const mongoose = require("mongoose")

const adminDashboardPageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
)

const adminDashboardSettingSchema = new mongoose.Schema(
  {
    pages: {
      type: [adminDashboardPageSchema],
      default: [],
    },
    updatedBy: {
      type: String,
      default: "",
    },
    updatedByRole: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("AdminDashboardSetting", adminDashboardSettingSchema)
