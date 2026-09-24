const mongoose = require("mongoose")

const stationDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      required: true,
      enum: ["Licence", "Invoice", "Equipment", "Safety", "Delivery", "Station", "Other"],
    },
    fileName: { type: String, required: true, trim: true, maxlength: 240 },
    format: { type: String, required: true, lowercase: true },
    resourceType: { type: String, required: true, enum: ["image", "raw"] },
    bytes: { type: Number, required: true, min: 1 },
    secureUrl: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    expiresAt: { type: Date, default: null },
    uploadedBy: { type: String, default: "Admin" },
  },
  { timestamps: true },
)

stationDocumentSchema.index({ category: 1, createdAt: -1 })
stationDocumentSchema.index({ title: "text", fileName: "text" })

module.exports = mongoose.model("StationDocument", stationDocumentSchema)
