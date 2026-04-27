const mongoose = require("mongoose")

const shiftScheduleSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },
    appliesToAll: {
      type: Boolean,
      default: false,
    },
    scheduleType: {
      type: String,
      enum: ["recurring", "one-time"],
      default: "recurring",
    },
    weekDay: {
      type: Number,
      min: 0,
      max: 6,
    },
    date: {
      type: Date,
    },
    shiftName: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    period: {
      type: String,
      enum: ["day", "night"],
      default: "day",
    },
    notes: {
      type: String,
      trim: true,
    },
    createdByRole: {
      type: String,
      default: "Admin",
    },
    createdByName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
)

shiftScheduleSchema.index({ employeeId: 1, date: 1, weekDay: 1 })

module.exports = mongoose.model("ShiftSchedule", shiftScheduleSchema)
