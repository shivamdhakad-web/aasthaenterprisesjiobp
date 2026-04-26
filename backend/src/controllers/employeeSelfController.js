const EmployeeAttendance = require("../models/EmployeeAttendance")
const Employee = require("../models/Employee")
const LubricantProduct = require("../models/LubricantProduct")
const LubricantSale = require("../models/LubricantSale")

const DAY_MS = 24 * 60 * 60 * 1000

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
  canEdit: canEditWithinDays(record.date, 3),
})

const annotateSale = (sale) => ({
  ...sale.toObject(),
  canEdit: canEditWithinDays(sale.date, 3),
})

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

    res.json({
      employee,
      totals: {
        attendanceCount,
        salesCount,
      },
    })
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
