const Employee = require("../models/Employee")
const EmployeeAttendance = require("../models/EmployeeAttendance")

const buildMonthRange = (month) => {
  const current = month ? new Date(`${month}-01T00:00:00`) : new Date()
  const start = new Date(current.getFullYear(), current.getMonth(), 1)
  const end = new Date(current.getFullYear(), current.getMonth() + 1, 1)

  return {
    start,
    end,
    monthKey: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
  }
}

const buildDayRange = (date) => {
  const start = new Date(`${date}T00:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    start,
    end,
    dayKey: date,
  }
}

const getDaysInMonth = (value) => {
  const date = value ? new Date(value) : new Date()

  if (Number.isNaN(date.getTime())) {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  }

  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

exports.getSalarySummary = async (req, res) => {
  try {
    const employeeId = req.params.employeeId || req.user.employeeId

    if (!employeeId) {
      return res.status(400).json({ message: "Employee id is required" })
    }

    if (req.user.role === "Employee" && req.user.employeeId !== employeeId) {
      return res.status(403).json({ message: "You can only access your own salary summary" })
    }

    const employee = await Employee.findById(employeeId)

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const isDateMode = Boolean(req.query.date)
    const isAllMode = req.query.scope === "all"
    const range = isDateMode ? buildDayRange(req.query.date) : buildMonthRange(req.query.month)

    const attendanceQuery = { employeeId }

    if (!isAllMode) {
      attendanceQuery.date = {
        $gte: range.start,
        $lt: range.end,
      }
    }

    const attendance = await EmployeeAttendance.find(attendanceQuery).sort({ date: 1 })

    const monthlySalary = Number(employee.salary || 0)

    let present = 0
    let absent = 0
    let doubleShift = 0
    let presentHalfShift = 0
    let halfShift = 0
    let shortage = 0
    let advance = 0
    let bonus = 0
    let earned = 0

    attendance.forEach((entry) => {
      const perDay = monthlySalary / getDaysInMonth(entry.date)

      if (entry.status === "present") present += 1
      if (entry.status === "absent") absent += 1
      if (entry.status === "double") doubleShift += 1
      if (entry.status === "present_half") presentHalfShift += 1
      if (entry.status === "half") halfShift += 1
      if (entry.status === "bonus") bonus += Number(entry.bonusAmount || 0)

      shortage += Number(entry.shortage || 0)
      advance += Number(entry.advanceCash || 0) + Number(entry.advancePetrol || 0)

      if (entry.status === "present") earned += perDay
      if (entry.status === "double") earned += perDay * 2
      if (entry.status === "present_half") earned += perDay * 1.5
      if (entry.status === "half") earned += perDay * 0.5
    })

    res.json({
      employee: {
        _id: employee._id,
        name: employee.name,
        role: employee.role,
        shift: employee.shift,
        salary: monthlySalary,
      },
      month: isAllMode ? null : isDateMode ? req.query.date?.slice?.(0, 7) : range.monthKey,
      selectedDate: isDateMode ? range.dayKey : null,
      scope: isAllMode ? "all" : isDateMode ? "date" : "month",
      breakdown: {
        present,
        absent,
        double: doubleShift,
        presentHalf: presentHalfShift,
        half: halfShift,
        shortage,
        advance,
        bonus,
        earned: Math.round(earned),
        final: Math.round(earned + bonus + shortage - advance),
      },
      entries: attendance,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}



