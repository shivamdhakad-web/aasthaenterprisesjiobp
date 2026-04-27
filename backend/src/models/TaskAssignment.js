const mongoose = require("mongoose")

const taskAssignmentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
    employeeNote: {
      type: String,
      trim: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
      index: true,
    },
    createdByRole: {
      type: String,
      default: "Admin",
    },
    createdByName: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
)

taskAssignmentSchema.index({ employeeId: 1, assignedDate: -1 })

module.exports = mongoose.model("TaskAssignment", taskAssignmentSchema)
