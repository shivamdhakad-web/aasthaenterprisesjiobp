const Employee = require("../models/Employee")
const EmployeeAttendance = require("../models/EmployeeAttendance")
const EmployeeLeave = require("../models/EmployeeLeave")

const LEAVE_LIMITS = {
  CL: 12,
  SL: 6,
  PL: 6,
  LOP: 0,
}

const startOfDay = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const endOfDay = (value) => {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

const eachDateInclusive = (start, end) => {
  const dates = []
  const current = startOfDay(start)
  const last = startOfDay(end)

  while (current <= last) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

const getLeaveBalances = (leaves, year = new Date().getFullYear()) => {
  const used = {
    CL: 0,
    SL: 0,
    PL: 0,
    LOP: 0,
  }

  leaves.forEach((leave) => {
    const leaveYear = new Date(leave.startDate).getFullYear()

    if (leave.status === "approved" && leaveYear === year) {
      used[leave.leaveType] = (used[leave.leaveType] || 0) + Number(leave.days || 0)
    }
  })

  return Object.entries(LEAVE_LIMITS).map(([type, total]) => ({
    type,
    total,
    used: used[type] || 0,
    remaining: Math.max(total - (used[type] || 0), 0),
  }))
}

const syncLeaveAttendance = async (leave) => {
  const dates = eachDateInclusive(leave.startDate, leave.endDate)

  for (const date of dates) {
    const existingRecord = await EmployeeAttendance.findOne({
      employeeId: leave.employeeId,
      date: {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      },
    })

    if (existingRecord) {
      existingRecord.status = "absent"
      existingRecord.remark = `Approved ${leave.leaveType} leave${leave.reason ? ` - ${leave.reason}` : ""}`
      existingRecord.createdByRole = "Admin"
      existingRecord.leaveRequestId = leave._id
      await existingRecord.save()
      continue
    }

    await EmployeeAttendance.create({
      employeeId: leave.employeeId,
      date: startOfDay(date),
      status: "absent",
      remark: `Approved ${leave.leaveType} leave${leave.reason ? ` - ${leave.reason}` : ""}`,
      createdByRole: "Admin",
      leaveRequestId: leave._id,
    })
  }
}

const clearLeaveAttendance = async (leave) => {
  await EmployeeAttendance.deleteMany({
    employeeId: leave.employeeId,
    leaveRequestId: leave._id,
  })
}

exports.getLeaves = async (req, res) => {
  try {
    const filters = {}

    if (req.query.status) {
      filters.status = req.query.status
    }

    if (req.query.employeeId) {
      filters.employeeId = req.query.employeeId
    }

    const leaves = await EmployeeLeave.find(filters)
      .populate("employeeId", "name role shift phone")
      .sort({ createdAt: -1 })

    const employeeIds = [...new Set(leaves.map((leave) => leave.employeeId?._id?.toString()).filter(Boolean))]
    const employeeMap = new Map()

    if (employeeIds.length) {
      const allEmployeeLeaves = await EmployeeLeave.find({
        employeeId: { $in: employeeIds },
      })

      employeeIds.forEach((id) => {
        employeeMap.set(
          id,
          getLeaveBalances(allEmployeeLeaves.filter((leave) => leave.employeeId.toString() === id)),
        )
      })
    }

    res.json({
      items: leaves,
      balancesByEmployee: Object.fromEntries(employeeMap),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.decideLeave = async (req, res) => {
  try {
    const leave = await EmployeeLeave.findById(req.params.id)

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" })
    }

    const nextStatus = req.body.status

    if (!["approved", "rejected"].includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid leave decision" })
    }

    const previousStatus = leave.status

    leave.status = nextStatus
    leave.adminNote = req.body.adminNote || ""
    leave.reviewedByRole = req.user.role
    leave.reviewedByName = req.user.name
    leave.reviewedAt = new Date()
    await leave.save()

    if (previousStatus === "approved" && nextStatus !== "approved") {
      await clearLeaveAttendance(leave)
    }

    if (nextStatus === "approved") {
      await syncLeaveAttendance(leave)
    }

    const employee = await Employee.findById(leave.employeeId).select("name role shift phone")

    res.json({
      ...leave.toObject(),
      employeeId: employee,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
