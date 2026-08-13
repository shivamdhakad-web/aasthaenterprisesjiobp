const axios = require("axios")
const Expense = require("../models/Expense")
const CardSwipe = require("../models/CardSwipe")
const LubricantSale = require("../models/LubricantSale")
const DcdEntry = require("../models/DcdEntry")
const MduEntry = require("../models/MduEntry")
const InvoiceDetail = require("../models/InvoiceDetail")
const DailySale = require("../models/DailySale")
const TankerDelivery = require("../models/TankerDelivery")
const MobileDispenser = require("../models/MobileDispenser")
const Employee = require("../models/Employee")

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
const GROQ_API_BASE_URL = "https://api.groq.com/openai/v1"
const GROQ_CHAT_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
]
const GEMINI_CHAT_MODELS = [
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
]

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

const generateGroqSummary = async (payload) => {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    const error = new Error("Groq API key is not configured.")
    error.statusCode = 503
    throw error
  }

  const model = process.env.GROQ_SUMMARY_MODEL || "llama-3.1-8b-instant"

  const response = await axios.post(
    `${GROQ_API_BASE_URL}/chat/completions`,
    {
      model,
      messages: [
        {
          role: "system",
          content: "You create accurate business report summaries from provided data only.",
        },
        {
          role: "user",
          content: buildPrompt(payload),
        },
      ],
      temperature: 0.2,
      max_tokens: 700,
    },
    {
      timeout: 0,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  )

  const text = response.data?.choices?.[0]?.message?.content?.trim() || ""

  if (!text || text.length < 80 || /\b(and|or|with|for|to|by)\s*$/i.test(text)) {
    return {
      provider: "local-fallback",
      model,
      summary: buildFallbackSummary(payload),
    }
  }

  return {
    provider: "groq",
    model,
    summary: text,
  }
}

const generateReportSummary = async (payload) => generateGroqSummary(payload)

const normalizeChatMessages = (messages = []) =>
  messages
    .filter((message) => ["user", "assistant"].includes(message?.role) && String(message?.content || "").trim())
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: String(message.content).slice(0, 4000),
    }))

const parseExpenseDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  const text = String(value || "").trim()
  if (!text) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const parsed = new Date(`${text.slice(0, 10)}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (!match) return null

  const [, day, month, rawYear] = match
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear
  const parsed = new Date(Number(year), Number(month) - 1, Number(day))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatComparableDate = (value) => {
  const date = parseExpenseDate(value)
  if (!date) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const PHOTO_IMPORT_SCHEMAS = {
  expenses: {
    label: "Expenses",
    fields: ["date", "category", "description", "amount", "paymentMode", "addedBy"],
    numericFields: ["amount"],
  },
  cardSwipe: {
    label: "Card Swipe Register",
    fields: ["date", "time", "amount", "charges", "machine", "paymentMethod", "remark"],
    numericFields: ["amount", "charges"],
  },
  dcd: {
    label: "D.C.D",
    fields: ["date", "product", "volume", "purchasePrice", "salePrice", "shift", "remark"],
    numericFields: ["volume", "purchasePrice", "salePrice"],
  },
  mdu: {
    label: "M.D.U",
    fields: ["date", "openingStock", "decant", "sale", "physicalStock", "rate", "remark"],
    numericFields: ["openingStock", "decant", "sale", "physicalStock", "rate"],
  },
  dailySales: {
    label: "Daily Sales",
    fields: ["date", "product", "sale", "rate", "lossGain", "remark"],
    numericFields: ["sale", "rate", "lossGain"],
  },
  invoiceDetails: {
    label: "Invoice Details",
    fields: ["date", "product", "qty", "invoiceAmount", "transportCost", "lfr", "rsp", "remark"],
    numericFields: ["qty", "invoiceAmount", "transportCost", "lfr", "rsp"],
  },
}

const cleanImportedNumber = (value) => {
  const cleaned = String(value ?? "")
    .replace(/[,\s]/g, "")
    .replace(/^(?:Rs\.?|INR|₹)/i, "")
  return /^-?\d*(?:\.\d+)?$/.test(cleaned) && cleaned !== "" ? cleaned : ""
}

const extractJsonObject = (text = "") => {
  const cleaned = String(text).replace(/```(?:json)?/gi, "").replace(/```/g, "").trim()
  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned)
}

const extractPhotoEntries = async ({ imageDataUrl, pageKey }) => {
  const schema = PHOTO_IMPORT_SCHEMAS[pageKey]
  if (!schema) {
    const error = new Error("Select a supported page for photo import.")
    error.statusCode = 400
    throw error
  }

  const imageMatch = String(imageDataUrl || "").match(/^data:([^;]+);base64,([\s\S]+)$/)
  if (!imageMatch) {
    const error = new Error("Please upload a valid image file.")
    error.statusCode = 400
    throw error
  }

  const [, mimeType, imageData] = imageMatch
  if (!mimeType.startsWith("image/") || Buffer.byteLength(imageData, "base64") > 10 * 1024 * 1024) {
    const error = new Error("Upload an image smaller than 10 MB.")
    error.statusCode = 400
    throw error
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const error = new Error("Gemini API key is not configured.")
    error.statusCode = 503
    throw error
  }

  const prompt = `Read this handwritten or printed business register photo for the ${schema.label} page. Extract EVERY visible table row as a separate entry. Return JSON only in this exact shape: {"entries":[{...}]}. Use only these keys: ${schema.fields.join(", ")}. Use YYYY-MM-DD dates (Indian dates are day/month/year). Leave unclear values as an empty string. Do not invent values. Keep numeric fields as plain numbers without commas or currency symbols. Do not add any extra keys or explanation.`
  const model = process.env.GEMINI_VISION_MODEL || "gemini-flash-latest"

  const response = await axios.post(
    `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageData } }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 8192, responseMimeType: "application/json" },
    },
    { timeout: 0, headers: { "Content-Type": "application/json" } },
  )

  let parsed
  try {
    parsed = extractJsonObject(extractGeminiText(response.data))
  } catch (_error) {
    const error = new Error("The photo could not be read as structured entries. Try a clearer image.")
    error.statusCode = 422
    throw error
  }

  const entries = (Array.isArray(parsed?.entries) ? parsed.entries : Array.isArray(parsed) ? parsed : [])
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) =>
      schema.fields.reduce((row, field) => {
        const value = entry[field]
        if (field === "date") row[field] = formatComparableDate(value) || ""
        else if (schema.numericFields.includes(field)) row[field] = cleanImportedNumber(value)
        else row[field] = value === undefined || value === null ? "" : String(value).trim()
        return row
      }, {}),
    )
    .filter((entry) => Object.values(entry).some(Boolean))

  if (!entries.length) {
    const error = new Error("No entries were found in this photo. Try a clearer, well-lit photo.")
    error.statusCode = 422
    throw error
  }

  return { pageKey, pageLabel: schema.label, entries, provider: "gemini", model }
}

const getQuestionDates = (question = "") =>
  [...String(question).matchAll(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/g)]
    .map((match) => formatComparableDate(match[1]))
    .filter(Boolean)

const WEBSITE_DATA_SOURCES = [
  {
    key: "expenses",
    label: "Expenses",
    terms: ["expense", "expenses", "kharcha", "kharch"],
    model: Expense,
    select: "date category description amount paymentMode addedBy",
  },
  {
    key: "cardSwipe",
    label: "Card Swipe Register",
    terms: ["card swipe", "swipe", "charges", "machine"],
    model: CardSwipe,
    select: "date time amount charges machine paymentMethod remark",
  },
  {
    key: "lubricantSales",
    label: "Lubricant Sales",
    terms: ["lubricant", "lubricants", "lubricant sale"],
    model: LubricantSale,
    select: "date product price quantity total totalProfit soldBy",
  },
  {
    key: "dcd",
    label: "D.C.D",
    terms: ["d.c.d", "dcd"],
    model: DcdEntry,
    select: "date product volume purchasePrice salePrice profit shift remark",
  },
  {
    key: "mdu",
    label: "M.D.U",
    terms: ["m.d.u", "mdu"],
    model: MduEntry,
    select: "date openingStock decant sale physicalStock lossGain rate remark",
  },
  {
    key: "invoiceDetails",
    label: "Invoice Details",
    terms: ["invoice", "lfr", "rsp", "purchase amount"],
    model: InvoiceDetail,
    select: "date product qty invoiceAmount transportCost lfr rsp purchaseAmount remark",
  },
  {
    key: "dailySales",
    label: "Daily Sales",
    terms: ["daily sales", "daily sale", "hsd sale", "ms sale"],
    model: DailySale,
    select: "date product sale rate lossGain profit remark",
  },
  {
    key: "tankerDeliveries",
    label: "Tanker Deliveries",
    terms: ["tanker", "delivery", "truck"],
    model: TankerDelivery,
    select: "date truckNo transportName driverName product qty unloadedQty lossGain supplier invoice",
  },
  {
    key: "mobileDispenser",
    label: "Mobile Dispenser",
    terms: ["mobile dispenser", "dispenser"],
    model: MobileDispenser,
    select: "date stockAdd saleLiter totalKM profit dieselCost finalProfit",
  },
  {
    key: "employees",
    label: "Employees",
    terms: ["employee", "employees", "salary", "attendance"],
    model: Employee,
    select: "name role shift salary status",
  },
]

