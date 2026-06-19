const mongoose = require("mongoose")

const mduEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    openingStock: { type: Number, default: 0 },
    decant: { type: Number, default: 0 },
    sale: { type: Number, default: 0 },
    physicalStock: { type: Number, default: 0 },
    lossGain: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    remark: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    lastEditedAt: { type: Date },
    lastEditedBy: { type: String, default: "" },
    lastEditedByRole: { type: String, default: "" },
  },
  { timestamps: true },
)

module.exports = mongoose.model("MduEntry", mduEntrySchema)
