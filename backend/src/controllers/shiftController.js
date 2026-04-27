const ShiftSchedule = require("../models/ShiftSchedule")

exports.getShiftSchedules = async (req, res) => {
  try {
    const filters = {}

    if (req.query.employeeId) {
      if (req.query.employeeId === "all") {
        filters.appliesToAll = true
      } else {
        filters.employeeId = req.query.employeeId
      }
    }

    const schedules = await ShiftSchedule.find(filters)
      .populate("employeeId", "name role shift")
      .sort({ date: 1, weekDay: 1, createdAt: -1 })

    res.json(schedules)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createShiftSchedule = async (req, res) => {
  try {
    const scheduleType = req.body.scheduleType || "recurring"
    const appliesToAll = req.body.employeeId === "all" || Boolean(req.body.appliesToAll)

    if (scheduleType === "one-time" && !req.body.date) {
      return res.status(400).json({ message: "Date is required for one-time schedule" })
    }

    if (scheduleType === "recurring" && (req.body.weekDay === undefined || req.body.weekDay === null || req.body.weekDay === "")) {
      return res.status(400).json({ message: "Week day is required for recurring schedule" })
    }

    const schedule = await ShiftSchedule.create({
      employeeId: appliesToAll ? null : req.body.employeeId,
      appliesToAll,
      scheduleType,
      weekDay:
        scheduleType === "recurring" && req.body.weekDay !== ""
          ? Number(req.body.weekDay)
          : undefined,
      date: scheduleType === "one-time" ? req.body.date : undefined,
      shiftName: req.body.shiftName,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      period: req.body.period || "day",
      notes: req.body.notes,
      createdByRole: req.user.role,
      createdByName: req.user.name,
    })

    const populated = await schedule.populate("employeeId", "name role shift")
    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateShiftSchedule = async (req, res) => {
  try {
    const schedule = await ShiftSchedule.findById(req.params.id)

    if (!schedule) {
      return res.status(404).json({ message: "Shift schedule not found" })
    }

    const scheduleType = req.body.scheduleType || schedule.scheduleType
    const appliesToAll = req.body.employeeId === "all" || Boolean(req.body.appliesToAll)

    schedule.employeeId = appliesToAll ? null : req.body.employeeId || schedule.employeeId
    schedule.appliesToAll = appliesToAll
    schedule.scheduleType = scheduleType
    schedule.weekDay =
      scheduleType === "recurring"
        ? Number(req.body.weekDay ?? schedule.weekDay)
        : undefined
    schedule.date = scheduleType === "one-time" ? req.body.date || schedule.date : undefined
    schedule.shiftName = req.body.shiftName || schedule.shiftName
    schedule.startTime = req.body.startTime || schedule.startTime
    schedule.endTime = req.body.endTime || schedule.endTime
    schedule.period = req.body.period || schedule.period
    schedule.notes = req.body.notes ?? schedule.notes

    await schedule.save()

    const populated = await schedule.populate("employeeId", "name role shift")
    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteShiftSchedule = async (req, res) => {
  try {
    await ShiftSchedule.findByIdAndDelete(req.params.id)
    res.json({ message: "Shift schedule deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
