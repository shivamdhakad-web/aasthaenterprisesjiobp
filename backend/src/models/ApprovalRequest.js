const mongoose = require("mongoose")

const userSnapshotSchema = new mongoose.Schema(
  {
    role: String,
    name: String,
    employeeId: String,
  },
  { _id: false },
)

const approvalRequestSchema = new mongoose.Schema(
  {
    moduleKey: {
      type: String,
      required: true,
    },
    moduleLabel: {
      type: String,
      required: true,
    },
    operation: {
      type: String,
      required: true,
    },
    resourceId: String,
    payload: mongoose.Schema.Types.Mixed,
    meta: mongoose.Schema.Types.Mixed,
    summary: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requester: userSnapshotSchema,
    reviewer: userSnapshotSchema,
    reviewNote: String,
    errorMessage: String,
    processedAt: Date,
    resultId: String,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("ApprovalRequest", approvalRequestSchema)
