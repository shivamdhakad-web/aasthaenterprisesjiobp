const axios = require("axios")
const mongoose = require("mongoose")
const StationDocument = require("../models/StationDocument")

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET
const cloudinaryReady = Boolean(cloudName && apiKey && apiSecret && uploadPreset)
const maxFileBytes = 10 * 1024 * 1024
const allowedCategories = ["Licence", "Invoice", "Equipment", "Safety", "Delivery", "Station", "Other"]
const toPublicDocument = (document) => ({
  id: document._id.toString(),
  title: document.title,
  category: document.category,
  fileName: document.fileName,
  format: document.format,
  resourceType: document.resourceType,
  bytes: document.bytes,
  secureUrl: document.secureUrl,
  publicId: document.publicId,
  expiresAt: document.expiresAt,
  uploadedBy: document.uploadedBy,
  createdAt: document.createdAt,
})

exports.getStationDocuments = async (_req, res) => {
  try {
    const documents = await StationDocument.find().sort({ createdAt: -1 }).limit(500).lean()
    const storedBytes = documents.reduce((total, document) => total + Number(document.bytes || 0), 0)
    res.json({
      documents: documents.map(toPublicDocument),
      summary: { totalFiles: documents.length, trackedBytes: storedBytes },
      cloudinary: {
        connected: cloudinaryReady,
        uploadReady: Boolean(cloudName && uploadPreset),
        usageReady: Boolean(cloudName && apiKey && apiSecret),
        cloudName: cloudName || "",
        uploadPreset: uploadPreset || "",
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getStationDocumentUsage = async (_req, res) => {
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ message: "Cloudinary usage is not configured." })
  }

  try {
    const { data } = await axios.get(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/usage`, {
      auth: { username: apiKey, password: apiSecret },
      timeout: 12000,
    })
    res.json({ usage: data, fetchedAt: new Date().toISOString() })
  } catch (error) {
    res.status(error.response?.status || 502).json({ message: "Unable to retrieve Cloudinary usage right now." })
  }
}

exports.createStationDocument = async (req, res) => {
  const { title, category, fileName, format, resourceType, bytes, secureUrl, publicId, expiresAt } = req.body || {}

  if (!cloudName || !uploadPreset) {
    return res.status(503).json({ message: "Cloudinary uploads are not configured." })
  }
  if (!title?.trim() || !fileName?.trim() || !publicId || !secureUrl || !allowedCategories.includes(category)) {
    return res.status(400).json({ message: "Complete the document details before saving." })
  }
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0 || Number(bytes) > maxFileBytes) {
    return res.status(400).json({ message: "Files must be 10 MB or smaller." })
  }
  if (!["image", "raw"].includes(resourceType)) {
    return res.status(400).json({ message: "Unsupported Cloudinary resource type." })
  }
  const normalizedFormat = String(format || "").toLowerCase()
  if ((resourceType === "raw" && normalizedFormat !== "pdf") ||
      (resourceType === "image" && !["jpg", "jpeg", "png", "webp"].includes(normalizedFormat))) {
    return res.status(400).json({ message: "Only PDF, JPG, PNG and WEBP files are allowed." })
  }

  try {
    const parsedUrl = new URL(secureUrl)
    if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "res.cloudinary.com" || parsedUrl.pathname.split("/")[1] !== cloudName) {
      return res.status(400).json({ message: "The uploaded file does not belong to the configured Cloudinary account." })
    }
    const document = await StationDocument.create({
      title: title.trim(),
      category,
      fileName: fileName.trim(),
      format: String(format || "").toLowerCase(),
      resourceType,
      bytes: Number(bytes),
      secureUrl,
      publicId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      uploadedBy: req.user?.name || req.user?.email || "Admin",
    })
    res.status(201).json({ document: toPublicDocument(document) })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "This uploaded file is already in the vault." })
    res.status(500).json({ message: error.message })
  }
}

exports.deleteStationDocument = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid document." })
  }
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ message: "Cloudinary delete credentials are not configured." })
  }

  try {
    const document = await StationDocument.findById(req.params.id)
    if (!document) return res.status(404).json({ message: "Document not found." })

    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${document.resourceType}/destroy`
    const timestamp = String(Math.floor(Date.now() / 1000))
    const crypto = require("crypto")
    const signature = crypto.createHash("sha1").update(`public_id=${document.publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex")
    const body = new URLSearchParams({ public_id: document.publicId, timestamp, api_key: apiKey, signature })
    const { data } = await axios.post(endpoint, body, { timeout: 12000 })
    if (data.result !== "ok" && data.result !== "not found") {
      return res.status(502).json({ message: "Cloudinary could not delete this file." })
    }
    await document.deleteOne()
    res.json({ message: "Document deleted." })
  } catch (error) {
    res.status(error.response?.status || 500).json({ message: error.response?.data?.error?.message || "Unable to delete the document." })
  }
}
