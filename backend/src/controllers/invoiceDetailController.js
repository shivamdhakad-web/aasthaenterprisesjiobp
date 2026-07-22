const InvoiceDetail = require("../models/InvoiceDetail")

const numberValue = (value) => Number(value || 0)

const buildPayload = (payload = {}, audit = {}) => {
  const qty = numberValue(payload.qty)
  const invoiceAmount = numberValue(payload.invoiceAmount)
  const transportCost = numberValue(payload.transportCost)
  const lfr = numberValue(payload.lfr)
  const rsp = numberValue(payload.rsp)

  return {
    ...payload,
    date: payload.date,
    product: payload.product || "",
    qty,
    invoiceAmount,
    transportCost,
    lfr,
    rsp,
    purchaseAmount: Number(payload.purchaseAmount ?? (qty ? (invoiceAmount + transportCost) / qty + lfr : 0)),
    remark: payload.remark || "",
    ...audit,
  }
}

exports.getEntries = async (_req, res) => {
  const data = await InvoiceDetail.find().sort({ date: -1, createdAt: -1 })
  res.json(data)
}

exports.addEntry = async (req, res) => {
  const entry = await InvoiceDetail.create(buildPayload(req.body))
  res.json(entry)
}

exports.updateEntry = async (req, res) => {
  const entry = await InvoiceDetail.findByIdAndUpdate(
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
  await InvoiceDetail.findByIdAndDelete(req.params.id)
  res.json({ message: "Deleted" })
}
