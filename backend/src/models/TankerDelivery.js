const mongoose = require("mongoose")

const tankerSchema = new mongoose.Schema(
  {
    date: {
      type: String,
    },

    truckNo: {
      type: String,
    },

    transportName: {
      type: String,
    },

    driverName: {
      type: String,
    },

    number: {
      type: String,
    },

    product: {
      type: String,
    },

    qty: {
      type: Number,
      default: 0,
    },

    initialStock: {
      type: Number,
      default: 0,
    },

    initialTemp: {
      type: Number,
      default: 0,
    },

    finalStock: {
      type: Number,
      default: 0,
    },

    finalTemp: {
      type: Number,
      default: 0,
    },

    fuelSales: {
      type: Number,
      default: 0,
    },

    unloadedQty: {
      type: Number,
      default: 0,
    },

    lossGain: {
      type: Number,
      default: 0,
    },

    supplier: {
      type: String,
    },

    fuel: {
      type: String,
    },

    quantity: {
      type: Number,
      default: 0,
    },

    density: {
      type: Number,
    },

    invoice: {
      type: String,
    },

    createdBy: {
      type: String,
    },

    lastEditedAt: {
      type: Date,
    },

    lastEditedBy: {
      type: String,
    },

    lastEditedByRole: {
      type: String,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("TankerDelivery",tankerSchema)
