const mongoose = require("mongoose")

const manualFinanceEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMode: { type: String, default: "Cash", trim: true },
    addedBy: { type: String, default: "" },
    createdByRole: { type: String, enum: ["Admin", "Manager"], default: "Admin" },
    lastEditedAt: { type: Date, default: null },
    lastEditedBy: { type: String, default: "" },
    lastEditedByRole: { type: String, default: "" },
  },
  { timestamps: true },
)

module.exports = mongoose.model("ManualFinanceEntry", manualFinanceEntrySchema)
