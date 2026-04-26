const mongoose = require("mongoose")

const readReceiptSchema = new mongoose.Schema(
  {
    userId: String,
    role: String,
    name: String,
    employeeId: String,
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    sender: {
      role: String,
      name: String,
      employeeId: String,
    },
    targetRoles: {
      type: [String],
      default: [],
    },
    targetEmployeeIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Employee",
      default: [],
    },
    recipientKeys: {
      type: [String],
      default: [],
    },
    readBy: {
      type: [readReceiptSchema],
      default: [],
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Notification", notificationSchema)
