const EmployeeDailyReport = require("../models/EmployeeDailyReport")
const Employee = require("../models/Employee")

const DAY_MS = 24 * 60 * 60 * 1000

const normalizeDate = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const canEditWithinDays = (value, days) => {
  const date = normalizeDate(value)
  const now = normalizeDate(new Date())
  const diff = (now - date) / DAY_MS
  return diff >= 0 && diff <= days
}

const toNumber = (value) => Number(value || 0)

const buildPayload = (payload = {}, employee, actor) => ({
  employeeId: employee._id,
  employeeName: employee.name,
  reportDate: payload.reportDate || payload.date,
  location: payload.location,
  shift: payload.shift,
  lube: payload.lube || "",
  manualTotalEnabled: Boolean(payload.manualTotalEnabled),
  manualTotalSales: toNumber(payload.manualTotalSales),
  totals: {
    grandAmount: toNumber(payload.totals?.grandAmount),
    cashTotal: toNumber(payload.totals?.cashTotal),
    cashNet: toNumber(payload.totals?.cashNet),
    onlineTotal: toNumber(payload.totals?.onlineTotal),
    fleetAmount: toNumber(payload.totals?.fleetAmount),
    creditTotal: toNumber(payload.totals?.creditTotal),
    totalCollection: toNumber(payload.totals?.totalCollection),
    shortOver: toNumber(payload.totals?.shortOver),
    hhtTotal: toNumber(payload.totals?.hhtTotal),
    difference: toNumber(payload.totals?.difference),
    denominationTotal: toNumber(payload.totals?.denominationTotal),
    summaryTotal: toNumber(payload.totals?.summaryTotal),
  },
  totaliserRows: payload.totaliserRows || [],
  cashDrops: payload.cashDrops || [],
  online: {
    upiNo: toNumber(payload.online?.upiNo),
    upiAmt: toNumber(payload.online?.upiAmt),
    cardNo: toNumber(payload.online?.cardNo),
    cardAmt: toNumber(payload.online?.cardAmt),
  },
  fleet: {
    count: toNumber(payload.fleet?.count),
    amount: toNumber(payload.fleet?.amount),
  },
  creditCustomers: payload.creditCustomers || [],
  hht: {
    creditCard: toNumber(payload.hht?.creditCard),
    fleet: toNumber(payload.hht?.fleet),
    other: toNumber(payload.hht?.other),
  },
  denominations: payload.denominations || [],
  creditList: payload.creditList || [],
  signatures: {
    systemLogin: payload.signatures?.systemLogin || "",
    shiftSupervisor: payload.signatures?.shiftSupervisor || "",
  },
  updatedByRole: actor.role,
  updatedByName: actor.name,
})

const decorateReport = (report, userRole) => ({
  ...report.toObject(),
  canEdit: userRole === "Admin" ? true : canEditWithinDays(report.reportDate, 2),
})

exports.getDailyReports = async (req, res) => {
  try {
    const query = {}

    if (req.query.employeeId) {
      query.employeeId = req.query.employeeId
    }

    if (req.query.from || req.query.to) {
      query.reportDate = {}
      if (req.query.from) query.reportDate.$gte = new Date(req.query.from)
      if (req.query.to) query.reportDate.$lte = new Date(req.query.to)
    }

    const data = await EmployeeDailyReport.find(query).sort({ reportDate: -1, createdAt: -1 })

    res.json(data.map((report) => decorateReport(report, req.user.role)))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMyDailyReports = async (req, res) => {
  try {
    const data = await EmployeeDailyReport.find({
      employeeId: req.user.employeeId,
    }).sort({ reportDate: -1, createdAt: -1 })

    res.json(data.map((report) => decorateReport(report, req.user.role)))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createMyDailyReport = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.employeeId)

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const report = await EmployeeDailyReport.create({
      ...buildPayload(req.body, employee, req.user),
      createdByRole: req.user.role,
      createdByEmployeeId: req.user.employeeId,
      createdByName: req.user.name,
    })

    res.status(201).json(decorateReport(report, req.user.role))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateMyDailyReport = async (req, res) => {
  try {
    const report = await EmployeeDailyReport.findById(req.params.id)

    if (!report || report.employeeId.toString() !== req.user.employeeId) {
      return res.status(404).json({ message: "Daily report not found" })
    }

    if (!canEditWithinDays(report.reportDate, 2)) {
      return res.status(400).json({ message: "Daily report can only be edited within 2 days" })
    }

    const employee = await Employee.findById(req.user.employeeId)
    Object.assign(report, buildPayload(req.body, employee, req.user))
    await report.save()

    res.json(decorateReport(report, req.user.role))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateDailyReport = async (req, res) => {
  try {
    const report = await EmployeeDailyReport.findById(req.params.id)

    if (!report) {
      return res.status(404).json({ message: "Daily report not found" })
    }

    const employee = await Employee.findById(report.employeeId)
    Object.assign(report, buildPayload(req.body, employee, req.user))
    await report.save()

    res.json(decorateReport(report, req.user.role))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
