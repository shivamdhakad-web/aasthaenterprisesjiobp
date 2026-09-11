import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  Clock,
  Droplets,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Fuel,
  Gauge,
  Layers,
  LayoutGrid,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Receipt,
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
import SimpleAuditRegisterPage, { helpers } from "./SimpleAuditRegisterPage"
import {
  addDcdEntry,
  deleteDcdEntry,
  getDcdEntries,
  updateDcdEntry,
} from "../../services/dcdApi"

const { formatDate, formatNumber, numberValue, today } = helpers

const getToday = () => new Date().toISOString().slice(0, 10)
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

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

const empty = () => ({
  date: today(),
  product: "HSD",
  volume: "",
  purchasePrice: "",
  salePrice: "",
  shift: "",
  remark: "",
})

const getProfit = (entry) =>
  Number(entry.profit ?? (numberValue(entry.salePrice) - numberValue(entry.purchasePrice)) * numberValue(entry.volume))

const getMargin = (entry) => numberValue(entry.salePrice) - numberValue(entry.purchasePrice)

// ==========================================
// MAIN DCD PAGE WRAPPER (Desktop + Mobile)
// ==========================================
export default function DcdPage() {
  const [productOptions, setProductOptions] = useState(["HSD", "HSD PC"])
  const navigate = useNavigate()

  const addProductOption = (value) => {
    setProductOptions((current) => (current.includes(value) ? current : [...current, value]))
  }

  return (
    <>
      {/* =========================================================
          DESKTOP VIEW (100% ORIGINAL & UNTOUCHED)
          ========================================================= */}
      <div className="hidden lg:block">
        <SimpleAuditRegisterPage
          config={{
            title: "D.C.D",
            kicker: "Diesel Credit/Daily Register",
            description: "Track date, volume, purchase price, sale price, profit, shift, remarks, and audit history.",
            pageKey: "dcd",
            aiSummary: { valueKey: "profit", categoryKey: "product" },
            dashboardAction: {
              label: "DCD Dashboard",
              icon: <ChartNoAxesCombined size={18} />,
              onClick: () => navigate("/admin/dcd-dashboard"),
            },
            iconBg: "bg-orange-50",
            badgeStyle: "bg-orange-100 text-orange-700",
            lineStyle: "bg-orange-200",
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6 text-orange-600"
              >
                <ellipse cx="12" cy="5" rx="5" ry="2" />
                <path d="M7 5v14c0 1.1 2.2 2 5 2s5-.9 5-2V5" />
                <path d="M7 12c0 1.1 2.2 2 5 2s5-.9 5-2" />
                <path d="M10 9h4" />
              </svg>
            ),
            empty,
            api: {
              list: getDcdEntries,
              add: addDcdEntry,
              update: updateDcdEntry,
              remove: deleteDcdEntry,
            },
            requiredFields: ["date", "product", "volume", "purchasePrice", "salePrice"],
            bulkDefaults: [
              { key: "date" },
              { key: "product" },
              { key: "salePrice" },
            ],
            searchFields: ["date", "product", "volume", "purchasePrice", "salePrice", "shift", "remark"],
            searchPlaceholder: "Search date, product, volume, shift, remark",
            categoryFilter: {
              key: "product",
              allLabel: "All Categories",
              options: productOptions,
            },
            fields: [
              { key: "date", label: "Date", type: "date" },
              {
                key: "product",
                label: "Product",
                type: "select",
                options: productOptions,
                allowCustomOption: true,
                onAddOption: addProductOption,
              },
              { key: "volume", label: "Volume", type: "number" },
              { key: "purchasePrice", label: "Purchase Price", type: "number" },
              { key: "salePrice", label: "Sale Price", type: "number" },
              { key: "shift", label: "Shift" },
              { key: "remark", label: "Remark", full: true },
            ],
            columns: [
              { key: "date", label: "Date", render: (entry) => formatDate(entry.date) },
              { key: "product", label: "Product" },
              { key: "volume", label: "Volume", render: (entry) => formatNumber(entry.volume) },
              { key: "purchasePrice", label: "Purchase Price", render: (entry) => formatNumber(entry.purchasePrice) },
              { key: "salePrice", label: "Sale Price", render: (entry) => formatNumber(entry.salePrice) },
              {
                key: "margin",
                label: "Margin",
                render: (entry) => formatNumber(getMargin(entry)),
                className: (entry) => (getMargin(entry) >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-red-500"),
              },
              {
                key: "profit",
                label: "Profit",
                render: (entry) => formatNumber(getProfit(entry)),
                className: (entry) => (getProfit(entry) >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-red-500"),
              },
              { key: "shift", label: "Shift" },
              { key: "remark", label: "Remark" },
            ],
            buildPayload: (form) => ({
              ...form,
              product: form.product || "",
              volume: numberValue(form.volume),
              purchasePrice: numberValue(form.purchasePrice),
              salePrice: numberValue(form.salePrice),
              profit: (numberValue(form.salePrice) - numberValue(form.purchasePrice)) * numberValue(form.volume),
            }),
            summary: (entries) => {
              const totalVolume = entries.reduce((sum, entry) => sum + numberValue(entry.volume), 0)
              const totalProfit = entries.reduce((sum, entry) => sum + getProfit(entry), 0)
              const avgSale = entries.length
                ? entries.reduce((sum, entry) => sum + numberValue(entry.salePrice), 0) / entries.length
                : 0

              return [
                { label: "Total Volume", value: formatNumber(totalVolume), tone: "green" },
                { label: "Total Profit", value: formatNumber(totalProfit), tone: totalProfit >= 0 ? "green" : "rose" },
                { label: "Avg Sale Price", value: formatNumber(avgSale), tone: "amber" },
              ]
            },
            preview: (form) => {
              const margin = numberValue(form.salePrice) - numberValue(form.purchasePrice)
              const profit = (numberValue(form.salePrice) - numberValue(form.purchasePrice)) * numberValue(form.volume)

              return {
                label: "Calculated Margin / Profit",
                value: `${formatNumber(margin)} / ${formatNumber(profit)}`,
                className: profit >= 0 ? "text-emerald-500" : "text-red-500",
              }
            },
            mobileTitle: (entry) => entry.product || `Shift ${entry.shift || "-"}`,
            mobileBadge: (entry) => formatNumber(getProfit(entry)),
            mobileFields: [
              { key: "product", label: "Product" },
              { key: "volume", label: "Volume", render: (entry) => formatNumber(entry.volume) },
              { key: "purchasePrice", label: "Purchase", render: (entry) => formatNumber(entry.purchasePrice) },
              { key: "salePrice", label: "Sale", render: (entry) => formatNumber(entry.salePrice) },
              { key: "margin", label: "Margin", render: (entry) => formatNumber(getMargin(entry)) },
              { key: "remark", label: "Remark" },
            ],
          }}
        />
      </div>

      {/* =========================================================
          MOBILE VIEW (DEDICATED PREMIUM MOBILE INTERFACE)
          ========================================================= */}
      <div className="block lg:hidden">
        <DcdMobileView productOptions={productOptions} onAddProductOption={addProductOption} />
      </div>
    </>
  )
}

// ==========================================
// DEDICATED DCD MOBILE VIEW COMPONENT
// ==========================================
function DcdMobileView({ productOptions, onAddProductOption }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Data State
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  // Navigation Bottom Dock
  const [activeTab, setActiveTab] = useState("register")

  // Timeframe filter for Hero Card: "today" | "week" | "month" | "all"
  const [timeframe, setTimeframe] = useState("month")
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false)

  // Filters & Search
  const [search, setSearch] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("all")
  const [selectedShift, setSelectedShift] = useState("all")
  const [profitFilter, setProfitFilter] = useState("all") // "all" | "profit" | "loss"
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  // Accordion Expand State
  const [expandedCardId, setExpandedCardId] = useState(null)

  // Entry Modals
  const [showChoiceModal, setShowChoiceModal] = useState(false)
  const [showSingleModal, setShowSingleModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)

  // Single Form State
  const [singleForm, setSingleForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [customProductInput, setCustomProductInput] = useState("")
  const [showCustomProductInput, setShowCustomProductInput] = useState(false)

  // Bulk Form State
  const [bulkCommon, setBulkCommon] = useState({
    date: getToday(),
    product: "HSD",
    shift: "Morning",
    salePrice: "",
  })
  const [bulkRows, setBulkRows] = useState([
    { id: 1, volume: "", purchasePrice: "", salePrice: "", shift: "Morning", remark: "" },
    { id: 2, volume: "", purchasePrice: "", salePrice: "", shift: "Morning", remark: "" },
  ])

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Load Entries from API
  const loadEntries = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const data = await getDcdEntries()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load DCD entries:", err)
      setError(err?.response?.data?.message || "Failed to load D.C.D records.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [])

  // Timeframe calculation for Hero Analytics
  const heroEntries = useMemo(() => {
    const todayStr = getToday()
    const monthStr = getCurrentMonth()

    if (timeframe === "today") {
      return entries.filter((e) => String(e.date || "").slice(0, 10) === todayStr)
    }
    if (timeframe === "week") {
      const now = new Date()
      const dayOfWeek = now.getDay() || 7
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - dayOfWeek + 1)
      const startStr = startOfWeek.toISOString().slice(0, 10)
      return entries.filter((e) => {
        const d = String(e.date || "").slice(0, 10)
        return d >= startStr && d <= todayStr
      })
    }
    if (timeframe === "month") {
      return entries.filter((e) => String(e.date || "").slice(0, 7) === monthStr)
    }
    return entries
  }, [entries, timeframe])

  // Hero Card Summary Metrics
  const heroMetrics = useMemo(() => {
    let totalVolume = 0
    let totalProfit = 0
    let totalSaleValue = 0
    let totalPurchaseCost = 0
    let hsdVolume = 0
    let hsdPcVolume = 0

    heroEntries.forEach((entry) => {
      const vol = numberValue(entry.volume)
      const prcSale = numberValue(entry.salePrice)
      const prcPur = numberValue(entry.purchasePrice)
      const profit = getProfit(entry)

      totalVolume += vol
      totalProfit += profit
      totalSaleValue += vol * prcSale
      totalPurchaseCost += vol * prcPur

      const prod = String(entry.product || "").toLowerCase()
      if (prod.includes("pc")) {
        hsdPcVolume += vol
      } else {
        hsdVolume += vol
      }
    })

    const avgMargin = totalVolume > 0 ? totalProfit / totalVolume : 0

    return {
      totalVolume,
      totalProfit,
      totalSaleValue,
      totalPurchaseCost,
      avgMargin,
      hsdVolume,
      hsdPcVolume,
      count: heroEntries.length,
    }
  }, [heroEntries])

  // Filtered List of Entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          String(entry.product || "").toLowerCase().includes(q) ||
          String(entry.shift || "").toLowerCase().includes(q) ||
          String(entry.remark || "").toLowerCase().includes(q) ||
          String(entry.volume || "").includes(q) ||
          String(entry.date || "").includes(q)
        if (!match) return false
      }

      // Product
      if (selectedProduct !== "all") {
        if (String(entry.product || "").trim().toLowerCase() !== selectedProduct.trim().toLowerCase()) {
          return false
        }
      }

      // Shift
      if (selectedShift !== "all") {
        if (String(entry.shift || "").trim().toLowerCase() !== selectedShift.trim().toLowerCase()) {
          return false
        }
      }

      // Profit filter
      if (profitFilter === "profit") {
        if (getProfit(entry) < 0) return false
      } else if (profitFilter === "loss") {
        if (getProfit(entry) >= 0) return false
      }

      // Date Range
      const entryDate = entry.date ? String(entry.date).slice(0, 10) : ""
      if (fromDate && entryDate < fromDate) return false
      if (toDate && entryDate > toDate) return false

      return true
    })
  }, [entries, search, selectedProduct, selectedShift, profitFilter, fromDate, toDate])

  // Overall Quick Stats Bar for currently filtered entries
  const listStats = useMemo(() => {
    let vol = 0
    let profit = 0
    let saleSum = 0

    filteredEntries.forEach((e) => {
      const v = numberValue(e.volume)
      const sp = numberValue(e.salePrice)
      vol += v
      profit += getProfit(e)
      saleSum += sp * v
    })

    const avgSale = vol > 0 ? saleSum / vol : 0
    const avgMargin = vol > 0 ? profit / vol : 0

    return {
      vol,
      profit,
      avgSale,
      avgMargin,
      count: filteredEntries.length,
    }
  }, [filteredEntries])

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedProduct !== "all") count++
    if (selectedShift !== "all") count++
    if (profitFilter !== "all") count++
    if (fromDate) count++
    if (toDate) count++
    return count
  }, [selectedProduct, selectedShift, profitFilter, fromDate, toDate])

  // Shifts unique set
  const availableShifts = useMemo(() => {
    const s = new Set(["Morning", "Evening", "Night"])
    entries.forEach((e) => {
      if (e.shift && String(e.shift).trim()) s.add(String(e.shift).trim())
    })
    return Array.from(s)
  }, [entries])

  // Handlers for Add/Edit
  const openSingleAddModal = () => {
    setEditingEntry(null)
    setSingleForm(empty())
    setShowCustomProductInput(false)
    setCustomProductInput("")
    setShowChoiceModal(false)
    setShowSingleModal(true)
  }

  const openSingleEditModal = (entry) => {
    setEditingEntry(entry)
    setSingleForm({
      date: entry.date ? String(entry.date).slice(0, 10) : getToday(),
      product: entry.product || "HSD",
      volume: entry.volume ?? "",
      purchasePrice: entry.purchasePrice ?? "",
      salePrice: entry.salePrice ?? "",
      shift: entry.shift ?? "",
      remark: entry.remark ?? "",
    })
    setShowCustomProductInput(false)
    setCustomProductInput("")
    setShowSingleModal(true)
  }

  const openBulkAddModal = () => {
    setBulkCommon({
      date: getToday(),
      product: "HSD",
      shift: "Morning",
      salePrice: "",
    })
    setBulkRows([
      { id: 1, volume: "", purchasePrice: "", salePrice: "", shift: "Morning", remark: "" },
      { id: 2, volume: "", purchasePrice: "", salePrice: "", shift: "Morning", remark: "" },
    ])
    setShowChoiceModal(false)
    setShowBulkModal(true)
  }

  // Handle saving single entry
  const handleSaveSingle = async (e) => {
    e.preventDefault()
    if (!singleForm.date) return alert("Date is required")
    if (!singleForm.product) return alert("Product is required")
    if (!singleForm.volume || numberValue(singleForm.volume) <= 0) return alert("Valid volume is required")
    if (!singleForm.purchasePrice) return alert("Purchase price is required")
    if (!singleForm.salePrice) return alert("Sale price is required")

    setSaving(true)
    try {
      const vol = numberValue(singleForm.volume)
      const pur = numberValue(singleForm.purchasePrice)
      const sal = numberValue(singleForm.salePrice)
      const profit = (sal - pur) * vol

      const payload = {
        date: singleForm.date,
        product: singleForm.product,
        volume: vol,
        purchasePrice: pur,
        salePrice: sal,
        profit,
        shift: singleForm.shift || "",
        remark: singleForm.remark || "",
      }

      if (editingEntry) {
        await updateDcdEntry(editingEntry._id, payload)
      } else {
        await addDcdEntry(payload)
      }

      setShowSingleModal(false)
      setEditingEntry(null)
      await loadEntries()
    } catch (err) {
      console.error("Save error:", err)
      alert(err?.response?.data?.message || "Failed to save D.C.D entry")
    } finally {
      setSaving(false)
    }
  }

  // Handle saving bulk entries
  const handleSaveBulk = async () => {
    const validRows = bulkRows.filter(
      (r) => numberValue(r.volume) > 0 && (r.purchasePrice || r.purchasePrice === 0)
    )
    if (validRows.length === 0) {
      alert("Please fill at least one valid row with volume and purchase price.")
      return
    }

    setSaving(true)
    try {
      for (const row of validRows) {
        const vol = numberValue(row.volume)
        const pur = numberValue(row.purchasePrice)
        const sal = numberValue(row.salePrice || bulkCommon.salePrice)
        const profit = (sal - pur) * vol

        const payload = {
          date: bulkCommon.date,
          product: bulkCommon.product,
          volume: vol,
          purchasePrice: pur,
          salePrice: sal,
          profit,
          shift: row.shift || bulkCommon.shift || "",
          remark: row.remark || "",
        }
        await addDcdEntry(payload)
      }

      setShowBulkModal(false)
      await loadEntries()
    } catch (err) {
      console.error("Bulk save error:", err)
      alert(err?.response?.data?.message || "Failed to save bulk D.C.D entries")
    } finally {
      setSaving(false)
    }
  }

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteDcdEntry(deleteTarget._id)
      setDeleteTarget(null)
      await loadEntries()
    } catch (err) {
      console.error("Delete error:", err)
      alert(err?.response?.data?.message || "Failed to delete entry")
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredEntries.map((e) => ({
        Date: formatDate(e.date),
        Product: e.product || "-",
        "Volume (L)": numberValue(e.volume),
        "Purchase Price (Rs/L)": numberValue(e.purchasePrice),
        "Sale Price (Rs/L)": numberValue(e.salePrice),
        "Margin (Rs/L)": getMargin(e),
        "Net Profit (Rs)": getProfit(e),
        Shift: e.shift || "-",
        Remark: e.remark || "-",
      }))

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "DCD_Register")
      XLSX.writeFile(wb, `DCD_Register_${getToday()}.xlsx`)
    } catch (err) {
      console.error("Excel export error:", err)
      alert("Failed to export Excel.")
    }
  }

  // Export PDF Report
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text("D.C.D - Diesel Credit / Delivery Register", 14, 18)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 25)
      doc.text(
        `Total Entries: ${filteredEntries.length} | Total Volume: ${formatNumber(listStats.vol)} L | Total Profit: ${formatCurrency(listStats.profit)}`,
        14,
        32
      )

      const tableRows = filteredEntries.map((e) => [
        formatDate(e.date),
        e.product || "-",
        formatNumber(e.volume),
        formatNumber(e.purchasePrice),
        formatNumber(e.salePrice),
        formatNumber(getMargin(e)),
        formatNumber(getProfit(e)),
        e.shift || "-",
      ])

      autoTable(doc, {
        head: [["Date", "Product", "Volume (L)", "Pur. Price", "Sale Price", "Margin", "Profit (Rs)", "Shift"]],
        body: tableRows,
        startY: 38,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [234, 88, 12] },
      })

      doc.save(`DCD_Report_${getToday()}.pdf`)
    } catch (err) {
      console.error("PDF export error:", err)
      alert("Failed to export PDF.")
    }
  }

  // Clear all filters
  const handleResetFilters = () => {
    setSelectedProduct("all")
    setSelectedShift("all")
    setProfitFilter("all")
    setFromDate("")
    setToDate("")
    setSearch("")
    setShowFiltersModal(false)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[color:var(--text-strong)] pb-28">
      {/* =========================================================
          TOP MOBILE HEADER
          ========================================================= */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-panel)]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 shadow-sm">
            <Fuel className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-[color:var(--text-strong)]">D.C.D</h1>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                Diesel Register
              </span>
            </div>
            <p className="text-xs text-[color:var(--text-secondary)]">
              {entries.length} {entries.length === 1 ? "Record" : "Records"} recorded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadEntries(true)}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)] transition-transform active:scale-95 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-amber-500" : ""} />
          </button>
          <button
            type="button"
            onClick={() => setShowChoiceModal(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-600 px-3 text-xs font-semibold text-white shadow-sm shadow-amber-600/30 transition-transform active:scale-95 hover:bg-amber-500"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>
      </header>

      {/* MAIN MOBILE SCROLL CONTAINER */}
      <div className="px-3 pt-3 space-y-3">
        {/* =========================================================
            HERO CARD (AMBER / BRONZE GRADIENT WITH STATS & TIMEFRAME)
            ========================================================= */}
        <section className="relative overflow-visible rounded-3xl bg-gradient-to-br from-[#451a03] via-[#78350f] to-[#b45309] p-4 text-white shadow-xl shadow-amber-950/20">
          {/* Subtle Decorative Wave Background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl opacity-15">
            <svg viewBox="0 0 400 200" className="h-full w-full object-cover">
              <path
                d="M0 100 C 150 150, 250 50, 400 120 L 400 200 L 0 200 Z"
                fill="currentColor"
                className="text-white"
              />
            </svg>
          </div>

          <div className="relative z-10 space-y-3">
            {/* Top Bar inside Hero: Timeframe Selector + Dashboard Button */}
            <div className="flex items-center justify-between gap-2">
              {/* Timeframe Dropdown (Non-clipping, absolute popover) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                  className="flex items-center gap-1.5 rounded-xl bg-black/30 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-amber-100 ring-1 ring-white/20 transition-all hover:bg-black/40 active:scale-95"
                >
                  <Calendar size={13} className="text-amber-300" />
                  <span className="capitalize">
                    {timeframe === "today"
                      ? "Today"
                      : timeframe === "week"
                      ? "This Week"
                      : timeframe === "month"
                      ? "This Month"
                      : "All Time"}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${showTimeframeDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showTimeframeDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowTimeframeDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 z-50 w-36 rounded-2xl border border-white/20 bg-[#291104] p-1 shadow-2xl backdrop-blur-xl">
                      {[
                        { id: "today", label: "Today" },
                        { id: "week", label: "This Week" },
                        { id: "month", label: "This Month" },
                        { id: "all", label: "All Time" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTimeframe(t.id)
                            setShowTimeframeDropdown(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                            timeframe === t.id
                              ? "bg-amber-600 text-white font-semibold"
                              : "text-amber-100 hover:bg-white/10"
                          }`}
                        >
                          <span>{t.label}</span>
                          {timeframe === t.id && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* DCD Dashboard Shortcut Button */}
              <button
                type="button"
                onClick={() => navigate("/admin/dcd-dashboard")}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 backdrop-blur-md px-2.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25 hover:bg-white/25 active:scale-95 transition-all"
              >
                <ChartNoAxesCombined size={14} className="text-amber-200" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Main Profit Display */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/90">
                  Total Net Profit
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                    heroMetrics.totalProfit >= 0
                      ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40"
                      : "bg-rose-500/20 text-rose-200 ring-rose-400/40"
                  }`}
                >
                  {heroMetrics.totalProfit >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {heroMetrics.avgMargin >= 0 ? `+${formatNumber(heroMetrics.avgMargin)}/L` : `${formatNumber(heroMetrics.avgMargin)}/L`}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-white">
                  {formatCurrency(heroMetrics.totalProfit)}
                </span>
              </div>
            </div>

            {/* Bottom 2-stat row in Hero: Volume & Revenue */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/15">
              <div className="rounded-2xl bg-black/20 p-2.5 backdrop-blur-sm">
                <p className="text-[10px] font-medium text-amber-200/80">Total Volume</p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  {formatNumber(heroMetrics.totalVolume)} <span className="text-[11px] font-normal text-amber-200/80">L</span>
                </p>
                <p className="text-[10px] text-amber-200/70">
                  {heroMetrics.count} {heroMetrics.count === 1 ? "delivery" : "deliveries"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-2.5 backdrop-blur-sm">
                <p className="text-[10px] font-medium text-amber-200/80">Total Sale Value</p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  {formatCurrency(heroMetrics.totalSaleValue)}
                </p>
                <p className="text-[10px] text-amber-200/70 truncate">
                  Pur: {formatCurrency(heroMetrics.totalPurchaseCost)}
                </p>
              </div>
            </div>

            {/* Product breakdown pills */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-black/25 px-2.5 py-1 text-[11px] font-medium text-amber-100">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>HSD:</span>
                <span className="font-bold text-white">{formatNumber(heroMetrics.hsdVolume)} L</span>
              </div>
              {heroMetrics.hsdPcVolume > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-black/25 px-2.5 py-1 text-[11px] font-medium text-amber-100">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <span>HSD PC:</span>
                  <span className="font-bold text-white">{formatNumber(heroMetrics.hsdPcVolume)} L</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================
            3-METRIC SUMMARY BAR (FOR CURRENT FILTER SELECTION)
            ========================================================= */}
        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 shadow-sm">
            <span className="text-[10px] font-semibold text-[color:var(--text-secondary)]">Volume</span>
            <p className="mt-0.5 text-sm font-bold text-[color:var(--text-strong)]">
              {formatNumber(listStats.vol)} <span className="text-[10px] font-normal text-[color:var(--text-muted)]">L</span>
            </p>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Diesel Dispensed</span>
          </div>

          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 shadow-sm">
            <span className="text-[10px] font-semibold text-[color:var(--text-secondary)]">Avg Sale Rate</span>
            <p className="mt-0.5 text-sm font-bold text-[color:var(--text-strong)]">
              ₹{formatNumber(listStats.avgSale)}
            </p>
            <span className="text-[9px] text-[color:var(--text-secondary)] font-medium">Per Litre</span>
          </div>

          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 shadow-sm">
            <span className="text-[10px] font-semibold text-[color:var(--text-secondary)]">Avg Margin</span>
            <p
              className={`mt-0.5 text-sm font-bold ${
                listStats.avgMargin >= 0 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {listStats.avgMargin >= 0 ? `+₹${formatNumber(listStats.avgMargin)}` : `₹${formatNumber(listStats.avgMargin)}`}
            </p>
            <span className="text-[9px] text-[color:var(--text-secondary)] font-medium">Profit / L</span>
          </div>
        </section>

        {/* =========================================================
            PRODUCT FILTER TABS (SCROLLABLE PILLS)
            ========================================================= */}
        <section className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedProduct("all")}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedProduct === "all"
                ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                : "border border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
            }`}
          >
            <span>All Products</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                selectedProduct === "all" ? "bg-white/20 text-white" : "bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
              }`}
            >
              {entries.length}
            </span>
          </button>

          {productOptions.map((prod) => {
            const count = entries.filter(
              (e) => String(e.product || "").trim().toLowerCase() === prod.trim().toLowerCase()
            ).length
            return (
              <button
                key={prod}
                type="button"
                onClick={() => setSelectedProduct(prod)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedProduct === prod
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                    : "border border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
                }`}
              >
                <span>{prod}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    selectedProduct === prod
                      ? "bg-white/20 text-white"
                      : "bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </section>

        {/* =========================================================
            SEARCH & QUICK ACTION TOOLS
            ========================================================= */}
        <section className="flex items-center gap-2">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, shift, volume, remark..."
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] py-2 pl-9 pr-8 text-xs text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setShowFiltersModal(true)}
            className={`relative flex h-9 w-9 items-center justify-center rounded-2xl border transition-colors ${
              activeFiltersCount > 0
                ? "border-amber-500 bg-amber-500/10 text-amber-500"
                : "border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
            }`}
            title="Filters"
          >
            <Filter size={15} />
            {activeFiltersCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[9px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-secondary)] hover:text-emerald-500 transition-colors"
            title="Export to Excel"
          >
            <FileSpreadsheet size={16} />
          </button>
        </section>

        {/* Active Filter Tags Indicator */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[color:var(--text-muted)] font-medium">Filters:</span>
            {selectedProduct !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                Product: {selectedProduct}
                <X size={10} className="cursor-pointer" onClick={() => setSelectedProduct("all")} />
              </span>
            )}
            {selectedShift !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                Shift: {selectedShift}
                <X size={10} className="cursor-pointer" onClick={() => setSelectedShift("all")} />
              </span>
            )}
            {profitFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {profitFilter === "profit" ? "Profitable Only" : "Loss Only"}
                <X size={10} className="cursor-pointer" onClick={() => setProfitFilter("all")} />
              </span>
            )}
            {(fromDate || toDate) && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {fromDate || "Start"} to {toDate || "End"}
                <X
                  size={10}
                  className="cursor-pointer"
                  onClick={() => {
                    setFromDate("")
                    setToDate("")
                  }}
                />
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 underline ml-1"
            >
              Reset All
            </button>
          </div>
        )}

        {/* =========================================================
            DCD ENTRY FEED / CARDS
            ========================================================= */}
        <section className="space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
              <p className="mt-3 text-xs font-medium text-[color:var(--text-secondary)]">Loading D.C.D records...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border-color)] bg-[var(--bg-panel)] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Fuel size={24} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-[color:var(--text-strong)]">No D.C.D Records Found</h3>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                {search || activeFiltersCount > 0
                  ? "Try resetting your search or active filters."
                  : "Start recording diesel credit delivery entries."}
              </p>
              <button
                type="button"
                onClick={() => setShowChoiceModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 active:scale-95"
              >
                <Plus size={15} />
                <span>Add First Entry</span>
              </button>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isExpanded = expandedCardId === entry._id
              const profit = getProfit(entry)
              const margin = getMargin(entry)
              const vol = numberValue(entry.volume)
              const purchaseCost = vol * numberValue(entry.purchasePrice)
              const saleRevenue = vol * numberValue(entry.salePrice)
              const isProfitable = profit >= 0

              return (
                <article
                  key={entry._id}
                  className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-sm transition-all"
                >
                  {/* Card Main Clickable Row */}
                  <div
                    onClick={() => setExpandedCardId(isExpanded ? null : entry._id)}
                    className="cursor-pointer p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Product Pill Badge */}
                        <span
                          className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                            String(entry.product || "").toLowerCase().includes("pc")
                              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {entry.product || "HSD"}
                        </span>

                        {/* Shift Badge if present */}
                        {entry.shift && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--text-secondary)]">
                            <Clock size={10} />
                            <span>{entry.shift}</span>
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <span className="text-xs font-semibold text-[color:var(--text-secondary)]">
                        {formatMobileDate(entry.date)}
                      </span>
                    </div>

                    {/* Stats Highlights */}
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase font-semibold tracking-wider text-[color:var(--text-secondary)]">
                          Volume Dispensed
                        </p>
                        <p className="mt-0.5 text-xl font-black text-[color:var(--text-strong)]">
                          {formatNumber(entry.volume)} <span className="text-xs font-medium text-[color:var(--text-secondary)]">Litres</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase font-semibold tracking-wider text-[color:var(--text-secondary)]">
                          Net Profit
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold ring-1 ${
                            isProfitable
                              ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400"
                          }`}
                        >
                          {isProfitable ? "+" : ""}
                          {formatCurrency(profit)}
                        </span>
                      </div>
                    </div>

                    {/* Rates overview bar */}
                    <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[var(--bg-soft)] px-3 py-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-[color:var(--text-secondary)]">
                        <span>Sale:</span>
                        <span className="font-semibold text-[color:var(--text-strong)]">₹{formatNumber(entry.salePrice)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[color:var(--text-secondary)]">
                        <span>Margin:</span>
                        <span
                          className={`font-bold ${margin >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {margin >= 0 ? "+" : ""}₹{formatNumber(margin)}/L
                        </span>
                      </div>
                      <ChevronDown
                        size={15}
                        className={`text-[color:var(--text-secondary)] transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-amber-500" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Accordion Detailed Section */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-color)] bg-[var(--bg-soft)]/50 p-3.5 space-y-3">
                      {/* 4-Metric Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5">
                          <span className="text-[10px] font-medium text-[color:var(--text-secondary)]">Purchase Rate</span>
                          <p className="text-xs font-bold text-[color:var(--text-strong)]">
                            ₹{formatNumber(entry.purchasePrice)} / Litre
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5">
                          <span className="text-[10px] font-medium text-[color:var(--text-secondary)]">Sale Rate</span>
                          <p className="text-xs font-bold text-[color:var(--text-strong)]">
                            ₹{formatNumber(entry.salePrice)} / Litre
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5">
                          <span className="text-[10px] font-medium text-[color:var(--text-secondary)]">Total Cost</span>
                          <p className="text-xs font-bold text-[color:var(--text-strong)]">
                            {formatCurrency(purchaseCost)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5">
                          <span className="text-[10px] font-medium text-[color:var(--text-secondary)]">Total Sale Value</span>
                          <p className="text-xs font-bold text-[color:var(--text-strong)]">
                            {formatCurrency(saleRevenue)}
                          </p>
                        </div>
                      </div>

                      {/* Remark info if available */}
                      {entry.remark && (
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5">
                          <span className="text-[10px] font-medium text-[color:var(--text-secondary)]">Remark</span>
                          <p className="mt-0.5 text-xs text-[color:var(--text-strong)] leading-relaxed">
                            {entry.remark}
                          </p>
                        </div>
                      )}

                      {/* Audit stamp if available */}
                      {entry.lastEditedAt && (
                        <p className="text-[10px] text-[color:var(--text-secondary)]">
                          Last edited by {entry.lastEditedBy || "Admin"} on {formatDateTime(entry.lastEditedAt)}
                        </p>
                      )}

                      {/* Action Buttons: Edit & Delete */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openSingleEditModal(entry)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] py-2 text-xs font-semibold text-[color:var(--text-strong)] hover:bg-[var(--bg-soft)] transition-colors"
                        >
                          <Edit2 size={13} className="text-amber-500" />
                          <span>Edit Entry</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(entry)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </section>
      </div>

      {/* =========================================================
          CIRCULAR FLOATING ACTION BUTTON (+)
          Floats cleanly above the h-[68px] dock at bottom-[82px] right-4
          ========================================================= */}
      <button
        type="button"
        onClick={() => setShowChoiceModal(true)}
        className="fixed bottom-[82px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-white shadow-[0_8px_25px_rgba(217,119,6,0.45)] transition-transform active:scale-95 hover:bg-amber-500"
        title="Add DCD Entry"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* =========================================================
          FLOATING CAPSULE BOTTOM NAVIGATION BAR
          ========================================================= */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-2 pt-1 pointer-events-none">
        <div className="pointer-events-auto mx-auto flex h-[68px] max-w-md items-center justify-around rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-panel)]/95 px-2 shadow-[0_12px_36px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          {/* Register Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("register")
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors ${
              activeTab === "register"
                ? "text-amber-600 dark:text-amber-400 font-bold"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
            }`}
          >
            <Fuel size={20} strokeWidth={activeTab === "register" ? 2.5 : 2} />
            <span className="text-[11px] font-medium">Register</span>
          </button>

          {/* DCD Dashboard Tab */}
          <button
            type="button"
            onClick={() => navigate("/admin/dcd-dashboard")}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)] transition-colors"
          >
            <ChartNoAxesCombined size={20} />
            <span className="text-[11px] font-medium">Dashboard</span>
          </button>

          {/* Reports Tab */}
          <button
            type="button"
            onClick={() => setShowReportsModal(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)] transition-colors"
          >
            <FileText size={20} />
            <span className="text-[11px] font-medium">Reports</span>
          </button>

          {/* Filters Tab */}
          <button
            type="button"
            onClick={() => setShowFiltersModal(true)}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors ${
              activeFiltersCount > 0
                ? "text-amber-600 dark:text-amber-400 font-bold"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
            }`}
          >
            <Filter size={20} strokeWidth={activeFiltersCount > 0 ? 2.5 : 2} />
            <span className="text-[11px] font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute top-1 right-5 flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-[var(--bg-panel)]" />
            )}
          </button>
        </div>
      </nav>

      {/* =========================================================
          MODAL 1: ADD ENTRY CHOICE BOTTOM SHEET
          ========================================================= */}
      {showChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setShowChoiceModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-3xl border-t border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto h-1 w-12 rounded-full bg-[var(--border-strong)] mb-4" />
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 className="text-base font-bold text-[color:var(--text-strong)]">New D.C.D Entry</h3>
                <p className="text-xs text-[color:var(--text-secondary)]">Choose entry method to continue</p>
              </div>
              <button
                type="button"
                onClick={() => setShowChoiceModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={openSingleAddModal}
                className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 text-center hover:border-amber-500 hover:bg-amber-500/5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Fuel size={24} />
                </div>
                <span className="mt-3 text-sm font-bold text-[color:var(--text-strong)]">Single Delivery</span>
                <span className="mt-1 text-[11px] text-[color:var(--text-secondary)]">One delivery at a time</span>
              </button>

              <button
                type="button"
                onClick={openBulkAddModal}
                className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 text-center hover:border-amber-500 hover:bg-amber-500/5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Layers size={24} />
                </div>
                <span className="mt-3 text-sm font-bold text-[color:var(--text-strong)]">Multiple Deliveries</span>
                <span className="mt-1 text-[11px] text-[color:var(--text-secondary)]">Bulk add in one shift</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: SINGLE ENTRY MODAL (WITH LIVE CALCULATION)
          ========================================================= */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Fuel size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[color:var(--text-strong)]">
                    {editingEntry ? "Edit D.C.D Entry" : "New D.C.D Entry"}
                  </h3>
                  <p className="text-[11px] text-[color:var(--text-secondary)]">
                    {editingEntry ? "Update delivery details" : "Record diesel delivery"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSingleModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="mt-4 space-y-3.5">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">
                  Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={singleForm.date}
                  onChange={(e) => setSingleForm({ ...singleForm, date: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Product Select with Custom Option */}
              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">
                  Product *
                </label>
                {!showCustomProductInput ? (
                  <div className="flex gap-2">
                    <select
                      value={singleForm.product}
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          setShowCustomProductInput(true)
                        } else {
                          setSingleForm({ ...singleForm, product: e.target.value })
                        }
                      }}
                      className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                    >
                      {productOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add New Product...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customProductInput}
                      onChange={(e) => setCustomProductInput(e.target.value)}
                      placeholder="e.g. HSD Extra"
                      className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = customProductInput.trim()
                        if (trimmed) {
                          onAddProductOption(trimmed)
                          setSingleForm({ ...singleForm, product: trimmed })
                        }
                        setShowCustomProductInput(false)
                        setCustomProductInput("")
                      }}
                      className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomProductInput(false)
                        setCustomProductInput("")
                      }}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-2.5 py-2 text-xs text-[color:var(--text-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">
                  Shift
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Morning", "Evening", "Night"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSingleForm({ ...singleForm, shift: s })}
                      className={`rounded-xl border py-1.5 text-xs font-semibold transition-all ${
                        singleForm.shift === s
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">
                  Volume (Litres) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={singleForm.volume}
                  onChange={(e) => setSingleForm({ ...singleForm, volume: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Purchase Price & Sale Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">
                    Purchase Rate (₹/L) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={singleForm.purchasePrice}
                    onChange={(e) => setSingleForm({ ...singleForm, purchasePrice: e.target.value })}
                    placeholder="e.g. 87.50"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">
                    Sale Rate (₹/L) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={singleForm.salePrice}
                    onChange={(e) => setSingleForm({ ...singleForm, salePrice: e.target.value })}
                    placeholder="e.g. 90.20"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* LIVE CALCULATION PREVIEW BOX */}
              {singleForm.volume && singleForm.purchasePrice && singleForm.salePrice && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[color:var(--text-secondary)]">Calculated Margin:</span>
                    <span
                      className={`font-bold ${
                        numberValue(singleForm.salePrice) - numberValue(singleForm.purchasePrice) >= 0
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {numberValue(singleForm.salePrice) - numberValue(singleForm.purchasePrice) >= 0 ? "+" : ""}
                      ₹{formatNumber(numberValue(singleForm.salePrice) - numberValue(singleForm.purchasePrice))} / L
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[color:var(--text-secondary)]">Net Profit / Loss:</span>
                    <span
                      className={`font-bold ${
                        (numberValue(singleForm.salePrice) - numberValue(singleForm.purchasePrice)) *
                          numberValue(singleForm.volume) >=
                        0
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(
                        (numberValue(singleForm.salePrice) - numberValue(singleForm.purchasePrice)) *
                          numberValue(singleForm.volume)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-500/20">
                    <span className="text-[color:var(--text-secondary)]">Total Sale Value:</span>
                    <span className="font-semibold text-[color:var(--text-strong)]">
                      {formatCurrency(numberValue(singleForm.salePrice) * numberValue(singleForm.volume))}
                    </span>
                  </div>
                </div>
              )}

              {/* Remark */}
              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">
                  Remark (Optional)
                </label>
                <textarea
                  rows={2}
                  value={singleForm.remark}
                  onChange={(e) => setSingleForm({ ...singleForm, remark: e.target.value })}
                  placeholder="e.g. Tanker #4 delivery, driver notes..."
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] py-2.5 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[var(--bg-panel)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingEntry ? "Update Entry" : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: BULK / MULTIPLE ENTRIES MODAL
          ========================================================= */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[color:var(--text-strong)]">Bulk D.C.D Entries</h3>
                  <p className="text-[11px] text-[color:var(--text-secondary)]">Add multiple deliveries at once</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Common Fields Row */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Common Defaults
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[color:var(--text-secondary)] mb-1">Date</label>
                    <input
                      type="date"
                      value={bulkCommon.date}
                      onChange={(e) => setBulkCommon({ ...bulkCommon, date: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[color:var(--text-secondary)] mb-1">Product</label>
                    <select
                      value={bulkCommon.product}
                      onChange={(e) => setBulkCommon({ ...bulkCommon, product: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                    >
                      {productOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[color:var(--text-secondary)] mb-1">Shift</label>
                    <select
                      value={bulkCommon.shift}
                      onChange={(e) => setBulkCommon({ ...bulkCommon, shift: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[color:var(--text-secondary)] mb-1">Default Sale Rate (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 90.50"
                      value={bulkCommon.salePrice}
                      onChange={(e) => setBulkCommon({ ...bulkCommon, salePrice: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Rows List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[color:var(--text-strong)]">Deliveries ({bulkRows.length})</p>
                  <button
                    type="button"
                    onClick={() =>
                      setBulkRows([
                        ...bulkRows,
                        {
                          id: Date.now(),
                          volume: "",
                          purchasePrice: "",
                          salePrice: bulkCommon.salePrice,
                          shift: bulkCommon.shift,
                          remark: "",
                        },
                      ])
                    }
                    className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400"
                  >
                    <Plus size={14} />
                    <span>Add Row</span>
                  </button>
                </div>

                {bulkRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[color:var(--text-secondary)]">
                      <span>Row #{idx + 1}</span>
                      {bulkRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBulkRows(bulkRows.filter((r) => r.id !== row.id))}
                          className="text-rose-500 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] text-[color:var(--text-muted)]">Volume (L) *</label>
                        <input
                          type="number"
                          placeholder="Volume"
                          value={row.volume}
                          onChange={(e) =>
                            setBulkRows(
                              bulkRows.map((r) => (r.id === row.id ? { ...r, volume: e.target.value } : r))
                            )
                          }
                          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] px-2 py-1 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[color:var(--text-muted)]">Pur. Rate (₹) *</label>
                        <input
                          type="number"
                          placeholder="Cost"
                          value={row.purchasePrice}
                          onChange={(e) =>
                            setBulkRows(
                              bulkRows.map((r) => (r.id === row.id ? { ...r, purchasePrice: e.target.value } : r))
                            )
                          }
                          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] px-2 py-1 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[color:var(--text-muted)]">Sale Rate (₹)</label>
                        <input
                          type="number"
                          placeholder={bulkCommon.salePrice || "Sale"}
                          value={row.salePrice}
                          onChange={(e) =>
                            setBulkRows(
                              bulkRows.map((r) => (r.id === row.id ? { ...r, salePrice: e.target.value } : r))
                            )
                          }
                          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] px-2 py-1 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Remark (optional)"
                        value={row.remark}
                        onChange={(e) =>
                          setBulkRows(
                            bulkRows.map((r) => (r.id === row.id ? { ...r, remark: e.target.value } : r))
                          )
                        }
                        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] px-2 py-1 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] py-2.5 text-xs font-semibold text-[color:var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveBulk}
                  className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : `Save All (${bulkRows.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: ADVANCED FILTERS BOTTOM SHEET
          ========================================================= */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setShowFiltersModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-3xl border-t border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-4">
            <div className="mx-auto h-1 w-12 rounded-full bg-[var(--border-strong)] mb-2" />
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-base font-bold text-[color:var(--text-strong)]">Filter Records</h3>
                <p className="text-xs text-[color:var(--text-secondary)]">Narrow down D.C.D delivery feed</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[color:var(--text-muted)]">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-2.5 py-1.5 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[color:var(--text-muted)]">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-2.5 py-1.5 text-xs text-[color:var(--text-strong)] focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">
                Product
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedProduct("all")}
                  className={`rounded-xl px-3 py-1 text-xs font-semibold ${
                    selectedProduct === "all"
                      ? "bg-amber-600 text-white"
                      : "border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                  }`}
                >
                  All
                </button>
                {productOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedProduct(opt)}
                    className={`rounded-xl px-3 py-1 text-xs font-semibold ${
                      selectedProduct === opt
                        ? "bg-amber-600 text-white"
                        : "border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Shift Filter */}
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">
                Shift
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedShift("all")}
                  className={`rounded-xl px-3 py-1 text-xs font-semibold ${
                    selectedShift === "all"
                      ? "bg-amber-600 text-white"
                      : "border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                  }`}
                >
                  All Shifts
                </button>
                {availableShifts.map((sh) => (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => setSelectedShift(sh)}
                    className={`rounded-xl px-3 py-1 text-xs font-semibold ${
                      selectedShift === sh
                        ? "bg-amber-600 text-white"
                        : "border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                    }`}
                  >
                    {sh}
                  </button>
                ))}
              </div>
            </div>

            {/* Profitability Filter */}
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">
                Margin Outcome
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "all", label: "All Records" },
                  { id: "profit", label: "Profit Only" },
                  { id: "loss", label: "Loss Only" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProfitFilter(item.id)}
                    className={`rounded-xl border py-1.5 text-xs font-semibold ${
                      profitFilter === item.id
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] py-2.5 text-xs font-semibold text-[color:var(--text-primary)]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white hover:bg-amber-500 shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 5: REPORTS & SUMMARY MODAL
          ========================================================= */}
      {showReportsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[color:var(--text-strong)]">D.C.D Summary Report</h3>
                  <p className="text-[11px] text-[color:var(--text-secondary)]">Diesel Credit analytics overview</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportsModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                <span className="text-[10px] font-semibold text-[color:var(--text-secondary)]">Total Volume</span>
                <p className="mt-1 text-lg font-black text-[color:var(--text-strong)]">
                  {formatNumber(listStats.vol)} L
                </p>
                <span className="text-[10px] text-[color:var(--text-muted)]">Across {listStats.count} entries</span>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                <span className="text-[10px] font-semibold text-[color:var(--text-secondary)]">Total Net Profit</span>
                <p
                  className={`mt-1 text-lg font-black ${
                    listStats.profit >= 0 ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {formatCurrency(listStats.profit)}
                </p>
                <span className="text-[10px] text-[color:var(--text-muted)]">Net earnings</span>
              </div>
            </div>

            {/* Product breakdown table */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3 space-y-2">
              <p className="text-xs font-bold text-[color:var(--text-strong)]">Volume by Product</p>
              {productOptions.map((prod) => {
                const rows = filteredEntries.filter(
                  (e) => String(e.product || "").trim().toLowerCase() === prod.trim().toLowerCase()
                )
                const v = rows.reduce((s, r) => s + numberValue(r.volume), 0)
                const p = rows.reduce((s, r) => s + getProfit(r), 0)
                if (v === 0 && rows.length === 0) return null
                return (
                  <div key={prod} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border-color)]/50 last:border-0">
                    <span className="font-semibold text-[color:var(--text-strong)]">{prod}</span>
                    <div className="text-right">
                      <span className="font-bold text-[color:var(--text-strong)]">{formatNumber(v)} L</span>
                      <span className={`ml-2 text-[10px] font-semibold ${p >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {formatCurrency(p)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Export Buttons */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-500 active:scale-95"
              >
                <FileText size={15} />
                <span>Download PDF Summary</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] py-2.5 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[var(--bg-panel)]"
              >
                <FileSpreadsheet size={15} className="text-emerald-500" />
                <span>Export Detailed Excel (XLSX)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 6: CONFIRM DELETE DIALOG (NO BROWSER ALERT)
          ========================================================= */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete D.C.D Record?"
          description={`Are you sure you want to delete delivery on ${formatMobileDate(
            deleteTarget.date
          )} of ${formatNumber(deleteTarget.volume)} L (${deleteTarget.product || "HSD"})? This action cannot be undone.`}
          actionLabel="Delete"
          variant="danger"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}

// ==========================================
// REUSABLE CONFIRM DIALOG COMPONENT
// ==========================================
function ConfirmDialog({
  title,
  description,
  actionLabel,
  variant,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-xs font-semibold text-[color:var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${
              variant === "danger" ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
