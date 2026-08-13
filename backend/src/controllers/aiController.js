const {
  generateGeminiChatAnswer,
  generateGroqChatAnswer,
  generateReportSummary,
  GEMINI_CHAT_MODELS,
  GROQ_CHAT_MODELS,
  AI_CHAT_SCOPES,
  extractPhotoEntries,
} = require("../services/aiService")

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

exports.getChatModels = (_req, res) => {
  res.json({
    providers: {
      groq: { label: "Groq", models: GROQ_CHAT_MODELS, defaultModel: "llama-3.1-8b-instant" },
      gemini: { label: "Google Gemini", models: GEMINI_CHAT_MODELS, defaultModel: "gemini-3.5-flash-lite" },
    },
    scopes: AI_CHAT_SCOPES,
    defaultProvider: "gemini",
  })
}

exports.chat = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({ message: "Only admin can use AI chat." })
    }

    const { question = "", messages = [], model, provider = "gemini", scope = "all", responseLanguage = "hinglish" } = req.body || {}

    if (!String(question).trim()) {
      return res.status(400).json({ message: "Question is required." })
    }

    const result = provider === "gemini"
      ? await generateGeminiChatAnswer({ question, messages, model, scope, responseLanguage })
      : await generateGroqChatAnswer({ question, messages, model, scope, responseLanguage })
    res.json(result)
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.response?.data?.error?.message || error.message || "Unable to generate AI chat answer.",
    })
  }
}

exports.importPhotoEntries = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({ message: "Only admin can import entries from a photo." })
    }

    const { imageDataUrl, pageKey } = req.body || {}
    const result = await extractPhotoEntries({ imageDataUrl, pageKey })
    res.json(result)
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.response?.data?.error?.message || error.message || "Unable to read the photo.",
    })
  }
}
