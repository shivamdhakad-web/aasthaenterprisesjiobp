const mongoose = require("mongoose")

const loginSessionSchema = new mongoose.Schema(
  {
    userRole: {
      type: String,
      required: true,
      enum: ["Admin", "Manager", "Employee"],
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    loginAt: {
      type: Date,
      default: Date.now,
    },
    logoutAt: {
      type: Date,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Logged Out", "Expired", "Terminated"],
      default: "Active",
    },
    ipAddress: {
      type: String,
      default: "-",
    },
    userAgent: {
      type: String,
      default: "",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    os: {
      type: String,
      default: "Unknown",
    },
    deviceType: {
      type: String,
      enum: ["Desktop", "Mobile", "Tablet", "Unknown"],
      default: "Unknown",
    },
  },
  { timestamps: true },
)

loginSessionSchema.index({ loginAt: -1 })
loginSessionSchema.index({ status: 1, expiresAt: 1 })
loginSessionSchema.index({ userRole: 1, userName: 1 })

module.exports = mongoose.model("LoginSession", loginSessionSchema)
