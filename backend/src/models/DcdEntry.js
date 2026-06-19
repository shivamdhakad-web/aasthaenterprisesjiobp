const mongoose = require("mongoose")

const dcdEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    volume: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    shift: { type: String, default: "" },
    remark: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    lastEditedAt: { type: Date },
    lastEditedBy: { type: String, default: "" },
    lastEditedByRole: { type: String, default: "" },
  },
  { timestamps: true },
)

module.exports = mongoose.model("DcdEntry", dcdEntrySchema)
