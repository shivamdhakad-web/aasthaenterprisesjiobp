const { generateReportSummary } = require("../services/aiService")

exports.summarizeReport = async (req, res) => {
  try {
    const { reportType, filters = {}, totals = {}, rows = [] } = req.body || {}

    if (!reportType) {
      return res.status(400).json({ message: "Report type is required." })
    }

    if (!Array.isArray(rows)) {
      return res.status(400).json({ message: "Rows must be an array." })
    }

    const limitedRows = rows.slice(0, 80)
    const result = await generateReportSummary({
      reportType,
      filters,
      totals,
      rows: limitedRows,
    })

    res.json({
      ...result,
      rowCount: rows.length,
      analyzedRowCount: limitedRows.length,
    })
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.response?.data?.error?.message || error.message || "Unable to generate AI summary.",
    })
  }
}
