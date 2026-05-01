const Notification = require("../models/Notification")
const SmartCalculatorEntry = require("../models/SmartCalculatorEntry")

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

const toAmount = (value) => {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

const normalizeDenominations = (values = []) =>
  values
    .map((item) => {
      const value = toAmount(item.value)
      const count = toAmount(item.count)

      return {
        value,
        count,
        total: Number((value * count).toFixed(2)),
      }
    })
    .filter((item) => item.value > 0)

const calculateTotals = (payload = {}) => {
  const denominationBreakdown = normalizeDenominations(payload.denominationBreakdown)
  const notesCount = denominationBreakdown.reduce((total, item) => total + item.count, 0)
  const cashTotal = denominationBreakdown.reduce((total, item) => total + item.total, 0)
  const onlineAmount = toAmount(payload.onlineAmount)
  const tallyAmount = toAmount(payload.tallyAmount)
  const manualAdjustmentAmount = toAmount(payload.manualAdjustmentAmount)
  const manualAdjustmentMode = ["add", "sub"].includes(payload.manualAdjustmentMode)
    ? payload.manualAdjustmentMode
    : "none"

  const signedAdjustment =
    manualAdjustmentMode === "add"
      ? manualAdjustmentAmount
      : manualAdjustmentMode === "sub"
        ? -manualAdjustmentAmount
        : 0

  const cardEnabled = Boolean(payload.cardSwipe?.enabled)
  const cardAmount = cardEnabled ? toAmount(payload.cardSwipe?.amount) : 0
  const chargePercent = cardEnabled ? toAmount(payload.cardSwipe?.chargePercent) : 0
  const chargeAmount = Number(((cardAmount * chargePercent) / 100).toFixed(2))
  const finalCardAmount = Number((cardAmount + chargeAmount).toFixed(2))
  const totalAmount = Number((cashTotal + onlineAmount + finalCardAmount + signedAdjustment).toFixed(2))
  const differenceAmount = Number((totalAmount - tallyAmount).toFixed(2))

  return {
    notesCount,
    cashTotal: Number(cashTotal.toFixed(2)),
    onlineAmount: Number(onlineAmount.toFixed(2)),
    tallyAmount: Number(tallyAmount.toFixed(2)),
    manualAdjustmentMode,
    manualAdjustmentAmount: Number(manualAdjustmentAmount.toFixed(2)),
    totalAmount,
    differenceAmount,
    denominationBreakdown,
    cardSwipe: {
      enabled: cardEnabled,
      amount: Number(cardAmount.toFixed(2)),
      chargePercent: Number(chargePercent.toFixed(2)),
      chargeAmount,
      finalAmount: finalCardAmount,
    },
  }
}

const getBaseQuery = (user) => {
  const createdAfter = new Date(Date.now() - RETENTION_MS)

  if (user.role === "Admin") {
    return {
      createdAt: { $gte: createdAfter },
    }
  }

  if (user.role === "Manager") {
    return {
      createdAt: { $gte: createdAfter },
      $or: [
        {
          creatorRole: "Manager",
          creatorName: user.name,
        },
        {
          sentToRoles: "Manager",
        },
      ],
    }
  }

  return {
    createdAt: { $gte: createdAfter },
    creatorRole: "Employee",
    creatorEmployeeId: user.employeeId,
  }
}

const applyFilters = (baseQuery, query = {}) => {
  const conditions = [baseQuery]

  if (query.entryType && ["credit", "debit"].includes(query.entryType)) {
    conditions.push({ entryType: query.entryType })
  }

  if (query.search) {
    conditions.push({
      $or: [
        { payeeName: { $regex: query.search, $options: "i" } },
        { creatorName: { $regex: query.search, $options: "i" } },
      ],
    })
  }

  if (query.startDate || query.endDate) {
    const entryDate = {}

    if (query.startDate) {
      entryDate.$gte = new Date(query.startDate)
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate)
      endDate.setHours(23, 59, 59, 999)
      entryDate.$lte = endDate
    }

    conditions.push({ entryDate })
  }

  return conditions.length === 1 ? baseQuery : { $and: conditions }
}

const createSendNotification = async ({ user, entry }) => {
  if (user.role !== "Employee") {
    return
  }

  await Notification.create({
    title: "Smart Calculator Entry Shared",
    message: `${user.name} shared a ${entry.entryType} entry for ${entry.payeeName} of Rs ${entry.totalAmount}`,
    sender: {
      role: user.role,
      name: user.name,
      employeeId: user.employeeId,
    },
    targetRoles: ["Admin", "Manager"],
    recipientKeys: ["Admin:Admin", "Manager:Manager"],
  })
}

exports.getEntries = async (req, res) => {
  try {
    const query = applyFilters(getBaseQuery(req.user), req.query)
    const items = await SmartCalculatorEntry.find(query).sort({ entryDate: -1, createdAt: -1 })

    res.json(items)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createEntry = async (req, res) => {
  try {
    const computed = calculateTotals(req.body)
    const shouldSend = Boolean(req.body.sendToAdminManager && req.user.role === "Employee")

    const entry = await SmartCalculatorEntry.create({
      payeeName: (req.body.payeeName || "No Name").trim() || "No Name",
      entryDate: req.body.entryDate || new Date(),
      entryType: req.body.entryType === "debit" ? "debit" : "credit",
      remarks: req.body.remarks || "",
      visibleDenominations: Array.isArray(req.body.visibleDenominations)
        ? req.body.visibleDenominations.map((value) => toAmount(value)).filter((value) => value > 0)
        : [],
      creatorRole: req.user.role,
      creatorName: req.user.name,
      creatorEmployeeId: req.user.employeeId || "",
      sentToRoles: shouldSend ? ["Admin", "Manager"] : [],
      sentAt: shouldSend ? new Date() : null,
      ...computed,
    })

    if (shouldSend) {
      await createSendNotification({
        user: req.user,
        entry,
      })
    }

    res.status(201).json(entry)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await SmartCalculatorEntry.findById(req.params.id)

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" })
    }

    if (req.user.role === "Employee" && entry.creatorEmployeeId !== req.user.employeeId) {
      return res.status(403).json({ message: "You do not have access to delete this entry" })
    }

    if (
      req.user.role === "Manager" &&
      !(entry.creatorRole === "Manager" && entry.creatorName === req.user.name)
    ) {
      return res.status(403).json({ message: "You do not have access to delete this entry" })
    }

    await entry.deleteOne()
    res.json({ message: "Entry deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
