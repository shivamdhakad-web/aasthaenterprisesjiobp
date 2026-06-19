const MduEntry = require("../models/MduEntry")

const numberValue = (value) => Number(value || 0)

const buildPayload = (payload = {}, audit = {}) => {
  const openingStock = numberValue(payload.openingStock)
  const decant = numberValue(payload.decant)
  const sale = numberValue(payload.sale)
  const physicalStock = numberValue(payload.physicalStock)

  return {
    ...payload,
    date: payload.date,
    openingStock,
    decant,
    sale,
    physicalStock,
    lossGain: Number(payload.lossGain ?? physicalStock - (openingStock + decant - sale)),
    rate: numberValue(payload.rate),
    remark: payload.remark || "",
    ...audit,
  }
}

exports.getEntries = async (_req, res) => {
  const data = await MduEntry.find().sort({ date: -1, createdAt: -1 })
  res.json(data)
}

exports.addEntry = async (req, res) => {
  const entry = await MduEntry.create(buildPayload(req.body))
  res.json(entry)
}

exports.updateEntry = async (req, res) => {
  const entry = await MduEntry.findByIdAndUpdate(
    req.params.id,
    buildPayload(req.body, {
      lastEditedAt: new Date(),
      lastEditedBy: req.body.lastEditedBy || req.user?.name || "Admin",
      lastEditedByRole: req.body.lastEditedByRole || req.user?.role || "Admin",
    }),
    { new: true },
  )
  res.json(entry)
}

exports.deleteEntry = async (req, res) => {
  await MduEntry.findByIdAndDelete(req.params.id)
  res.json({ message: "Deleted" })
}
