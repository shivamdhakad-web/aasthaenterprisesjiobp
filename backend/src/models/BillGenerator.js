const mongoose = require("mongoose")

const billItemSchema = new mongoose.Schema(
  {
    product: { type: String, default: "" },
    description: { type: String, default: "" },
    date: { type: String, default: "" },
    unit: { type: String, default: "Ltr" },
    quantity: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false },
)

const billGeneratorSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true },
    billDate: { type: String, required: true },
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    vehicleNo: { type: String, default: "" },
    paymentMode: { type: String, default: "Cash" },
    remark: { type: String, default: "" },
    items: { type: [billItemSchema], default: [] },
    subTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
    lastEditedAt: { type: Date },
    lastEditedBy: { type: String, default: "" },
    lastEditedByRole: { type: String, default: "" },
  },
  { timestamps: true },
)

module.exports = mongoose.model("BillGenerator", billGeneratorSchema)