const AI_CHAT_SCOPES = [
  { key: "direct", label: "Direct AI Chat" },
  { key: "all", label: "All Operational Pages" },
  ...WEBSITE_DATA_SOURCES.map(({ key, label }) => ({ key, label })),
]

const getWebsitePageList = () => AI_CHAT_SCOPES.map((source) => source.label).join(", ")

const getDataSource = (question = "", scope = "") => {
  if (scope && scope !== "all") {
    return WEBSITE_DATA_SOURCES.find((item) => item.key === scope) || null
  }

  const normalizedQuestion = String(question).toLowerCase()
  return WEBSITE_DATA_SOURCES.find((item) => item.terms.some((term) => normalizedQuestion.includes(term))) || null
}

const getRelevantWebsiteData = async (question = "", scope = "") => {
  const source = getDataSource(question, scope)

  if (!source) {
    return {
      matchedPage: "",
      availablePages: getWebsitePageList(),
      note: "No specific website data page was identified in this question.",
      records: [],
    }
  }

  const questionDates = getQuestionDates(question)
  const [firstDate, secondDate] = questionDates
  const rangeStart = firstDate && secondDate ? [firstDate, secondDate].sort()[0] : ""
  const rangeEnd = firstDate && secondDate ? [firstDate, secondDate].sort()[1] : ""
  const requestedDate = firstDate && !secondDate ? firstDate : ""
  const rows = await source.model.find().select(source.select).sort({ createdAt: -1 }).limit(1500).lean()
  const matchingRows = rangeStart
    ? rows.filter((row) => {
        const comparableDate = formatComparableDate(row.date)
        return comparableDate >= rangeStart && comparableDate <= rangeEnd
      })
    : requestedDate
      ? rows.filter((row) => formatComparableDate(row.date) === requestedDate)
      : rows.slice(0, 40)

  return {
    sourceKey: source.key,
    matchedPage: source.label,
    requestedDate: requestedDate || undefined,
    rangeStart: rangeStart || undefined,
    rangeEnd: rangeEnd || undefined,
    totalRecordsOnPage: rows.length,
    matchingRecordCount: matchingRows.length,
    records: matchingRows,
  }
}

const getSourceSummary = async (source) => {
  const [allRows, recentRecords] = await Promise.all([
    source.model.find().select(source.select).lean(),
    source.model.find().select(source.select).sort({ createdAt: -1 }).limit(20).lean(),
  ])
  const numericFields = {
    expenses: "amount",
    cardSwipe: "amount",
    lubricantSales: "total",
    dcd: "profit",
    mdu: "sale",
    invoiceDetails: "invoiceAmount",
    dailySales: "sale",
    tankerDeliveries: "qty",
    mobileDispenser: "finalProfit",
  }
  const totalField = numericFields[source.key]

  return {
    key: source.key,
    page: source.label,
    totalRecordCount: allRows.length,
    allRecordsTotal: totalField ? allRows.reduce((sum, row) => sum + Number(row[totalField] || 0), 0) : undefined,
    recentRecords,
  }
}

const getScopeContext = async (question = "", scope = "") => {
  if (scope === "all") {
    const summaries = await Promise.all(WEBSITE_DATA_SOURCES.map(getSourceSummary))
    return {
      selectedScope: "All Operational Pages",
      note: "Privacy-safe summaries and recent operational records. Employee phone numbers, passwords, secure notes, settings, and API keys are excluded.",
      pages: summaries,
    }
  }

  return getRelevantWebsiteData(question, scope)
}

const getRecordTotal = (sourceKey, row) => {
  const amountFields = {
    expenses: "amount",
    cardSwipe: "amount",
    lubricantSales: "total",
    dcd: "profit",
    mdu: "sale",
    invoiceDetails: "invoiceAmount",
    dailySales: "sale",
    tankerDeliveries: "qty",
    mobileDispenser: "finalProfit",
  }

  return Number(row?.[amountFields[sourceKey]] || 0)
}

