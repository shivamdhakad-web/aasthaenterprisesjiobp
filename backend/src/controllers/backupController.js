const fs = require("fs/promises")
const path = require("path")
const crypto = require("crypto")
const mongoose = require("mongoose")
const { EJSON } = require("bson")
const BackupRecord = require("../models/BackupRecord")
const BackupRestoreLog = require("../models/BackupRestoreLog")
const Settings = require("../models/Settings")

const BACKUP_DIR = path.join(__dirname, "../../backups")
const MASTER_UNLOCK_PASSWORD = process.env.DASHBOARD_MASTER_PASSWORD || "jiobp"
const ZIP_LOCAL_HEADER = 0x04034b50
const ZIP_CENTRAL_HEADER = 0x02014b50
const ZIP_END_HEADER = 0x06054b50
const ENCRYPTION_MARKER = "JIOBP_ENCRYPTED_BACKUP_V1"

const scopeCollections = {
  dashboard: [
    "cardswipes",
    "expenses",
    "lubricantproducts",
    "lubricantsales",
    "employees",
    "approvalrequests",
    "notifications",
    "employeedailyreports",
  ],
  approvals: ["approvalrequests"],
  notifications: ["notifications"],
  dailyReports: ["employeedailyreports"],
  meterReadings: ["meterreadings", "tanks", "fuelpricehistories"],
  tankerDeliveries: ["tankerdeliveries"],
  employeeAttendanceDashboard: ["employees", "employeeattendances"],
  finance: [
    "expenses",
    "cardswipes",
    "lubricantproducts",
    "lubricantsales",
    "mduentries",
    "dcdentries",
    "dailysales",
    "invoicedetails",
  ],
  employees: [
    "employees",
    "employeeattendances",
    "employeedailyreports",
    "employeeleaves",
    "shiftschedules",
    "taskassignments",
  ],
  leaves: ["employeeleaves"],
  shifts: ["shiftschedules"],
  tasks: ["taskassignments"],
  creditCustomers: ["customers", "customertransactions"],
  expenses: ["expenses"],
  lubricants: ["lubricantproducts", "lubricantsales"],
  mobileDispenser: ["mobiledispensers", "mobiledispensersettings"],
  cardSwipe: ["cardswipes"],
  dcd: ["dcdentries"],
  mdu: ["mduentries"],
  invoiceDetails: ["invoicedetails"],
  dailySales: ["dailysales", "petrolsales", "dieselsales", "fuelpricehistories"],
  financeDashboard: [
    "expenses",
    "cardswipes",
    "lubricantproducts",
    "lubricantsales",
    "mduentries",
    "dcdentries",
    "dailysales",
    "invoicedetails",
    "employeeattendances",
    "employees",
  ],
  smartCalculator: ["smartcalculatorentries"],
  densityCalculator: ["densitycalculatorentries"],
  ttDrivers: ["ttdrivers"],
  customerDrivers: ["customerdrivers"],
  secureNotes: ["securenotes"],
  reminder: ["reminders"],
  storage: [],
  loginSessions: ["loginsessions"],
  backupRestore: ["backuprecords"],
  billGenerator: ["billgenerators"],
  aiChat: [],
  settings: [
    "settings",
    "admindashboardsettings",
    "managerdashboardsettings",
    "employeedashboardsettings",
    "securenotes",
  ],
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

const crc32 = (buffer) => {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const ensureBackupDir = () => fs.mkdir(BACKUP_DIR, { recursive: true })

const getBackupPath = (fileName) => path.join(BACKUP_DIR, path.basename(fileName))

const writeLog = (data) => BackupRestoreLog.create(data).catch(() => null)

const getEncryptionKey = (password, salt) =>
  crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256")

const encryptBuffer = (buffer, password) => {
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(password, salt), iv)
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  const payload = {
    marker: ENCRYPTION_MARKER,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  }

  return Buffer.from(JSON.stringify(payload))
}

const decryptBuffer = (buffer, password) => {
  const payload = JSON.parse(buffer.toString())
  if (payload.marker !== ENCRYPTION_MARKER) return buffer
  if (!String(password || "").trim()) {
    throw new Error("Backup password is required")
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(password, Buffer.from(payload.salt, "base64")),
    Buffer.from(payload.iv, "base64"),
  )
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(payload.data, "base64")), decipher.final()])
}

