const ManualFinanceEntry = require("../models/ManualFinanceEntry")

exports.getEntries = async (_req, res) => {
  try {
    const entries = await ManualFinanceEntry.find().sort({ date: -1, createdAt: -1 })
    res.json(entries)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.addEntry = async (req, res) => {
  try {
    const { date, type, category, description = "", amount, paymentMode = "Cash" } = req.body
    const numericAmount = Number(amount)

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
      return res.status(400).json({ message: "Enter a valid date." })
    }
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Choose income or expense." })
    }
    if (!String(category || "").trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Category and a positive amount are required." })
    }

    const entry = await ManualFinanceEntry.create({
      date,
      type,
      category: String(category).trim(),
      description: String(description).trim(),
      amount: numericAmount,
      paymentMode: String(paymentMode).trim() || "Cash",
      addedBy: req.user?.name || "Admin",
      createdByRole: req.user?.role === "Manager" ? "Manager" : "Admin",
    })

    res.status(201).json(entry)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.addEntries = async (req, res) => {
  try {
    const entries = req.body?.entries
    if (!Array.isArray(entries) || entries.length < 1 || entries.length > 100) {
      return res.status(400).json({ message: "Add between 1 and 100 entries." })
    }
    const docs = entries.map((entry) => {
      const numericAmount = Number(entry.amount)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date || "") || !["income", "expense"].includes(entry.type) || !String(entry.category || "").trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error("Every row needs a valid date, type, category, and positive amount.")
      }
      return {
        date: entry.date,
        type: entry.type,
        category: String(entry.category).trim(),
        description: String(entry.description || "").trim(),
        amount: numericAmount,
        paymentMode: String(entry.paymentMode || "Cash").trim() || "Cash",
        addedBy: req.user?.name || "Admin",
        createdByRole: req.user?.role === "Manager" ? "Manager" : "Admin",
      }
    })
    const created = await ManualFinanceEntry.insertMany(docs, { ordered: true })
    res.status(201).json({ createdCount: created.length, entries: created })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.deleteMonth = async (req, res) => {
  try {
    const year = Number(req.params.year)
    const month = Number(req.params.month)
    if (!Number.isInteger(year) || year < 2000 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Enter a valid year and month." })
    }
    const monthKey = `${year}-${String(month).padStart(2, "0")}`
    const nextMonth = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
    const result = await ManualFinanceEntry.deleteMany({ date: { $gte: `${monthKey}-01`, $lt: nextMonth } })
    res.json({ message: "Monthly financial entries deleted.", deletedCount: result.deletedCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateEntry = async (req, res) => {
  try {
    const { date, type, category, description = "", amount, paymentMode = "Cash" } = req.body
    const numericAmount = Number(amount)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Enter a valid date and entry type." })
    }
    if (!String(category || "").trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Category and a positive amount are required." })
    }

    const entry = await ManualFinanceEntry.findByIdAndUpdate(
      req.params.id,
      {
        date,
        type,
        category: String(category).trim(),
        description: String(description).trim(),
        amount: numericAmount,
        paymentMode: String(paymentMode).trim() || "Cash",
        lastEditedAt: new Date(),
        lastEditedBy: req.user?.name || "Admin",
        lastEditedByRole: req.user?.role || "Admin",
      },
      { new: true, runValidators: true },
    )
    if (!entry) return res.status(404).json({ message: "Financial entry not found." })
    res.json(entry)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await ManualFinanceEntry.findByIdAndDelete(req.params.id)
    if (!entry) return res.status(404).json({ message: "Financial entry not found." })
    res.json({ message: "Financial entry deleted." })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
