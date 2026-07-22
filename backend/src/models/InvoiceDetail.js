const mongoose = require("mongoose")

const invoiceDetailSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    product: { type: String, default: "" },
    qty: { type: Number, default: 0 },
    invoiceAmount: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },
    lfr: { type: Number, default: 0 },
    rsp: { type: Number, default: 0 },
    purchaseAmount: { type: Number, default: 0 },
    remark: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    lastEditedAt: { type: Date },
    lastEditedBy: { type: String, default: "" },
    lastEditedByRole: { type: String, default: "" },
  },
  { timestamps: true },
)

module.exports = mongoose.model("InvoiceDetail", invoiceDetailSchema)