const parseBackupDate = (value, endOfDay = false) => {
  if (!value) return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  const raw = String(value).trim()
  if (!raw) return null

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const date = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const indianMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (indianMatch) {
    const [, day, month, year] = indianMatch
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0,
    )
    return Number.isNaN(date.getTime()) ? null : date
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getDocumentDate = (document) => {
  const candidateFields = [
    "date",
    "addedDate",
    "createdAt",
    "updatedAt",
    "loginAt",
    "logoutAt",
    "lastSeenAt",
    "dueDate",
    "reportDate",
    "startDate",
    "endDate",
    "month",
  ]

  for (const field of candidateFields) {
    const parsed = parseBackupDate(document?.[field])
    if (parsed) return parsed
  }

  if (document?._id?.getTimestamp) {
    return document._id.getTimestamp()
  }

  return null
}

const filterDocumentsByDateRange = (documents, dateRange) => {
  if (!dateRange?.from && !dateRange?.to) return documents

  return documents.filter((document) => {
    const documentDate = getDocumentDate(document)
    if (!documentDate) return true
    if (dateRange.from && documentDate < dateRange.from) return false
    if (dateRange.to && documentDate > dateRange.to) return false
    return true
  })
}

const getCollectionsForScope = async (scope = "full") => {
  const collections = await mongoose.connection.db.listCollections().toArray()
  const names = collections
    .map((collection) => collection.name)
    .filter((name) => !name.startsWith("system."))

  if (scope === "full") return names

  const allowed = new Set(scopeCollections[scope] || [])
  return names.filter((name) => allowed.has(name))
}

const collectBackupData = async (scope = "full", dateRange = {}) => {
  const collectionNames = await getCollectionsForScope(scope)
  const collections = {}
  let totalRecords = 0

  for (const name of collectionNames) {
    const documents = filterDocumentsByDateRange(
      await mongoose.connection.db.collection(name).find({}).toArray(),
      dateRange,
    )
    collections[name] = documents
    totalRecords += documents.length
  }

  const metadata = {
    app: "Jio-bp Station",
    version: 1,
    scope,
    dateRange: {
      from: dateRange.from ? dateRange.from.toISOString() : null,
      to: dateRange.to ? dateRange.to.toISOString() : null,
    },
    createdAt: new Date().toISOString(),
    totalCollections: collectionNames.length,
    totalRecords,
    collections: collectionNames.map((name) => ({
      name,
      records: collections[name].length,
    })),
  }

  return { metadata, collections }
}

const buildZip = (entries) => {
  const localParts = []
  const centralParts = []
  let offset = 0

  entries.forEach((entry) => {
    const nameBuffer = Buffer.from(entry.name)
    const dataBuffer = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data)
    const checksum = crc32(dataBuffer)

    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(ZIP_LOCAL_HEADER, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt32LE(0, 10)
    localHeader.writeUInt32LE(checksum, 14)
    localHeader.writeUInt32LE(dataBuffer.length, 18)
    localHeader.writeUInt32LE(dataBuffer.length, 22)
    localHeader.writeUInt16LE(nameBuffer.length, 26)
    localHeader.writeUInt16LE(0, 28)

    localParts.push(localHeader, nameBuffer, dataBuffer)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(ZIP_CENTRAL_HEADER, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt32LE(0, 12)
    centralHeader.writeUInt32LE(checksum, 16)
    centralHeader.writeUInt32LE(dataBuffer.length, 20)
    centralHeader.writeUInt32LE(dataBuffer.length, 24)
    centralHeader.writeUInt16LE(nameBuffer.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    centralParts.push(centralHeader, nameBuffer)

    offset += localHeader.length + nameBuffer.length + dataBuffer.length
  })

  const centralOffset = offset
  const centralBuffer = Buffer.concat(centralParts)
  const endHeader = Buffer.alloc(22)
  endHeader.writeUInt32LE(ZIP_END_HEADER, 0)
  endHeader.writeUInt16LE(0, 4)
  endHeader.writeUInt16LE(0, 6)
  endHeader.writeUInt16LE(entries.length, 8)
  endHeader.writeUInt16LE(entries.length, 10)
  endHeader.writeUInt32LE(centralBuffer.length, 12)
  endHeader.writeUInt32LE(centralOffset, 16)
  endHeader.writeUInt16LE(0, 20)

  return Buffer.concat([...localParts, centralBuffer, endHeader])
}

const parseZip = (buffer) => {
  const entries = {}
  let offset = 0

  while (offset < buffer.length && buffer.readUInt32LE(offset) === ZIP_LOCAL_HEADER) {
    const method = buffer.readUInt16LE(offset + 8)
    const size = buffer.readUInt32LE(offset + 18)
    const nameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)
    const nameStart = offset + 30
    const dataStart = nameStart + nameLength + extraLength
    const name = buffer.slice(nameStart, nameStart + nameLength).toString()

    if (method !== 0) {
      throw new Error("Only app-created ZIP backups are supported for restore")
    }

    entries[name] = buffer.slice(dataStart, dataStart + size).toString()
    offset = dataStart + size
  }

  return entries
}

const encodeBackup = (payload, format) => {
  if (format === "zip") {
    const entries = [
      { name: "metadata.json", data: EJSON.stringify(payload.metadata, null, 2) },
      ...Object.entries(payload.collections).map(([name, documents]) => ({
        name: `collections/${name}.json`,
        data: EJSON.stringify(documents, null, 2),
      })),
    ]
    return buildZip(entries)
  }

  return Buffer.from(EJSON.stringify(payload, null, 2))
}

const decodeBackup = (buffer, format) => {
  if (format === "zip") {
    const entries = parseZip(buffer)
    const metadata = EJSON.parse(entries["metadata.json"] || "{}")
    const collections = {}

    Object.entries(entries).forEach(([name, content]) => {
      const match = name.match(/^collections\/(.+)\.json$/)
      if (match) {
        collections[match[1]] = EJSON.parse(content)
      }
    })

    return { metadata, collections }
  }

  return EJSON.parse(buffer.toString())
}

const summarizePayload = (payload) => ({
  metadata: payload.metadata,
  collections: Object.entries(payload.collections || {}).map(([name, documents]) => ({
    name,
    records: Array.isArray(documents) ? documents.length : 0,
    sample: Array.isArray(documents) ? documents.slice(0, 2) : [],
  })),
  totalCollections: Object.keys(payload.collections || {}).length,
  totalRecords: Object.values(payload.collections || {}).reduce(
    (sum, documents) => sum + (Array.isArray(documents) ? documents.length : 0),
    0,
  ),
})

const readBackupFromBody = async (body = {}) => {
  if (body.backupId) {
    const record = await BackupRecord.findById(body.backupId)
    if (!record) throw new Error("Backup file not found")
    let buffer = await fs.readFile(getBackupPath(record.fileName))
    if (record.passwordProtected) {
      buffer = decryptBuffer(buffer, body.backupPassword)
    }
    return {
      buffer,
      format: record.format,
      record,
    }
  }

  const format = String(body.format || "").toLowerCase()
  if (!["json", "zip"].includes(format)) {
    throw new Error("Please choose a valid backup format")
  }

  if (!body.content) {
    throw new Error("Backup file content is required")
  }

  let buffer = format === "zip" ? Buffer.from(body.content, "base64") : Buffer.from(body.content)
  if (body.passwordProtected) {
    buffer = decryptBuffer(buffer, body.backupPassword)
  }

  return {
    buffer,
    format,
  }
}

const createBackupRecord = async ({ req, format, scope, dateRange, note = "", password = "", systemNote = "" }) => {
  const payload = await collectBackupData(scope, dateRange)
  let buffer = encodeBackup(payload, format)
  const passwordProtected = Boolean(String(password || "").trim())

  if (passwordProtected) {
    buffer = encryptBuffer(buffer, password)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const fileName = `aastha-${scope}-backup-${timestamp}.${format}`

  await ensureBackupDir()
  await fs.writeFile(getBackupPath(fileName), buffer)

  const record = await BackupRecord.create({
    fileName,
    format,
    scope,
    sizeBytes: buffer.length,
    totalCollections: payload.metadata.totalCollections,
    totalRecords: payload.metadata.totalRecords,
    createdBy: req.user?.name || "Admin",
    note: systemNote || note,
    passwordProtected,
  })

  await writeLog({
    action: "CREATE",
    backupId: record._id,
    fileName,
    performedBy: req.user?.name || "Admin",
    message: systemNote || "Backup created",
    details: { scope, format, totalRecords: payload.metadata.totalRecords },
  })

  return { record, payload }
}

const getPayloadFromRecord = async (record, password) => {
  let buffer = await fs.readFile(getBackupPath(record.fileName))
  if (record.passwordProtected) {
    buffer = decryptBuffer(buffer, password)
  }
  return decodeBackup(buffer, record.format)
}

const buildDiff = async (payload) => {
  const collections = []

  for (const [name, documents] of Object.entries(payload.collections || {})) {
    const currentRecords = await mongoose.connection.db.collection(name).countDocuments()
    const backupRecords = Array.isArray(documents) ? documents.length : 0
    collections.push({
      name,
      currentRecords,
      backupRecords,
      difference: backupRecords - currentRecords,
    })
  }

  return {
    collections,
    totalCurrent: collections.reduce((sum, item) => sum + item.currentRecords, 0),
    totalBackup: collections.reduce((sum, item) => sum + item.backupRecords, 0),
  }
}

const comparePayloads = (left, right) => {
  const names = new Set([
    ...Object.keys(left.collections || {}),
    ...Object.keys(right.collections || {}),
  ])

  return Array.from(names).map((name) => {
    const leftRecords = left.collections?.[name]?.length || 0
    const rightRecords = right.collections?.[name]?.length || 0
    return {
      name,
      leftRecords,
      rightRecords,
      difference: rightRecords - leftRecords,
    }
  })
}

exports.listBackups = async (_req, res) => {
  try {
    const backups = await BackupRecord.find().sort({ createdAt: -1 }).lean()
    const lastBackup = backups[0] || null

    res.json({
      backups,
      summary: {
        totalBackups: backups.length,
        lastBackupAt: lastBackup?.createdAt || null,
        lastBackupSize: lastBackup?.sizeBytes || 0,
        restoreAvailable: backups.length > 0,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createBackup = async (req, res) => {
  try {
    const format = req.body?.format === "zip" ? "zip" : "json"
    const scope = req.body?.scope || "full"
    const dateRange = {
      from: parseBackupDate(req.body?.fromDate),
      to: parseBackupDate(req.body?.toDate, true),
    }

    if (dateRange.from && dateRange.to && dateRange.from > dateRange.to) {
      return res.status(400).json({ message: "From date cannot be after To date" })
    }

    const { record, payload } = await createBackupRecord({
      req,
      format,
      scope,
      dateRange,
      note: req.body?.note,
      password: req.body?.backupPassword,
    })

    res.status(201).json({
      backup: record,
      preview: summarizePayload(payload),
      message: "Backup created successfully.",
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.downloadBackup = async (req, res) => {
  try {
    const record = await BackupRecord.findById(req.params.id)
    if (!record) return res.status(404).json({ message: "Backup not found" })

    res.download(getBackupPath(record.fileName), record.fileName)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.previewStoredBackup = async (req, res) => {
  try {
    const record = await BackupRecord.findById(req.params.id)
    if (!record) return res.status(404).json({ message: "Backup not found" })

    res.json({ preview: summarizePayload(await getPayloadFromRecord(record, req.query?.backupPassword)) })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.previewUploadedBackup = async (req, res) => {
  try {
    const { buffer, format } = await readBackupFromBody(req.body)
    res.json({ preview: summarizePayload(decodeBackup(buffer, format)) })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.restoreBackup = async (req, res) => {
  try {
    const settings = await Settings.findOne()
    const masterPassword = settings?.passwordSecurity?.masterUnlockPassword || MASTER_UNLOCK_PASSWORD

    if (String(req.body?.masterPassword || "").trim() !== String(masterPassword).trim()) {
      return res.status(400).json({ message: "Master password is incorrect" })
    }

    const mode = req.body?.mode === "merge" ? "merge" : "replace"
    const selectedCollections = Array.isArray(req.body?.collections) ? req.body.collections : []
    await createBackupRecord({
      req,
      format: "json",
      scope: "full",
      dateRange: {},
      systemNote: "Automatic safety backup before restore",
    })
    const { buffer, format, record } = await readBackupFromBody(req.body)
    const payload = decodeBackup(buffer, format)
    const collectionEntries = Object.entries(payload.collections || {}).filter(
      ([name]) => !selectedCollections.length || selectedCollections.includes(name),
    )

    for (const [name, documents] of collectionEntries) {
      const collection = mongoose.connection.db.collection(name)
      if (mode === "replace") {
        await collection.deleteMany({})
      }
      if (Array.isArray(documents) && documents.length) {
        if (mode === "merge") {
          await collection.bulkWrite(
            documents.map((document) => ({
              replaceOne: {
                filter: { _id: document._id },
                replacement: document,
                upsert: true,
              },
            })),
            { ordered: false },
          )
        } else {
          await collection.insertMany(documents, { ordered: false })
        }
      }
    }

    if (record) {
      record.restoredAt = new Date()
      record.restoredBy = req.user?.name || "Admin"
      await record.save()
    }

    await writeLog({
      action: "RESTORE",
      backupId: record?._id || null,
      fileName: record?.fileName || "Uploaded backup",
      performedBy: req.user?.name || "Admin",
      message: "Backup restored",
      details: { mode, collections: collectionEntries.map(([name]) => name) },
    })

    res.json({
      message: "Backup restored successfully.",
      restored: summarizePayload(payload),
      mode,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteBackup = async (req, res) => {
  try {
    const record = await BackupRecord.findById(req.params.id)
    if (!record) return res.status(404).json({ message: "Backup not found" })
    if (record.locked) {
      return res.status(400).json({ message: "Locked backups cannot be deleted" })
    }

    await fs.rm(getBackupPath(record.fileName), { force: true })
    await record.deleteOne()
    await writeLog({
      action: "DELETE",
      fileName: record.fileName,
      performedBy: req.user?.name || "Admin",
      message: "Backup deleted",
    })

    res.json({ message: "Backup deleted successfully." })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.toggleBackupLock = async (req, res) => {
  try {
    const record = await BackupRecord.findById(req.params.id)
    if (!record) return res.status(404).json({ message: "Backup not found" })

    record.locked = !record.locked
    await record.save()
    await writeLog({
      action: record.locked ? "LOCK" : "UNLOCK",
      backupId: record._id,
      fileName: record.fileName,
      performedBy: req.user?.name || "Admin",
      message: record.locked ? "Backup locked" : "Backup unlocked",
    })

    res.json({ backup: record })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getRestoreDiff = async (req, res) => {
  try {
    const { buffer, format } = await readBackupFromBody(req.body)
    const payload = decodeBackup(buffer, format)
    const diff = await buildDiff(payload)
    res.json({ diff })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.healthCheckBackup = async (req, res) => {
  try {
    const { buffer, format, record } = await readBackupFromBody(req.body)
    const payload = decodeBackup(buffer, format)
    const summary = summarizePayload(payload)
    await writeLog({
      action: "HEALTH_CHECK",
      backupId: record?._id || null,
      fileName: record?.fileName || "Uploaded backup",
      performedBy: req.user?.name || "Admin",
      message: "Backup health check passed",
      details: { collections: summary.totalCollections, records: summary.totalRecords },
    })
    res.json({ healthy: true, summary })
  } catch (error) {
    res.status(400).json({ healthy: false, message: error.message })
  }
}

exports.compareBackups = async (req, res) => {
  try {
    const left = await BackupRecord.findById(req.body?.leftBackupId)
    const right = await BackupRecord.findById(req.body?.rightBackupId)
    if (!left || !right) return res.status(404).json({ message: "Please choose two valid backups" })

    const comparison = comparePayloads(
      await getPayloadFromRecord(left, req.body?.leftPassword),
      await getPayloadFromRecord(right, req.body?.rightPassword),
    )
    await writeLog({
      action: "COMPARE",
      performedBy: req.user?.name || "Admin",
      message: "Backups compared",
      details: { left: left.fileName, right: right.fileName },
    })
    res.json({ comparison })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.emergencyRestoreLatest = async (req, res) => {
  try {
    const latest = await BackupRecord.findOne().sort({ createdAt: -1 })
    if (!latest) return res.status(404).json({ message: "No backup is available" })

    req.body = {
      ...req.body,
      backupId: latest._id,
      mode: "replace",
    }
    await writeLog({
      action: "EMERGENCY_RESTORE",
      backupId: latest._id,
      fileName: latest.fileName,
      performedBy: req.user?.name || "Admin",
      message: "Emergency restore started",
    })
    return exports.restoreBackup(req, res)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.listBackupLogs = async (_req, res) => {
  try {
    const logs = await BackupRestoreLog.find().sort({ createdAt: -1 }).limit(100).lean()
    res.json({ logs })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
