const DensityCalculatorEntry = require("../models/DensityCalculatorEntry")

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

const TANK_PRESETS = {
  "10K": { key: "10K", label: "10K", capacityLitres: 10000, maxReadingCm: 250 },
  "15K": { key: "15K", label: "15K", capacityLitres: 15000, maxReadingCm: 275 },
  "20K": { key: "20K", label: "20K", capacityLitres: 20000, maxReadingCm: 300 },
  "30K": { key: "30K", label: "30K", capacityLitres: 30000, maxReadingCm: 330 },
}

const toNumber = (value) => {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const hasNumericValue = (value) =>
  value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value))

const calculateDensityValue = ({ hydrometer, temperature }) => {
  const safeHydrometer = clamp(toNumber(hydrometer), 660, 960)
  const safeTemperature = clamp(toNumber(temperature), -10, 55)
  const delta = safeTemperature - 15
  const temperatureFactor = 0.949 - 0.0005 * delta
  const correctedDensity = safeHydrometer + delta * temperatureFactor

  return {
    hydrometer: Number(safeHydrometer.toFixed(1)),
    temperature: Number(safeTemperature.toFixed(1)),
    densityValue: Number(correctedDensity.toFixed(1)),
  }
}

const calculateVolumeValue = ({ tankKey, readingCm }) => {
  const preset = TANK_PRESETS[tankKey] || TANK_PRESETS["20K"]
  const safeReading = clamp(toNumber(readingCm), 0, preset.maxReadingCm)
  const volumeValue = (safeReading / preset.maxReadingCm) * preset.capacityLitres

  return {
    tankKey: preset.key,
    tankLabel: preset.label,
    tankCapacityLitres: preset.capacityLitres,
    maxReadingCm: preset.maxReadingCm,
    readingCm: Number(safeReading.toFixed(1)),
    volumeValue: Number(volumeValue.toFixed(1)),
  }
}

const getBaseQuery = (user) => {
  const createdAfter = new Date(Date.now() - RETENTION_MS)

  if (user.role === "Admin") {
    return {
      createdAt: { $gte: createdAfter },
    }
  }

  if (user.role === "Manager") {
    return {
      createdAt: { $gte: createdAfter },
      creatorRole: "Manager",
      creatorName: user.name,
    }
  }

  return {
    createdAt: { $gte: createdAfter },
    creatorRole: "Employee",
    creatorEmployeeId: user.employeeId,
  }
}

const applyFilters = (baseQuery, query = {}) => {
  const conditions = [baseQuery]

  if (query.mode && ["density", "volume"].includes(query.mode)) {
    conditions.push({ mode: query.mode })
  }

  if (query.search) {
    conditions.push({
      $or: [
        { creatorName: { $regex: query.search, $options: "i" } },
        { creatorRole: { $regex: query.search, $options: "i" } },
        { tankLabel: { $regex: query.search, $options: "i" } },
      ],
    })
  }

  return conditions.length === 1 ? baseQuery : { $and: conditions }
}

exports.getEntries = async (req, res) => {
  try {
    const query = applyFilters(getBaseQuery(req.user), req.query)
    const items = await DensityCalculatorEntry.find(query).sort({ recordedAt: -1, createdAt: -1 })

    res.json(items)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createEntry = async (req, res) => {
  try {
    const mode = req.body.mode === "volume" ? "volume" : "density"
    const recordedAt = req.body.recordedAt ? new Date(req.body.recordedAt) : new Date()

    if (mode === "density") {
      if (!hasNumericValue(req.body.hydrometer) || !hasNumericValue(req.body.temperature)) {
        return res.status(400).json({ message: "Hydrometer and temperature are required" })
      }
    } else if (!hasNumericValue(req.body.readingCm)) {
      return res.status(400).json({ message: "Reading is required" })
    }

    const payload =
      mode === "volume"
        ? calculateVolumeValue({
            tankKey: req.body.tankKey,
            readingCm: req.body.readingCm,
          })
        : calculateDensityValue({
            hydrometer: req.body.hydrometer,
            temperature: req.body.temperature,
          })

    const entry = await DensityCalculatorEntry.create({
      mode,
      recordedAt,
      creatorRole: req.user.role,
      creatorName: req.user.name,
      creatorEmployeeId: req.user.employeeId || "",
      ...payload,
    })

    res.status(201).json(entry)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await DensityCalculatorEntry.findById(req.params.id)

    if (!entry) {
      return res.status(404).json({ message: "Density history entry not found" })
    }

    if (req.user.role === "Admin") {
      await entry.deleteOne()
      return res.json({ message: "Entry deleted" })
    }

    if (req.user.role === "Manager") {
      const canDelete = entry.creatorRole === "Manager" && entry.creatorName === req.user.name

      if (!canDelete) {
        return res.status(403).json({ message: "You do not have access to delete this entry" })
      }

      await entry.deleteOne()
      return res.json({ message: "Entry deleted" })
    }

    const canDelete =
      entry.creatorRole === "Employee" && entry.creatorEmployeeId === req.user.employeeId

    if (!canDelete) {
      return res.status(403).json({ message: "You do not have access to delete this entry" })
    }

    await entry.deleteOne()
    res.json({ message: "Entry deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getPresets = async (req, res) => {
  res.json(Object.values(TANK_PRESETS))
}