const formatChatDate = (dateText) => {
  const date = parseExpenseDate(dateText)
  return date ? date.toLocaleDateString("en-IN") : dateText
}

const formatExactRecord = (sourceKey, row) => {
  const fieldSets = {
    expenses: [
      ["Category", row.category],
      ["Description", row.description],
      ["Amount", formatCurrency(row.amount)],
      ["Payment", row.paymentMode],
      ["Added by", row.addedBy],
    ],
    cardSwipe: [
      ["Time", row.time],
      ["Amount", formatCurrency(row.amount)],
      ["Charges", formatCurrency(row.charges)],
      ["Machine", row.machine],
      ["Payment", row.paymentMethod],
      ["Remark", row.remark],
    ],
    dcd: [
      ["Product", row.product],
      ["Volume", row.volume],
      ["Purchase price", row.purchasePrice],
      ["Sale price", row.salePrice],
      ["Profit", row.profit],
      ["Shift", row.shift],
    ],
    mdu: [
      ["Opening stock", row.openingStock],
      ["Decant", row.decant],
      ["Sale", row.sale],
      ["Physical stock", row.physicalStock],
      ["Loss/Gain", row.lossGain],
      ["Rate", row.rate],
    ],
    invoiceDetails: [
      ["Product", row.product],
      ["Qty", row.qty],
      ["Invoice amount", formatCurrency(row.invoiceAmount)],
      ["Transport cost", formatCurrency(row.transportCost)],
      ["LFR", row.lfr],
      ["RSP", row.rsp],
      ["Purchase amount", row.purchaseAmount],
    ],
    dailySales: [
      ["Product", row.product],
      ["Sale", row.sale],
      ["Rate", row.rate],
      ["Loss/Gain", row.lossGain],
      ["Profit", row.profit],
    ],
    tankerDeliveries: [
      ["Truck no.", row.truckNo],
      ["Product", row.product],
      ["Qty", row.qty],
      ["Unloaded qty", row.unloadedQty],
      ["Loss/Gain", row.lossGain],
      ["Supplier", row.supplier],
    ],
    lubricantSales: [
      ["Product", row.product],
      ["Quantity", row.quantity],
      ["Price", formatCurrency(row.price)],
      ["Total", formatCurrency(row.total)],
      ["Profit", formatCurrency(row.totalProfit)],
    ],
    mobileDispenser: [
      ["Stock added", row.stockAdd],
      ["Sale litres", row.saleLiter],
      ["Total KM", row.totalKM],
      ["Final profit", formatCurrency(row.finalProfit)],
    ],
  }

  return (fieldSets[sourceKey] || Object.entries(row))
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join(", ")
}

const buildExactDateAnswer = (websiteData) => {
  if (!websiteData?.matchedPage || !websiteData?.requestedDate) {
    return ""
  }

  const requestedDate = formatChatDate(websiteData.requestedDate)
  if (!websiteData.records.length) {
    return `No ${websiteData.matchedPage} entry was found on ${requestedDate}.`
  }

  const recordLines = websiteData.records
    .map((row, index) => `${index + 1}. ${formatExactRecord(websiteData.sourceKey, row)}`)
    .join("\n")

  return `${websiteData.matchedPage} has ${websiteData.records.length} entr${websiteData.records.length === 1 ? "y" : "ies"} on ${requestedDate}:\n${recordLines}`
}

const buildDateRangeAnswer = (websiteData) => {
  if (!websiteData?.matchedPage || !websiteData?.rangeStart || !websiteData?.rangeEnd) {
    return ""
  }

  const startDate = formatChatDate(websiteData.rangeStart)
  const endDate = formatChatDate(websiteData.rangeEnd)
  const total = websiteData.records.reduce(
    (sum, row) => sum + getRecordTotal(websiteData.sourceKey, row),
    0,
  )

  const entryLines = websiteData.records
    .map((row, index) => `${index + 1}. ${formatChatDate(row.date)} - ${formatExactRecord(websiteData.sourceKey, row)}`)
    .join("\n")

  return `${websiteData.matchedPage} from ${startDate} to ${endDate}: ${websiteData.records.length} entr${websiteData.records.length === 1 ? "y" : "ies"}, total ${formatCurrency(total)}.${entryLines ? `\n${entryLines}` : ""}`
}

