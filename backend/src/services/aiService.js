const axios = require("axios")

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

const formatCategoryTotals = (categoryTotals = {}) =>
  Object.entries(categoryTotals)
    .sort(([, firstAmount], [, secondAmount]) => Number(secondAmount || 0) - Number(firstAmount || 0))
    .slice(0, 3)
    .map(([category, amount]) => `${category}: ${formatCurrency(amount)}`)
    .join(", ")

const buildFallbackSummary = ({ reportType, filters = {}, totals = {}, rows = [] }) => {
  const monthText = filters.month && filters.month !== "All" ? filters.month : "selected period"
  const categoryText = filters.category && filters.category !== "All Categories" ? filters.category : "all categories"
  const highestCategories = formatCategoryTotals(totals.categoryTotals)
  const largestRow = [...rows].sort((first, second) => Number(second.amount || 0) - Number(first.amount || 0))[0]
  const dateRange =
    filters.fromDate && filters.fromDate !== "All" && filters.toDate && filters.toDate !== "All"
      ? `${filters.fromDate} to ${filters.toDate}`
      : monthText

  const points = [
    `${reportType} summary for ${dateRange}: ${totals.records || rows.length || 0} records with total amount ${formatCurrency(totals.totalAmount)}.`,
    `Category filter: ${categoryText}.`,
  ]

  if (highestCategories) {
    points.push(`Top categories by amount: ${highestCategories}.`)
  }

  if (largestRow) {
    points.push(
      `Largest entry is ${formatCurrency(largestRow.amount)} in ${largestRow.category || "Uncategorized"} on ${largestRow.date || "unknown date"}.`,
    )
  }

  points.push("Review high-value entries before final report approval.")

  return points.map((point) => `- ${point}`).join("\n")
}

const buildPrompt = ({ reportType, filters, totals, rows }) => `
You are an assistant for a petrol pump management system.
Create a complete, practical business summary in English for this ${reportType} report.

Rules:
- Use only the provided JSON data.
- Do not invent missing values.
- Return exactly 5 bullet points.
- Every bullet must start with "- ".
- Include total records and total amount in the first bullet.
- Mention top categories if category totals are available.
- Mention the largest entry if rows are available.
- Mention one practical review/action point.
- Do not stop after a heading.
- Do not write markdown headings.

Report JSON:
${JSON.stringify({ filters, totals, rows }, null, 2)}
`

const extractGeminiText = (data) =>
  data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim() || ""

const generateGeminiSummary = async (payload) => {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    const error = new Error("Gemini API key is not configured.")
    error.statusCode = 503
    throw error
  }

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest"
  const url = `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${apiKey}`

  const response = await axios.post(
    url,
    {
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(payload) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700,
      },
    },
    { timeout: 20000 },
  )

  const text = extractGeminiText(response.data)

  if (!text || text.length < 80 || /\b(and|or|with|for|to|by)\s*$/i.test(text)) {
    return {
      provider: "local-fallback",
      model,
      summary: buildFallbackSummary(payload),
    }
  }

  return {
    provider: "gemini",
    model,
    summary: text,
  }
}

const generateReportSummary = async (payload) => generateGeminiSummary(payload)

module.exports = {
  generateReportSummary,
}
