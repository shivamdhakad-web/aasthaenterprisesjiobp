const mongoose = require("mongoose")

const densityCalculatorEntrySchema = new mongoose.Schema(
  {
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    mode: {
      type: String,
      enum: ["density", "volume"],
      required: true,
    },
    hydrometer: {
      type: Number,
      default: 0,
    },
    temperature: {
      type: Number,
      default: 0,
    },
    densityValue: {
      type: Number,
      default: 0,
    },
    tankKey: {
      type: String,
      default: "",
    },
    tankLabel: {
      type: String,
      default: "",
    },
    tankCapacityLitres: {
      type: Number,
      default: 0,
    },
    maxReadingCm: {
      type: Number,
      default: 0,
    },
    readingCm: {
      type: Number,
      default: 0,
    },
    volumeValue: {
      type: Number,
      default: 0,
    },
    creatorRole: {
      type: String,
      required: true,
    },
    creatorName: {
      type: String,
      required: true,
    },
    creatorEmployeeId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
)

densityCalculatorEntrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

module.exports = mongoose.model("DensityCalculatorEntry", densityCalculatorEntrySchema)