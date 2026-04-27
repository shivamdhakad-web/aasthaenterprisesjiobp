const EmployeeAttendance = require("../models/EmployeeAttendance")
const Employee = require("../models/Employee")
const EmployeeLeave = require("../models/EmployeeLeave")
const Expense = require("../models/Expense")
const LubricantProduct = require("../models/LubricantProduct")
const LubricantSale = require("../models/LubricantSale")
const ShiftSchedule = require("../models/ShiftSchedule")
const TaskAssignment = require("../models/TaskAssignment")

const DAY_MS = 24 * 60 * 60 * 1000
const LEAVE_LIMITS = {
  CL: 12,
  SL: 6,
  PL: 6,
  LOP: 0,
}

const withinCurrentMonth = (value) => {
  const date = new Date(value)
  const now = new Date()

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  )
}

const canAccessSale = (sale, user) =>
  sale.createdByRole === "Employee" && sale.createdByEmployeeId === user.employeeId

const canEditWithinDays = (value, days) => {
  const target = new Date(value)
  const now = new Date()

  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)

  const diff = (now - target) / DAY_MS
  return diff >= 0 && diff <= days
}

const annotateAttendance = (record) => ({
  ...record.toObject(),
  canEdit: !record.leaveRequestId && canEditWithinDays(record.date, 3),
})

const annotateSale = (sale) => ({
  ...sale.toObject(),
  canEdit: canEditWithinDays(sale.date, 3),
})

const annotateExpense = (expense) => ({
  ...expense.toObject(),
  canEdit: canEditWithinDays(expense.date, 3),
})

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

