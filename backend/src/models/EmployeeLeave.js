const mongoose = require("mongoose")

const employeeLeaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: ["CL", "SL", "PL", "LOP"],
      default: "CL",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
    },
    requestedByName: {
      type: String,
      trim: true,
    },
    reviewedByRole: {
      type: String,
      trim: true,
    },
    reviewedByName: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
)

employeeLeaveSchema.index({ employeeId: 1, startDate: -1 })

module.exports = mongoose.model("EmployeeLeave", employeeLeaveSchema)
