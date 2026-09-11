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
  Flame,
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
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import { useAuth } from "../../contexts/AuthContext"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"
import SimpleAuditRegisterPage, { helpers } from "./SimpleAuditRegisterPage"
import {
  addDailySale,
  deleteDailySale,
  getDailySales,
  updateDailySale,
} from "../../services/dailySaleApi"

const { formatDate, formatNumber, numberValue, today } = helpers

const getToday = () => new Date().toISOString().slice(0, 10)
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

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
  sale: "",
  rate: "",
  lossGain: "",
  remark: "",
})

const getProfit = (entry) =>
  Number(entry.profit ?? numberValue(entry.sale) * numberValue(entry.rate))

export default function DailySalesPage() {
  const navigate = useNavigate()

  return (
    <>
      {/* =========================================================================
          DESKTOP VIEW - 100% UNTOUCHED ORIGINAL SIMPLEAUDITREGISTERPAGE
      ========================================================================= */}
      <div className="hidden lg:block">
        <SimpleAuditRegisterPage
          config={{
            title: "Daily Sales",
            kicker: "Daily Sales Register",
            description: "Track product sales, rate, loss/gain, profit, remarks, and audit history.",
            pageKey: "dailySales",
            aiSummary: { valueKey: "profit", categoryKey: "product" },
            dashboardAction: {
              label: "Daily Sales Dashboard",
              icon: <ChartNoAxesCombined size={18} />,
              onClick: () => navigate("/admin/daily-sales-dashboard"),
            },
            iconBg: "bg-blue-50",
            badgeStyle: "bg-blue-100 text-blue-700",
            lineStyle: "bg-blue-200",
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6 text-blue-600"
              >
                <path d="M4 20h16" />
                <rect x="5" y="11" width="3" height="7" rx="1" />
                <rect x="10.5" y="8" width="3" height="10" rx="1" />
                <rect x="16" y="5" width="3" height="13" rx="1" />
              </svg>
            ),
            empty,
            api: {
              list: getDailySales,
              add: addDailySale,
              update: updateDailySale,
              remove: deleteDailySale,
            },
            requiredFields: ["date", "product", "sale", "rate"],
            bulkDefaults: [
              { key: "date" },
              { key: "product" },
              { key: "rate" },
            ],
            searchFields: ["date", "product", "sale", "rate", "lossGain", "profit", "remark"],
            searchPlaceholder: "Search date, product, sale, remark",
            categoryFilter: {
              key: "product",
              allLabel: "All Categories",
              options: ["MS", "HSD"],
            },
            fields: [
              { key: "date", label: "Date", type: "date" },
              { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
              { key: "sale", label: "Sale", type: "number" },
              { key: "rate", label: "Rate", type: "number" },
              { key: "lossGain", label: "Loss / Gain (LTR)", type: "number" },
              { key: "remark", label: "Remark", full: true },
            ],
            columns: [
              { key: "date", label: "Date", render: (entry) => formatDate(entry.date) },
              { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
              { key: "sale", label: "Sale", render: (entry) => formatNumber(entry.sale) },
              { key: "rate", label: "Rate", render: (entry) => formatNumber(entry.rate) },
              {
                key: "lossGain",
                label: "Loss/Gain (LTR)",
                render: (entry) => formatNumber(entry.lossGain),
                className: (entry) =>
                  numberValue(entry.lossGain) >= 0
                    ? "font-semibold text-emerald-500"
                    : "font-semibold text-red-500",
              },
              {
                key: "profit",
                label: "Profit",
                render: (entry) => formatNumber(getProfit(entry)),
                className: () => "font-semibold text-emerald-500",
              },
              { key: "remark", label: "Remark" },
            ],
            buildPayload: (form) => {
              const sale = numberValue(form.sale)
              const rate = numberValue(form.rate)

              return {
                ...form,
                sale,
                rate,
                lossGain: numberValue(form.lossGain),
                profit: sale * rate,
              }
            },
            summary: (entries) => {
              const hsdEntries = entries.filter(
                (entry) => String(entry.product || "").toLowerCase() === "hsd"
              )
              const msEntries = entries.filter(
                (entry) => String(entry.product || "").toLowerCase() === "ms"
              )
              const hsdSale = hsdEntries.reduce((sum, entry) => sum + numberValue(entry.sale), 0)
              const msSale = msEntries.reduce((sum, entry) => sum + numberValue(entry.sale), 0)
              const hsdProfit = hsdEntries.reduce((sum, entry) => sum + getProfit(entry), 0)
              const msProfit = msEntries.reduce((sum, entry) => sum + getProfit(entry), 0)
              const hsdLossGain = hsdEntries.reduce((sum, entry) => sum + numberValue(entry.lossGain), 0)
              const msLossGain = msEntries.reduce((sum, entry) => sum + numberValue(entry.lossGain), 0)
              const avgHsdPrice = hsdSale ? hsdProfit / hsdSale : 0
              const avgMsPrice = msSale ? msProfit / msSale : 0

              return [
                { key: "hsdSale", label: "HSD Sale", value: formatNumber(hsdSale), tone: "green" },
                { key: "msSale", label: "MS Sale", value: formatNumber(msSale), tone: "amber" },
                { key: "hsdProfit", label: "HSD Profit", value: formatNumber(hsdProfit), tone: "green" },
                { key: "msProfit", label: "MS Profit", value: formatNumber(msProfit), tone: "amber" },
                {
                  key: "avgHsdPrice",
                  label: "Avg HSD Price",
                  value: formatNumber(avgHsdPrice.toFixed(2)),
                  tone: "violet",
                },
                {
                  key: "avgMsPrice",
                  label: "Avg MS Price",
                  value: formatNumber(avgMsPrice.toFixed(2)),
                  tone: "blue",
                },
                {
                  key: "hsdLossGain",
                  label: "HSD Loss / Gain",
                  value: formatNumber(hsdLossGain.toFixed(2)),
                  tone: hsdLossGain >= 0 ? "green" : "rose",
                },
                {
                  key: "msLossGain",
                  label: "MS Loss / Gain",
                  value: formatNumber(msLossGain.toFixed(2)),
                  tone: msLossGain >= 0 ? "green" : "rose",
                },
              ]
            },
            preview: (form) => {
              const profit = numberValue(form.sale) * numberValue(form.rate)

              return {
                label: "Calculated Profit",
                value: formatNumber(profit),
                className: "text-emerald-500",
              }
            },
            mobileTitle: (entry) => entry.product || "Product",
            mobileBadge: (entry) => formatNumber(getProfit(entry)),
            mobileFields: [
              { key: "sale", label: "Sale", render: (entry) => formatNumber(entry.sale) },
              { key: "rate", label: "Rate", render: (entry) => formatNumber(entry.rate) },
              { key: "lossGain", label: "Loss/Gain", render: (entry) => formatNumber(entry.lossGain) },
              { key: "remark", label: "Remark" },
            ],
          }}
        />
      </div>

      {/* =========================================================================
          MOBILE VIEW (ONLY ON MOBILE: lg:hidden) - CONSISTENT THEME WITH REST OF APP
      ========================================================================= */}
      <div className="block lg:hidden">
        <DailySalesMobileView />
      </div>
    </>
  )
}

function DailySalesMobileView() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isManager = user?.role === "Manager"
  const { canUse } = useManagerDashboardSettings("dailySales", isManager)

  const canManagerUse = (buttonKey) => !isManager || canUse(buttonKey)
  const showNoAccess = (message) => setNotice({ type: "error", text: message })

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [productCategory, setProductCategory] = useState("all") // "all" | "HSD" | "MS"

  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmState, setConfirmState] = useState(null)
  const [entryModePrompt, setEntryModePrompt] = useState(false)

  // Single Entry modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [savingSale, setSavingSale] = useState(false)
  const [form, setForm] = useState(empty())

  // Bulk Entry modal
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkDefaultDate, setBulkDefaultDate] = useState(getToday())
  const [bulkDefaultProduct, setBulkDefaultProduct] = useState("HSD")
  const [bulkDefaultRate, setBulkDefaultRate] = useState("")
  const [bulkRows, setBulkRows] = useState([empty(), empty()])

  // Reports modal
  const [reportOpen, setReportOpen] = useState(false)
  const [reportFormat, setReportFormat] = useState("pdf")

  // Mobile layout state
  const [mobileTimeframe, setMobileTimeframe] = useState("month") // "today" | "week" | "month" | "all"
  const [showMobileTimeDropdown, setShowMobileTimeDropdown] = useState(false)
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false)
  const [expandedCardId, setExpandedCardId] = useState(null)

  useEffect(() => {
    loadSales()
  }, [])

  useEffect(() => {
    if (!notice.text) return undefined
    const timeout = window.setTimeout(() => setNotice({ type: "", text: "" }), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const loadSales = async () => {
    setLoading(true)
    try {
      const res = await getDailySales()
      setData(Array.isArray(res) ? res : [])
    } catch (_error) {
      setNotice({ type: "error", text: "Unable to load Daily Sales entries." })
    } finally {
      setLoading(false)
    }
  }

  const hasDateRange = Boolean(fromDate || toDate)

  // Filtered entries according to search, month, custom dates, and product tab
  const filteredEntries = useMemo(() => {
    return data.filter((entry) => {
      const dateStr = entry.date ? String(entry.date).slice(0, 10) : ""
      const entryMonth = dateStr.slice(0, 7)
      const prodUpper = String(entry.product || "").toUpperCase()

      const target = [
        dateStr,
        entry.product,
        entry.sale,
        entry.rate,
        entry.lossGain,
        entry.profit,
        entry.remark,
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch = !search || target.includes(search.toLowerCase())
      const matchesFrom = !fromDate || (dateStr && dateStr >= fromDate)
      const matchesTo = !toDate || (dateStr && dateStr <= toDate)
      const matchesMonth = hasDateRange || !monthFilter || entryMonth === monthFilter
      const matchesProduct =
        productCategory === "all" || prodUpper === productCategory.toUpperCase()

      return matchesSearch && matchesFrom && matchesTo && matchesMonth && matchesProduct
    })
  }, [data, fromDate, hasDateRange, monthFilter, productCategory, search, toDate])

  // Summary statistics for filtered records
  const summary = useMemo(() => {
    const hsdEntries = filteredEntries.filter(
      (e) => String(e.product || "").toUpperCase() === "HSD"
    )
    const msEntries = filteredEntries.filter(
      (e) => String(e.product || "").toUpperCase() === "MS"
    )

    const hsdSale = hsdEntries.reduce((s, e) => s + numberValue(e.sale), 0)
    const msSale = msEntries.reduce((s, e) => s + numberValue(e.sale), 0)
    const hsdProfit = hsdEntries.reduce((s, e) => s + getProfit(e), 0)
    const msProfit = msEntries.reduce((s, e) => s + getProfit(e), 0)
    const hsdLossGain = hsdEntries.reduce((s, e) => s + numberValue(e.lossGain), 0)
    const msLossGain = msEntries.reduce((s, e) => s + numberValue(e.lossGain), 0)

    const avgHsdRate = hsdSale ? hsdProfit / hsdSale : 0
    const avgMsRate = msSale ? msProfit / msSale : 0

    return {
      hsdSale,
      msSale,
      hsdProfit,
      msProfit,
      avgHsdRate,
      avgMsRate,
      totalSale: hsdSale + msSale,
      totalProfit: hsdProfit + msProfit,
      totalLossGain: hsdLossGain + msLossGain,
      records: filteredEntries.length,
    }
  }, [filteredEntries])

  // Hero Card timeframe calculation
  const mobileHeroStats = useMemo(() => {
    const todayStr = getToday()
    let filteredSales = 0
    let filteredProfit = 0
    let hsdVol = 0
    let msVol = 0
    let totalLossGain = 0
    let count = 0

    data.forEach((entry) => {
      const entryDate = String(entry.date || "").slice(0, 10)
      const saleVal = Number(entry.sale || 0)
      const profitVal = getProfit(entry)
      const lgVal = Number(entry.lossGain || 0)
      const prodUpper = String(entry.product || "").toUpperCase()

      let match = false
      if (mobileTimeframe === "today") {
        match = entryDate === todayStr
      } else if (mobileTimeframe === "week") {
        const diffDays = (new Date() - new Date(entry.date)) / (1000 * 60 * 60 * 24)
        match = diffDays >= 0 && diffDays <= 7
      } else if (mobileTimeframe === "all") {
        match = true
      } else {
        match = entryDate.slice(0, 7) === (monthFilter || getCurrentMonth())
      }

      if (match) {
        filteredSales += saleVal
        filteredProfit += profitVal
        totalLossGain += lgVal
        if (prodUpper === "HSD") hsdVol += saleVal
        if (prodUpper === "MS") msVol += saleVal
        count++
      }
    })

    const label =
      mobileTimeframe === "today"
        ? "Today"
        : mobileTimeframe === "week"
          ? "This Week"
          : mobileTimeframe === "all"
            ? "All Time"
            : "This Month"

    return {
      label,
      totalSale: filteredSales,
      totalProfit: filteredProfit,
      hsdVol,
      msVol,
      totalLossGain,
      count,
    }
  }, [data, mobileTimeframe, monthFilter])

  // Entry Actions
  const openEntryMode = () => {
    setEntryModePrompt(true)
  }

  const chooseSingleEntry = () => {
    setEntryModePrompt(false)
    setEditData(null)
    setForm(empty())
    setModalOpen(true)
  }

  const chooseMultipleEntry = () => {
    setEntryModePrompt(false)
    setBulkDefaultDate(getToday())
    setBulkDefaultProduct("HSD")
    setBulkDefaultRate("")
    setBulkRows([empty(), empty()])
    setBulkOpen(true)
  }

  const openEdit = (item) => {
    setEditData(item)
    setForm({
      date: item.date ? String(item.date).slice(0, 10) : getToday(),
      product: item.product || "HSD",
      sale: item.sale ?? "",
      rate: item.rate ?? "",
      lossGain: item.lossGain ?? "",
      remark: item.remark || "",
    })
    setModalOpen(true)
  }

  const closeFormModal = () => {
    setModalOpen(false)
    setEditData(null)
    setForm(empty())
  }

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (editData && !canManagerUse("editSale")) {
      showNoAccess("You do not have access to edit daily sales.")
      return
    }
    if (!editData && !canManagerUse("addSale")) {
      showNoAccess("You do not have access to add daily sales.")
      return
    }

    if (!form.date || !form.product || form.sale === "" || form.rate === "") {
      setNotice({ type: "error", text: "Please enter date, product, sale volume and rate." })
      return
    }

    setSavingSale(true)
    try {
      const sale = Number(form.sale || 0)
      const rate = Number(form.rate || 0)
      const payload = {
        ...form,
        sale,
        rate,
        lossGain: Number(form.lossGain || 0),
        profit: sale * rate,
        createdByName: user?.name || "Admin",
        createdByRole: user?.role || "Admin",
      }

      if (editData) {
        await updateDailySale(editData._id, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
        })
        setNotice({ type: "success", text: "Daily sale updated successfully." })
      } else {
        await addDailySale(payload)
        setNotice({ type: "success", text: "Daily sale saved successfully." })
      }

      closeFormModal()
      await loadSales()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save daily sale.",
      })
    } finally {
      setSavingSale(false)
    }
  }

  const handleDelete = (entry) => {
    if (!canManagerUse("deleteSale")) {
      showNoAccess("You do not have access to delete daily sales.")
      return
    }

    setConfirmState({
      title: "Delete Sale Entry",
      description: `Delete the ${entry.product} entry for ${formatDate(entry.date)} (${formatNumber(entry.sale)} Ltr)? This action cannot be undone.`,
      actionLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteDailySale(entry._id)
          await loadSales()
          setNotice({ type: "success", text: "Sale entry deleted successfully." })
        } catch (_err) {
          setNotice({ type: "error", text: "Failed to delete entry." })
        } finally {
          setConfirmState(null)
        }
      },
    })
  }

  // Bulk Row Handlers
  const updateBulkRow = (index, field, value) => {
    setBulkRows((current) => {
      const updated = [...current]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addBulkRow = () => {
    setBulkRows((current) => [
      ...current,
      {
        date: bulkDefaultDate || getToday(),
        product: bulkDefaultProduct || "HSD",
        sale: "",
        rate: bulkDefaultRate || "",
        lossGain: "",
        remark: "",
      },
    ])
  }

  const removeBulkRow = (index) => {
    setBulkRows((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)))
  }

  const applyBulkDefaults = () => {
    setBulkRows((current) =>
      current.map((row) => ({
        ...row,
        date: bulkDefaultDate || row.date,
        product: bulkDefaultProduct || row.product,
        rate: bulkDefaultRate || row.rate,
      }))
    )
  }

  const saveBulkRows = async () => {
    if (!canManagerUse("addSale")) {
      showNoAccess("You do not have access to add daily sales.")
      return
    }

    const validRows = bulkRows.filter(
      (r) => r.date && r.product && r.sale !== "" && r.rate !== ""
    )

    if (!validRows.length) {
      setNotice({
        type: "error",
        text: "Please complete at least one row with Date, Product, Sale, and Rate.",
      })
      return
    }

    setBulkSaving(true)
    try {
      await Promise.all(
        validRows.map((row) => {
          const sale = Number(row.sale || 0)
          const rate = Number(row.rate || 0)
          return addDailySale({
            ...row,
            sale,
            rate,
            lossGain: Number(row.lossGain || 0),
            profit: sale * rate,
            createdByName: user?.name || "Admin",
            createdByRole: user?.role || "Admin",
          })
        })
      )

      setNotice({ type: "success", text: `${validRows.length} daily sales saved successfully.` })
      setBulkOpen(false)
      await loadSales()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Failed to save multiple entries.",
      })
    } finally {
      setBulkSaving(false)
    }
  }

  // Export handlers
  const handleExportExcel = () => {
    if (!filteredEntries.length) {
      setNotice({ type: "error", text: "No entries available to export." })
      return
    }

    const rows = filteredEntries.map((e, idx) => ({
      "S.No": idx + 1,
      Date: formatDate(e.date),
      Product: e.product,
      "Sale (LTR)": Number(e.sale || 0),
      "Rate (Rs/LTR)": Number(e.rate || 0),
      "Loss/Gain (LTR)": Number(e.lossGain || 0),
      "Turnover (Rs)": getProfit(e),
      Remark: e.remark || "",
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Daily Sales")
    XLSX.writeFile(wb, `Daily_Sales_${monthFilter || "export"}.xlsx`)
    setNotice({ type: "success", text: "Excel file exported successfully." })
  }

  const handleExportReport = () => {
    if (!filteredEntries.length) {
      setNotice({ type: "error", text: "No entries available to download." })
      return
    }

    if (reportFormat === "excel") {
      handleExportExcel()
      setReportOpen(false)
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text("Daily Sales Register Report", 14, 15)
    doc.setFontSize(9)
    doc.text(`Period: ${monthFilter || "All Time"} | Generated: ${new Date().toLocaleDateString()}`, 14, 22)

    autoTable(doc, {
      startY: 28,
      head: [["#", "Date", "Product", "Sale (L)", "Rate", "Loss/Gain", "Turnover", "Remark"]],
      body: filteredEntries.map((e, idx) => [
        idx + 1,
        formatDate(e.date),
        e.product,
        formatNumber(e.sale),
        formatNumber(e.rate),
        formatNumber(e.lossGain),
        formatCurrency(getProfit(e)),
        e.remark || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [2, 132, 199] },
      styles: { fontSize: 8 },
    })

    doc.save(`Daily_Sales_Report_${monthFilter || "all"}.pdf`)
    setReportOpen(false)
    setNotice({ type: "success", text: "Report downloaded successfully." })
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-3 text-[color:var(--text-primary)] sm:p-6 pb-32 lg:pb-6">
      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="space-y-3">
        {/* 1. MOBILE HEADER CARD (Consistent with Lubricants & Expenses) */}
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-[color:var(--text-strong)] leading-tight">
                  Daily Sales
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 dark:bg-blue-950/80 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Live Fuel
                </span>
              </div>
              <p className="text-[11px] font-medium text-[color:var(--text-secondary)]">
                HSD & MS Dispensing Register
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManagerUse("addSale") ? (
              <button
                type="button"
                onClick={openEntryMode}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                title="Add Sale Entry"
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
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[var(--bg-panel)]" />
            </button>
          </div>
        </div>

        {/* 2. PREMIUM OCEAN BLUE HERO GRADIENT CARD WITH LIQUID WAVE */}
        <div className="relative z-30 overflow-visible rounded-[26px] bg-gradient-to-br from-[#0c4a6e] via-[#0284c7] to-[#0369a1] p-5 text-white shadow-xl shadow-sky-950/20">
          {/* Clipped background wave vector */}
          <div className="absolute inset-0 overflow-hidden rounded-[26px] pointer-events-none">
            <svg
              viewBox="0 0 280 80"
              className="absolute bottom-0 right-0 w-3/5 h-20 text-sky-300 opacity-80"
            >
              <defs>
                <linearGradient id="mobileDailySalesHeroGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,60 Q70,75 140,38 T280,28"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="190" cy="32" r="4" fill="#ffffff" />
              <path
                d="M0,60 Q70,75 140,38 T280,28 L280,80 L0,80 Z"
                fill="url(#mobileDailySalesHeroGrad)"
              />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Top row: Title and Timeframe Dropdown */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md">
                  <Fuel size={14} className="text-white" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-100">
                  Total Dispensed Sales
                </span>
              </div>

              {/* Timeframe Dropdown Pill */}
              <div className="relative z-40">
                <button
                  type="button"
                  onClick={() => setShowMobileTimeDropdown((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/30 bg-black/25 px-3 py-1.5 text-xs font-bold text-sky-100 backdrop-blur-md active:scale-95 transition-all"
                >
                  <Calendar size={12} />
                  <span>{mobileHeroStats.label}</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${
                      showMobileTimeDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Options Menu with Backdrop */}
                {showMobileTimeDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[1px]"
                      onClick={() => setShowMobileTimeDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-sky-500/40 bg-[#082f49] p-1.5 shadow-2xl backdrop-blur-xl z-[80] text-xs font-bold text-white animate-in fade-in zoom-in-95 duration-150">
                      {[
                        { key: "today", label: "Today" },
                        { key: "week", label: "This Week" },
                        { key: "month", label: "This Month" },
                        { key: "all", label: "All Time" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setMobileTimeframe(opt.key)
                            setShowMobileTimeDropdown(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors ${
                            mobileTimeframe === opt.key
                              ? "bg-sky-500 text-white"
                              : "hover:bg-white/10"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {mobileTimeframe === opt.key && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Main Stats: Litres & Revenue */}
            <div className="mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                  {formatNumber(mobileHeroStats.totalSale)}
                </span>
                <span className="text-sm font-bold text-sky-200">LTR</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base font-bold text-sky-100">
                  {formatCurrency(mobileHeroStats.totalProfit)}
                </span>
                <span className="text-[11px] text-sky-200 font-medium">
                  • {mobileHeroStats.count} {mobileHeroStats.count === 1 ? "entry" : "entries"}
                </span>
              </div>
            </div>

            {/* Bottom Row inside Hero: HSD vs MS breakdown & Net Loss/Gain */}
            <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  <span className="text-[11px] text-sky-100 font-medium">HSD:</span>
                  <span className="text-[11px] text-white font-bold">
                    {formatNumber(mobileHeroStats.hsdVol)} L
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  <span className="text-[11px] text-sky-100 font-medium">MS:</span>
                  <span className="text-[11px] text-white font-bold">
                    {formatNumber(mobileHeroStats.msVol)} L
                  </span>
                </div>
              </div>

              {/* Loss / Gain indicator pill */}
              <div
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-extrabold backdrop-blur-md ${
                  mobileHeroStats.totalLossGain >= 0
                    ? "bg-emerald-950/60 border-emerald-400/40 text-emerald-300"
                    : "bg-rose-950/60 border-rose-400/40 text-rose-300"
                }`}
              >
                {mobileHeroStats.totalLossGain >= 0 ? (
                  <TrendingUp size={13} />
                ) : (
                  <TrendingDown size={13} />
                )}
                <span>
                  {mobileHeroStats.totalLossGain >= 0 ? "+" : ""}
                  {formatNumber(mobileHeroStats.totalLossGain)} L
                </span>
              </div>
            </div>

            {/* Quick Link to Daily Sales Dashboard */}
            <div className="mt-3.5">
              <button
                type="button"
                onClick={() =>
                  navigate(isManager ? "/manager/daily-sales-dashboard" : "/admin/daily-sales-dashboard")
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/20 active:scale-[0.98] border border-white/25 py-2 px-3 text-xs font-bold text-white transition-all shadow-sm backdrop-blur-sm"
              >
                <ChartNoAxesCombined size={14} />
                <span>Open Sales Analytics & Trends</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. COMPACT 3-METRICS BAR (Matching M.D.U & Lubricants style) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-secondary)]">
              HSD Sales
            </p>
            <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-cyan-600 dark:text-cyan-400 truncate">
              {formatNumber(summary.hsdSale)} L
            </p>
            <p className="text-[10px] font-medium text-[color:var(--text-secondary)] truncate mt-0.5">
              Avg: ₹{summary.avgHsdRate ? summary.avgHsdRate.toFixed(2) : "0"}
            </p>
          </div>

          <div className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-secondary)]">
              MS Sales
            </p>
            <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 truncate">
              {formatNumber(summary.msSale)} L
            </p>
            <p className="text-[10px] font-medium text-[color:var(--text-secondary)] truncate mt-0.5">
              Avg: ₹{summary.avgMsRate ? summary.avgMsRate.toFixed(2) : "0"}
            </p>
          </div>

          <div className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-secondary)]">
              Net Loss/Gain
            </p>
            <p
              className={`mt-0.5 text-xs sm:text-sm font-extrabold truncate ${
                summary.totalLossGain >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {summary.totalLossGain >= 0 ? "+" : ""}
              {formatNumber(summary.totalLossGain)} L
            </p>
            <p className="text-[10px] font-medium text-[color:var(--text-secondary)] truncate mt-0.5">
              {summary.records} entries
            </p>
          </div>
        </div>

        {/* 4. PRODUCT SEGMENT FILTER TABS */}
        <div className="flex items-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-1 shadow-sm">
          {[
            { key: "all", label: "All Fuel" },
            { key: "HSD", label: "HSD (Diesel)" },
            { key: "MS", label: "MS (Petrol)" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setProductCategory(tab.key)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                productCategory === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 5. SEARCH & FILTER BAR */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)] pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search date, product, remark..."
              className="h-11 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] py-2 pl-10 pr-9 text-xs font-medium text-[color:var(--text-primary)] shadow-sm outline-none placeholder:text-[color:var(--text-secondary)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowMobileFilterModal(true)}
            className={`inline-flex h-11 items-center gap-1.5 rounded-2xl border px-3.5 text-xs font-bold shadow-sm active:scale-95 transition-all ${
              hasDateRange || monthFilter !== getCurrentMonth()
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-blue-200 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
            }`}
          >
            <Filter size={15} />
            <span>Filter</span>
            {(hasDateRange || monthFilter !== getCurrentMonth()) && (
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] text-emerald-600 dark:text-emerald-400 shadow-sm active:scale-95 transition-all"
            title="Export Excel"
          >
            <FileSpreadsheet size={18} />
          </button>
        </div>

        {/* 6. DAILY SALES ENTRY CARDS LIST */}
        <div className="space-y-2.5 mb-28">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[color:var(--text-secondary)]">
              <RefreshCw size={26} className="animate-spin text-blue-500 mb-2" />
              <p className="text-xs font-medium">Loading sales records...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-8 text-center shadow-sm">
              <Fuel size={32} className="mx-auto text-blue-400/60 mb-2" />
              <p className="text-sm font-bold text-[color:var(--text-strong)]">
                No daily sales entries found
              </p>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)] max-w-xs mx-auto">
                No records match your selected month or filter. Add a new sales entry to get started.
              </p>
              {canManagerUse("addSale") && (
                <button
                  type="button"
                  onClick={openEntryMode}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95"
                >
                  <Plus size={14} />
                  <span>Add Sale Entry</span>
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isExpanded = expandedCardId === entry._id
              const isHSD = String(entry.product || "").toUpperCase() === "HSD"
              const entryProfit = getProfit(entry)
              const lgVal = numberValue(entry.lossGain)

              return (
                <div
                  key={entry._id}
                  onClick={() => setExpandedCardId(isExpanded ? null : entry._id)}
                  className={`group rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                    isExpanded
                      ? "ring-2 ring-blue-500/20 border-blue-500/40 shadow-md"
                      : "hover:border-blue-500/30"
                  }`}
                >
                  {/* Top Row: Product badge, Date & Loss/Gain indicator */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-black ${
                          isHSD
                            ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                            : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        <Fuel size={12} />
                        {entry.product || "HSD"}
                      </span>
                      <span className="text-xs font-semibold text-[color:var(--text-secondary)]">
                        {formatMobileDate(entry.date)}
                      </span>
                    </div>

                    {/* Loss / Gain tag */}
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                        lgVal > 0
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                          : lgVal < 0
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                            : "bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                      }`}
                    >
                      {lgVal > 0 ? (
                        <TrendingUp size={11} className="stroke-[2.5]" />
                      ) : lgVal < 0 ? (
                        <TrendingDown size={11} className="stroke-[2.5]" />
                      ) : null}
                      <span>
                        {lgVal > 0 ? "+" : ""}
                        {formatNumber(lgVal)} L
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Sales Volume & Calculated Turnover */}
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-[color:var(--text-strong)]">
                          {formatNumber(entry.sale)}
                        </span>
                        <span className="text-xs font-bold text-[color:var(--text-secondary)]">LTR</span>
                      </div>
                      <p className="text-[11px] font-medium text-[color:var(--text-secondary)]">
                        Rate: ₹{formatNumber(entry.rate)} / L
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {formatCurrency(entryProfit)}
                      </span>
                      <p className="text-[10px] text-[color:var(--text-secondary)] font-medium">Turnover</p>
                    </div>
                  </div>

                  {/* Expand indicator hint */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-[color:var(--text-secondary)] border-t border-[var(--border-color)] pt-2">
                    <span className="truncate max-w-[200px]">
                      {entry.remark ? (
                        <span className="text-[color:var(--text-primary)] font-medium">
                          {entry.remark}
                        </span>
                      ) : (
                        "Tap to view details"
                      )}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 text-[color:var(--text-secondary)] ${
                        isExpanded ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                      }`}
                    />
                  </div>

                  {/* EXPANDED ACCORDION: Shows technical details and EDIT / DELETE buttons */}
                  {isExpanded && (
                    <div
                      className="mt-3 border-t border-[var(--border-color)] bg-[var(--bg-soft)] p-3 rounded-2xl space-y-2.5 animate-in fade-in-50 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Grid of technical metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5">
                          <span className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)] block">
                            Product
                          </span>
                          <span className="font-bold text-[color:var(--text-strong)]">
                            {entry.product || "HSD"}
                          </span>
                        </div>
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5">
                          <span className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)] block">
                            Rate (₹ / L)
                          </span>
                          <span className="font-bold text-[color:var(--text-strong)]">
                            ₹{formatNumber(entry.rate)}
                          </span>
                        </div>
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5">
                          <span className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)] block">
                            Dispensed Fuel
                          </span>
                          <span className="font-bold text-[color:var(--text-strong)]">
                            {formatNumber(entry.sale)} LTR
                          </span>
                        </div>
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5">
                          <span className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)] block">
                            Calculated Turnover
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(entryProfit)}
                          </span>
                        </div>
                      </div>

                      {/* Loss / Gain & Remark details */}
                      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)]">
                            Loss / Gain Variance
                          </span>
                          <span
                            className={`font-bold ${
                              lgVal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {lgVal >= 0 ? "+" : ""}
                            {formatNumber(lgVal)} LTR
                          </span>
                        </div>
                        {entry.remark && (
                          <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                            <span className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)] block mb-0.5">
                              Remark
                            </span>
                            <span className="text-[color:var(--text-primary)]">
                              {entry.remark}
                            </span>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-[var(--border-color)] flex justify-between text-[10px] text-[color:var(--text-secondary)]">
                          <span>By: {entry.createdByName || entry.createdBy?.name || entry.user?.name || "System"}</span>
                          <span>{formatDateTime(entry.lastEditedAt || entry.updatedAt || entry.createdAt)}</span>
                        </div>
                      </div>

                      {/* ACTION BUTTONS (Only visible when card is clicked!) */}
                      <div className="flex items-center gap-2 pt-1">
                        {canManagerUse("editSale") && (
                          <button
                            type="button"
                            onClick={() => openEdit(entry)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800/80 active:scale-95 transition-transform"
                          >
                            <Edit2 size={13} />
                            <span>Edit Entry</span>
                          </button>
                        )}
                        {canManagerUse("deleteSale") && (
                          <button
                            type="button"
                            onClick={() => handleDelete(entry)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800/80 active:scale-95 transition-transform"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 7. DIRECT FLOATING ACTION BUTTON (FAB) */}
      {canManagerUse("addSale") && (
        <div className="lg:hidden fixed bottom-[82px] right-4 z-40">
          <button
            type="button"
            onClick={openEntryMode}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/35 active:scale-90 transition-all"
            title="Add Daily Sale"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* 8. MOBILE BOTTOM NAVIGATION BAR (Floating Pill Dock matching other pages) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 mx-3 mb-2 flex h-[68px] items-center justify-around rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)]/95 backdrop-blur-xl px-2 shadow-2xl transition-colors duration-300">
        <button
          type="button"
          onClick={() => {
            setProductCategory("all")
            setSearch("")
            setFromDate("")
            setToDate("")
          }}
          className={`relative flex min-w-[54px] flex-col items-center gap-1 transition-colors ${
            productCategory === "all" && !hasDateRange
              ? "text-blue-600 dark:text-blue-400 font-extrabold"
              : "text-[color:var(--text-secondary)]"
          }`}
        >
          <Fuel size={20} />
          <span className="text-[10px]">Register</span>
          {productCategory === "all" && !hasDateRange ? (
            <span className="mt-0.5 h-[3px] w-7 rounded-full bg-blue-600 dark:bg-blue-400" />
          ) : (
            <span className="mt-0.5 h-[3px] w-7 opacity-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(isManager ? "/manager/daily-sales-dashboard" : "/admin/daily-sales-dashboard")
          }
          className="flex min-w-[54px] flex-col items-center gap-1 text-[color:var(--text-secondary)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ChartNoAxesCombined size={20} />
          <span className="text-[10px]">Dashboard</span>
          <span className="mt-0.5 h-[3px] w-7 opacity-0" />
        </button>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="flex min-w-[54px] flex-col items-center gap-1 text-[color:var(--text-secondary)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <FileText size={20} />
          <span className="text-[10px]">Reports</span>
          <span className="mt-0.5 h-[3px] w-7 opacity-0" />
        </button>

        <button
          type="button"
          onClick={() => setShowMobileFilterModal(true)}
          className={`relative flex min-w-[54px] flex-col items-center gap-1 transition-colors ${
            hasDateRange || monthFilter !== getCurrentMonth() || productCategory !== "all"
              ? "text-blue-600 dark:text-blue-400 font-extrabold"
              : "text-[color:var(--text-secondary)] hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          <Filter size={20} />
          <span className="text-[10px]">Filters</span>
          {(hasDateRange || monthFilter !== getCurrentMonth() || productCategory !== "all") && (
            <span className="absolute top-0 right-3.5 h-2 w-2 rounded-full bg-blue-500" />
          )}
          {hasDateRange || monthFilter !== getCurrentMonth() || productCategory !== "all" ? (
            <span className="mt-0.5 h-[3px] w-7 rounded-full bg-blue-600 dark:bg-blue-400" />
          ) : (
            <span className="mt-0.5 h-[3px] w-7 opacity-0" />
          )}
        </button>
      </nav>

      {/* MOBILE FILTER BOTTOM SHEET MODAL */}
      {showMobileFilterModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-t-3xl border-t border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl text-[color:var(--text-primary)] animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Filter size={16} />
                </div>
                <h3 className="text-base font-black text-[color:var(--text-strong)]">
                  Filter Sales
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                className="rounded-full p-1.5 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Product Filter */}
              <div>
                <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1.5">
                  Product
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "all", label: "All Products" },
                    { key: "HSD", label: "HSD (Diesel)" },
                    { key: "MS", label: "MS (Petrol)" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setProductCategory(p.key)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        productCategory === p.key
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-400"
                          : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-primary)]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Picker */}
              <div>
                <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1.5">
                  Select Month
                </label>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value)
                    setFromDate("")
                    setToDate("")
                  }}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-blue-500"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[color:var(--text-secondary)] block mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[color:var(--text-secondary)] block mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMonthFilter(getCurrentMonth())
                    setFromDate("")
                    setToDate("")
                    setProductCategory("all")
                    setSearch("")
                    setShowMobileFilterModal(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-xs font-bold text-[color:var(--text-primary)] hover:bg-[var(--bg-panel)]"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilterModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md active:scale-95"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. ENTRY MODE SELECTION MODAL */}
      {entryModePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl text-center text-[color:var(--text-primary)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-3">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-black text-[color:var(--text-strong)]">
              Choose Entry Mode
            </h3>
            <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
              Select how you would like to record your daily fuel sales entries.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={chooseSingleEntry}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-blue-500/30 hover:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 active:scale-95 transition-all text-left group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                  <Plus size={20} />
                </div>
                <span className="text-sm font-bold text-[color:var(--text-strong)] group-hover:text-blue-600">
                  Single Entry
                </span>
                <span className="text-[10px] text-[color:var(--text-secondary)] text-center">
                  Standard form with preview
                </span>
              </button>

              <button
                type="button"
                onClick={chooseMultipleEntry}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-[var(--border-color)] hover:border-blue-500 bg-[var(--bg-soft)] active:scale-95 transition-all text-left group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white shadow-md">
                  <Layers size={20} />
                </div>
                <span className="text-sm font-bold text-[color:var(--text-strong)] group-hover:text-blue-600">
                  Multiple Entry
                </span>
                <span className="text-[10px] text-[color:var(--text-secondary)] text-center">
                  Batch table for multiple rows
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEntryModePrompt(false)}
              className="mt-5 w-full py-2.5 text-xs font-bold text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 2. SINGLE ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-[color:var(--text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Fuel size={18} />
                </div>
                <h3 className="text-base font-black text-[color:var(--text-strong)]">
                  {editData ? "Edit Daily Sale" : "New Daily Sale Entry"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-full p-1.5 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                    Product *
                  </label>
                  <select
                    required
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-bold text-[color:var(--text-primary)] outline-none focus:border-blue-500"
                  >
                    <option value="HSD">HSD (High Speed Diesel)</option>
                    <option value="MS">MS (Motor Spirit / Petrol)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                    Sale (LTR) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 4500"
                    value={form.sale}
                    onChange={(e) => setForm({ ...form, sale: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                    Rate (₹ / LTR) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 89.50"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                  Loss / Gain (LTR)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 15 or -10"
                  value={form.lossGain}
                  onChange={(e) => setForm({ ...form, lossGain: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-blue-500"
                />
              </div>

              {/* Real-time calculated Turnover preview */}
              {form.sale !== "" && form.rate !== "" && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-xs">
                  <span className="font-medium text-emerald-800 dark:text-emerald-300">
                    Estimated Turnover
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-200 text-sm">
                    {formatCurrency(Number(form.sale || 0) * Number(form.rate || 0))}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                  Remark (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional delivery or nozzle notes..."
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] resize-none outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSale}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
                >
                  {savingSale && <RefreshCw size={13} className="animate-spin" />}
                  <span>{editData ? "Update Sale" : "Save Entry"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MULTIPLE / BULK ENTRY MODAL */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl max-h-[90vh] flex flex-col text-[color:var(--text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[color:var(--text-strong)]">
                    Multiple Sales Entry
                  </h3>
                  <p className="text-[11px] text-[color:var(--text-secondary)]">
                    Quickly insert multiple dispensing records with shared defaults.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                className="rounded-full p-1.5 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Bulk Fast Defaults Bar */}
            <div className="grid grid-cols-3 gap-2 p-3 my-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)] block mb-1">
                  Default Date
                </label>
                <input
                  type="date"
                  value={bulkDefaultDate}
                  onChange={(e) => setBulkDefaultDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text-primary)] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)] block mb-1">
                  Default Product
                </label>
                <select
                  value={bulkDefaultProduct}
                  onChange={(e) => setBulkDefaultProduct(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs font-bold text-[color:var(--text-primary)] outline-none"
                >
                  <option value="HSD">HSD</option>
                  <option value="MS">MS</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)] block mb-1">
                  Default Rate
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 89.5"
                    value={bulkDefaultRate}
                    onChange={(e) => setBulkDefaultRate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text-primary)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyBulkDefaults}
                    className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px] hover:bg-blue-500/25 transition-colors"
                    title="Apply defaults to all rows"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Rows Container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {bulkRows.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] text-xs"
                >
                  <span className="text-[11px] font-bold text-[color:var(--text-secondary)] w-5 text-center">
                    {idx + 1}
                  </span>

                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateBulkRow(idx, "date", e.target.value)}
                    className="w-28 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
                  />

                  <select
                    value={row.product}
                    onChange={(e) => updateBulkRow(idx, "product", e.target.value)}
                    className="w-20 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs font-bold text-[color:var(--text-primary)]"
                  >
                    <option value="HSD">HSD</option>
                    <option value="MS">MS</option>
                  </select>

                  <input
                    type="number"
                    step="any"
                    placeholder="Sale LTR"
                    value={row.sale}
                    onChange={(e) => updateBulkRow(idx, "sale", e.target.value)}
                    className="w-24 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
                  />

                  <input
                    type="number"
                    step="any"
                    placeholder="Rate"
                    value={row.rate}
                    onChange={(e) => updateBulkRow(idx, "rate", e.target.value)}
                    className="w-20 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
                  />

                  <input
                    type="number"
                    step="any"
                    placeholder="Loss/Gain"
                    value={row.lossGain}
                    onChange={(e) => updateBulkRow(idx, "lossGain", e.target.value)}
                    className="w-20 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
                  />

                  <input
                    type="text"
                    placeholder="Remark"
                    value={row.remark}
                    onChange={(e) => updateBulkRow(idx, "remark", e.target.value)}
                    className="flex-1 min-w-[100px] rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
                  />

                  <button
                    type="button"
                    onClick={() => removeBulkRow(idx)}
                    className="p-1 rounded-lg text-[color:var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Bulk Footer Actions */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={addBulkRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[var(--border-color)] text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-[var(--bg-soft)]"
              >
                <Plus size={14} />
                <span>Add Another Row</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveBulkRows}
                  disabled={bulkSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
                >
                  {bulkSaving && <RefreshCw size={13} className="animate-spin" />}
                  <span>Save All Rows</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. REPORTS MODAL */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl text-[color:var(--text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText size={18} />
                </div>
                <h3 className="text-base font-black text-[color:var(--text-strong)]">
                  Export Daily Sales
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-full p-1.5 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold text-[color:var(--text-strong)] block mb-1">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportFormat("pdf")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 font-bold transition-all ${
                      reportFormat === "pdf"
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300"
                        : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                    }`}
                  >
                    <FileText size={22} className="text-rose-500" />
                    <span>PDF Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportFormat("excel")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 font-bold transition-all ${
                      reportFormat === "excel"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300"
                        : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                    }`}
                  >
                    <FileSpreadsheet size={22} className="text-emerald-500" />
                    <span>Excel Sheet</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3 text-[11px] text-[color:var(--text-secondary)]">
                Exports {filteredEntries.length} currently filtered entries ({monthFilter || "all time"}).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[color:var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md active:scale-95"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIRMATION DIALOG (Consistent with ModalShell & ConfirmDialog in M.D.U) */}
      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          description={confirmState.description}
          actionLabel={confirmState.actionLabel}
          variant={confirmState.variant}
          onCancel={() => setConfirmState(null)}
          onConfirm={confirmState.onConfirm}
        />
      )}
    </div>
  )
}

function InlineNotice({ notice }) {
  return (
    <div
      className={`mb-3 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
        notice.type === "error"
          ? "border-red-200 bg-red-50 text-red-600 dark:bg-red-950/50 dark:border-red-800/50 dark:text-red-400"
          : "border-green-200 bg-green-50 text-green-700 dark:bg-green-950/50 dark:border-green-800/50 dark:text-green-400"
      }`}
    >
      {notice.type === "error" ? <AlertTriangle size={18} /> : <Check size={18} />}
      <span>{notice.text}</span>
    </div>
  )
}

function ConfirmDialog({
  title,
  description,
  actionLabel,
  variant,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.22)]">
        <h3 className="text-lg font-bold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-xs font-bold text-[color:var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${
              variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
