const BillGenerator = require("../models/BillGenerator")

const numberValue = (value) => Number(value || 0)

const cleanupOldBills = () =>
  BillGenerator.deleteMany({
    createdAt: { $lt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
  })

const buildPayload = (payload = {}, audit = {}) => {
  const items = Array.isArray(payload.items)
    ? payload.items
        .filter((item) => item.product || item.description || item.quantity || item.rate)
        .map((item) => {
          const quantity = numberValue(item.quantity)
          const rate = numberValue(item.rate)
          const amount = numberValue(item.amount || quantity * rate)

          return {
            product: item.product || "",
            description: item.description || "",
            quantity,
            rate,
            amount,
          }
        })
    : []

  const subTotal = items.reduce((sum, item) => sum + numberValue(item.amount), 0)
  const discount = numberValue(payload.discount)
  const grandTotal = Math.max(subTotal - discount, 0)

  return {
    billNo: payload.billNo,
    billDate: payload.billDate,
    customerName: payload.customerName || "",
    customerPhone: payload.customerPhone || "",
    vehicleNo: payload.vehicleNo || "",
    paymentMode: payload.paymentMode || "Cash",
    remark: payload.remark || "",
    items,
    subTotal,
    discount,
    grandTotal,
    createdBy: payload.createdBy || audit.createdBy || "",
    expiresAt: payload.expiresAt || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    ...audit,
  }
}

exports.getBills = async (_req, res) => {
  await cleanupOldBills()
  const data = await BillGenerator.find().sort({ createdAt: -1 })
  res.json(data)
}

exports.addBill = async (req, res) => {
  await cleanupOldBills()
  const payload = buildPayload(req.body, {
    createdBy: req.body.createdBy || req.user?.name || "Admin",
  })

  const bill = await BillGenerator.create(payload)
  res.json(bill)
}

exports.updateBill = async (req, res) => {
  await cleanupOldBills()
  const bill = await BillGenerator.findByIdAndUpdate(
    req.params.id,
    buildPayload(req.body, {
      lastEditedAt: new Date(),
      lastEditedBy: req.body.lastEditedBy || req.user?.name || "Admin",
      lastEditedByRole: req.body.lastEditedByRole || req.user?.role || "Admin",
    }),
    { new: true },
  )

  res.json(bill)
}

exports.deleteBill = async (req, res) => {
  await BillGenerator.findByIdAndDelete(req.params.id)
  res.json({ message: "Deleted" })
}