const getExpenseContext = async () => {
  const expenses = await Expense.find().select("date category amount").lean()
  const now = new Date()
  const currentMonthExpenses = expenses.filter((expense) => {
    const date = parseExpenseDate(expense.date)
    return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  })
  const categoryTotals = expenses.reduce((totals, expense) => {
    const category = expense.category || "Uncategorized"
    if (!totals[category]) {
      totals[category] = { amount: 0, records: 0 }
    }
    totals[category].amount += Number(expense.amount || 0)
    totals[category].records += 1
    return totals
  }, {})
  const totalAmount = expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0)
  const currentMonthAmount = currentMonthExpenses.reduce((total, expense) => total + Number(expense.amount || 0), 0)

  return {
    records: expenses.length,
    totalAmount,
    currentMonth: now.toLocaleString("en-IN", { month: "long", year: "numeric" }),
    currentMonthAmount,
    topCategories: Object.entries(categoryTotals)
      .sort(([, first], [, second]) => second.amount - first.amount)
      .slice(0, 5)
      .map(([category, values]) => ({ category, ...values })),
  }
}

const buildTopExpenseCategoryAnswer = (question, scope, expenseContext) => {
  const normalizedQuestion = String(question || "").toLowerCase()
  const asksAboutExpenses = scope === "expenses" || /expense|expenses|kharcha|kharch/.test(normalizedQuestion)
  const asksForTopCategory = /category|categories|sab\s*se|highest|top|maximum|most|zyada/.test(normalizedQuestion)

  if (!asksAboutExpenses || !asksForTopCategory) {
    return ""
  }

  const [topCategory, ...otherCategories] = expenseContext.topCategories
  if (!topCategory) {
    return "No expense records are available."
  }

  const otherCategoryText = otherCategories
    .map((item) => `${item.category}: ${formatCurrency(item.amount)}`)
    .join(", ")

  return `The highest expense category is ${topCategory.category}: ${formatCurrency(topCategory.amount)} across ${topCategory.records} record(s), calculated from all ${expenseContext.records} expense records.${otherCategoryText ? ` Next highest categories: ${otherCategoryText}.` : ""}`
}

const asksForAllRecords = (question = "") =>
  /\b(all|complete|entire|full|saare|sare|sabhi|sabi)\b.*\b(data|record|records|entry|entries|detail|details)\b|\b(data|record|records|entry|entries|detail|details)\b.*\b(do|dikhao|dikhaiye|chahiye)\b/i.test(question)

const buildAllRecordsAnswer = async (question, scope) => {
  if (!asksForAllRecords(question)) {
    return ""
  }

  const source = getDataSource(question, scope)
  if (!source) {
    return "Please select a specific page before asking for all records."
  }

  const rows = await source.model.find().select(source.select).sort({ createdAt: -1 }).lean()
  if (!rows.length) {
    return `No ${source.label} records are available.`
  }

  const recordLines = rows
    .map((row, index) => `${index + 1}. ${row.date ? `${formatChatDate(row.date)} - ` : ""}${formatExactRecord(source.key, row)}`)
    .join("\n")

  return `${source.label}: all ${rows.length} record(s).\n${recordLines}`
}

const getResponseLanguageInstruction = (responseLanguage = "hinglish") => {
  if (responseLanguage === "hindi") return "Reply only in Hindi, using Devanagari script."
  if (responseLanguage === "english") return "Reply only in clear English."
  return "Reply only in simple Hinglish written with English letters."
}

const buildChatSystemPrompt = (expenseContext, websiteData, responseLanguage) =>
  `You are Aastha Enterprises Jio-bp Station assistant. Answer directly, accurately, and briefly. ${getResponseLanguageInstruction(responseLanguage)}\n\nEXPENSE SUMMARY (live):\n${JSON.stringify(expenseContext)}\n\nSELECTED DATA SCOPE (live, source of truth):\n${JSON.stringify(websiteData)}\n\nPrivacy: Employee phone numbers, passwords, secure notes, settings, and API keys are never included and must never be requested or invented.\n\nRules:\n- Answer website questions only from SELECTED DATA SCOPE or EXPENSE SUMMARY.\n- For total expense questions, give the Total Expense amount directly from EXPENSE SUMMARY.\n- For current-month expense questions, use currentMonthAmount and state currentMonth.\n- Do not invent website numbers or records.\n- If data is not in the selected scope, ask the admin to select the correct page or All Operational Pages.\n- For general questions not about website data, answer normally and directly.`

