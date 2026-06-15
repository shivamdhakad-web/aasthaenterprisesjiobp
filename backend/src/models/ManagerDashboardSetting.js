const mongoose = require("mongoose")

const buttonAccessSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
)

const pageAccessSchema = new mongoose.Schema(
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
    hidden: {
      type: Boolean,
      default: false,
    },
    buttons: {
      type: [buttonAccessSchema],
      default: [],
    },
  },
  { _id: false },
)

const managerDashboardSettingSchema = new mongoose.Schema(
  {
    pages: {
      type: [pageAccessSchema],
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

module.exports = mongoose.model("ManagerDashboardSetting", managerDashboardSettingSchema)
