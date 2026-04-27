const mongoose = require("mongoose")

const MAX_CAPACITY_BYTES = 512 * 1024 * 1024

exports.getStorageOverview = async (_req, res) => {
  try {
    const db = mongoose.connection.db

    if (!db) {
      return res.status(503).json({ message: "Database connection is not ready" })
    }

    const stats = await db.stats()
    const collections = await db.listCollections().toArray()
    const collectionStats = []

    for (const collection of collections) {
      try {
        const snapshot = await db.command({ collStats: collection.name })
        collectionStats.push({
          name: collection.name,
          documents: Number(snapshot.count || 0),
          storageBytes: Number(snapshot.storageSize || 0),
          dataBytes: Number(snapshot.size || 0),
          avgDocumentBytes: Number(snapshot.avgObjSize || 0),
          indexBytes: Number(snapshot.totalIndexSize || 0),
        })
      } catch (_error) {
        // Ignore collection-level stat errors so the page still works.
      }
    }

    collectionStats.sort((left, right) => right.storageBytes - left.storageBytes)

    const usedBytes = Number(stats.storageSize || stats.dataSize || 0)
    const dataBytes = Number(stats.dataSize || 0)
    const indexBytes = Number(stats.indexSize || 0)
    const remainingBytes = Math.max(MAX_CAPACITY_BYTES - usedBytes, 0)

    const cleanupPreview = collectionStats.slice(0, 6).map((item) => ({
      name: item.name,
      removableBytes: item.storageBytes,
      usedAfterDeleteBytes: Math.max(usedBytes - item.storageBytes, 0),
      remainingAfterDeleteBytes: Math.min(
        MAX_CAPACITY_BYTES,
        remainingBytes + item.storageBytes,
      ),
      usedAfterDeletePercentage: Number(
        (
          (Math.max(usedBytes - item.storageBytes, 0) / MAX_CAPACITY_BYTES) *
          100
        ).toFixed(2),
      ),
    }))

    res.json({
      capacityBytes: MAX_CAPACITY_BYTES,
      usedBytes,
      dataBytes,
      indexBytes,
      remainingBytes,
      usedPercentage: Number(((usedBytes / MAX_CAPACITY_BYTES) * 100).toFixed(2)),
      collections: collectionStats,
      cleanupPreview,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
