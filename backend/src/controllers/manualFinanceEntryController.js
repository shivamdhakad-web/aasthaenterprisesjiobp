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
