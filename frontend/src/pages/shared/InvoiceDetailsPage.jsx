import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
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
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"
import SimpleAuditRegisterPage, { helpers } from "./SimpleAuditRegisterPage"
import {
  addInvoiceDetail,
  deleteInvoiceDetail,
  getInvoiceDetails,
  updateInvoiceDetail,
} from "../../services/invoiceDetailApi"

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
  qty: "19000",
  invoiceAmount: "",
  transportCost: "",
  lfr: "",
  rsp: "",
  remark: "",
})

const getPurchaseAmount = (entry) =>
  Number(
    entry.purchaseAmount ??
      (numberValue(entry.qty)
        ? (numberValue(entry.invoiceAmount) + numberValue(entry.transportCost)) / numberValue(entry.qty) +
          numberValue(entry.lfr)
        : 0),
  )

const getLfrAmount = (entry) => numberValue(entry.qty) * numberValue(entry.lfr)

const getMargin = (entry) => numberValue(entry.rsp) - getPurchaseAmount(entry)

const COMMON_TANKER_CAPACITIES = ["12000", "14000", "19000", "20000", "22000", "24000"]

export default function InvoiceDetailsPage() {
  const navigate = useNavigate()

  return (
    <>
      {/* =========================================================================
          DESKTOP VIEW - 100% UNTOUCHED ORIGINAL SIMPLEAUDITREGISTERPAGE
      ========================================================================= */}
      <div className="hidden lg:block">
        <SimpleAuditRegisterPage
          config={{
            title: "Invoice Details",
            kicker: "Fuel Invoice Register",
            description: "Track product invoice quantity, invoice amount, transport cost, LFR, purchase amount, remarks, and audit history.",
            pageKey: "invoiceDetails",
            aiSummary: { valueKey: "invoiceAmount", categoryKey: "product" },
            dashboardAction: {
              label: "Invoice Dashboard",
              icon: <ChartNoAxesCombined size={18} />,
              onClick: () => navigate("/admin/invoice-details-dashboard"),
            },
            iconBg: "bg-violet-50",
            badgeStyle: "bg-violet-100 text-violet-700",
            lineStyle: "bg-violet-200",
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6 text-violet-600"
              >
                <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3z" />
                <path d="M9 8h6" />
                <path d="M9 12h6" />
                <path d="M9 16h4" />
              </svg>
            ),
            empty,
            api: {
              list: getInvoiceDetails,
              add: addInvoiceDetail,
              update: updateInvoiceDetail,
              remove: deleteInvoiceDetail,
            },
            requiredFields: ["date", "product", "qty", "invoiceAmount"],
            bulkDefaults: [
              { key: "date" },
              { key: "product" },
              { key: "lfr" },
              { key: "qty" },
              { key: "rsp" },
            ],
            searchFields: ["date", "product", "qty", "invoiceAmount", "transportCost", "lfr", "rsp", "remark"],
            searchPlaceholder: "Search date, product, invoice amount, RSP, remark",
            categoryFilter: {
              keys: ["product", "qty"],
              allLabel: "All Categories",
              options: ["MS", "HSD", "19000", "22000", "24000", "12000", "14000"],
            },
            fields: [
              { key: "date", label: "Date", type: "date" },
              { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
              { key: "qty", label: "Qty", type: "select", options: ["19000", "22000", "24000", "12000", "14000"] },
              { key: "invoiceAmount", label: "Invoice Amount", type: "number" },
              { key: "transportCost", label: "Transport Cost", type: "number" },
              { key: "lfr", label: "LFR", type: "number" },
              { key: "rsp", label: "RSP", type: "number" },
              { key: "remark", label: "Remark", full: true },
            ],
            columns: [
              { key: "date", label: "Date", render: (entry) => formatDate(entry.date) },
              { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
              { key: "qty", label: "Qty", render: (entry) => formatNumber(entry.qty) },
              { key: "invoiceAmount", label: "Invoice Amount", render: (entry) => formatNumber(entry.invoiceAmount) },
              { key: "transportCost", label: "Transport Cost", render: (entry) => formatNumber(entry.transportCost) },
              { key: "lfr", label: "LFR", render: (entry) => formatNumber(entry.lfr) },
              { key: "lfrAmount", label: "LFR Amount", render: (entry) => formatNumber(getLfrAmount(entry)) },
              { key: "rsp", label: "RSP", render: (entry) => formatNumber(entry.rsp) },
              {
                key: "purchaseAmount",
                label: "Purchase Amount",
                render: (entry) => formatNumber(getPurchaseAmount(entry)),
                className: () => "font-semibold text-emerald-500",
              },
              {
                key: "margin",
                label: "Margin",
                render: (entry) => formatNumber(getMargin(entry)),
                className: (entry) => (getMargin(entry) >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-rose-500"),
              },
              { key: "remark", label: "Remark" },
            ],
            buildPayload: (form) => {
              const qty = numberValue(form.qty)
              const invoiceAmount = numberValue(form.invoiceAmount)
              const transportCost = numberValue(form.transportCost)
              const lfr = numberValue(form.lfr)
              const rsp = numberValue(form.rsp)
              const purchaseAmount = qty ? (invoiceAmount + transportCost) / qty + lfr : 0

              return {
                ...form,
                qty,
                invoiceAmount,
                transportCost,
                lfr,
                rsp,
                purchaseAmount,
              }
            },
            summary: (entries) => {
              const hsdEntries = entries.filter((entry) => String(entry.product || "").toLowerCase() === "hsd")
              const msEntries = entries.filter((entry) => String(entry.product || "").toLowerCase() === "ms")
              const sumField = (list, key) => list.reduce((sum, entry) => sum + numberValue(entry[key]), 0)
              const sumLfrAmount = (list) => list.reduce((sum, entry) => sum + getLfrAmount(entry), 0)
              const avgPurchase = (list) => {
                const totalQty = sumField(list, "qty")
                if (!totalQty) return 0

                return (sumField(list, "invoiceAmount") + sumField(list, "transportCost") + sumLfrAmount(list)) / totalQty
              }

              return [
                { key: "hsdTotalQty", label: "HSD Total Qty", value: formatNumber(sumField(hsdEntries, "qty")), tone: "green" },
                { key: "msTotalQty", label: "MS Total Qty", value: formatNumber(sumField(msEntries, "qty")), tone: "amber" },
                { key: "totalHsdLfrAmount", label: "Total HSD LFR Amount", value: formatNumber(sumLfrAmount(hsdEntries)), tone: "violet" },
                { key: "totalMsLfrAmount", label: "Total MS LFR Amount", value: formatNumber(sumLfrAmount(msEntries)), tone: "blue" },
                { key: "avgPurchaseRateHsd", label: "Avg Purchase Rate HSD", value: formatNumber(avgPurchase(hsdEntries).toFixed(2)), tone: "green" },
                { key: "avgPurchaseRateMs", label: "Avg Purchase Rate MS", value: formatNumber(avgPurchase(msEntries).toFixed(2)), tone: "amber" },
                { key: "totalInvoiceAmountHsd", label: "Total Invoice Amount HSD", value: formatNumber(sumField(hsdEntries, "invoiceAmount")), tone: "green" },
                { key: "totalTransportCostHsd", label: "Total Transport Cost HSD", value: formatNumber(sumField(hsdEntries, "transportCost")), tone: "rose" },
                { key: "totalInvoiceAmountMs", label: "Total Invoice Amount MS", value: formatNumber(sumField(msEntries, "invoiceAmount")), tone: "amber" },
                { key: "totalTransportCostMs", label: "Total Transport Cost MS", value: formatNumber(sumField(msEntries, "transportCost")), tone: "rose" },
              ]
            },
            preview: (form) => {
              const qty = numberValue(form.qty)
              const purchaseAmount = qty
                ? (numberValue(form.invoiceAmount) + numberValue(form.transportCost)) / qty + numberValue(form.lfr)
                : 0
              const margin = numberValue(form.rsp) - purchaseAmount

              return {
                label: "Calculated Purchase Amount / Margin",
                value: `${formatNumber(purchaseAmount)} / ${formatNumber(margin)}`,
                className: margin >= 0 ? "text-emerald-500" : "text-rose-500",
              }
            },
            mobileTitle: (entry) => entry.product || "Product",
            mobileBadge: (entry) => formatNumber(getPurchaseAmount(entry)),
            mobileFields: [
              { key: "qty", label: "Qty", render: (entry) => formatNumber(entry.qty) },
              { key: "invoiceAmount", label: "Invoice", render: (entry) => formatNumber(entry.invoiceAmount) },
              { key: "transportCost", label: "Transport", render: (entry) => formatNumber(entry.transportCost) },
              { key: "lfr", label: "LFR", render: (entry) => formatNumber(entry.lfr) },
              { key: "lfrAmount", label: "LFR Amount", render: (entry) => formatNumber(getLfrAmount(entry)) },
              { key: "rsp", label: "RSP", render: (entry) => formatNumber(entry.rsp) },
              { key: "margin", label: "Margin", render: (entry) => formatNumber(getMargin(entry)) },
            ],
          }}
        />
      </div>

      {/* =========================================================================
          MOBILE VIEW (ONLY ON MOBILE: lg:hidden) - CONSISTENT UX WITH REST OF APP
      ========================================================================= */}
      <div className="block lg:hidden">
        <InvoiceDetailsMobileView />
      </div>
    </>
  )
}

function InvoiceDetailsMobileView() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isManager = user?.role === "Manager"
  const { canUse } = useManagerDashboardSettings("invoiceDetails", isManager)

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
  const [savingInvoice, setSavingInvoice] = useState(false)
  const [form, setForm] = useState(empty())

  // Bulk Entry modal
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkDefaultDate, setBulkDefaultDate] = useState(getToday())
  const [bulkDefaultProduct, setBulkDefaultProduct] = useState("HSD")
  const [bulkDefaultQty, setBulkDefaultQty] = useState("19000")
  const [bulkDefaultLfr, setBulkDefaultLfr] = useState("")
  const [bulkDefaultRsp, setBulkDefaultRsp] = useState("")
  const [bulkRows, setBulkRows] = useState([empty(), empty()])

  // Reports modal
  const [reportOpen, setReportOpen] = useState(false)
  const [reportFormat, setReportFormat] = useState("pdf")

  // Mobile layout state
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    if (!notice.text) return undefined
    const timeout = window.setTimeout(() => setNotice({ type: "", text: "" }), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const res = await getInvoiceDetails()
      setData(Array.isArray(res) ? res : [])
    } catch (_error) {
      setNotice({ type: "error", text: "Unable to load Invoice Details entries." })
    } finally {
      setLoading(false)
    }
  }

  const hasDateRange = Boolean(fromDate || toDate)

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return data.filter((entry) => {
      const dateStr = entry.date ? String(entry.date).slice(0, 10) : ""
      const entryMonth = dateStr.slice(0, 7)
      const prodUpper = String(entry.product || "").toUpperCase()

      const target = [
        dateStr,
        entry.product,
        entry.qty,
        entry.invoiceAmount,
        entry.transportCost,
        entry.lfr,
        entry.rsp,
        entry.purchaseAmount,
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
    setBulkDefaultQty("19000")
    setBulkDefaultLfr("")
    setBulkDefaultRsp("")
    setBulkRows([empty(), empty()])
    setBulkOpen(true)
  }

  const openEdit = (item) => {
    setEditData(item)
    setForm({
      date: item.date ? String(item.date).slice(0, 10) : getToday(),
      product: item.product || "HSD",
      qty: item.qty ?? "19000",
      invoiceAmount: item.invoiceAmount ?? "",
      transportCost: item.transportCost ?? "",
      lfr: item.lfr ?? "",
      rsp: item.rsp ?? "",
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

    if (editData && !canManagerUse("editInvoice")) {
      showNoAccess("You do not have access to edit invoice details.")
      return
    }
    if (!editData && !canManagerUse("addInvoice")) {
      showNoAccess("You do not have access to add invoice details.")
      return
    }

    if (!form.date || !form.product || form.qty === "" || form.invoiceAmount === "") {
      setNotice({ type: "error", text: "Please enter date, product, quantity and invoice amount." })
      return
    }

    setSavingInvoice(true)
    try {
      const qty = numberValue(form.qty)
      const invoiceAmount = numberValue(form.invoiceAmount)
      const transportCost = numberValue(form.transportCost)
      const lfr = numberValue(form.lfr)
      const rsp = numberValue(form.rsp)
      const purchaseAmount = qty ? (invoiceAmount + transportCost) / qty + lfr : 0

      const payload = {
        ...form,
        qty,
        invoiceAmount,
        transportCost,
        lfr,
        rsp,
        purchaseAmount,
        createdByName: user?.name || "Admin",
        createdByRole: user?.role || "Admin",
      }

      if (editData) {
        await updateInvoiceDetail(editData._id, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
        })
        setNotice({ type: "success", text: "Invoice detail updated successfully." })
      } else {
        await addInvoiceDetail(payload)
        setNotice({ type: "success", text: "Invoice detail saved successfully." })
      }

      closeFormModal()
      await loadInvoices()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save invoice detail.",
      })
    } finally {
      setSavingInvoice(false)
    }
  }

  const handleDelete = (entry) => {
    if (!canManagerUse("deleteInvoice")) {
      showNoAccess("You do not have access to delete invoice details.")
      return
    }

    setConfirmState({
      title: "Delete Invoice Entry",
      description: `Delete the ${entry.product} invoice of ${formatNumber(entry.qty)} LTR for ${formatDate(entry.date)} (${formatCurrency(entry.invoiceAmount)})? This action cannot be undone.`,
      actionLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteInvoiceDetail(entry._id)
          await loadInvoices()
          setNotice({ type: "success", text: "Invoice detail deleted successfully." })
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
        qty: bulkDefaultQty || "19000",
        invoiceAmount: "",
        transportCost: "",
        lfr: bulkDefaultLfr || "",
        rsp: bulkDefaultRsp || "",
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
        qty: bulkDefaultQty || row.qty,
        lfr: bulkDefaultLfr || row.lfr,
        rsp: bulkDefaultRsp || row.rsp,
      }))
    )
  }

  const saveBulkRows = async () => {
    if (!canManagerUse("addInvoice")) {
      showNoAccess("You do not have access to add invoice details.")
      return
    }

    const validRows = bulkRows.filter(
      (r) => r.date && r.product && r.qty !== "" && r.invoiceAmount !== ""
    )

    if (!validRows.length) {
      setNotice({
        type: "error",
        text: "Please complete at least one row with Date, Product, Qty, and Invoice Amount.",
      })
      return
    }

    setBulkSaving(true)
    try {
      await Promise.all(
        validRows.map((row) => {
          const qty = numberValue(row.qty)
          const invoiceAmount = numberValue(row.invoiceAmount)
          const transportCost = numberValue(row.transportCost)
          const lfr = numberValue(row.lfr)
          const rsp = numberValue(row.rsp)
          const purchaseAmount = qty ? (invoiceAmount + transportCost) / qty + lfr : 0

          return addInvoiceDetail({
            ...row,
            qty,
            invoiceAmount,
            transportCost,
            lfr,
            rsp,
            purchaseAmount,
            createdByName: user?.name || "Admin",
            createdByRole: user?.role || "Admin",
          })
        })
      )

      setNotice({ type: "success", text: `${validRows.length} invoice entries saved successfully.` })
      setBulkOpen(false)
      await loadInvoices()
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
      "Quantity (LTR)": numberValue(e.qty),
      "Invoice Amount (Rs)": numberValue(e.invoiceAmount),
      "Transport Cost (Rs)": numberValue(e.transportCost),
      "LFR (Rs/LTR)": numberValue(e.lfr),
      "LFR Amount (Rs)": getLfrAmount(e),
      "RSP (Rs/LTR)": numberValue(e.rsp),
      "Purchase Rate (Rs/LTR)": getPurchaseAmount(e),
      "Margin (Rs/LTR)": getMargin(e),
      Remark: e.remark || "",
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Invoice Details")
    XLSX.writeFile(wb, `Invoice_Details_${monthFilter || "export"}.xlsx`)
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

    const doc = new jsPDF("landscape")
    doc.setFontSize(14)
    doc.text("Fuel Invoice Details Register", 14, 15)
    doc.setFontSize(9)
    doc.text(`Period: ${monthFilter || "All Time"} | Generated: ${new Date().toLocaleDateString()}`, 14, 22)

    autoTable(doc, {
      startY: 28,
      head: [["#", "Date", "Product", "Qty (L)", "Invoice (Rs)", "Transport", "LFR", "RSP", "Purchase Rate", "Margin", "Remark"]],
      body: filteredEntries.map((e, idx) => [
        idx + 1,
        formatDate(e.date),
        e.product,
        formatNumber(e.qty),
        formatNumber(e.invoiceAmount),
        formatNumber(e.transportCost),
        formatNumber(e.lfr),
        formatNumber(e.rsp),
        formatNumber(getPurchaseAmount(e).toFixed(2)),
        formatNumber(getMargin(e).toFixed(2)),
        e.remark || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [109, 40, 217] },
      styles: { fontSize: 8 },
    })

    doc.save(`Invoice_Details_Report_${monthFilter || "all"}.pdf`)
    setReportOpen(false)
    setNotice({ type: "success", text: "Report downloaded successfully." })
  }

  // Live real-time single form calculator
  const liveFormCalc = useMemo(() => {
    const q = numberValue(form.qty)
    const inv = numberValue(form.invoiceAmount)
    const tr = numberValue(form.transportCost)
    const lfr = numberValue(form.lfr)
    const rsp = numberValue(form.rsp)

    const purchaseRate = q ? (inv + tr) / q + lfr : 0
    const margin = rsp ? rsp - purchaseRate : 0
    const totalMargin = margin * q

    return { purchaseRate, margin, totalMargin }
  }, [form.qty, form.invoiceAmount, form.transportCost, form.lfr, form.rsp])

  const selectedEntryPurchaseRate = selectedEntry ? getPurchaseAmount(selectedEntry) : 0
  const selectedEntryMargin = selectedEntry ? getMargin(selectedEntry) : 0
  const selectedEntryTotalMargin = selectedEntry
    ? selectedEntryMargin * numberValue(selectedEntry.qty)
    : 0

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-3 text-[color:var(--text-primary)] sm:p-6 pb-32 lg:pb-6">
      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="space-y-3">
        {/* Compact mobile page header */}
        <div className="flex min-h-[62px] items-center justify-between gap-3 rounded-[18px] border border-violet-100 bg-gradient-to-r from-[var(--bg-panel)] to-violet-50/70 px-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-600/20">
              <Receipt size={18} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black leading-tight tracking-tight text-[color:var(--text-strong)]">
                Invoice Details
              </h1>
              <p className="truncate text-[10px] font-medium text-[color:var(--text-secondary)]">
                Fuel Purchase &amp; Margin Register
              </p>
            </div>
          </div>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-400 ring-4 ring-violet-100" aria-label="Active page" />
        </div>

        {/* Product segment filter tabs */}
        <div className="flex items-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-1 shadow-sm">
          {[
            { key: "all", label: "All Invoices" },
            { key: "HSD", label: "HSD (Diesel)" },
            { key: "MS", label: "MS (Petrol)" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setProductCategory(tab.key)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                productCategory === tab.key
                  ? "bg-violet-600 !text-white shadow-sm"
                  : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and clear controls */}
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
              placeholder="Search date, product, qty, remark..."
              className="h-11 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] py-2 pl-10 pr-3 text-xs font-medium text-[color:var(--text-primary)] shadow-sm outline-none placeholder:text-[color:var(--text-secondary)] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("")
              setProductCategory("all")
              setFromDate("")
              setToDate("")
              setMonthFilter(getCurrentMonth())
            }}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-[var(--bg-panel)] px-4 text-xs font-bold text-violet-700 shadow-sm transition-all active:scale-95"
          >
            Clear
          </button>
        </div>

        {/* 6. INVOICE ENTRY CARDS LIST */}
        <div className="space-y-2.5 mb-28">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[color:var(--text-secondary)]">
              <RefreshCw size={26} className="animate-spin text-violet-500 mb-2" />
              <p className="text-xs font-medium">Loading invoice records...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-8 text-center shadow-sm">
              <Receipt size={32} className="mx-auto text-violet-400/60 mb-2" />
              <p className="text-sm font-bold text-[color:var(--text-strong)]">
                No invoice records found
              </p>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)] max-w-xs mx-auto">
                No records match your selected month or filter. Add a new fuel invoice to get started.
              </p>
              {canManagerUse("addInvoice") && (
                <button
                  type="button"
                  onClick={openEntryMode}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95"
                >
                  <Plus size={14} />
                  <span>Add Invoice Entry</span>
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isHSD = String(entry.product || "").toUpperCase() === "HSD"
              const purchaseRate = getPurchaseAmount(entry)
              const margin = getMargin(entry)
              const totalMargin = margin * numberValue(entry.qty)

              return (
                <div
                  key={entry._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedEntry(entry)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedEntry(entry)
                    }
                  }}
                  className="group cursor-pointer rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-sm transition-all duration-200 hover:border-violet-500/30 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                >
                  {/* Top Row: Product badge, Tanker Qty, Date & Margin Tag */}
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

                      <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-soft)] border border-[var(--border-color)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--text-strong)]">
                        <Truck size={11} className="text-violet-500" />
                        {formatNumber(entry.qty)} L
                      </span>

                      <span className="text-xs font-semibold text-[color:var(--text-secondary)]">
                        {formatMobileDate(entry.date)}
                      </span>
                    </div>

                    {/* Margin Tag */}
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                        margin >= 0
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {margin >= 0 ? (
                        <TrendingUp size={11} className="stroke-[2.5]" />
                      ) : (
                        <TrendingDown size={11} className="stroke-[2.5]" />
                      )}
                      <span>
                        {margin >= 0 ? "+" : ""}₹{margin.toFixed(2)}/L
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Invoice Amount & Purchase Rate vs RSP & Margin */}
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <div className="text-lg font-black text-[color:var(--text-strong)]">
                        {formatCurrency(entry.invoiceAmount)}
                      </div>
                      <p className="text-[11px] font-medium text-[color:var(--text-secondary)]">
                        Purchase: ₹{purchaseRate.toFixed(2)} / L
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalMargin)}
                      </span>
                      <p className="text-[10px] text-[color:var(--text-secondary)] font-medium">
                        RSP ₹{formatNumber(entry.rsp)} / L
                      </p>
                    </div>
                  </div>

                  {/* Bottom row: Transport & LFR brief / Remark preview */}
                  <div className="mt-2.5 flex items-center text-[11px] text-[color:var(--text-secondary)] border-t border-[var(--border-color)] pt-2">
                    <span className="truncate max-w-[210px]">
                      {entry.remark ? (
                        <span className="text-[color:var(--text-primary)] font-medium">
                          {entry.remark}
                        </span>
                      ) : (
                        `Freight: ₹${formatNumber(entry.transportCost)} • LFR: ₹${formatNumber(entry.lfr)}/L`
                      )}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedEntry(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-detail-modal-title"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-[26px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 text-[color:var(--text-primary)] shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    String(selectedEntry.product || "").toUpperCase() === "HSD"
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  <Fuel size={21} />
                </div>
                <div className="min-w-0">
                  <h2 id="invoice-detail-modal-title" className="truncate text-lg font-black text-[color:var(--text-strong)]">
                    {selectedEntry.product || "Fuel"} Invoice
                  </h2>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    {formatMobileDate(selectedEntry.date)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close invoice details"
                onClick={() => setSelectedEntry(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-violet-600 p-4 text-white shadow-lg shadow-violet-600/20">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-100">Invoice Amount</p>
                <p className="mt-1 truncate text-xl font-black">{formatCurrency(selectedEntry.invoiceAmount)}</p>
                <p className="mt-1 text-xs font-medium text-violet-100">
                  {formatNumber(selectedEntry.qty)} LTR
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-100">Load Margin</p>
                <p className="mt-1 text-lg font-black">{formatCurrency(selectedEntryTotalMargin)}</p>
                <p className="text-xs font-medium text-violet-100">
                  {selectedEntryMargin >= 0 ? "+" : "−"}₹{Math.abs(selectedEntryMargin).toFixed(2)} / L
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                <p className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)]">Purchase Rate (₹ / L)</p>
                <p className="mt-1 text-sm font-black text-violet-600 dark:text-violet-400">
                  ₹{selectedEntryPurchaseRate.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                <p className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)]">Selling Price (RSP)</p>
                <p className="mt-1 text-sm font-black text-[color:var(--text-strong)]">
                  ₹{formatNumber(selectedEntry.rsp)} / L
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[color:var(--text-secondary)]">Base Invoice Amount</span>
                <span className="font-bold text-[color:var(--text-strong)]">{formatCurrency(selectedEntry.invoiceAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[color:var(--text-secondary)]">Transport Freight Cost</span>
                <span className="font-bold text-[color:var(--text-strong)]">{formatCurrency(selectedEntry.transportCost)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[color:var(--text-secondary)]">LFR Rate &amp; Amount</span>
                <span className="text-right font-bold text-[color:var(--text-strong)]">
                  ₹{formatNumber(selectedEntry.lfr)}/L ({formatCurrency(getLfrAmount(selectedEntry))})
                </span>
              </div>
              {selectedEntry.remark ? (
                <div className="border-t border-[var(--border-color)] pt-2">
                  <p className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)]">Remark</p>
                  <p className="mt-1 break-words text-[color:var(--text-primary)]">{selectedEntry.remark}</p>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 border-t border-[var(--border-color)] pt-2 text-[10px] text-[color:var(--text-secondary)]">
                <span>By: {selectedEntry.createdByName || selectedEntry.createdBy?.name || selectedEntry.user?.name || "System"}</span>
                <span className="text-right">{formatDateTime(selectedEntry.lastEditedAt || selectedEntry.updatedAt || selectedEntry.createdAt)}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {canManagerUse("editInvoice") ? (
                <button
                  type="button"
                  onClick={() => {
                    const entry = selectedEntry
                    setSelectedEntry(null)
                    openEdit(entry)
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-violet-700"
                >
                  <Edit2 size={16} />
                  Edit Invoice
                </button>
              ) : null}
              {canManagerUse("deleteInvoice") ? (
                <button
                  type="button"
                  onClick={() => {
                    const entry = selectedEntry
                    setSelectedEntry(null)
                    handleDelete(entry)
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setSelectedEntry(null)}
              className="mt-2 min-h-10 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-sm font-bold text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]"
            >
              Close
            </button>
          </section>
        </div>
      )}

      {/* 7. DIRECT FLOATING ACTION BUTTON (FAB) */}
      {canManagerUse("addInvoice") && (
        <div className="lg:hidden fixed bottom-[82px] right-4 z-40">
          <button
            type="button"
            onClick={openEntryMode}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-600/35 active:scale-90 transition-all"
            title="Add Invoice Entry"
          >
            <Plus size={28} strokeWidth={2.5} stroke="white" className="!text-white" />
          </button>
        </div>
      )}

      {/* 8. MOBILE BOTTOM NAVIGATION BAR (Floating Pill Dock) */}
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
              ? "text-violet-600 dark:text-violet-400 font-extrabold"
              : "text-[color:var(--text-secondary)]"
          }`}
        >
          <Receipt size={20} />
          <span className="text-[10px]">Register</span>
          {productCategory === "all" && !hasDateRange ? (
            <span className="mt-0.5 h-[3px] w-7 rounded-full bg-violet-600 dark:bg-violet-400" />
          ) : (
            <span className="mt-0.5 h-[3px] w-7 opacity-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowMobileFilterModal(true)}
          className={`relative flex min-w-[54px] flex-col items-center gap-1 transition-colors ${
            hasDateRange || monthFilter !== getCurrentMonth() || productCategory !== "all"
              ? "text-violet-600 dark:text-violet-400 font-extrabold"
              : "text-[color:var(--text-secondary)] hover:text-violet-600 dark:hover:text-violet-400"
          }`}
        >
          <Filter size={20} />
          <span className="text-[10px]">Filters</span>
          {(hasDateRange || monthFilter !== getCurrentMonth() || productCategory !== "all") && (
            <span className="absolute top-0 right-3.5 h-2 w-2 rounded-full bg-violet-500" />
          )}
          {hasDateRange || monthFilter !== getCurrentMonth() || productCategory !== "all" ? (
            <span className="mt-0.5 h-[3px] w-7 rounded-full bg-violet-600 dark:bg-violet-400" />
          ) : (
            <span className="mt-0.5 h-[3px] w-7 opacity-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="flex min-w-[54px] flex-col items-center gap-1 text-[color:var(--text-secondary)] hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <FileSpreadsheet size={20} />
          <span className="text-[10px]">Reports</span>
          <span className="mt-0.5 h-[3px] w-7 opacity-0" />
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(isManager ? "/manager/invoice-details-dashboard" : "/admin/invoice-details-dashboard")
          }
          className="flex min-w-[54px] flex-col items-center gap-1 text-[color:var(--text-secondary)] hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <ChartNoAxesCombined size={20} />
          <span className="text-[10px]">Dashboard</span>
          <span className="mt-0.5 h-[3px] w-7 opacity-0" />
        </button>
      </nav>

      {/* MOBILE FILTER BOTTOM SHEET MODAL */}
      {showMobileFilterModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-t-3xl border-t border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl text-[color:var(--text-primary)] animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Filter size={16} />
                </div>
                <h3 className="text-base font-black text-[color:var(--text-strong)]">
                  Filter Invoices
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
                          ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-400"
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
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-violet-500"
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
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-violet-500"
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
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-violet-500"
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
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white shadow-md active:scale-95"
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-3">
              <Receipt size={24} />
            </div>
            <h3 className="text-lg font-black text-[color:var(--text-strong)]">
              Choose Entry Mode
            </h3>
            <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
              Select how you would like to record your fuel invoice entries.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={chooseSingleEntry}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-violet-500/30 hover:border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 active:scale-95 transition-all text-left group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md">
                  <Plus size={20} />
                </div>
                <span className="text-sm font-bold text-[color:var(--text-strong)] group-hover:text-violet-600">
                  Single Invoice
                </span>
                <span className="text-[10px] text-[color:var(--text-secondary)] text-center">
                  Full load form with live margin preview
                </span>
              </button>

              <button
                type="button"
                onClick={chooseMultipleEntry}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-[var(--border-color)] hover:border-violet-500 bg-[var(--bg-soft)] active:scale-95 transition-all text-left group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white shadow-md">
                  <Layers size={20} />
                </div>
                <span className="text-sm font-bold text-[color:var(--text-strong)] group-hover:text-violet-600">
                  Multiple Invoices
                </span>
                <span className="text-[10px] text-[color:var(--text-secondary)] text-center">
                  Batch table for multiple tanker entries
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

      {/* 2. SINGLE ADD / EDIT INVOICE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-[color:var(--text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Receipt size={18} />
                </div>
                <h3 className="text-base font-black text-[color:var(--text-strong)]">
                  {editData ? "Edit Fuel Invoice" : "New Fuel Invoice Entry"}
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

            <form onSubmit={handleSave} className="space-y-3.5 mt-4">
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
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-violet-500"
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
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-bold text-[color:var(--text-primary)] outline-none focus:border-violet-500"
                  >
                    <option value="HSD">HSD (High Speed Diesel)</option>
                    <option value="MS">MS (Motor Spirit / Petrol)</option>
                  </select>
                </div>
              </div>

              {/* Tanker Load Quantity with fast presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[color:var(--text-strong)]">
                    Invoiced Quantity (LTR) *
                  </label>
                  <span className="text-[10px] text-[color:var(--text-secondary)]">Presets</span>
                </div>
                <div className="flex gap-1.5 mb-1.5 overflow-x-auto pb-1">
                  {COMMON_TANKER_CAPACITIES.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setForm({ ...form, qty: cap })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors shrink-0 ${
                        form.qty === cap
                          ? "bg-violet-600 text-white border-violet-600"
                          : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"
                      }`}
                    >
                      {Number(cap).toLocaleString()} L
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 19000"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                    Invoice Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 1650000"
                    value={form.invoiceAmount}
                    onChange={(e) => setForm({ ...form, invoiceAmount: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                    Transport Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 8500"
                    value={form.transportCost}
                    onChange={(e) => setForm({ ...form, transportCost: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                    LFR (₹ / LTR)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 0.35"
                    value={form.lfr}
                    onChange={(e) => setForm({ ...form, lfr: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                    Retail Selling Price (RSP ₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 91.50"
                    value={form.rsp}
                    onChange={(e) => setForm({ ...form, rsp: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* LIVE REAL-TIME CALCULATION PREVIEW */}
              {form.qty && form.invoiceAmount && (
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[color:var(--text-secondary)]">Calculated Purchase Rate:</span>
                    <span className="font-extrabold text-violet-600 dark:text-violet-400">
                      ₹{liveFormCalc.purchaseRate.toFixed(2)} / L
                    </span>
                  </div>
                  {form.rsp && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[color:var(--text-secondary)]">Profit Margin per Litre:</span>
                        <span
                          className={`font-black ${
                            liveFormCalc.margin >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {liveFormCalc.margin >= 0 ? "+" : ""}₹{liveFormCalc.margin.toFixed(2)} / L
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-[var(--border-color)]">
                        <span className="font-bold text-[color:var(--text-strong)]">
                          Estimated Total Load Margin:
                        </span>
                        <span
                          className={`font-black text-sm ${
                            liveFormCalc.totalMargin >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {formatCurrency(liveFormCalc.totalMargin)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[color:var(--text-strong)] block mb-1">
                  Remark (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Invoice number, terminal, TT driver notes..."
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-medium text-[color:var(--text-primary)] resize-none outline-none focus:border-violet-500"
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
                  disabled={savingInvoice}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
                >
                  {savingInvoice && <RefreshCw size={13} className="animate-spin" />}
                  <span>{editData ? "Update Invoice" : "Save Invoice"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MULTIPLE / BULK INVOICE ENTRY MODAL */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl max-h-[90vh] flex flex-col text-[color:var(--text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[color:var(--text-strong)]">
                    Multiple Fuel Invoices Entry
                  </h3>
                  <p className="text-[11px] text-[color:var(--text-secondary)]">
                    Quickly record multiple fuel invoices with shared defaults.
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
            <div className="grid grid-cols-4 gap-2 p-3 my-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-xs">
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
                  Default Qty
                </label>
                <select
                  value={bulkDefaultQty}
                  onChange={(e) => setBulkDefaultQty(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text-primary)] outline-none"
                >
                  {COMMON_TANKER_CAPACITIES.map((c) => (
                    <option key={c} value={c}>
                      {c} L
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[color:var(--text-secondary)] block mb-1">
                  Default RSP
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 91.5"
                    value={bulkDefaultRsp}
                    onChange={(e) => setBulkDefaultRsp(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text-primary)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyBulkDefaults}
                    className="px-2.5 py-1 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 font-bold text-[10px] hover:bg-violet-500/25 transition-colors"
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
                    placeholder="Qty L"
                    value={row.qty}
                    onChange={(e) => updateBulkRow(idx, "qty", e.target.value)}
                    className="w-20 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
                  />

                  <input
                    type="number"
                    step="any"
                    placeholder="Invoice ₹"
                    value={row.invoiceAmount}
                    onChange={(e) => updateBulkRow(idx, "invoiceAmount", e.target.value)}
                    className="w-24 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
                  />

                  <input
                    type="number"
                    step="any"
                    placeholder="Transport ₹"
                    value={row.transportCost}
                    onChange={(e) => updateBulkRow(idx, "transportCost", e.target.value)}
                    className="w-20 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
                  />

                  <input
                    type="number"
                    step="any"
                    placeholder="RSP ₹"
                    value={row.rsp}
                    onChange={(e) => updateBulkRow(idx, "rsp", e.target.value)}
                    className="w-16 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
                  />

                  <input
                    type="text"
                    placeholder="Remark"
                    value={row.remark}
                    onChange={(e) => updateBulkRow(idx, "remark", e.target.value)}
                    className="flex-1 min-w-[90px] rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[color:var(--text-primary)]"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[var(--border-color)] text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-[var(--bg-soft)]"
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
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
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
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <FileSpreadsheet size={18} />
                </div>
                <h3 className="text-base font-black text-[color:var(--text-strong)]">
                  Export Fuel Invoices
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
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white shadow-md active:scale-95"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIRMATION DIALOG */}
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
              variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
