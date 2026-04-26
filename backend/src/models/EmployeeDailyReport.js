const mongoose = require("mongoose")

const reportLineSchema = new mongoose.Schema(
  {
    label: String,
    value: Number,
    qty: Number,
    details: String,
  },
  { _id: false },
)

const reportTotaliserSchema = new mongoose.Schema(
  {
    label: String,
    closing: Number,
    opening: Number,
    dispensed: Number,
    pumpTest: Number,
    ownUse: Number,
    netDispensed: Number,
    rate: Number,
    amount: Number,
  },
  { _id: false },
)

const employeeDailyReportSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeName: String,
    reportDate: {
      type: Date,
      required: true,
    },
    location: String,
    shift: String,
    lube: String,
    manualTotalEnabled: {
      type: Boolean,
      default: false,
    },
    manualTotalSales: {
      type: Number,
      default: 0,
    },
    totals: {
      grandAmount: Number,
      cashTotal: Number,
      cashNet: Number,
      onlineTotal: Number,
      fleetAmount: Number,
      creditTotal: Number,
      totalCollection: Number,
      shortOver: Number,
      hhtTotal: Number,
      difference: Number,
      denominationTotal: Number,
      summaryTotal: Number,
    },
    totaliserRows: {
      type: [reportTotaliserSchema],
      default: [],
    },
    cashDrops: {
      type: [Number],
      default: [],
    },
    online: {
      upiNo: Number,
      upiAmt: Number,
      cardNo: Number,
      cardAmt: Number,
    },
    fleet: {
      count: Number,
      amount: Number,
    },
    creditCustomers: {
      type: [reportLineSchema],
      default: [],
    },
    hht: {
      creditCard: Number,
      fleet: Number,
      other: Number,
    },
    denominations: {
      type: [reportLineSchema],
      default: [],
    },
    creditList: {
      type: [reportLineSchema],
      default: [],
    },
    signatures: {
      systemLogin: String,
      shiftSupervisor: String,
    },
    createdByRole: {
      type: String,
      default: "Employee",
    },
    createdByEmployeeId: String,
    createdByName: String,
    updatedByRole: String,
    updatedByName: String,
  },
  { timestamps: true },
)

module.exports = mongoose.model("EmployeeDailyReport", employeeDailyReportSchema)
