const axios = require("axios")

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

const buildPrompt = ({ reportType, filters, totals, rows }) => `
You are an assistant for a petrol pump management system.
Create a short, practical business summary in English for this ${reportType} report.

Rules:
- Use only the provided JSON data.
- Do not invent missing values.
- Keep it concise and useful for an admin.
- Mention totals, important category patterns, and warnings if something looks unusual.
- Return plain text only.

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
        maxOutputTokens: 350,
      },
    },
    { timeout: 20000 },
  )

  const text = extractGeminiText(response.data)

  if (!text) {
    const error = new Error("AI did not return a summary.")
    error.statusCode = 502
    throw error
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
