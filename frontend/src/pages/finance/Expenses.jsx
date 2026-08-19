import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Fuel,
  Home,
  LayoutGrid,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Percent,
  PieChart,
  Plane,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Truck,
  UserCheck,
  Utensils,
  Wallet,
  Wrench,
  X,
  Zap,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../../components/MobileActionFab"
import { useAuth } from "../../contexts/AuthContext"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"
import {
  addExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../../services/expenseApi"
import { getAiReportSummary } from "../../services/aiApi"

const defaultCategories = ["Other", "Electricity", "Maintenance", "Salary", "Cleaning", "Miscellaneous"]
const defaultPaymentModes = ["Cash", "UPI", "Bank"]
const defaultAddedByOptions = ["Admin", "Manager", "Account Team"]

const getToday = () => new Date().toISOString().slice(0, 10)
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

const formatDate = (value) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleDateString("en-IN")
}

const formatMobileDate = (value) => {
  if (!value) return "-"
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  const day = d.getDate()
  const month = d.toLocaleString("en-US", { month: "short" })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

const getCategoryMeta = (catName = "") => {
  const name = String(catName).toLowerCase()
  if (name.includes("nastha") || name.includes("khana") || name.includes("food") || name.includes("tea") || name.includes("snack")) {
    return {
      icon: ShoppingBag,
      bgColor: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/50",
      pillBg: "bg-emerald-50 text-emerald-600",
    }
  }
  if (name.includes("interest") || name.includes("bank") || name.includes("loan") || name.includes("emi")) {
    return {
      icon: Percent,
      bgColor: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-900/50",
      pillBg: "bg-emerald-50 text-emerald-600",
    }
  }
  if (name.includes("print") || name.includes("stationery") || name.includes("paper") || name.includes("office")) {
    return {
      icon: Printer,
      bgColor: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/50",
      pillBg: "bg-blue-50 text-blue-600",
    }
  }
  if (name.includes("petrol") || name.includes("diesel") || name.includes("fuel") || name.includes("hsd") || name.includes("ms")) {
    return {
      icon: Fuel,
      bgColor: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/50",
      pillBg: "bg-rose-50 text-rose-600",
    }
  }
  if (name.includes("travel") || name.includes("tour") || name.includes("ticket") || name.includes("flight") || name.includes("hotel")) {
    return {
      icon: Plane,
      bgColor: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-900/50",
      pillBg: "bg-purple-50 text-purple-600",
    }
  }
  if (name.includes("vehicle") || name.includes("truck") || name.includes("car") || name.includes("transport")) {
    return {
      icon: Truck,
      bgColor: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-900/50",
      pillBg: "bg-indigo-50 text-indigo-600",
    }
  }
  if (name.includes("salary") || name.includes("wage") || name.includes("bonus") || name.includes("advance")) {
    return {
      icon: Wallet,
      bgColor: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/50",
      pillBg: "bg-emerald-50 text-emerald-600",
    }
  }
  if (name.includes("maint") || name.includes("repair") || name.includes("clean") || name.includes("service")) {
    return {
      icon: Wrench,
      bgColor: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/50",
      pillBg: "bg-amber-50 text-amber-600",
    }
  }
  if (name.includes("electric") || name.includes("power") || name.includes("bill") || name.includes("light")) {
    return {
      icon: Zap,
      bgColor: "bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-950/60 dark:text-yellow-400 dark:border-yellow-900/50",
      pillBg: "bg-yellow-50 text-yellow-600",
    }
  }
  return {
    icon: CreditCard,
    bgColor: "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/60 dark:text-teal-400 dark:border-teal-900/50",
    pillBg: "bg-emerald-50 text-emerald-600",
  }
}

const formatDateTime = (value) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const buildOptionList = (defaults, values = []) =>
  [...new Set([...defaults, ...values.filter(Boolean).map((item) => String(item).trim())])]

const defaultForm = (user) => ({
  date: getToday(),
  category: defaultCategories[0],
  description: "",
  amount: "",
  paymentMode: defaultPaymentModes[0],
  addedBy: user?.name || defaultAddedByOptions[0],
})

const defaultBulkExpenseRow = (user) => ({
  date: getToday(),
  category: defaultCategories[0],
  description: "",
  amount: "",
  paymentMode: defaultPaymentModes[0],
  addedBy: user?.name || defaultAddedByOptions[0],
})

export default function Expenses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user?.role === "Manager"
  const { canUse, canShowCard } = useManagerDashboardSettings("expenses", isManager)
  const canManagerUse = (buttonKey) => !isManager || canUse(buttonKey)
  const canManagerShowCard = (cardKey) => !isManager || canShowCard(cardKey)
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [fromDateFilter, setFromDateFilter] = useState("")
  const [toDateFilter, setToDateFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())
  const [showFilter, setShowFilter] = useState(false)
  const [openCard, setOpenCard] = useState(null)
  const [open, setOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmState, setConfirmState] = useState(null)
  const [reportForm, setReportForm] = useState({
    fromDate: "",
    toDate: "",
    category: "",
    format: "pdf",
  })
  const [optionBuilder, setOptionBuilder] = useState({ field: "", value: "" })
  const [entryModePrompt, setEntryModePrompt] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkEntries, setBulkEntries] = useState([defaultBulkExpenseRow(user)])
  const [bulkDefaults, setBulkDefaults] = useState({
    date: getToday(),
    category: defaultCategories[0],
  })
  const [bulkDefaultsApplied, setBulkDefaultsApplied] = useState({
    date: false,
    category: false,
  })
  const [form, setForm] = useState(defaultForm(user))
  const [aiSummary, setAiSummary] = useState("")
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [mobileTimeframe, setMobileTimeframe] = useState("month")
  const [showMobileTimeDropdown, setShowMobileTimeDropdown] = useState(false)
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false)
  const [mobileActionItem, setMobileActionItem] = useState(null)
  const [mobileDetailItem, setMobileDetailItem] = useState(null)
  const [mobileActiveTab, setMobileActiveTab] = useState("dashboard")
  const importedDraftHandled = useRef(false)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (importedDraftHandled.current) return

    const rawDraft = sessionStorage.getItem("aiPhotoImportDraft")
    if (!rawDraft) return

    try {
      const draft = JSON.parse(rawDraft)
      if (draft?.pageKey !== "expenses" || !Array.isArray(draft.entries)) return

      importedDraftHandled.current = true
      sessionStorage.removeItem("aiPhotoImportDraft")
      setBulkEntries(draft.entries.map((entry) => ({ ...defaultBulkExpenseRow(user), ...entry })))
      setBulkOpen(true)
      setNotice({ type: "success", text: `${draft.entries.length} photo entries are ready to review and save.` })
    } catch (_error) {
      sessionStorage.removeItem("aiPhotoImportDraft")
    }
  }, [user])

  useEffect(() => {
    if (!notice.text) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setNotice({ type: "", text: "" })
    }, 2400)

    return () => window.clearTimeout(timeout)
  }, [notice])

  const load = async () => {
    const res = await getExpenses()
    setData(Array.isArray(res) ? res : [])
  }

  const categoryOptions = useMemo(
    () => buildOptionList(defaultCategories, data.map((item) => item.category)),
    [data],
  )

  const paymentModeOptions = useMemo(
    () => buildOptionList(defaultPaymentModes, data.map((item) => item.paymentMode)),
    [data],
  )

  const addedByOptions = useMemo(
    () => buildOptionList(defaultAddedByOptions, data.map((item) => item.addedBy)),
    [data],
  )

  const resetForm = () => {
    setForm(defaultForm(user))
    setEditId(null)
    setOptionBuilder({ field: "", value: "" })
  }

  const openCreateModal = () => {
    if (!canManagerUse("addExpense")) {
      setNotice({ type: "error", text: "You do not have access to add expenses." })
      return
    }

    resetForm()
    setOpen(true)
  }

  const openEntryModePrompt = () => {
    if (!canManagerUse("addExpense")) {
      setNotice({ type: "error", text: "You do not have access to add expenses." })
      return
    }

    setEntryModePrompt(true)
  }

  const openBulkModal = () => {
    if (!canManagerUse("addExpense")) {
      setNotice({ type: "error", text: "You do not have access to add expenses." })
      return
    }

    const defaults = {
      date: getToday(),
      category: defaultCategories[0],
    }

    setBulkDefaults(defaults)
    setBulkDefaultsApplied({ date: false, category: false })
    setBulkEntries([{ ...defaultBulkExpenseRow(user), ...defaults }])
    setBulkOpen(true)
  }

  const openEditModal = (expense) => {
    if (!canManagerUse("editExpense")) {
      setNotice({ type: "error", text: "You do not have access to edit expenses." })
      return
    }

    setForm({
      date: expense.date || getToday(),
      category: expense.category || categoryOptions[0] || defaultCategories[0],
      description: expense.description || "",
      amount: String(expense.amount ?? ""),
      paymentMode: expense.paymentMode || paymentModeOptions[0] || defaultPaymentModes[0],
      addedBy: expense.addedBy || addedByOptions[0] || user?.name || "Admin",
    })
    setEditId(expense._id)
    setOptionBuilder({ field: "", value: "" })
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    resetForm()
  }

  const saveExpense = async () => {
    if (!canManagerUse(editId ? "editExpense" : "addExpense")) {
      setNotice({ type: "error", text: "You do not have access to save this expense." })
      return
    }

    if (!form.date || !form.category || !form.amount || !form.paymentMode || !form.addedBy) {
      setNotice({ type: "error", text: "Please complete all expense fields." })
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...form,
        description: form.description?.trim() || "",
        amount: Number(form.amount || 0),
      }

      if (editId) {
        await updateExpense(editId, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: "Expense updated successfully." })
      } else {
        await addExpense(payload)
        setNotice({ type: "success", text: "Expense saved successfully." })
      }

      closeModal()
      await load()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save expense right now.",
      })
    } finally {
      setSaving(false)
    }
  }

  const askDelete = (expense) => {
    if (!canManagerUse("deleteExpense")) {
      setNotice({ type: "error", text: "You do not have access to delete expenses." })
      return
    }

    setConfirmState({
      title: "Delete Expense",
      description: `Delete the expense "${expense.description}"? This action cannot be undone.`,
      actionLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        await deleteExpense(expense._id)
        await load()
        setNotice({ type: "success", text: "Expense deleted successfully." })
      },
    })
  }

  const updateBulkEntry = (index, key, value) => {
    setBulkEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry,
      ),
    )
  }

  const updateBulkDefault = (key, value) => {
    setBulkDefaults((current) => ({ ...current, [key]: value }))

    setBulkDefaultsApplied((current) => {
      const shouldApplyRows = !current[key]

      if (shouldApplyRows) {
        setBulkEntries((entries) => entries.map((entry) => ({ ...entry, [key]: value })))
      }

      return { ...current, [key]: true }
    })
  }

  const addBulkEntryRow = () => {
    setBulkEntries((current) => [...current, { ...defaultBulkExpenseRow(user), ...bulkDefaults }])
  }

  const removeBulkEntryRow = (index) => {
    setBulkEntries((current) => current.filter((_, entryIndex) => entryIndex !== index))
  }

  const saveBulkExpenses = async () => {
    if (!canManagerUse("addExpense")) {
      setNotice({ type: "error", text: "You do not have access to add expenses." })
      return
    }

    const validEntries = bulkEntries.filter(
      (entry) => entry.date && entry.category && entry.amount && entry.paymentMode && entry.addedBy,
    )

    if (!validEntries.length) {
      setNotice({ type: "error", text: "Please complete at least one expense row." })
      return
    }

    setBulkSaving(true)

    try {
      for (const entry of validEntries) {
        await addExpense({
          ...entry,
          description: entry.description?.trim() || "",
          amount: Number(entry.amount || 0),
        })
      }

      setBulkOpen(false)
      setBulkDefaults({ date: getToday(), category: defaultCategories[0] })
      setBulkDefaultsApplied({ date: false, category: false })
      setBulkEntries([defaultBulkExpenseRow(user)])
      setNotice({
        type: "success",
        text: `${validEntries.length} expense entries saved successfully.`,
      })
      await load()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save multiple expense entries.",
      })
    } finally {
      setBulkSaving(false)
    }
  }

  const filteredData = useMemo(
    () => {
      const hasDateRange = Boolean(fromDateFilter || toDateFilter)

      return data.filter((expense) => {
        const target = [
          expense.description,
          expense.category,
          expense.paymentMode,
          expense.addedBy,
          expense.date,
        ]
          .join(" ")
          .toLowerCase()

        return (
          target.includes(search.toLowerCase()) &&
          (!category || expense.category === category) &&
          (!fromDateFilter || String(expense.date || "") >= fromDateFilter) &&
          (!toDateFilter || String(expense.date || "") <= toDateFilter) &&
          (hasDateRange || !monthFilter || String(expense.date || "").slice(0, 7) === monthFilter)
        )
      })
    },
    [category, data, fromDateFilter, monthFilter, search, toDateFilter],
  )

  const summary = useMemo(() => {
    const today = new Date()
    const todayString = today.toISOString().slice(0, 10)

    let todayTotal = 0
    let weekTotal = 0
    let monthTotal = 0
    let grandTotal = 0

    filteredData.forEach((expense) => {
      const amount = Number(expense.amount || 0)
      const expenseDate = new Date(expense.date)

      grandTotal += amount

      if (expense.date === todayString) {
        todayTotal += amount
      }

      const diffDays = (today - expenseDate) / (1000 * 60 * 60 * 24)
      if (diffDays >= 0 && diffDays <= 7) {
        weekTotal += amount
      }

      if (String(expense.date || "").slice(0, 7) === (monthFilter || getCurrentMonth())) {
        monthTotal += amount
      }
    })

    return { todayTotal, weekTotal, monthTotal, grandTotal }
  }, [filteredData, monthFilter])

  const summaryCards = [
    { key: "todayExpense", label: "Today Expense", value: formatCurrency(summary.todayTotal), tone: "rose" },
    { key: "weekExpense", label: "Week Expense", value: formatCurrency(summary.weekTotal), tone: "amber" },
    { key: "monthExpense", label: "Month Expense", value: formatCurrency(summary.monthTotal), tone: "blue" },
    { key: "totalExpense", label: "Total Expense", value: formatCurrency(summary.grandTotal), tone: "violet" },
  ]
  const visibleSummaryCards = summaryCards.filter((card) => canManagerShowCard(card.key))

  const mobileHeroAmount = useMemo(() => {
    switch (mobileTimeframe) {
      case "today":
        return { label: "Today", value: formatCurrency(summary.todayTotal) }
      case "week":
        return { label: "This Week", value: formatCurrency(summary.weekTotal) }
      case "all":
        return { label: "All Time", value: formatCurrency(summary.grandTotal) }
      case "month":
      default:
        return { label: "This Month", value: formatCurrency(summary.monthTotal) }
    }
  }, [mobileTimeframe, summary])

  const reportData = useMemo(
    () =>
      data.filter((expense) => {
        const expenseDate = String(expense.date || "")
        return (
          (!reportForm.fromDate || expenseDate >= reportForm.fromDate) &&
          (!reportForm.toDate || expenseDate <= reportForm.toDate) &&
          (!reportForm.category || expense.category === reportForm.category)
        )
      }),
    [data, reportForm.category, reportForm.fromDate, reportForm.toDate],
  )

  const exportPdf = () => {
    const total = reportData.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const doc = new jsPDF()

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("Expense Report", 14, 18)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`From: ${reportForm.fromDate || "All"}  To: ${reportForm.toDate || "All"}`, 14, 28)
    doc.text(`Category: ${reportForm.category || "All Categories"}`, 14, 34)
    doc.text(`Total Amount: ${formatCurrency(total)}`, 14, 40)

    let tableStartY = 48

    if (aiSummary) {
      doc.setFont("helvetica", "bold")
      doc.text("AI Notes", 14, 48)
      doc.setFont("helvetica", "normal")
      const notes = doc.splitTextToSize(aiSummary, 180)
      doc.text(notes, 14, 55)
      tableStartY = 62 + notes.length * 5
    }

    autoTable(doc, {
      startY: tableStartY,
      head: [["Date", "Category", "Description", "Amount", "Payment Mode", "Added By"]],
      body: reportData.map((expense) => [
        expense.date,
        expense.category,
        expense.description,
        formatCurrency(expense.amount),
        expense.paymentMode,
        expense.addedBy,
      ]),
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3.6 },
    })

    doc.save("expense-report.pdf")
  }

  const exportExcel = () => {
    const workbookData = reportData.map((expense) => ({
      Date: expense.date,
      Category: expense.category,
      Description: expense.description,
      Amount: Number(expense.amount || 0),
      Payment_Mode: expense.paymentMode,
      Added_By: expense.addedBy,
      Edited_At: expense.lastEditedAt ? formatDateTime(expense.lastEditedAt) : "",
      Edited_By: expense.lastEditedBy || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(workbookData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses")
    XLSX.writeFile(workbook, "expense-report.xlsx")
  }

  const handleGenerateReport = () => {
    if (!canManagerUse("generateReport")) {
      setNotice({ type: "error", text: "You do not have access to generate reports." })
      return
    }

    if (!reportData.length) {
      setNotice({ type: "error", text: "No report data found for the selected filters." })
      return
    }

    if (reportForm.format === "pdf") {
      exportPdf()
    } else {
      exportExcel()
    }

    setReportOpen(false)
    setNotice({ type: "success", text: "Report downloaded successfully." })
  }

  const buildExpenseAiPayload = () => {
    const total = filteredData.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const categoryTotals = filteredData.reduce((totals, expense) => {
      const key = expense.category || "Uncategorized"
      totals[key] = (totals[key] || 0) + Number(expense.amount || 0)
      return totals
    }, {})

    return {
      reportType: "Expense",
      filters: {
        fromDate: fromDateFilter || "All",
        toDate: toDateFilter || "All",
        category: category || "All Categories",
        month: monthFilter || "All",
      },
      totals: {
        records: filteredData.length,
        totalAmount: total,
        categoryTotals,
      },
      rows: filteredData.map((expense) => ({
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: Number(expense.amount || 0),
        paymentMode: expense.paymentMode,
        addedBy: expense.addedBy,
      })),
    }
  }

  const generateAiSummary = async () => {
    if (!filteredData.length) {
      setNotice({ type: "error", text: "No expense data found for AI summary." })
      return
    }

    setAiSummaryLoading(true)

    try {
      const result = await getAiReportSummary(buildExpenseAiPayload())
      setAiSummary(result.summary || "")
      setNotice({ type: "success", text: "AI summary generated successfully." })
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to generate AI summary right now.",
      })
    } finally {
      setAiSummaryLoading(false)
    }
  }

  const addInlineOption = (field) => {
    const value = optionBuilder.value.trim()

    if (!value) {
      setNotice({ type: "error", text: "Please enter an option name first." })
      return
    }

    setForm((current) => ({ ...current, [field]: value }))
    setOptionBuilder({ field: "", value: "" })
    setNotice({ type: "success", text: "Option added to the form." })
  }

return (
  <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[var(--bg-main)] p-3 pb-28 text-[color:var(--text-primary)] transition-colors duration-300 sm:p-6 lg:pb-6">
    {notice.text ? <InlineNotice notice={notice} /> : null}

    {/* ========================= MOBILE HEADER ========================= */}
<div className="lg:hidden mb-2">
  <div className="flex items-center gap-4 rounded-[15px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2 shadow-sm">


    <div className="min-w-0">
      <h1 className="text-[20px] font-black tracking-tight text-[color:var(--text-strong)]">
        Expenses
      </h1>
    </div>

    <div className="ml-auto h-1.5 w-20 rounded-full bg-emerald-400/60" />
  </div>
</div>

    {/* ========================= HERO ========================= */}
    <div className="lg:hidden relative mb-2 min-h-[125px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#087b5a] via-[#069f70] to-[#08c38b] px-5 pt-5 text-white shadow-xl shadow-emerald-900/10">
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[16px] font-semibold text-white/95">
            Total Expenses
          </p>

          <div className="mt-2 text-[34px] font-black leading-none tracking-tight">
            {mobileHeroAmount.value}
          </div>

         
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/expense-dashboard")}
          className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-black/15 text-white shadow-inner active:scale-95"
        >
          <TrendingUp size={26} />
        </button>
      </div>

      <svg
        viewBox="0 0 360 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-0 h-[115px] w-full"
      >
        <defs>
          <linearGradient
            id="mobileHeroGrad"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#8affd1"
              stopOpacity="0.25"
            />
            <stop
              offset="100%"
              stopColor="#8affd1"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        <path
          d="M0 92 C42 104 65 72 106 78 C145 84 150 99 188 84 C226 68 238 91 270 66 C304 40 316 59 360 28"
          fill="none"
          stroke="#7cf7c5"
          strokeOpacity="0.8"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M0 92 C42 104 65 72 106 78 C145 84 150 99 188 84 C226 68 238 91 270 66 C304 40 316 59 360 28 L360 120 L0 120 Z"
          fill="url(#mobileHeroGrad)"
        />

        <circle cx="270" cy="66" r="5" fill="white" />
      </svg>
    </div>

    {/* ========================= SUMMARY CARDS ========================= */}
    <div className="lg:hidden mb-2 grid grid-cols-3 gap-2">
      {/* TODAY */}
      <div className="relative flex min-h-[122px] flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm transition-colors duration-300">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CreditCard size={18} />
          </div>

          <p className="text-[11px] font-semibold text-[color:var(--text-secondary)]">
            Today
          </p>

          <p className="mt-1 whitespace-nowrap text-[14px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.todayTotal)}
          </p>
        </div>

        <svg
          viewBox="0 0 100 24"
          className="h-5 w-full text-emerald-400"
        >
          <path
            d="M0 15 C18 22 28 5 45 14 S72 21 100 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* WEEK */}
      <div className="relative flex min-h-[122px] flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm transition-colors duration-300">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 dark:text-orange-400">
            <Calendar size={18} />
          </div>

          <p className="text-[11px] font-semibold text-[color:var(--text-secondary)]">
            This Week
          </p>

          <p className="mt-1 whitespace-nowrap text-[14px] font-extrabold text-orange-500 dark:text-orange-400">
            {formatCurrency(summary.weekTotal)}
          </p>
        </div>

        <svg
          viewBox="0 0 100 24"
          className="h-5 w-full text-orange-400"
        >
          <path
            d="M0 15 C18 22 28 5 45 14 S72 21 100 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* MONTH */}
      <div className="relative flex min-h-[122px] flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm transition-colors duration-300">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Calendar size={18} />
          </div>

          <p className="text-[11px] font-semibold text-[color:var(--text-secondary)]">
            This Month
          </p>

          <p className="mt-1 whitespace-nowrap text-[14px] font-extrabold text-blue-600 dark:text-blue-400">
            {mobileHeroAmount.value}
          </p>
        </div>

        <svg
          viewBox="0 0 100 24"
          className="h-5 w-full text-blue-400"
        >
          <path
            d="M0 15 C18 22 28 5 45 14 S72 21 100 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

    </div>

    {/* ========================= SEARCH ========================= */}
    <div className="lg:hidden mb-2 flex items-center gap-2.5">
      <div className="relative flex-1">
        <Search
          size={19}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)]"
        />

        <input
          placeholder="Search expenses..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-[45px] w-full rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] py-2 pl-11 pr-4 text-[14px] font-medium text-[color:var(--text-primary)] shadow-sm outline-none transition-colors placeholder:text-[color:var(--text-secondary)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowMobileFilterModal(true)}
        className="inline-flex h-[45px] items-center gap-2 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 text-[14px] font-bold text-emerald-600 shadow-sm transition-colors dark:text-emerald-400 active:scale-95"
      >
        <Filter size={18} />
        <span>Filter</span>
      </button>
    </div>

    {/* ========================= EXPENSE LIST ========================= */}
    <div className="lg:hidden mb-24 space-y-3">
      {filteredData.length === 0 ? (
        <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-[color:var(--text-secondary)]">
            No expenses found matching your search.
          </p>
        </div>
      ) : (
        filteredData.map((expense) => {
          const meta = getCategoryMeta(expense.category);
          const Icon = meta.icon;

          return (
            <div
              key={expense._id}
              onClick={() => setMobileDetailItem(expense)}
              className="group relative flex h-[55px] cursor-pointer items-center justify-between gap-2 rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-3 shadow-sm transition-colors duration-300 active:scale-[0.985]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[17px] border ${meta.bgColor}`}
                >
                  <Icon size={22} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-[13px] font-extrabold leading-tight text-[color:var(--text-strong)]">
                    {expense.category || "Expense"}
                  </h3>


                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" />

                    <p className="truncate text-[11px] font-semibold text-[color:var(--text-secondary)]">
                      {formatMobileDate(expense.date)}
                    </p>

                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <div className="text-right">
                  <p className="text-[13px] font-extrabold tracking-tight text-[color:var(--text-strong)]">
                    {formatCurrency(expense.amount)}
                  </p>

                  <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    {expense.paymentMode || "Cash"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileActionItem(expense);
                  }}
                  className="flex h-9 w-8 items-center justify-center rounded-xl text-[color:var(--text-secondary)] transition-colors"
                >
                  <MoreVertical size={19} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>

    {/* ========================= FLOATING BUTTON ========================= */}
    <div className="lg:hidden fixed bottom-[82px] right-5 z-30">
      {canManagerUse("addExpense") ? (
        <button
          type="button"
          onClick={openEntryModePrompt}
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-emerald-600 text-amber-50 shadow-xl shadow-emerald-600/30 transition active:scale-90"
        >
          <svg
            width="29"
            height="29"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      ) : null}
    </div>

    {/* ========================= BOTTOM NAV ========================= */}
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 mx-3 mb-2 flex h-[72px] items-center justify-around rounded-[25px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-2 shadow-lg transition-colors duration-300">
      <button
        type="button"
        onClick={() => {
          setMobileActiveTab("dashboard");
          setCategory("");
          setSearch("");
        }}
        className={`flex min-w-[58px] flex-col items-center gap-1 transition-colors ${
          mobileActiveTab === "dashboard"
            ? "font-extrabold text-emerald-600 dark:text-emerald-400"
            : "text-[color:var(--text-secondary)]"
        }`}
      >
        <Home size={21} />
        <span className="text-[10px]">Dashboard</span>

        {mobileActiveTab === "dashboard" ? (
          <span className="mt-0.5 h-[3px] w-8 rounded-full bg-emerald-600 dark:bg-emerald-400" />
        ) : (
          <span className="mt-0.5 h-[3px] w-8 opacity-0" />
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          setMobileActiveTab("categories");
          setShowMobileFilterModal(true);
        }}
        className={`flex min-w-[58px] flex-col items-center gap-1 transition-colors ${
          mobileActiveTab === "categories"
            ? "font-extrabold text-emerald-600 dark:text-emerald-400"
            : "text-[color:var(--text-secondary)]"
        }`}
      >
        <LayoutGrid size={21} />
        <span className="text-[10px]">Categories</span>
        <span className="mt-0.5 h-[3px] w-8 opacity-0" />
      </button>

      <button
        type="button"
        onClick={() => {
          setMobileActiveTab("reports");

          if (canManagerUse("generateReport")) {
            setReportForm((current) => ({
              ...current,
              fromDate: fromDateFilter || current.fromDate,
              toDate: toDateFilter || current.toDate,
              category: category || current.category,
            }));

            setReportOpen(true);
          }
        }}
        className={`flex min-w-[58px] flex-col items-center gap-1 transition-colors ${
          mobileActiveTab === "reports"
            ? "font-extrabold text-emerald-600 dark:text-emerald-400"
            : "text-[color:var(--text-secondary)]"
        }`}
      >
        <BarChart3 size={21} />
        <span className="text-[10px]">Reports</span>
        <span className="mt-0.5 h-[3px] w-8 opacity-0" />
      </button>

      <button
        type="button"
        onClick={() => {
          setMobileActiveTab("budgets");
          navigate("/admin/expense-dashboard");
        }}
        className={`flex min-w-[58px] flex-col items-center gap-1 transition-colors ${
          mobileActiveTab === "budgets"
            ? "font-extrabold text-emerald-600 dark:text-emerald-400"
            : "text-[color:var(--text-secondary)]"
        }`}
      >
        <PieChart size={21} />
        <span className="text-[10px]">Budgets</span>
        <span className="mt-0.5 h-[3px] w-8 opacity-0" />
      </button>

    </nav>

    {/* ========================= DESKTOP ========================= */}
    <div className="hidden lg:block">
      <div className="group relative mb-3 flex items-center gap-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] px-5 py-3 shadow-sm">
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600" />

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-[color:var(--text-strong)]">
            Expenses
          </h1>

          <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {filteredData?.length || 0}{" "}
            {filteredData?.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="ml-auto h-0.5 w-12 rounded-full bg-emerald-500/30" />
      </div>

      {visibleSummaryCards.length ? (
        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {visibleSummaryCards.map((card) => (
            <SummaryCard
              key={card.key}
              label={card.label}
              value={card.value}
              tone={card.tone}
            />
          ))}
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          placeholder="Search expense"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full lg:max-w-[420px]"
        />

        <div className="flex gap-3 lg:ml-auto">
          {!isManager ? (
            <button
              type="button"
              onClick={() => navigate("/admin/expense-dashboard")}
              className="hidden items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 font-medium text-emerald-600 dark:text-emerald-400 shadow-sm lg:inline-flex"
            >
              <ChartNoAxesCombined size={18} />
              Expense Dashboard
            </button>
          ) : null}

          {canManagerUse("addExpense") ? (
            <button
              onClick={openEntryModePrompt}
              className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm lg:inline-flex"
            >
              + Add Expense
            </button>
          ) : null}

          {canManagerUse("generateReport") ? (
            <button
              onClick={() => {
                setReportForm((current) => ({
                  ...current,
                  fromDate: fromDateFilter || current.fromDate,
                  toDate: toDateFilter || current.toDate,
                  category: category || current.category,
                }));

                setReportOpen(true);
              }}
              className="hidden rounded-2xl bg-purple-600 px-5 py-3 font-medium text-white shadow-sm lg:inline-flex"
            >
              Generate Report
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,220px)_minmax(0,180px)_minmax(0,180px)_minmax(0,220px)_auto]">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="input"
          >
            <option value="">All Categories</option>

            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDateFilter}
            onChange={(event) => setFromDateFilter(event.target.value)}
            className="input"
          />

          <input
            type="date"
            value={toDateFilter}
            onChange={(event) => setToDateFilter(event.target.value)}
            className="input"
          />

          <input
            type="month"
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="input"
          />

          <button
            onClick={() => {
              setCategory("");
              setFromDateFilter("");
              setToDateFilter("");
            }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)]"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="hidden max-h-[620px] overflow-x-auto overflow-y-auto rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-sm lg:block">
        <table className="table min-w-[1080px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Payment Mode</th>
              <th>Added By</th>
              <th>Audit</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((expense) => (
              <tr key={expense._id}>
                <td>{formatDate(expense.date)}</td>
                <td>{expense.category}</td>
                <td>{expense.description}</td>
                <td className="font-semibold text-rose-500">
                  {formatCurrency(expense.amount)}
                </td>
                <td>{expense.paymentMode}</td>
                <td>{expense.addedBy}</td>

                <td className="text-left text-xs leading-6 text-[color:var(--text-secondary)]">
                  {expense.lastEditedAt ? (
                    <>
                      <div>
                        Edited: {formatDateTime(expense.lastEditedAt)}
                      </div>

                      <div>
                        By: {expense.lastEditedBy || "-"}{" "}
                        {expense.lastEditedByRole
                          ? `(${expense.lastEditedByRole})`
                          : ""}
                      </div>
                    </>
                  ) : (
                    <span>Not edited yet</span>
                  )}
                </td>

                <td>
                  <div className="flex items-center justify-center gap-3">
                    {canManagerUse("editExpense") ? (
                      <button
                        onClick={() => openEditModal(expense)}
                        className="text-blue-500"
                      >
                        Edit
                      </button>
                    ) : null}

                    {canManagerUse("deleteExpense") ? (
                      <button
                        onClick={() => askDelete(expense)}
                        className="text-red-500"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* ========================= MOBILE FILTER ========================= */}
    {showMobileFilterModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-4">
        <div className="w-full max-w-lg rounded-t-[28px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl sm:rounded-[28px]">
          <div className="mb-5 flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div className="flex items-center gap-2">
              <Filter size={19} className="text-emerald-500" />

              <h3 className="text-base font-extrabold text-[color:var(--text-strong)]">
                Filter Expenses
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilterModal(false)}
              className="rounded-xl p-2 text-[color:var(--text-secondary)]"
            >
              <X size={19} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-[color:var(--text-secondary)]">
                Category
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="input w-full"
              >
                <option value="">All Categories</option>

                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-bold text-[color:var(--text-secondary)]">
                  From Date
                </label>

                <input
                  type="date"
                  value={fromDateFilter}
                  onChange={(event) =>
                    setFromDateFilter(event.target.value)
                  }
                  className="input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[color:var(--text-secondary)]">
                  To Date
                </label>

                <input
                  type="date"
                  value={toDateFilter}
                  onChange={(event) =>
                    setToDateFilter(event.target.value)
                  }
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[color:var(--text-secondary)]">
                Month Filter
              </label>

              <input
                type="month"
                value={monthFilter}
                onChange={(event) =>
                  setMonthFilter(event.target.value)
                }
                className="input w-full"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setFromDateFilter("");
                setToDateFilter("");
                setMonthFilter(getCurrentMonth());
                setShowMobileFilterModal(false);
              }}
              className="flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] py-3 text-sm font-bold text-[color:var(--text-primary)]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => setShowMobileFilterModal(false)}
              className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ========================= MOBILE ACTION SHEET ========================= */}
    {mobileActionItem && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:p-4">
        <div className="w-full max-w-lg rounded-t-[28px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl sm:rounded-[28px]">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[color:var(--text-strong)]">
                {mobileActionItem.category}
              </h3>

              <p className="mt-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(mobileActionItem.amount)} •{" "}
                {formatMobileDate(mobileActionItem.date)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMobileActionItem(null)}
              className="rounded-xl p-2 text-[color:var(--text-secondary)]"
            >
              <X size={19} />
            </button>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileDetailItem(mobileActionItem);
                setMobileActionItem(null);
              }}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left font-bold text-[color:var(--text-primary)] hover:bg-[var(--bg-soft)]"
            >
              <Eye size={19} className="text-emerald-500" />
              <span>View Full Details</span>
            </button>

            {canManagerUse("editExpense") && (
              <button
                type="button"
                onClick={() => {
                  openEditModal(mobileActionItem);
                  setMobileActionItem(null);
                }}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-left font-bold text-blue-500 hover:bg-blue-500/10"
              >
                <Edit2 size={19} />
                <span>Edit Expense</span>
              </button>
            )}

            {canManagerUse("deleteExpense") && (
              <button
                type="button"
                onClick={() => {
                  askDelete(mobileActionItem);
                  setMobileActionItem(null);
                }}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-left font-bold text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={19} />
                <span>Delete Expense</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {/* ========================= MOBILE DETAIL ========================= */}
    {mobileDetailItem && (
      <ModalShell
        title="Expense Details"
        onClose={() => setMobileDetailItem(null)}
      >
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-[color:var(--text-secondary)]">
              Category
            </span>

            <span className="font-bold text-[color:var(--text-strong)]">
              {mobileDetailItem.category}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-[color:var(--text-secondary)]">
              Amount
            </span>

            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(mobileDetailItem.amount)}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-[color:var(--text-secondary)]">
              Date
            </span>

            <span className="font-bold text-[color:var(--text-strong)]">
              {formatDate(mobileDetailItem.date)}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-[color:var(--text-secondary)]">
              Payment Mode
            </span>

            <span className="font-bold text-blue-500">
              {mobileDetailItem.paymentMode || "Cash"}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-[color:var(--text-secondary)]">
              Added By
            </span>

            <span className="font-bold text-[color:var(--text-strong)]">
              {mobileDetailItem.addedBy || "-"}
            </span>
          </div>

          {mobileDetailItem.description ? (
            <div className="border-b border-[var(--border-color)] pb-2">
              <span className="mb-1 block text-[color:var(--text-secondary)]">
                Description
              </span>

              <p className="font-medium text-[color:var(--text-primary)]">
                {mobileDetailItem.description}
              </p>
            </div>
          ) : null}

          <div className="pt-1 text-xs text-[color:var(--text-secondary)]">
            {mobileDetailItem.lastEditedAt ? (
              <div>
                Last Edited:{" "}
                {formatDateTime(mobileDetailItem.lastEditedAt)} by{" "}
                {mobileDetailItem.lastEditedBy || "-"}
              </div>
            ) : (
              <div>Not edited yet</div>
            )}
          </div>

          <div className="mt-4 flex gap-2 pt-2">
            {canManagerUse("editExpense") && (
              <button
                type="button"
                onClick={() => {
                  const item = mobileDetailItem;
                  setMobileDetailItem(null);
                  openEditModal(item);
                }}
                className="flex-1 rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white"
              >
                Edit
              </button>
            )}

            {canManagerUse("deleteExpense") && (
              <button
                type="button"
                onClick={() => {
                  const item = mobileDetailItem;
                  setMobileDetailItem(null);
                  askDelete(item);
                }}
                className="flex-1 rounded-2xl bg-red-600 py-2.5 text-xs font-bold text-white"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </ModalShell>
    )}

    {/* ========================= SINGLE EXPENSE ========================= */}
    {open ? (
      <ModalShell
        title={editId ? "Edit Expense" : "Add Expense"}
        onClose={closeModal}
      >
        <div className="grid gap-3">
          <input
            type="date"
            value={form.date}
            onChange={(event) =>
              setForm({ ...form, date: event.target.value })
            }
            className="input"
          />

          <InlineOptionSelect
            label="Category"
            value={form.category}
            options={categoryOptions}
            onChange={(value) =>
              setForm({ ...form, category: value })
            }
            optionBuilder={optionBuilder}
            setOptionBuilder={setOptionBuilder}
            field="category"
            onAdd={() => addInlineOption("category")}
          />

          <input
            placeholder="Description"
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description: event.target.value,
              })
            }
            className="input"
          />

          <input
            placeholder="Amount"
            value={form.amount}
            onChange={(event) =>
              setForm({
                ...form,
                amount: event.target.value,
              })
            }
            className="input"
          />

          <InlineOptionSelect
            label="Payment Mode"
            value={form.paymentMode}
            options={paymentModeOptions}
            onChange={(value) =>
              setForm({
                ...form,
                paymentMode: value,
              })
            }
            optionBuilder={optionBuilder}
            setOptionBuilder={setOptionBuilder}
            field="paymentMode"
            onAdd={() => addInlineOption("paymentMode")}
          />

          <InlineOptionSelect
            label="Added By"
            value={form.addedBy}
            options={addedByOptions}
            onChange={(value) =>
              setForm({
                ...form,
                addedBy: value,
              })
            }
            optionBuilder={optionBuilder}
            setOptionBuilder={setOptionBuilder}
            field="addedBy"
            onAdd={() => addInlineOption("addedBy")}
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
          >
            Cancel
          </button>

          <button
            onClick={saveExpense}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </ModalShell>
    ) : null}

    {/* ========================= BULK EXPENSES ========================= */}
    {bulkOpen ? (
      <ModalShell
        title="Add Multiple Expenses"
        onClose={() => {
          setBulkOpen(false);
          setBulkDefaults({
            date: getToday(),
            category: defaultCategories[0],
          });
          setBulkDefaultsApplied({
            date: false,
            category: false,
          });
        }}
      >
        <div className="mb-2 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
              Default Date
            </span>

            <input
              type="date"
              value={bulkDefaults.date}
              onChange={(event) =>
                updateBulkDefault("date", event.target.value)
              }
              className="input"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
              Default Category
            </span>

            <select
              value={bulkDefaults.category}
              onChange={(event) =>
                updateBulkDefault("category", event.target.value)
              }
              className="input"
            >
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {bulkEntries.map((entry, index) => (
            <div
              key={`${index}-${entry.date}`}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">
                  Entry {index + 1}
                </h3>

                {bulkEntries.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeBulkEntryRow(index)}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm text-red-500"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3">
                <input
                  type="date"
                  value={entry.date}
                  onChange={(event) =>
                    updateBulkEntry(
                      index,
                      "date",
                      event.target.value
                    )
                  }
                  className="input"
                />

                <select
                  value={entry.category}
                  onChange={(event) =>
                    updateBulkEntry(
                      index,
                      "category",
                      event.target.value
                    )
                  }
                  className="input"
                >
                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Description (optional)"
                  value={entry.description}
                  onChange={(event) =>
                    updateBulkEntry(
                      index,
                      "description",
                      event.target.value
                    )
                  }
                  className="input"
                />

                <input
                  placeholder="Amount"
                  value={entry.amount}
                  onChange={(event) =>
                    updateBulkEntry(
                      index,
                      "amount",
                      event.target.value
                    )
                  }
                  className="input"
                />

                <select
                  value={entry.paymentMode}
                  onChange={(event) =>
                    updateBulkEntry(
                      index,
                      "paymentMode",
                      event.target.value
                    )
                  }
                  className="input"
                >
                  {paymentModeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={entry.addedBy}
                  onChange={(event) =>
                    updateBulkEntry(
                      index,
                      "addedBy",
                      event.target.value
                    )
                  }
                  className="input"
                >
                  {addedByOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addBulkEntryRow}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-emerald-600 dark:text-emerald-400"
          >
            + Add Another Row
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setBulkOpen(false)}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
          >
            Cancel
          </button>

          <button
            onClick={saveBulkExpenses}
            disabled={bulkSaving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {bulkSaving ? "Saving..." : "Save All"}
          </button>
        </div>
      </ModalShell>
    ) : null}

    {/* ========================= REPORT ========================= */}
    {reportOpen ? (
      <ModalShell
        title="Generate Expense Report"
        onClose={() => setReportOpen(false)}
      >
        <div className="grid gap-3">
          <input
            type="date"
            value={reportForm.fromDate}
            onChange={(event) =>
              setReportForm((current) => ({
                ...current,
                fromDate: event.target.value,
              }))
            }
            className="input"
          />

          <input
            type="date"
            value={reportForm.toDate}
            onChange={(event) =>
              setReportForm((current) => ({
                ...current,
                toDate: event.target.value,
              }))
            }
            className="input"
          />

          <select
            value={reportForm.category}
            onChange={(event) =>
              setReportForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
            className="input"
          >
            <option value="">All Categories</option>

            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={reportForm.format}
            onChange={(event) =>
              setReportForm((current) => ({
                ...current,
                format: event.target.value,
              }))
            }
            className="input"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setReportOpen(false)}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerateReport}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white"
          >
            Download
          </button>
        </div>
      </ModalShell>
    ) : null}

    {/* ========================= CONFIRM ========================= */}
    {confirmState ? (
      <ConfirmDialog
        title={confirmState.title}
        description={confirmState.description}
        actionLabel={confirmState.actionLabel}
        variant={confirmState.variant}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          try {
            await confirmState.onConfirm?.();
          } catch (error) {
            setNotice({
              type: "error",
              text:
                error?.response?.data?.message ||
                "Unable to complete this action.",
            });
          } finally {
            setConfirmState(null);
          }
        }}
      />
    ) : null}

    {/* ========================= ENTRY MODE ========================= */}
    {entryModePrompt ? (
      <ConfirmDialog
        title="Choose Expense Entry Mode"
        description="Select whether you want to add one expense or save multiple expense rows in one action."
        actionLabel="Single Entry"
        secondaryLabel="Multiple Entry"
        variant="primary"
        onCancel={() => setEntryModePrompt(false)}
        onConfirm={() => {
          setEntryModePrompt(false);
          openCreateModal();
        }}
        onSecondaryAction={() => {
          setEntryModePrompt(false);
          openBulkModal();
        }}
      />
    ) : null}
  </div>
);
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    rose: { panel: "border-rose-200/70 bg-rose-50/80", value: "text-rose-600" },
    amber: { panel: "border-amber-200/70 bg-amber-50/80", value: "text-amber-600" },
    blue: { panel: "border-blue-200/70 bg-blue-50/80", value: "text-blue-600" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80", value: "text-violet-600" },
  }
  const current = tones[tone] || tones.blue

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] ${current.panel}`}>
      <p className="font-semibold tracking-[0.18em] text-[color:var(--text-secondary)] text-[13px]">{label}</p>
      <p className={`mt-3 text-2xl font-extrabold ${current.value}`}>{value}</p>
    </div>
  )
}

function InlineNotice({ notice }) {
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
        notice.type === "error"
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {notice.text}
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2 text-[color:var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function InlineOptionSelect({
  label,
  value,
  options,
  onChange,
  field,
  optionBuilder,
  setOptionBuilder,
  onAdd,
}) {
  const isActive = optionBuilder.field === field

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="input flex-1">
          {options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() =>
            setOptionBuilder((current) => ({
              field: current.field === field ? "" : field,
              value: current.field === field ? "" : "",
            }))
          }
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-primary)]"
          title={`Add ${label}`}
        >
          <Plus size={18} />
        </button>
      </div>

      {isActive ? (
        <div className="flex gap-2">
          <input
            placeholder={`New ${label}`}
            value={optionBuilder.value}
            onChange={(event) => setOptionBuilder({ field, value: event.target.value })}
            className="input flex-1"
          />
          <button type="button" onClick={onAdd} className="rounded-xl bg-blue-600 px-4 py-2 text-white">
            Add
          </button>
        </div>
      ) : null}
    </div>
  )
}

function ConfirmDialog({
  title,
  description,
  actionLabel,
  variant,
  secondaryLabel = "",
  onCancel,
  onConfirm,
  onSecondaryAction,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.22)]">
        <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
          >
            Cancel
          </button>
          {secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-600"
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-white ${variant === "danger" ? "bg-red-600" : "bg-blue-600"}`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
