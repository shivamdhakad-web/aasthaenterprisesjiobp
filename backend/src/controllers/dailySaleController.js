const DailySale = require("../models/DailySale")

const numberValue = (value) => Number(value || 0)

const buildPayload = (payload = {}, audit = {}) => {
  const sale = numberValue(payload.sale)
  const rate = numberValue(payload.rate)

  return {
    ...payload,
    date: payload.date,
    product: payload.product || "",
    sale,
    rate,
    lossGain: numberValue(payload.lossGain),
    profit: Number(payload.profit ?? sale * rate),
    remark: payload.remark || "",
    ...audit,
  }
}

exports.getEntries = async (_req, res) => {
  const data = await DailySale.find().sort({ date: -1, createdAt: -1 })
  res.json(data)
}

exports.addEntry = async (req, res) => {
  const entry = await DailySale.create(buildPayload(req.body))
  res.json(entry)
}

exports.updateEntry = async (req, res) => {
  const entry = await DailySale.findByIdAndUpdate(
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
  await DailySale.findByIdAndDelete(req.params.id)
  res.json({ message: "Deleted" })
}
