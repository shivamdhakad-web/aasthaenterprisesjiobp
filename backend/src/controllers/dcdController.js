const DcdEntry = require("../models/DcdEntry")

const numberValue = (value) => Number(value || 0)

const buildPayload = (payload = {}, audit = {}) => {
  const volume = numberValue(payload.volume)
  const purchasePrice = numberValue(payload.purchasePrice)
  const salePrice = numberValue(payload.salePrice)

  return {
    ...payload,
    date: payload.date,
    volume,
    purchasePrice,
    salePrice,
    profit: Number(payload.profit ?? (salePrice - purchasePrice) * volume),
    shift: payload.shift || "",
    remark: payload.remark || "",
    ...audit,
  }
}

exports.getEntries = async (_req, res) => {
  const data = await DcdEntry.find().sort({ date: -1, createdAt: -1 })
  res.json(data)
}

exports.addEntry = async (req, res) => {
  const entry = await DcdEntry.create(buildPayload(req.body))
  res.json(entry)
}

exports.updateEntry = async (req, res) => {
  const entry = await DcdEntry.findByIdAndUpdate(
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
  await DcdEntry.findByIdAndDelete(req.params.id)
  res.json({ message: "Deleted" })
}
