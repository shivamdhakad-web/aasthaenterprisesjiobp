const mongoose = require("mongoose")

const backupRecordSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      unique: true,
    },
    format: {
      type: String,
      enum: ["json", "zip"],
      required: true,
    },
    scope: {
      type: String,
      default: "full",
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    totalCollections: {
      type: Number,
      default: 0,
    },
    totalRecords: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      default: "Admin",
    },
    note: {
      type: String,
      default: "",
    },
    locked: {
      type: Boolean,
      default: false,
    },
    passwordProtected: {
      type: Boolean,
      default: false,
    },
    restoredAt: {
      type: Date,
      default: null,
    },
    restoredBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
)

backupRecordSchema.index({ createdAt: -1 })

module.exports = mongoose.model("BackupRecord", backupRecordSchema)
