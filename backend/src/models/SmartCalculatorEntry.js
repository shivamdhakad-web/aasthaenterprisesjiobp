const mongoose = require("mongoose")

const denominationSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
)

const smartCalculatorEntrySchema = new mongoose.Schema(
  {
    payeeName: {
      type: String,
      trim: true,
      default: "No Name",
    },
    entryDate: {
      type: Date,
      required: true,
    },
    entryType: {
      type: String,
      enum: ["credit", "debit"],
      default: "credit",
    },
    notesCount: {
      type: Number,
      default: 0,
    },
    cashTotal: {
      type: Number,
      default: 0,
    },
    onlineAmount: {
      type: Number,
      default: 0,
    },
    tallyAmount: {
      type: Number,
      default: 0,
    },
    manualAdjustmentMode: {
      type: String,
      enum: ["none", "add", "sub"],
      default: "none",
    },
    manualAdjustmentAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    differenceAmount: {
      type: Number,
      default: 0,
    },
    denominationBreakdown: {
      type: [denominationSchema],
      default: [],
    },
    visibleDenominations: {
      type: [Number],
      default: [],
    },
    cardSwipe: {
      enabled: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        default: 0,
      },
      chargePercent: {
        type: Number,
        default: 0,
      },
      chargeAmount: {
        type: Number,
        default: 0,
      },
      finalAmount: {
        type: Number,
        default: 0,
      },
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
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
    sentToRoles: {
      type: [String],
      default: [],
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

smartCalculatorEntrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

module.exports = mongoose.model("SmartCalculatorEntry", smartCalculatorEntrySchema)