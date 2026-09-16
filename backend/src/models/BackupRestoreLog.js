const mongoose = require("mongoose")

const backupRestoreLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["CREATE", "RESTORE", "DELETE", "LOCK", "UNLOCK", "EMERGENCY_RESTORE", "HEALTH_CHECK", "COMPARE"],
      required: true,
    },
    backupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BackupRecord",
      default: null,
    },
    fileName: {
      type: String,
      default: "",
    },
    performedBy: {
      type: String,
      default: "Admin",
    },
    status: {
      type: String,
      enum: ["Success", "Failed"],
      default: "Success",
    },
    message: {
      type: String,
      default: "",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

backupRestoreLogSchema.index({ createdAt: -1 })

module.exports = mongoose.model("BackupRestoreLog", backupRestoreLogSchema)