const buildDirectChatSystemPrompt = (responseLanguage) =>
  `You are a helpful general AI assistant. Answer the user's questions directly and accurately. ${getResponseLanguageInstruction(responseLanguage)} This is Direct AI Chat mode: do not claim access to the Jio-bp website, database, reports, or records.`

const getDirectWebsiteAnswer = async (question, scope) => {
  const [expenseContext, websiteData, directWebsiteData, allRecordsAnswer] = await Promise.all([
    getExpenseContext(),
    getScopeContext(question, scope),
    scope === "all" ? getRelevantWebsiteData(question) : Promise.resolve(null),
    buildAllRecordsAnswer(question, scope),
  ])
  const answer = allRecordsAnswer
    || buildTopExpenseCategoryAnswer(question, scope, expenseContext)
    || buildDateRangeAnswer(directWebsiteData || websiteData)
    || buildExactDateAnswer(directWebsiteData || websiteData)

  return { expenseContext, websiteData, answer }
}

const generateGroqChatAnswer = async ({ question, messages = [], model = "llama-3.1-8b-instant", scope = "all", responseLanguage = "hinglish" }) => {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    const error = new Error("Groq API key is not configured.")
    error.statusCode = 503
    throw error
  }

  const selectedModel = GROQ_CHAT_MODELS.includes(model) ? model : "llama-3.1-8b-instant"
  const chatMessages = normalizeChatMessages(messages)
  const finalQuestion = String(question || "").trim()
  const directMode = scope === "direct"
  const { expenseContext, websiteData, answer: directDataAnswer } = directMode
    ? { expenseContext: null, websiteData: null, answer: "" }
    : await getDirectWebsiteAnswer(finalQuestion, scope)

  if (finalQuestion && chatMessages[chatMessages.length - 1]?.content !== finalQuestion) {
    chatMessages.push({ role: "user", content: finalQuestion.slice(0, 4000) })
  }

  if (directDataAnswer) {
    return {
      provider: "database",
      model: "direct-record-lookup",
      answer: directDataAnswer,
    }
  }

  const response = await axios.post(
    `${GROQ_API_BASE_URL}/chat/completions`,
    {
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: directMode ? buildDirectChatSystemPrompt(responseLanguage) : buildChatSystemPrompt(expenseContext, websiteData, responseLanguage),
        },
        ...chatMessages,
      ],
      temperature: 0.2,
      max_tokens: 700,
    },
    {
      timeout: 0,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  )

  return {
    provider: "groq",
    model: selectedModel,
    answer: response.data?.choices?.[0]?.message?.content?.trim() || "No answer received from AI.",
  }
}

const generateGeminiChatAnswer = async ({ question, messages = [], model = "gemini-3.5-flash-lite", scope = "all", responseLanguage = "hinglish" }) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const error = new Error("Gemini API key is not configured.")
    error.statusCode = 503
    throw error
  }

  const selectedModel = GEMINI_CHAT_MODELS.includes(model) ? model : "gemini-flash-latest"
  const finalQuestion = String(question || "").trim()
  const chatMessages = normalizeChatMessages(messages)
  const directMode = scope === "direct"
  const { expenseContext, websiteData, answer: directDataAnswer } = directMode
    ? { expenseContext: null, websiteData: null, answer: "" }
    : await getDirectWebsiteAnswer(finalQuestion, scope)

  if (directDataAnswer) {
    return { provider: "database", model: "direct-record-lookup", answer: directDataAnswer }
  }

  if (finalQuestion && chatMessages[chatMessages.length - 1]?.content !== finalQuestion) {
    chatMessages.push({ role: "user", content: finalQuestion.slice(0, 4000) })
  }

  const response = await axios.post(
    `${GEMINI_API_BASE_URL}/models/${selectedModel}:generateContent?key=${apiKey}`,
    {
      systemInstruction: { parts: [{ text: directMode ? buildDirectChatSystemPrompt(responseLanguage) : buildChatSystemPrompt(expenseContext, websiteData, responseLanguage) }] },
      contents: chatMessages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    },
    { timeout: 0 },
  )

  return {
    provider: "gemini",
    model: selectedModel,
    answer: extractGeminiText(response.data) || "No answer received from AI.",
  }
}

module.exports = {
  generateReportSummary,
  generateGroqChatAnswer,
  generateGeminiChatAnswer,
  GROQ_CHAT_MODELS,
  GEMINI_CHAT_MODELS,
  AI_CHAT_SCOPES,
  extractPhotoEntries,
}