const formatDateKey = (value) => {
  const date = startOfDay(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`
}

const buildLeaveBalances = (leaves, year = new Date().getFullYear()) => {
  const used = {
    CL: 0,
    SL: 0,
    PL: 0,
    LOP: 0,
  }

  leaves.forEach((leave) => {
    if (leave.status !== "approved") {
      return
    }

    if (new Date(leave.startDate).getFullYear() !== year) {
      return
    }

    used[leave.leaveType] = (used[leave.leaveType] || 0) + Number(leave.days || 0)
  })

  return Object.entries(LEAVE_LIMITS).map(([type, total]) => ({
    type,
    total,
    used: used[type] || 0,
    remaining: Math.max(total - (used[type] || 0), 0),
  }))
}

const countInclusiveDays = (startDate, endDate) => {
  const start = startOfDay(startDate)
  const end = startOfDay(endDate)
  return Math.floor((end - start) / DAY_MS) + 1
}

const getTaskCounts = (tasks) =>
  tasks.reduce(
    (summary, task) => {
      summary.total += 1

      if (task.status === "completed") {
        summary.completed += 1
      } else if (task.status === "in_progress") {
        summary.inProgress += 1
      } else {
        summary.pending += 1
      }

      return summary
    },
    { total: 0, pending: 0, inProgress: 0, completed: 0 },
  )

const resolveScheduleForDay = (day, schedules, employee) => {
  const dayKey = formatDateKey(day)
  const weekDay = startOfDay(day).getDay()
  const employeeId = employee._id.toString()

  const matches = schedules
    .map((schedule) => {
      const targetEmployeeId = schedule.employeeId?._id?.toString?.() || schedule.employeeId?.toString?.()
      const targetWeight = targetEmployeeId === employeeId ? 4 : schedule.appliesToAll ? 1 : 0

      if (!targetWeight) {
        return null
      }

      const isDateMatch =
        schedule.scheduleType === "one-time" && schedule.date && formatDateKey(schedule.date) === dayKey
      const isRecurringMatch =
        schedule.scheduleType === "recurring" && Number(schedule.weekDay) === weekDay

      if (!isDateMatch && !isRecurringMatch) {
        return null
      }

      return {
        schedule,
        score: (isDateMatch ? 20 : 10) + targetWeight,
      }
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score)

  if (matches.length) {
    return matches[0].schedule
  }

  if (!employee.shift) {
    return null
  }

  return {
    shiftName: `${employee.shift} Shift`,
    startTime: "-",
    endTime: "-",
    period: employee.shift.toLowerCase() === "night" ? "night" : "day",
    notes: "Default shift from employee profile",
  }
}

const buildWeekSchedule = (employee, schedules) => {
  const days = []
  const today = startOfDay(new Date())

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + index)

    const match = resolveScheduleForDay(date, schedules, employee)
    days.push({
      date: formatDateKey(date),
      dayLabel: date.toLocaleDateString("en-IN", { weekday: "short" }),
      shiftName: match?.shiftName || "-",
      startTime: match?.startTime || "-",
      endTime: match?.endTime || "-",
      period: match?.period || "-",
      notes: match?.notes || "",
    })
  }

  return days
}

const buildSeries = (items, dateAccessor, amountAccessor, labels) =>
  labels.map((label) => ({
    label: label.key,
    value: items
      .filter((item) => dateAccessor(item) === label.match)
      .reduce((total, item) => total + amountAccessor(item), 0),
  }))

const getLastMonthLabels = (count = 6) => {
  const labels = []
  const current = startOfDay(new Date())
  current.setDate(1)

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1)
    const match = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    labels.push({
      key: date.toLocaleDateString("en-IN", { month: "short" }),
      match,
    })
  }

  return labels
}

const getLastSevenDayLabels = () => {
  const labels = []
  const current = startOfDay(new Date())

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(current)
    date.setDate(current.getDate() - index)
    labels.push({
      key: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      match: formatDateKey(date),
    })
  }

  return labels
}

exports.getOverview = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.employeeId)

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const attendanceCount = await EmployeeAttendance.countDocuments({
      employeeId: req.user.employeeId,
    })

    const salesCount = await LubricantSale.countDocuments({
      createdByEmployeeId: req.user.employeeId,
      createdByRole: "Employee",
    })

    const taskCount = await TaskAssignment.countDocuments({
      employeeId: req.user.employeeId,
      status: { $ne: "completed" },
    })

    const leaveCount = await EmployeeLeave.countDocuments({
      employeeId: req.user.employeeId,
    })

    res.json({
      employee,
      totals: {
        attendanceCount,
        salesCount,
        taskCount,
        leaveCount,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMyInfo = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.employeeId).select("-loginPassword")

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    res.json(employee)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMyAttendance = async (req, res) => {
  try {
    const data = await EmployeeAttendance.find({
      employeeId: req.user.employeeId,
    }).sort({ date: -1 })

    res.json(data.map(annotateAttendance))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.addMyAttendance = async (req, res) => {
  try {
    if (!withinCurrentMonth(req.body.date)) {
      return res.status(400).json({ message: "You can only add attendance in the current month" })
    }

    const dateKey = startOfDay(req.body.date)
    const existingRecord = await EmployeeAttendance.findOne({
      employeeId: req.user.employeeId,
      date: {
        $gte: dateKey,
        $lte: endOfDay(req.body.date),
      },
    })

    if (existingRecord) {
      return res.status(400).json({ message: "Attendance for this date already exists" })
    }

    const approvedLeave = await EmployeeLeave.findOne({
      employeeId: req.user.employeeId,
      status: "approved",
      startDate: { $lte: endOfDay(req.body.date) },
      endDate: { $gte: startOfDay(req.body.date) },
    })

    if (approvedLeave) {
      return res.status(400).json({ message: "Approved leave already covers this date" })
    }

    const record = await EmployeeAttendance.create({
      employeeId: req.user.employeeId,
      date: req.body.date,
      status: req.body.status,
      remark: req.body.remark,
      createdByRole: "Employee",
      createdByEmployeeId: req.user.employeeId,
    })

    res.status(201).json(record)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateMyAttendance = async (req, res) => {
  try {
    const record = await EmployeeAttendance.findById(req.params.id)

    if (!record || record.employeeId.toString() !== req.user.employeeId) {
      return res.status(404).json({ message: "Attendance entry not found" })
    }

    if (record.leaveRequestId) {
      return res.status(400).json({ message: "Leave-linked attendance cannot be edited" })
    }

    if (!withinCurrentMonth(req.body.date || record.date)) {
      return res.status(400).json({ message: "You can only edit current-month attendance" })
    }

    if (!canEditWithinDays(record.date, 3)) {
      return res.status(400).json({ message: "Attendance can only be edited within 3 days" })
    }

    record.date = req.body.date || record.date
    record.status = req.body.status || record.status
    record.remark = req.body.remark || ""
    await record.save()

    res.json(record)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getProducts = async (_req, res) => {
  try {
    const products = await LubricantProduct.find().sort({ name: 1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMyLubricantSales = async (req, res) => {
  try {
    const sales = await LubricantSale.find({
      createdByRole: "Employee",
      createdByEmployeeId: req.user.employeeId,
    }).sort({ date: -1 })

    res.json(sales.map(annotateSale))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await EmployeeLeave.find({
      employeeId: req.user.employeeId,
    }).sort({ createdAt: -1 })

    res.json({
      items: leaves,
      balances: buildLeaveBalances(leaves),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.applyMyLeave = async (req, res) => {
  try {
    const startDate = startOfDay(req.body.startDate)
    const endDate = startOfDay(req.body.endDate)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Valid leave dates are required" })
    }

    if (endDate < startDate) {
      return res.status(400).json({ message: "End date must be after start date" })
    }

    const leave = await EmployeeLeave.create({
      employeeId: req.user.employeeId,
      leaveType: req.body.leaveType || "CL",
      startDate,
      endDate,
      days: countInclusiveDays(startDate, endDate),
      reason: req.body.reason,
      requestedByName: req.user.name,
    })

    res.status(201).json(leave)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMyShifts = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.employeeId).select("_id name shift role phone")

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const today = startOfDay(new Date())
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const schedules = await ShiftSchedule.find({
      $and: [
        {
          $or: [{ employeeId: req.user.employeeId }, { appliesToAll: true }],
        },
        {
          $or: [
            { scheduleType: "recurring" },
            {
              scheduleType: "one-time",
              date: {
                $gte: today,
                $lt: nextWeek,
              },
            },
          ],
        },
      ],
    }).sort({ appliesToAll: 1, createdAt: -1 })

    const week = buildWeekSchedule(employee, schedules)

    res.json({
      today: week[0] || null,
      week,
      schedules,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await TaskAssignment.find({
      employeeId: req.user.employeeId,
    }).sort({ status: 1, dueDate: 1, assignedDate: -1, createdAt: -1 })

    res.json({
      items: tasks,
      counts: getTaskCounts(tasks),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateMyTaskStatus = async (req, res) => {
  try {
    const task = await TaskAssignment.findById(req.params.id)

    if (!task || task.employeeId.toString() !== req.user.employeeId) {
      return res.status(404).json({ message: "Task not found" })
    }

    if (req.body.status) {
      task.status = req.body.status
      task.completedAt = req.body.status === "completed" ? new Date() : null
    }

    task.employeeNote = req.body.employeeNote ?? task.employeeNote
    await task.save()

    res.json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      employeeId: req.user.employeeId,
      createdByRole: "Employee",
    }).sort({ date: -1, createdAt: -1 })

    res.json(expenses.map(annotateExpense))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.addMyExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      date: req.body.date,
      category: req.body.category,
      description: req.body.description,
      amount: Number(req.body.amount || 0),
      paymentMode: req.body.paymentMode || "Cash",
      addedBy: req.user.name,
      employeeId: req.user.employeeId,
      employeeName: req.user.name,
      createdByRole: "Employee",
      expenseSource: "employee",
    })

    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateMyExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)

    if (!expense || expense.employeeId?.toString() !== req.user.employeeId || expense.createdByRole !== "Employee") {
      return res.status(404).json({ message: "Expense not found" })
    }

    if (!canEditWithinDays(expense.date, 3)) {
      return res.status(400).json({ message: "Expense can only be edited within 3 days" })
    }

    expense.date = req.body.date || expense.date
    expense.category = req.body.category || expense.category
    expense.description = req.body.description ?? expense.description
    expense.amount = Number(req.body.amount ?? expense.amount)
    expense.paymentMode = req.body.paymentMode || expense.paymentMode
    await expense.save()

    res.json(expense)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMyPerformance = async (req, res) => {
  try {
    const [sales, expenses] = await Promise.all([
      LubricantSale.find({
        createdByRole: "Employee",
        createdByEmployeeId: req.user.employeeId,
      }).sort({ date: 1 }),
      Expense.find({
        employeeId: req.user.employeeId,
        createdByRole: "Employee",
      }).sort({ date: 1 }),
    ])

    const today = formatDateKey(new Date())
    const sevenDaysAgo = startOfDay(new Date())
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const thisMonth = today.slice(0, 7)

    const salesSummary = {
      today: 0,
      week: 0,
      month: 0,
      total: 0,
    }

    const expenseSummary = {
      today: 0,
      week: 0,
      month: 0,
      total: 0,
    }

    sales.forEach((sale) => {
      const amount = Number(sale.total || 0)
      const saleKey = formatDateKey(sale.date)
      salesSummary.total += amount

      if (saleKey === today) {
        salesSummary.today += amount
      }

      if (startOfDay(sale.date) >= sevenDaysAgo) {
        salesSummary.week += amount
      }

      if (saleKey.slice(0, 7) === thisMonth) {
        salesSummary.month += amount
      }
    })

    expenses.forEach((expense) => {
      const amount = Number(expense.amount || 0)
      const expenseKey = formatDateKey(expense.date)
      expenseSummary.total += amount

      if (expenseKey === today) {
        expenseSummary.today += amount
      }

      if (startOfDay(expense.date) >= sevenDaysAgo) {
        expenseSummary.week += amount
      }

      if (expenseKey.slice(0, 7) === thisMonth) {
        expenseSummary.month += amount
      }
    })

    const monthLabels = getLastMonthLabels()
    const dayLabels = getLastSevenDayLabels()

    res.json({
      summary: {
        sales: salesSummary,
        expenses: expenseSummary,
        netMonth: salesSummary.month - expenseSummary.month,
      },
      monthly: {
        sales: buildSeries(
          sales,
          (sale) => formatDateKey(sale.date).slice(0, 7),
          (sale) => Number(sale.total || 0),
          monthLabels,
        ),
        expenses: buildSeries(
          expenses,
          (expense) => formatDateKey(expense.date).slice(0, 7),
          (expense) => Number(expense.amount || 0),
          monthLabels,
        ),
      },
      weekly: {
        sales: buildSeries(
          sales,
          (sale) => formatDateKey(sale.date),
          (sale) => Number(sale.total || 0),
          dayLabels,
        ),
        expenses: buildSeries(
          expenses,
          (expense) => formatDateKey(expense.date),
          (expense) => Number(expense.amount || 0),
          dayLabels,
        ),
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.addMyLubricantSale = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity || 0)
    const price = Number(req.body.price || 0)
    const product = await LubricantProduct.findOne({ name: req.body.product })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (Number(product.stock || 0) < quantity) {
      return res.status(400).json({ message: "Not enough stock" })
    }

    product.stock = Number(product.stock || 0) - quantity
    await product.save()

    const sale = await LubricantSale.create({
      date: req.body.date,
      product: req.body.product,
      price,
      quantity,
      total: quantity * price,
      soldBy: req.user.name,
      createdByRole: "Employee",
      createdByEmployeeId: req.user.employeeId,
      createdByName: req.user.name,
    })

    res.status(201).json(sale)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateMyLubricantSale = async (req, res) => {
  try {
    const sale = await LubricantSale.findById(req.params.id)

    if (!sale || !canAccessSale(sale, req.user)) {
      return res.status(404).json({ message: "Sale not found" })
    }

    if (!canEditWithinDays(sale.date, 3)) {
      return res.status(400).json({ message: "Lubricant sale can only be edited within 3 days" })
    }

    const nextProduct = await LubricantProduct.findOne({ name: req.body.product })
    const nextQuantity = Number(req.body.quantity || 0)
    const nextPrice = Number(req.body.price || 0)
    const oldQuantity = Number(sale.quantity || 0)
    const oldProduct = await LubricantProduct.findOne({ name: sale.product })

    if (!nextProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    const availableStock =
      oldProduct && oldProduct.name === nextProduct.name
        ? Number(nextProduct.stock || 0) + oldQuantity
        : Number(nextProduct.stock || 0)

    if (availableStock < nextQuantity) {
      return res.status(400).json({ message: "Not enough stock" })
    }

    if (oldProduct && oldProduct.name === nextProduct.name) {
      nextProduct.stock = availableStock - nextQuantity
      await nextProduct.save()
    } else {
      if (oldProduct) {
        oldProduct.stock = Number(oldProduct.stock || 0) + oldQuantity
        await oldProduct.save()
      }

      nextProduct.stock = availableStock - nextQuantity
      await nextProduct.save()
    }

    sale.date = req.body.date
    sale.product = req.body.product
    sale.price = nextPrice
    sale.quantity = nextQuantity
    sale.total = nextPrice * nextQuantity
    sale.soldBy = req.user.name
    await sale.save()

    res.json(sale)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
