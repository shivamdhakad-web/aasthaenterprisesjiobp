const mongoose = require("mongoose")

const dailySaleSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    product: { type: String, default: "" },
    sale: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    lossGain: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    remark: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    lastEditedAt: { type: Date },
    lastEditedBy: { type: String, default: "" },
    lastEditedByRole: { type: String, default: "" },
  },
  { timestamps: true },
)

module.exports = mongoose.model("DailySale", dailySaleSchema)
