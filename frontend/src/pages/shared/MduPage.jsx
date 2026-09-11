import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  Droplets,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Fuel,
  Gauge,
  Home,
  Layers,
  LayoutGrid,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import { useAuth } from "../../contexts/AuthContext"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"
import { getAiReportSummary } from "../../services/aiApi"
import {
  addMduEntry,
  deleteMduEntry,
  getMduEntries,
  updateMduEntry,
} from "../../services/mduApi"

const today = () => new Date().toISOString().slice(0, 10)
const currentMonth = () => new Date().toISOString().slice(0, 7)
const numberValue = (value) => Number(value || 0)

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")
const formatNumber = (value, suffix = "") =>
  `${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}${suffix}`
const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

const formatMobileDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}`
}

const formatDateTime = (value) => {
  if (!value) return "Not edited yet"
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const emptyForm = () => ({
  date: today(),
  openingStock: "",
  decant: "",
  sale: "",
  physicalStock: "",
  rate: "",
  remark: "",
})

const getLossGain = (entry) =>
  Number(
    entry.lossGain ??
      numberValue(entry.physicalStock) -
        (numberValue(entry.openingStock) + numberValue(entry.decant) - numberValue(entry.sale)),
  )

export default function MduPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isManager = user?.role === "Manager"
  const { canUse, canShowCard } = useManagerDashboardSettings("mdu", isManager)
  const canManagerUse = (key) => !isManager || canUse(key)
  const canManagerShowCard = (key) => !isManager || canShowCard(key)

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [monthFilter, setMonthFilter] = useState(currentMonth())
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmState, setConfirmState] = useState(null)
  const [entryModePrompt, setEntryModePrompt] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkDefaultDate, setBulkDefaultDate] = useState(today())
  const [bulkRows, setBulkRows] = useState([emptyForm()])
  const [reportOpen, setReportOpen] = useState(false)
  const [reportFormat, setReportFormat] = useState("pdf")
  const [monthDeleteOpen, setMonthDeleteOpen] = useState(false)
  const [deleteMonthValue, setDeleteMonthValue] = useState(currentMonth())
  const [aiSummary, setAiSummary] = useState("")
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)

  // Mobile-specific state
  const [mobileTimeframe, setMobileTimeframe] = useState("month")
  const [showMobileTimeDropdown, setShowMobileTimeDropdown] = useState(false)
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false)
  const [mobileDetailItem, setMobileDetailItem] = useState(null)
  const [expandedCardId, setExpandedCardId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!notice.text) return undefined
    const timeout = window.setTimeout(() => setNotice({ type: "", text: "" }), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const load = async () => {
    setLoading(true)
    try {
      const data = await getMduEntries()
      setEntries(Array.isArray(data) ? data : [])
    } catch (_error) {
      setNotice({ type: "error", text: "Unable to load M.D.U entries." })
    } finally {
      setLoading(false)
    }
  }

  const hasDateRange = Boolean(fromDate || toDate)

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const dateStr = entry.date ? String(entry.date).slice(0, 10) : ""
      const entryMonth = dateStr.slice(0, 7)

      const target = [
        dateStr,
        entry.openingStock,
        entry.decant,
        entry.sale,
        entry.physicalStock,
        entry.rate,
        entry.remark,
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch = !search || target.includes(search.toLowerCase())
      const matchesFrom = !fromDate || (dateStr && dateStr >= fromDate)
      const matchesTo = !toDate || (dateStr && dateStr <= toDate)
      const matchesMonth = hasDateRange || !monthFilter || entryMonth === monthFilter

      return matchesSearch && matchesFrom && matchesTo && matchesMonth
    })
  }, [entries, fromDate, hasDateRange, monthFilter, search, toDate])

  const summary = useMemo(() => {
    const totalSale = filteredEntries.reduce((sum, entry) => sum + numberValue(entry.sale), 0)
    const totalDecant = filteredEntries.reduce((sum, entry) => sum + numberValue(entry.decant), 0)
    const rateEntries = filteredEntries.filter((entry) => numberValue(entry.rate) > 0)
    const avgRate = rateEntries.length
      ? rateEntries.reduce((sum, entry) => sum + numberValue(entry.rate), 0) / rateEntries.length
      : 0
    const revenue = totalSale * avgRate
    const totalLossGain = filteredEntries.reduce((sum, entry) => sum + getLossGain(entry), 0)
    const impact = totalLossGain * avgRate

    return {
      totalSale,
      totalDecant,
      avgRate,
      revenue,
      totalLossGain,
      impact,
      records: filteredEntries.length,
    }
  }, [filteredEntries])

  const mobileHeroAmount = useMemo(() => {
    const todayStr = today()
    let filteredSales = 0
    let filteredLossGain = 0
    let count = 0

    filteredEntries.forEach((entry) => {
      const entryDate = String(entry.date || "").slice(0, 10)
      const saleVal = numberValue(entry.sale)
      const lgVal = getLossGain(entry)

      if (mobileTimeframe === "today") {
        if (entryDate === todayStr) {
          filteredSales += saleVal
          filteredLossGain += lgVal
          count++
        }
      } else if (mobileTimeframe === "week") {
        const diffDays = (new Date() - new Date(entry.date)) / (1000 * 60 * 60 * 24)
        if (diffDays >= 0 && diffDays <= 7) {
          filteredSales += saleVal
          filteredLossGain += lgVal
          count++
        }
      } else if (mobileTimeframe === "all") {
        filteredSales += saleVal
        filteredLossGain += lgVal
        count++
      } else {
        // month
        if (entryDate.slice(0, 7) === (monthFilter || currentMonth())) {
          filteredSales += saleVal
          filteredLossGain += lgVal
          count++
        }
      }
    })

    return {
      label:
        mobileTimeframe === "today"
          ? "Today"
          : mobileTimeframe === "week"
          ? "This Week"
          : mobileTimeframe === "all"
          ? "All Time"
          : "This Month",
      sale: `${formatNumber(filteredSales)} L`,
      lossGain: filteredLossGain,
      lossGainText: `${filteredLossGain >= 0 ? "+" : ""}${formatNumber(filteredLossGain)} L ${
        filteredLossGain >= 0 ? "Gain" : "Loss"
      }`,
      count,
    }
  }, [filteredEntries, mobileTimeframe, monthFilter])

  const summaryCards = [
    { key: "totalDecant", label: "Total Decant", value: `${formatNumber(summary.totalDecant)} L`, tone: "sky" },
    { key: "totalSale", label: "Total Sale", value: `${formatNumber(summary.totalSale)} L`, tone: "emerald" },
    { key: "avgRate", label: "Avg Rate", value: formatCurrency(summary.avgRate), tone: "violet" },
    { key: "revenue", label: "Total Revenue", value: formatCurrency(summary.revenue), tone: "amber" },
    {
      key: "netVariance",
      label: "Net Variance",
      value: `${summary.totalLossGain >= 0 ? "+" : ""}${formatNumber(summary.totalLossGain)} L`,
      tone: summary.totalLossGain >= 0 ? "emerald" : "rose",
    },
    {
      key: "impact",
      label: "Variance Value",
      value: formatCurrency(summary.impact),
      tone: summary.impact >= 0 ? "emerald" : "rose",
    },
  ]
  const visibleSummaryCards = summaryCards.filter((card) => canManagerShowCard(card.key))

  const openCreateModal = () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add entries." })
      return
    }
    setEditData(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEntryMode = () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add entries." })
      return
    }
    setEntryModePrompt(true)
  }

  const openBulkModal = () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add entries." })
      return
    }
    setBulkDefaultDate(today())
    setBulkRows([{ ...emptyForm(), date: today() }])
    setBulkOpen(true)
  }

  const openEditModal = (entry) => {
    if (!canManagerUse("editEntry")) {
      setNotice({ type: "error", text: "You do not have access to edit entries." })
      return
    }
    setEditData(entry)
    setForm({
      date: entry.date ? String(entry.date).slice(0, 10) : today(),
      openingStock: String(entry.openingStock ?? ""),
      decant: String(entry.decant ?? ""),
      sale: String(entry.sale ?? ""),
      physicalStock: String(entry.physicalStock ?? ""),
      rate: String(entry.rate ?? ""),
      remark: entry.remark || "",
    })
    setModalOpen(true)
  }

  const saveEntry = async () => {
    if (!canManagerUse(editData ? "editEntry" : "addEntry")) {
      setNotice({ type: "error", text: "You do not have access to save entries." })
      return
    }

    if (!form.date || form.openingStock === "" || form.physicalStock === "") {
      setNotice({ type: "error", text: "Please enter Date, Opening Stock, and Physical Stock." })
      return
    }

    setSaving(true)
    try {
      const openingStock = numberValue(form.openingStock)
      const decant = numberValue(form.decant)
      const sale = numberValue(form.sale)
      const physicalStock = numberValue(form.physicalStock)
      const rate = numberValue(form.rate)
      const lossGain = physicalStock - (openingStock + decant - sale)

      const payload = {
        date: form.date,
        openingStock,
        decant,
        sale,
        physicalStock,
        rate,
        lossGain,
        remark: form.remark?.trim() || "",
        createdBy: user?.name || user?.role || "Admin",
      }

      if (editData) {
        await updateMduEntry(editData._id, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: "M.D.U entry updated successfully." })
      } else {
        await addMduEntry(payload)
        setNotice({ type: "success", text: "M.D.U entry saved successfully." })
      }

      setModalOpen(false)
      setEditData(null)
      setForm(emptyForm())
      await load()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save M.D.U entry.",
      })
    } finally {
      setSaving(false)
    }
  }

  const askDelete = (entry) => {
    if (!canManagerUse("deleteEntry")) {
      setNotice({ type: "error", text: "You do not have access to delete entries." })
      return
    }

    setConfirmState({
      title: "Delete M.D.U Entry",
      description: `Delete M.D.U entry for ${formatDate(entry.date)}? This action cannot be undone.`,
      actionLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        await deleteMduEntry(entry._id)
        await load()
        setNotice({ type: "success", text: "M.D.U entry deleted successfully." })
      },
    })
  }

  const updateBulkRow = (index, key, value) => {
    setBulkRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    )
  }

  const updateBulkDefaultDate = (value) => {
    setBulkDefaultDate(value)
    setBulkRows((rows) => rows.map((row) => ({ ...row, date: value })))
  }

  const addBulkRow = () => {
    setBulkRows((current) => [...current, { ...emptyForm(), date: bulkDefaultDate }])
  }

  const removeBulkRow = (index) => {
    setBulkRows((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current))
  }

  const saveBulk = async () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add entries." })
      return
    }

    const validRows = bulkRows.filter((r) => r.date && r.openingStock !== "" && r.physicalStock !== "")
    if (!validRows.length) {
      setNotice({ type: "error", text: "Please complete Date, Opening Stock, and Physical Stock for at least one row." })
      return
    }

    setBulkSaving(true)
    try {
      for (const row of validRows) {
        const openingStock = numberValue(row.openingStock)
        const decant = numberValue(row.decant)
        const sale = numberValue(row.sale)
        const physicalStock = numberValue(row.physicalStock)
        const rate = numberValue(row.rate)
        const lossGain = physicalStock - (openingStock + decant - sale)

        await addMduEntry({
          date: row.date,
          openingStock,
          decant,
          sale,
          physicalStock,
          rate,
          lossGain,
          remark: row.remark?.trim() || "",
          createdBy: user?.name || user?.role || "Admin",
        })
      }

      setBulkOpen(false)
      setBulkRows([emptyForm()])
      await load()
      setNotice({ type: "success", text: `${validRows.length} M.D.U entries saved successfully.` })
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to save entries." })
    } finally {
      setBulkSaving(false)
    }
  }

  const exportReport = () => {
    if (!canManagerUse("generateReport")) {
      setNotice({ type: "error", text: "You do not have access to generate reports." })
      return
    }

    const headers = [
      "Date",
      "Opening Stock",
      "Decant",
      "Sale",
      "Physical Stock",
      "Loss/Gain",
      "Rate",
      "Remark",
    ]
    const rows = filteredEntries.map((e) => [
      formatDate(e.date),
      formatNumber(e.openingStock),
      formatNumber(e.decant),
      formatNumber(e.sale),
      formatNumber(e.physicalStock),
      formatNumber(getLossGain(e)),
      formatNumber(e.rate),
      e.remark || "-",
    ])

    if (reportFormat === "excel") {
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, "MDU_Report")
      XLSX.writeFile(workbook, "MDU_Report.xlsx")
    } else {
      const doc = new jsPDF({ orientation: "landscape" })
      doc.setFontSize(16)
      doc.text("M.D.U Daily Register Report", 14, 16)
      doc.setFontSize(10)
      doc.text(
        `Month: ${hasDateRange ? "All" : monthFilter || "All"} | From: ${fromDate || "All"} To: ${toDate || "All"} | Records: ${filteredEntries.length}`,
        14,
        24,
      )
      autoTable(doc, {
        startY: 30,
        head: [headers],
        body: rows,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [6, 78, 59], textColor: 255 },
      })
      doc.save("MDU_Report.pdf")
    }

    setReportOpen(false)
    setNotice({ type: "success", text: "Report downloaded successfully." })
  }

  const deleteSelectedMonth = async () => {
    if (!canManagerUse("deleteEntry")) {
      setNotice({ type: "error", text: "You do not have access to delete entries." })
      return
    }

    const targets = entries.filter((e) => String(e.date || "").slice(0, 7) === deleteMonthValue)
    if (!targets.length) {
      setNotice({ type: "error", text: "No entries found for selected month." })
      return
    }

    try {
      for (const target of targets) {
        await deleteMduEntry(target._id)
      }
      setMonthDeleteOpen(false)
      await load()
      setNotice({ type: "success", text: `${targets.length} M.D.U entries deleted successfully.` })
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to delete entries." })
    }
  }

  const liveLossGainPreview = useMemo(() => {
    const op = numberValue(form.openingStock)
    const dc = numberValue(form.decant)
    const sl = numberValue(form.sale)
    const ph = numberValue(form.physicalStock)
    const expected = op + dc - sl
    const lg = ph - expected
    return { expected, lossGain: lg }
  }, [form.openingStock, form.decant, form.sale, form.physicalStock])

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-3 text-[color:var(--text-primary)] sm:p-6 pb-28 lg:pb-6">
      {notice.text ? <InlineNotice notice={notice} /> : null}

      {/* =========================================================================
          MOBILE VIEW (ONLY FOR PHONE: lg:hidden)
      ========================================================================= */}
      <div className="lg:hidden space-y-3">
        {/* 1. Mobile Top Header */}
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Truck size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-[color:var(--text-strong)] leading-tight">
                M.D.U
              </h1>
              <p className="text-[11px] font-medium text-[color:var(--text-secondary)]">Mobile Dispenser Unit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManagerUse("addEntry") ? (
              <button
                type="button"
                onClick={openEntryMode}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                title="Add Entry"
              >
                <Plus size={19} strokeWidth={2.5} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => navigate(user?.role === "Admin" ? "/admin/notifications" : "/notifications")}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)] transition-colors"
              title="Notifications"
            >
              <Bell size={19} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-panel)]" />
            </button>
          </div>
        </div>

        {/* 2. Premium Emerald Hero Gradient Card with Liquid Wave */}
        <div className="relative z-30 overflow-visible rounded-[26px] bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#0d9488] p-5 text-white shadow-xl shadow-emerald-950/20">
          {/* Clipped background wave vector */}
          <div className="absolute inset-0 overflow-hidden rounded-[26px] pointer-events-none">
            <svg
              viewBox="0 0 280 80"
              className="absolute bottom-0 right-0 w-3/5 h-20 text-emerald-300 opacity-80"
            >
              <defs>
                <linearGradient id="mobileMduHeroGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,60 Q70,75 140,38 T280,28"
                fill="none"
                stroke="#6ee7b7"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="190" cy="32" r="4" fill="#ffffff" />
              <path
                d="M0,60 Q70,75 140,38 T280,28 L280,80 L0,80 Z"
                fill="url(#mobileMduHeroGrad)"
              />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Top row: Title and Dashboard Console button */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-emerald-100/90 tracking-wide flex items-center gap-1.5">
                <Fuel size={14} className="text-emerald-300" />
                Total Dispensed (Sale)
              </span>
              <button
                type="button"
                onClick={() => navigate("/admin/mdu-dashboard")}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 border border-white/20 text-white shadow-sm active:scale-95 transition-all"
                title="M.D.U Operations Console"
              >
                <TrendingUp size={18} />
              </button>
            </div>

            {/* Large Bold Amount */}
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm mb-3">
              {mobileHeroAmount.sale}
            </div>

            {/* Middle metrics row: Loss/Gain tag & Timeframe dropdown */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative inline-block z-40">
                <button
                  type="button"
                  onClick={() => setShowMobileTimeDropdown((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-black/25 px-3 py-1.5 text-xs font-bold text-emerald-100 backdrop-blur-md active:scale-95 transition-all"
                >
                  <span>{mobileHeroAmount.label}</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${showMobileTimeDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showMobileTimeDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-[70]"
                      onClick={() => setShowMobileTimeDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-36 rounded-2xl border border-emerald-500/40 bg-[#064e3b] p-1.5 shadow-2xl backdrop-blur-xl z-[80] text-xs font-bold text-white">
                      {[
                        { key: "today", label: "Today" },
                        { key: "week", label: "This Week" },
                        { key: "month", label: "This Month" },
                        { key: "all", label: "All Time" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setMobileTimeframe(item.key)
                            setShowMobileTimeDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                            mobileTimeframe === item.key ? "bg-emerald-600 text-white" : "hover:bg-white/10"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Loss/Gain Pill Badge */}
              <div
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-extrabold backdrop-blur-md ${
                  mobileHeroAmount.lossGain >= 0
                    ? "bg-emerald-950/60 border-emerald-400/40 text-emerald-300"
                    : "bg-rose-950/60 border-rose-400/40 text-rose-300"
                }`}
              >
                {mobileHeroAmount.lossGain >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{mobileHeroAmount.lossGainText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Compact 3-Metrics Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-[color:var(--text-secondary)]">Total Decant</p>
            <p className="text-xs sm:text-sm font-extrabold text-sky-600 dark:text-sky-400 mt-0.5 truncate">
              {formatNumber(summary.totalDecant)} L
            </p>
          </div>
          <div className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-[color:var(--text-secondary)]">Avg Rate</p>
            <p className="text-xs sm:text-sm font-extrabold text-violet-600 dark:text-violet-400 mt-0.5 truncate">
              {formatCurrency(summary.avgRate)}
            </p>
          </div>
          <div className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-[color:var(--text-secondary)]">Variance Value</p>
            <p
              className={`text-xs sm:text-sm font-extrabold mt-0.5 truncate ${
                summary.impact >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatCurrency(summary.impact)}
            </p>
          </div>
        </div>

        {/* 4. Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)] pointer-events-none"
            />
            <input
              placeholder="Search date, stock, rate, remark..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] py-2 pl-10 pr-3 text-xs font-medium text-[color:var(--text-primary)] shadow-sm outline-none placeholder:text-[color:var(--text-secondary)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowMobileFilterModal(true)}
            className={`inline-flex h-11 items-center gap-1.5 rounded-2xl border px-3.5 text-xs font-bold shadow-sm active:scale-95 transition-all ${
              fromDate || toDate || monthFilter !== currentMonth()
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            <Filter size={15} />
            <span>Filter</span>
          </button>
        </div>

        {/* 5. Mobile M.D.U Entries Card List */}
        <div className="space-y-2.5 mb-24">
          {filteredEntries.length === 0 ? (
            <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-8 text-center shadow-sm">
              <Truck size={32} className="mx-auto text-emerald-400/60 mb-2" />
              <p className="text-sm font-bold text-[color:var(--text-secondary)]">No M.D.U entries found.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const lossGain = getLossGain(entry)
              const isGain = lossGain >= 0
              const isExpanded = expandedCardId === entry._id

              return (
                <div
                  key={entry._id}
                  onClick={() => setExpandedCardId((prev) => (prev === entry._id ? null : entry._id))}
                  className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-all"
                >
                  {/* Card Header Row */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Fuel size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[color:var(--text-strong)] leading-tight">
                          {formatMobileDate(entry.date)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[color:var(--text-secondary)] truncate">
                          Rate: <span className="font-bold text-[color:var(--text-strong)]">{formatCurrency(entry.rate)}</span>
                          {entry.remark ? ` • ${entry.remark}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                          {formatNumber(entry.sale)} L
                        </p>
                        <span
                          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                            isGain
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          }`}
                        >
                          {isGain ? "+" : ""}{formatNumber(lossGain)} L {isGain ? "Gain" : "Loss"}
                        </span>
                      </div>

                      <ChevronDown
                        size={16}
                        className={`text-[color:var(--text-secondary)] transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-emerald-600" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Stock Details Grid */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2">
                      <span className="text-[10px] text-[color:var(--text-secondary)] block">Opening</span>
                      <span className="font-bold text-[color:var(--text-strong)]">{formatNumber(entry.openingStock)} L</span>
                    </div>
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2">
                      <span className="text-[10px] text-[color:var(--text-secondary)] block">Decant</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">{formatNumber(entry.decant)} L</span>
                    </div>
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2">
                      <span className="text-[10px] text-[color:var(--text-secondary)] block">Physical</span>
                      <span className="font-bold text-[color:var(--text-strong)]">{formatNumber(entry.physicalStock)} L</span>
                    </div>
                  </div>

                  {/* Expandable Section: Full breakdown & Edit/Delete actions */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-color)] space-y-2 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[color:var(--text-secondary)]">
                        <span>Expected Closing Stock:</span>
                        <span className="font-bold text-[color:var(--text-strong)]">
                          {formatNumber(
                            numberValue(entry.openingStock) + numberValue(entry.decant) - numberValue(entry.sale),
                          )}{" "}
                          L
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[color:var(--text-secondary)]">
                        <span>Financial Impact:</span>
                        <span className={`font-bold ${isGain ? "text-emerald-600" : "text-rose-600"}`}>
                          {formatCurrency(lossGain * numberValue(entry.rate))}
                        </span>
                      </div>

                      {entry.remark ? (
                        <div className="text-[color:var(--text-secondary)]">
                          <span>Remark:</span>{" "}
                          <span className="font-medium text-[color:var(--text-strong)]">{entry.remark}</span>
                        </div>
                      ) : null}

                      <div className="text-[10px] text-[color:var(--text-secondary)] pt-1">
                        {entry.lastEditedAt ? (
                          <span>
                            Edited: {formatDateTime(entry.lastEditedAt)} by {entry.lastEditedBy || "-"}
                          </span>
                        ) : (
                          <span>Created by {entry.createdBy || "Admin"}</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
                        {canManagerUse("editEntry") ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(entry)
                            }}
                            className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 active:scale-95"
                          >
                            Edit
                          </button>
                        ) : null}

                        {canManagerUse("deleteEntry") ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              askDelete(entry)
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 6. Mobile Floating Action Button (+ FAB) */}
        {canManagerUse("addEntry") ? (
          <button
            type="button"
            onClick={openEntryMode}
            className="lg:hidden fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#008744] hover:bg-[#007038] text-white shadow-xl shadow-emerald-900/30 active:scale-95 transition-all"
            title="Add M.D.U Entry"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        ) : null}

        {/* 7. Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 mx-3 mb-2 flex h-[68px] items-center justify-around rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)]/95 backdrop-blur-xl px-2 shadow-2xl transition-colors duration-300">
          <button
            type="button"
            onClick={() => {
              setFromDate("")
              setToDate("")
              setSearch("")
            }}
            className="flex min-w-[54px] flex-col items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold"
          >
            <Truck size={19} />
            <span className="text-[10px]">Register</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/mdu-dashboard")}
            className="flex min-w-[54px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"
          >
            <ChartNoAxesCombined size={19} />
            <span className="text-[10px]">Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (canManagerUse("generateReport")) {
                setReportOpen(true)
              }
            }}
            className="flex min-w-[54px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"
          >
            <FileText size={19} />
            <span className="text-[10px]">Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMobileFilterModal(true)}
            className="flex min-w-[54px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"
          >
            <Filter size={19} />
            <span className="text-[10px]">Filters</span>
          </button>
        </nav>
      </div>

      {/* =========================================================================
          DESKTOP VIEW (PRESERVED 100% FOR LARGE SCREENS: hidden lg:block)
      ========================================================================= */}
      <div className="hidden lg:block">
        {/* Header */}
        <div className="mb-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-5 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Truck size={22} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-strong)]">
                  M.D.U
                </h1>
                <p className="text-xs font-semibold text-[color:var(--text-secondary)]">MDU DSR Register</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <div className="h-1 w-16 rounded-full bg-emerald-200"></div>
          </div>
        </div>

        {/* Desktop Summary Cards */}
        {visibleSummaryCards.length ? (
          <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-6">
            {visibleSummaryCards.map((card) => (
              <SummaryCard key={card.key} label={card.label} value={card.value} tone={card.tone} />
            ))}
          </div>
        ) : null}

        {/* Desktop Search & Actions Bar */}
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <input
            placeholder="Search date, stock, rate, remark"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full xl:max-w-[420px]"
          />

          <div className="hidden gap-3 xl:ml-auto xl:flex">
            <button
              type="button"
              onClick={() => navigate("/admin/mdu-dashboard")}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-medium text-emerald-700 shadow-sm"
            >
              <ChartNoAxesCombined size={18} />
              MDU Dashboard
            </button>

            {canManagerUse("addEntry") ? (
              <button
                type="button"
                onClick={openEntryMode}
                className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm"
              >
                + Add Entry
              </button>
            ) : null}

            {canManagerUse("generateReport") ? (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="rounded-2xl bg-purple-600 px-5 py-3 font-medium text-white shadow-sm"
              >
                Generate Report
              </button>
            ) : null}

            {canManagerUse("deleteEntry") ? (
              <button
                type="button"
                onClick={() => {
                  setDeleteMonthValue(monthFilter || currentMonth())
                  setMonthDeleteOpen(true)
                }}
                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-medium text-red-500"
              >
                Delete Month
              </button>
            ) : null}
          </div>
        </div>

        {/* Desktop Filter Bar */}
        <div className="mb-5 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[250px_210px_210px_auto]">
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title="From date"
              className="input"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title="To date"
              className="input"
            />
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setMonthFilter(currentMonth())
                setFromDate("")
                setToDate("")
              }}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)]"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Desktop Full Table */}
        <div className="max-h-[620px] overflow-x-auto overflow-y-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_16px_32px_rgba(16,24,20,0.05)]">
          <table className="table min-w-[1080px] text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--bg-panel)] shadow-sm">
              <tr>
                <th>Date</th>
                <th>Op. Stock</th>
                <th>Decant</th>
                <th>Sale</th>
                <th>Physical Stock</th>
                <th>Loss/Gain</th>
                <th>Rate</th>
                <th>Remark</th>
                <th className="min-w-[170px]">Audit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const lossGain = getLossGain(entry)
                return (
                  <tr key={entry._id}>
                    <td>{formatDate(entry.date)}</td>
                    <td>{formatNumber(entry.openingStock)}</td>
                    <td>{formatNumber(entry.decant)}</td>
                    <td className="font-semibold text-emerald-600">{formatNumber(entry.sale)}</td>
                    <td>{formatNumber(entry.physicalStock)}</td>
                    <td className={`font-semibold ${lossGain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {formatNumber(lossGain)}
                    </td>
                    <td>{formatNumber(entry.rate)}</td>
                    <td>{entry.remark || "-"}</td>
                    <td className="min-w-[170px] whitespace-nowrap text-center text-[11px] leading-4 text-[color:var(--text-secondary)]">
                      Edited: {formatDateTime(entry.lastEditedAt)} | By: {entry.lastEditedBy || "-"}{" "}
                      {entry.lastEditedByRole ? `(${entry.lastEditedByRole})` : ""}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-3">
                        {canManagerUse("editEntry") ? (
                          <button
                            type="button"
                            onClick={() => openEditModal(entry)}
                            className="text-blue-500 hover:underline"
                          >
                            Edit
                          </button>
                        ) : null}
                        {canManagerUse("deleteEntry") ? (
                          <button
                            type="button"
                            onClick={() => askDelete(entry)}
                            className="text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODALS & BOTTOM SHEETS
      ========================================================================= */}

      {/* Mobile Filter Sheet Modal */}
      {showMobileFilterModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 lg:hidden">
          <div className="w-full max-w-lg rounded-t-[28px] sm:rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-emerald-500" />
                <h3 className="text-base font-bold text-[color:var(--text-strong)]">Filter M.D.U Entries</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                className="rounded-xl p-1.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">Month Filter</label>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFromDate("")
                  setToDate("")
                  setMonthFilter(currentMonth())
                  setShowMobileFilterModal(false)
                }}
                className="flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] py-3 text-sm font-semibold text-[color:var(--text-primary)]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/30"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Entry Add / Edit Modal */}
      {modalOpen ? (
        <ModalShell
          title={editData ? "Edit M.D.U Entry" : "Add M.D.U Entry"}
          onClose={() => setModalOpen(false)}
        >
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input w-full"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Opening Stock</span>
                <input
                  placeholder="Litres"
                  value={form.openingStock}
                  onChange={(e) => setForm({ ...form, openingStock: e.target.value })}
                  className="input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Decant Added</span>
                <input
                  placeholder="Litres"
                  value={form.decant}
                  onChange={(e) => setForm({ ...form, decant: e.target.value })}
                  className="input w-full"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Sale (Dispensed)</span>
                <input
                  placeholder="Litres"
                  value={form.sale}
                  onChange={(e) => setForm({ ...form, sale: e.target.value })}
                  className="input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Physical Stock</span>
                <input
                  placeholder="Litres"
                  value={form.physicalStock}
                  onChange={(e) => setForm({ ...form, physicalStock: e.target.value })}
                  className="input w-full"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Rate (Rs./Ltr)</span>
              <input
                placeholder="Rate"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                className="input w-full"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Remark (Optional)</span>
              <input
                placeholder="Driver, trip, dispenser note"
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                className="input w-full"
              />
            </label>

            {/* Live Variance Calculation */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--text-secondary)]">Expected Closing Stock:</span>
                <span className="font-bold text-[color:var(--text-strong)]">{formatNumber(liveLossGainPreview.expected)} L</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[color:var(--text-secondary)]">Calculated Loss / Gain:</span>
                <span
                  className={`font-black text-sm ${
                    liveLossGainPreview.lossGain >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {liveLossGainPreview.lossGain >= 0 ? "+" : ""}{formatNumber(liveLossGainPreview.lossGain)} L{" "}
                  {liveLossGainPreview.lossGain >= 0 ? "(Gain)" : "(Loss)"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEntry}
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-white font-bold disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {/* Multiple Entry Bulk Modal */}
      {bulkOpen ? (
        <ModalShell title="Add Multiple M.D.U Entries" onClose={() => setBulkOpen(false)}>
          <div className="mb-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Common Date</span>
              <input
                type="date"
                value={bulkDefaultDate}
                onChange={(e) => updateBulkDefaultDate(e.target.value)}
                className="input w-full"
              />
            </label>
          </div>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {bulkRows.map((row, index) => (
              <div
                key={`bulk-${index}`}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-extrabold text-[color:var(--text-strong)]">Entry {index + 1}</p>
                  {bulkRows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeBulkRow(index)}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-500 font-bold"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-2.5">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateBulkRow(index, "date", e.target.value)}
                    className="input w-full"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Op. Stock"
                      value={row.openingStock}
                      onChange={(e) => updateBulkRow(index, "openingStock", e.target.value)}
                      className="input"
                    />
                    <input
                      placeholder="Decant"
                      value={row.decant}
                      onChange={(e) => updateBulkRow(index, "decant", e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Sale"
                      value={row.sale}
                      onChange={(e) => updateBulkRow(index, "sale", e.target.value)}
                      className="input"
                    />
                    <input
                      placeholder="Physical Stock"
                      value={row.physicalStock}
                      onChange={(e) => updateBulkRow(index, "physicalStock", e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Rate"
                      value={row.rate}
                      onChange={(e) => updateBulkRow(index, "rate", e.target.value)}
                      className="input"
                    />
                    <input
                      placeholder="Remark"
                      value={row.remark}
                      onChange={(e) => updateBulkRow(index, "remark", e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addBulkRow}
            className="mt-4 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-xs font-bold text-[color:var(--text-primary)]"
          >
            + Add Another Row
          </button>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setBulkOpen(false)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveBulk}
              disabled={bulkSaving}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-white font-bold disabled:opacity-60"
            >
              {bulkSaving ? "Saving..." : "Save All"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {/* Entry Mode Prompt Dialog */}
      {entryModePrompt ? (
        <ConfirmDialog
          title="Add M.D.U Entry"
          description="Choose whether you want to save one entry or add multiple entries together."
          actionLabel="Single Entry"
          secondaryLabel="Multiple Entry"
          variant="primary"
          onCancel={() => setEntryModePrompt(false)}
          onConfirm={() => {
            setEntryModePrompt(false)
            openCreateModal()
          }}
          onSecondaryAction={() => {
            setEntryModePrompt(false)
            openBulkModal()
          }}
        />
      ) : null}

      {/* Generate Report Modal */}
      {reportOpen ? (
        <ModalShell title="Generate M.D.U Report" onClose={() => setReportOpen(false)}>
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">From Date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">To Date</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Format</span>
              <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
                className="input w-full"
              >
                <option value="pdf">PDF Document</option>
                <option value="excel">Excel Spreadsheet</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={exportReport}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-white font-bold"
            >
              Download
            </button>
          </div>
        </ModalShell>
      ) : null}

      {/* Delete Month Modal */}
      {monthDeleteOpen ? (
        <ModalShell title="Delete Month Records" onClose={() => setMonthDeleteOpen(false)}>
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[color:var(--text-secondary)]">Select Month</span>
              <input
                type="month"
                value={deleteMonthValue}
                onChange={(e) => setDeleteMonthValue(e.target.value)}
                className="input w-full"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setMonthDeleteOpen(false)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteSelectedMonth}
              className="rounded-xl bg-red-600 px-5 py-2 text-white font-bold"
            >
              Delete
            </button>
          </div>
        </ModalShell>
      ) : null}

      {/* Confirm Delete Dialog */}
      {confirmState ? (
        <ConfirmDialog
          title={confirmState.title}
          description={confirmState.description}
          actionLabel={confirmState.actionLabel}
          variant={confirmState.variant}
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            try {
              await confirmState.onConfirm?.()
            } catch (error) {
              setNotice({
                type: "error",
                text: error?.response?.data?.message || "Unable to complete this action.",
              })
            } finally {
              setConfirmState(null)
            }
          }}
        />
      ) : null}
    </div>
  )
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    sky: { panel: "border-sky-200/70 bg-sky-50/80 dark:bg-sky-950/40 dark:border-sky-800/40", value: "text-sky-600 dark:text-sky-400" },
    emerald: { panel: "border-emerald-200/70 bg-emerald-50/80 dark:bg-emerald-950/40 dark:border-emerald-800/40", value: "text-emerald-600 dark:text-emerald-400" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80 dark:bg-violet-950/40 dark:border-violet-800/40", value: "text-violet-600 dark:text-violet-400" },
    amber: { panel: "border-amber-200/70 bg-amber-50/80 dark:bg-amber-950/40 dark:border-amber-800/40", value: "text-amber-600 dark:text-amber-400" },
    rose: { panel: "border-rose-200/70 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-800/40", value: "text-rose-600 dark:text-rose-400" },
  }
  const current = tones[tone] || tones.emerald

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
          ? "border-red-200 bg-red-50 text-red-600 dark:bg-red-950/50 dark:border-red-800/50 dark:text-red-400"
          : "border-green-200 bg-green-50 text-green-700 dark:bg-green-950/50 dark:border-green-800/50 dark:text-green-400"
      }`}
    >
      {notice.text}
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 shadow-2xl">
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
              className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 text-emerald-600 dark:text-emerald-400"
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-white ${variant === "danger" ? "bg-red-600" : "bg-emerald-600"}`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
