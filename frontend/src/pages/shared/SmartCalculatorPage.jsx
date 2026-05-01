import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Copy,
  Delete,
  FileText,
  History,
  IndianRupee,
  MoreVertical,
  Percent,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Sigma,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import {
  deleteSmartCalculatorEntry,
  getSmartCalculatorEntries,
  saveSmartCalculatorEntry,
} from "../../services/smartCalculatorApi"

const DEFAULT_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5]
const ALL_DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1]
const DEFAULT_GST = {
  plus: [5, 12, 18, 28],
  minus: [5, 12, 18, 28],
}

const contributionSteps = {
  monthly: 12,
  quarterly: 4,
  "half-yearly": 2,
  yearly: 1,
}

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const formatDateKey = (value) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const formatLongDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

const createInitialForm = () => ({
  payeeName: "",
  entryDate: new Date().toISOString().slice(0, 10),
  entryType: "credit",
  onlineAmount: "",
  tallyAmount: "",
  manualAdjustmentMode: "add",
  manualAdjustmentAmount: "",
  remarks: "",
  cardSwipeEnabled: false,
  cardSwipeAmount: "",
  cardSwipePercent: "2",
  denominationCounts: Object.fromEntries(DEFAULT_DENOMINATIONS.map((v) => [v, ""])),
})

const safeAmount = (value) => {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

const sanitizeExpression = (value) =>
  value.replace(/x/gi, "*").replace(/÷/g, "/").replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")

const evaluateExpression = (value) => {
  if (!value) return 0
  const expr = sanitizeExpression(value)
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${expr})`)()
  return Number.isFinite(result) ? result : 0
}

const calculateCompound = ({ initialAmount, contributionAmount, interval, yearsToInvest, stayInvested, annualRate }) => {
  const spy = contributionSteps[interval] || 12
  const totalYears = Math.max(Number(stayInvested || 0), Number(yearsToInvest || 0))
  const contribYears = Math.min(Number(yearsToInvest || 0), totalYears)
  const rps = Number(annualRate || 0) / 100 / spy
  const totalSteps = Math.max(Math.round(totalYears * spy), 0)
  const contribStepsCount = Math.max(Math.round(contribYears * spy), 0)
  let value = Number(initialAmount || 0)
  let totalContrib = Number(initialAmount || 0)
  for (let i = 0; i < totalSteps; i++) {
    if (i < contribStepsCount) { value += Number(contributionAmount || 0); totalContrib += Number(contributionAmount || 0) }
    value += value * rps
  }
  return {
    futureValue: +value.toFixed(2),
    investedAmount: +totalContrib.toFixed(2),
    gains: +(value - totalContrib).toFixed(2),
  }
}

export default function SmartCalculatorPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("cash")
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(createInitialForm)
  const [visibleDenominations, setVisibleDenominations] = useState(DEFAULT_DENOMINATIONS)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [showDenominationSettings, setShowDenominationSettings] = useState(false)
  const [showGstSettings, setShowGstSettings] = useState(false)
  const [showReportFilters, setShowReportFilters] = useState(false)
  const [historySearch, setHistorySearch] = useState("")
  const [historyType, setHistoryType] = useState("all")
  const [reportType, setReportType] = useState("all-entries")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [expandedDays, setExpandedDays] = useState({})
  const [gstSettings, setGstSettings] = useState(DEFAULT_GST)
  const [expression, setExpression] = useState("")
  const [calculatorDisplay, setCalculatorDisplay] = useState("0")
  const [compound, setCompound] = useState({
    initialAmount: 0, contributionAmount: 0, interval: "monthly",
    yearsToInvest: 5, stayInvested: 10, annualRate: 12,
  })
  const [compoundResult, setCompoundResult] = useState(null)
  const [showCompoundHelp, setShowCompoundHelp] = useState(false)

  // Custom dialog state
  const [dialog, setDialog] = useState({ open: false, message: "", onConfirm: null, type: "alert" })

  const closeDialog = () => setDialog({ open: false, message: "", onConfirm: null, type: "alert" })
  const showAlert = (message) => setDialog({ open: true, message, type: "alert", onConfirm: null })
  const showConfirm = (message, onConfirm) => setDialog({ open: true, message, type: "confirm", onConfirm })

  useEffect(() => {
    const savedDenoms = window.localStorage.getItem(`smart-calculator-denominations-${user?.role}`)
    const savedGst = window.localStorage.getItem("smart-calculator-gst")
    if (savedDenoms) {
      try {
        const parsed = JSON.parse(savedDenoms)
        if (Array.isArray(parsed) && parsed.length) {
          setVisibleDenominations(parsed)
          setForm((cur) => ({
            ...cur,
            denominationCounts: Object.fromEntries(parsed.map((v) => [v, cur.denominationCounts?.[v] || ""])),
          }))
        }
      } catch {}
    }
    if (savedGst) { try { setGstSettings(JSON.parse(savedGst)) } catch {} }
  }, [user?.role])

  const loadEntries = async () => {
    setLoading(true)
    try { const data = await getSmartCalculatorEntries(); setEntries(data) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadEntries() }, [])

  const denominationRows = useMemo(() =>
    [...visibleDenominations].sort((a, b) => b - a).map((value) => {
      const count = safeAmount(form.denominationCounts[value])
      return { value, count, total: count * value }
    }), [form.denominationCounts, visibleDenominations])

  const cashMetrics = useMemo(() => {
    const notesCount = denominationRows.reduce((t, i) => t + i.count, 0)
    const cashTotal = denominationRows.reduce((t, i) => t + i.total, 0)
    const onlineAmount = safeAmount(form.onlineAmount)
    const tallyAmount = safeAmount(form.tallyAmount)
    const manualAdjustmentAmount = safeAmount(form.manualAdjustmentAmount)
    const manualAdjustmentSigned = form.manualAdjustmentMode === "sub" ? -manualAdjustmentAmount : manualAdjustmentAmount
    const cardSwipeBase = form.cardSwipeEnabled ? safeAmount(form.cardSwipeAmount) : 0
    const cardSwipePercent = form.cardSwipeEnabled ? safeAmount(form.cardSwipePercent) : 0
    const cardSwipeCharge = +((cardSwipeBase * cardSwipePercent) / 100).toFixed(2)
    const cardFinalAmount = +(cardSwipeBase + cardSwipeCharge).toFixed(2)
    const totalAmount = +(cashTotal + onlineAmount + cardFinalAmount + manualAdjustmentSigned).toFixed(2)
    const difference = +(totalAmount - tallyAmount).toFixed(2)
    return { notesCount, cashTotal, onlineAmount, tallyAmount, manualAdjustmentSigned, manualAdjustmentAmount, cardSwipeBase, cardSwipePercent, cardSwipeCharge, cardFinalAmount, totalAmount, difference }
  }, [denominationRows, form])

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const matchesSearch = [entry.payeeName, entry.creatorName].join(" ").toLowerCase().includes(historySearch.toLowerCase())
    const matchesType = historyType === "all" || entry.entryType === historyType
    const entryKey = formatDateKey(entry.entryDate)
    return matchesSearch && matchesType && (!startDate || entryKey >= startDate) && (!endDate || entryKey <= endDate)
  }), [endDate, entries, historySearch, historyType, startDate])

  const historyGroups = useMemo(() => {
    const map = new Map()
    filteredEntries.forEach((entry) => {
      const key = formatDateKey(entry.entryDate)
      if (!map.has(key)) map.set(key, { key, date: entry.entryDate, totalIn: 0, totalOut: 0, cashInHand: 0, onlineAmount: 0, notes: 0, denominationMap: {}, items: [] })
      const g = map.get(key)
      g.items.push(entry)
      g.notes += Number(entry.notesCount || 0)
      g.onlineAmount += Number(entry.onlineAmount || 0) + Number(entry.cardSwipe?.finalAmount || 0)
      if (entry.entryType === "credit") g.totalIn += Number(entry.totalAmount || 0)
      else g.totalOut += Number(entry.totalAmount || 0)
      g.cashInHand += Number(entry.cashTotal || 0) * (entry.entryType === "credit" ? 1 : -1)
      ;(entry.denominationBreakdown || []).forEach((d) => {
        g.denominationMap[d.value] = (g.denominationMap[d.value] || 0) + Number(d.count || 0)
      })
    })
    return Array.from(map.values())
      .sort((a, b) => new Date(b.key) - new Date(a.key))
      .map((g, i) => ({
        ...g, sequence: i + 1, net: +(g.totalIn - g.totalOut).toFixed(2),
        denominations: Object.entries(g.denominationMap).map(([v, c]) => ({ value: Number(v), count: c })).sort((a, b) => b.value - a.value),
      }))
  }, [filteredEntries])

  const footerSummary = useMemo(() => filteredEntries.reduce((s, e) => {
    if (e.entryType === "credit") s.totalIn += Number(e.totalAmount || 0)
    else s.totalOut += Number(e.totalAmount || 0)
    s.net = s.totalIn - s.totalOut
    return s
  }, { totalIn: 0, totalOut: 0, net: 0 }), [filteredEntries])

  const tabs = [
    { key: "history", label: "History", icon: History },
    { key: "cash", label: "Cash Counter", icon: ReceiptText },
    { key: "calculator", label: "Calculator", icon: Sigma },
    { key: "compound", label: "Compound", icon: Percent },
  ]

  const resetCashForm = () => setForm({ ...createInitialForm(), denominationCounts: Object.fromEntries(visibleDenominations.map((v) => [v, ""])) })

  const onSaveEntry = async (sendToAdminManager = false) => {
    const payload = {
      payeeName: form.payeeName, entryDate: form.entryDate, entryType: form.entryType,
      onlineAmount: form.onlineAmount, tallyAmount: form.tallyAmount,
      manualAdjustmentMode: form.manualAdjustmentAmount ? form.manualAdjustmentMode : "none",
      manualAdjustmentAmount: form.manualAdjustmentAmount, remarks: form.remarks,
      visibleDenominations, denominationBreakdown: denominationRows,
      cardSwipe: { enabled: form.cardSwipeEnabled, amount: form.cardSwipeAmount, chargePercent: form.cardSwipePercent },
      sendToAdminManager,
    }
    await saveSmartCalculatorEntry(payload)
    showAlert(sendToAdminManager ? "Entry saved and sent to admin/manager" : "Entry saved")
    resetCashForm()
    await loadEntries()
    setActiveTab("history")
  }

  const shareDraft = async () => {
    const text = [
      "Smart Calculator Entry",
      `Payee: ${form.payeeName || "No Name"}`, `Date: ${form.entryDate}`,
      `Type: ${form.entryType.toUpperCase()}`, `Cash: ${formatCurrency(cashMetrics.cashTotal)}`,
      `Online: ${formatCurrency(cashMetrics.onlineAmount)}`, `Card Swipe: ${formatCurrency(cashMetrics.cardFinalAmount)}`,
      `Total: ${formatCurrency(cashMetrics.totalAmount)}`, `Notes Count: ${cashMetrics.notesCount}`,
    ].join("\n")
    if (navigator.share) { await navigator.share({ title: "Smart Calculator Entry", text }); return }
    await navigator.clipboard.writeText(text)
    showAlert("Entry summary copied")
  }

  const handleDeleteEntry = async (entry) => {
    const isOwnManager = entry.creatorRole === "Manager" && entry.creatorName === user?.name
    const isOwnEmployee = entry.creatorRole === "Employee" && entry.creatorEmployeeId === user?.employeeId
    if (!(user?.role === "Admin" || isOwnManager || isOwnEmployee)) {
      showAlert("You don't have permission to delete this entry")
      return
    }
    showConfirm("Delete this smart calculator entry?", async () => {
      await deleteSmartCalculatorEntry(entry._id)
      await loadEntries()
    })
  }

  const generateReportPdf = () => {
    if (!filteredEntries.length) {
      showAlert("Need entries to generate report")
      return
    }
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text("Smart Calculator Report", 14, 18)
    doc.setFontSize(10); doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, 14, 25)
    if (reportType === "day-wise") {
      autoTable(doc, { startY: 32, head: [["Date","Total In","Total Out","Net","Cash In Hand","Online","Notes"]], body: historyGroups.map((g) => [formatLongDate(g.date), formatCurrency(g.totalIn), formatCurrency(g.totalOut), formatCurrency(g.net), formatCurrency(g.cashInHand), formatCurrency(g.onlineAmount), g.notes]) })
    } else {
      autoTable(doc, { startY: 32, head: [["Date","Type","Payee","Cash","Online","Card Swipe","Total","By"]], body: filteredEntries.map((e) => [formatLongDate(e.entryDate), e.entryType, e.payeeName, formatCurrency(e.cashTotal), formatCurrency(e.onlineAmount), formatCurrency(e.cardSwipe?.finalAmount || 0), formatCurrency(e.totalAmount), e.creatorName]) })
    }
    doc.save(`smart-calculator-${reportType}.pdf`)
    setShowReportFilters(false)
  }

  const applyQuickGst = (percent, mode) => {
    const base = safeAmount(calculatorDisplay)
    const next = mode === "plus" ? base + (base * percent) / 100 : base - (base * percent) / 100
    const val = String(+next.toFixed(2))
    setCalculatorDisplay(val); setExpression(val)
  }

  const onCalculatorPress = (value) => {
    if (soundEnabled && navigator.vibrate) navigator.vibrate(12)
    if (value === "AC") { setExpression(""); setCalculatorDisplay("0"); return }
    if (value === "C") { const n = expression.slice(0, -1); setExpression(n); setCalculatorDisplay(n || "0"); return }
    if (value === "=") {
      try { const r = evaluateExpression(expression); const v = String(+r.toFixed(2)); setCalculatorDisplay(v); setExpression(v) }
      catch { setCalculatorDisplay("Error") }
      return
    }
    const next = `${expression}${value}`; setExpression(next); setCalculatorDisplay(next)
  }

  const historyEmpty = !loading && !filteredEntries.length

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      {/* HEADER + TABS */}
      <div className="px-2 pt-2 pb-0 sm:px-3 sm:pt-3">
        <div className="rounded-2xl bg-[#179951] p-1">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key ? "bg-white/14 text-white" : "text-white/60"
                }`}
              >
                <tab.icon size={13} className="shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CASH COUNTER TAB */}
      {activeTab === "cash" && (
        <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3 sm:space-y-2">

          {/* Payee + Date */}
          <div className="grid grid-cols-[1fr_130px] gap-2">
            <input value={form.payeeName} onChange={(e) => setForm({ ...form, payeeName: e.target.value })} placeholder="Enter Payee Name" className="input" />
            <input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} className="input text-sm" />
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-[var(--border-strong)] bg-gradient-to-br from-[#fff2dd] to-[#fffaf0] p-2.5">
              <p className="text-[10px] text-[color:var(--text-secondary)]">Notes</p>
              <p className="mt-1 text-xl font-semibold text-[color:var(--text-strong)]">{cashMetrics.notesCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-strong)] bg-gradient-to-br from-[#eafbee] to-[#f7fff7] p-2.5">
              <p className="text-[10px] text-[color:var(--text-secondary)]">Cash Total</p>
              <p className="mt-1 text-xl font-semibold text-[color:var(--text-strong)]">{formatCurrency(cashMetrics.cashTotal)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-strong)] bg-gradient-to-br from-[#edf4ff] to-[#f7fbff] p-2.5">
              <p className="text-[10px] text-[color:var(--text-secondary)]">Total Amount</p>
              <p className="mt-1 text-xl font-semibold text-[color:var(--text-strong)]">{formatCurrency(cashMetrics.totalAmount)}</p>
            </div>
          </div>

          {/* Credit / Debit + Online + Tally */}
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ ...form, entryType: "credit" })}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1 text-xs font-semibold border transition-colors ${form.entryType === "credit" ? "bg-emerald-600 text-white border-emerald-600" : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-primary)]"}`}>
                <ArrowDownRight size={14} /> Credit
              </button>
              <button type="button" onClick={() => setForm({ ...form, entryType: "debit" })}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1 text-xs font-semibold border transition-colors ${form.entryType === "debit" ? "bg-rose-600 text-white border-rose-600" : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-primary)]"}`}>
                <ArrowUpRight size={14} /> Debit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--text-secondary)] mb-1">Online Payment</p>
                <input value={form.onlineAmount} onChange={(e) => setForm({ ...form, onlineAmount: e.target.value })} placeholder="Enter amount" className="input" />
              </div>
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--text-secondary)] mb-1">Tally Amount</p>
                <input value={form.tallyAmount} onChange={(e) => setForm({ ...form, tallyAmount: e.target.value })} placeholder="Enter tally" className="input" />
                <p className="mt-1 text-[10px] text-[color:var(--text-secondary)]">Diff: {formatCurrency(cashMetrics.difference)}</p>
              </div>
            </div>

            {/* Card Swipe */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--text-secondary)]">Card Swipe</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[color:var(--text-strong)]">{formatCurrency(cashMetrics.cardSwipeCharge)}</span>
                  <button type="button" onClick={() => setForm((c) => ({ ...c, cardSwipeEnabled: !c.cardSwipeEnabled }))}
                    className={`rounded-lg px-1 py-0 text-xs font-medium ${form.cardSwipeEnabled ? "bg-[#0b2b63] text-white" : "border border-[var(--border-color)] bg-white/60 text-[color:var(--text-secondary)]"}`}>
                    {form.cardSwipeEnabled ? "On" : "Off"}
                  </button>
                </div>
              </div>
              {form.cardSwipeEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.cardSwipeAmount} onChange={(e) => setForm({ ...form, cardSwipeAmount: e.target.value })} placeholder="Swipe amount" className="input" />
                  <input value={form.cardSwipePercent} onChange={(e) => setForm({ ...form, cardSwipePercent: e.target.value })} placeholder="Charge %" className="input" />
                </div>
              )}
            </div>

            {/* Manual Adjustment */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-1">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--text-secondary)] mb-1">Manual Adjustment</p>
              <div className="grid grid-cols-[80px_1fr_80px] gap-2 items-center">
                <button type="button" onClick={() => setForm({ ...form, manualAdjustmentMode: "add" })}
                  className={`rounded-xl py-1 text-xs font-semibold border ${form.manualAdjustmentMode === "add" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-[var(--border-color)] bg-white/70 text-[color:var(--text-secondary)]"}`}>Add</button>
                <input value={form.manualAdjustmentAmount} onChange={(e) => setForm({ ...form, manualAdjustmentAmount: e.target.value })} placeholder="Manual amount" className="input" />
                <button type="button" onClick={() => setForm({ ...form, manualAdjustmentMode: "sub" })}
                  className={`rounded-xl py-1 text-xs font-semibold border ${form.manualAdjustmentMode === "sub" ? "border-rose-500 bg-rose-500/10 text-rose-600" : "border-[var(--border-color)] bg-white/70 text-[color:var(--text-secondary)]"}`}>Sub</button>
              </div>
            </div>

            {/* Remarks */}
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Counter note or remark" rows={1} className="input resize-none" />
          </div>

          {/* Denomination Count */}
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-[color:var(--text-strong)]">Denomination Count</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setShowDenominationSettings(true)}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-1 text-[color:var(--text-primary)]">
                  <Settings2 size={15} />
                </button>
                <button type="button" onClick={() => setSoundEnabled((c) => !c)}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-1 text-[color:var(--text-primary)]">
                  {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-0">
              {denominationRows.map((row) => (
                <div key={row.value} className="grid grid-cols-[52px_16px_1fr_72px] items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-2 py-1">
                  <div className="rounded-lg bg-white/70 px-0 py-0 text-center text-xs font-semibold text-[color:var(--text-strong)]">₹{row.value}</div>
                  <div className="text-center text-xs font-semibold text-[color:var(--text-secondary)]">x</div>
                  <input
                    value={form.denominationCounts[row.value] || ""}
                    onChange={(e) => setForm((cur) => ({ ...cur, denominationCounts: { ...cur.denominationCounts, [row.value]: e.target.value } }))}
                    placeholder="0"
                    className="input text-sm"
                  />
                  <div className="text-right text-xs font-semibold text-[color:var(--text-strong)]">
                    {row.total ? formatCurrency(row.total) : "="}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              Click on settings to Add/Remove denominations
            </p>
          </div>

          {/* Action Buttons */}
          {user?.role === "Employee" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={shareDraft} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#0b2b63] py-1 text-xs font-semibold text-white">
                  <Send size={13} /> Share
                </button>
                <button type="button" onClick={() => onSaveEntry(false)} className="rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-500 py-1 text-xs font-semibold text-white">
                  Save
                </button>
                <button type="button" onClick={() => onSaveEntry(true)} className="rounded-2xl bg-gradient-to-r from-[#0b2b63] to-[#0f69a2] py-1 text-xs font-semibold text-white">
                  Save + Send
                </button>
              </div>
              <button type="button" onClick={resetCashForm} className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] py-1 text-xs font-semibold text-[color:var(--text-primary)]">
                Clear
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={shareDraft} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#0b2b63] py-3 text-xs font-semibold text-white">
                <Send size={13} /> Share
              </button>
              <button type="button" onClick={() => onSaveEntry(false)} className="rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-500 py-3 text-xs font-semibold text-white">
                Save Entry
              </button>
              <button type="button" onClick={resetCashForm} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] py-3 text-xs font-semibold text-[color:var(--text-primary)]">
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="px-3 pt-3 pb-24 space-y-2.5 sm:px-4">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search by name..." className="input pl-9 text-sm" />
            </div>
            <button type="button" onClick={generateReportPdf} className="flex items-center gap-1.5 rounded-2xl bg-[#179951] px-3 py-2 text-xs font-semibold text-white">
              <FileText size={13} /> PDF
            </button>
            <button type="button" onClick={() => setShowReportFilters(true)} className="flex items-center gap-1.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2 text-xs font-semibold text-[color:var(--text-primary)]">
              <MoreVertical size={13} /> Filters
            </button>
          </div>

          <div className="grid grid-cols-[140px_80px_80px] gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input text-xs" />
            <button type="button" onClick={() => setHistoryType((c) => c === "credit" ? "all" : "credit")}
              className={`flex items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-xs font-semibold ${historyType === "credit" ? "border-emerald-500 bg-emerald-600 text-white" : "border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-primary)]"}`}>
              <ArrowDownRight size={12} /> Credit
            </button>
            <button type="button" onClick={() => setHistoryType((c) => c === "debit" ? "all" : "debit")}
              className={`flex items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-xs font-semibold ${historyType === "debit" ? "border-rose-500 bg-rose-600 text-white" : "border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-primary)]"}`}>
              <ArrowUpRight size={12} /> Debit
            </button>
          </div>

          {historyEmpty ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-panel)] p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[color:var(--text-muted)]">
                <ReceiptText size={28} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[color:var(--text-strong)]">No Entries Yet</h3>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Your saved entries will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyGroups.map((group) => {
                const expanded = expandedDays[group.key] ?? group.sequence === 1
                return (
                  <div key={group.key} className="overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)]">
                    <button type="button" onClick={() => setExpandedDays((c) => ({ ...c, [group.key]: !expanded }))}
                      className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left">
                      <div>
                        <p className="text-base font-semibold text-[color:var(--text-strong)]">
                          {new Date(group.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                        <p className="text-xs text-[color:var(--text-secondary)]">
                          {new Date(group.date).toLocaleDateString("en-IN", { weekday: "long" })}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600">IN {formatCurrency(group.totalIn)}</span>
                        <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-600">OUT {formatCurrency(group.totalOut)}</span>
                        <span className="rounded-full bg-[var(--bg-soft)] px-2 py-1 text-[10px] font-semibold text-[color:var(--text-primary)]">{group.items.length}</span>
                        {expanded ? <ChevronUp size={16} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={16} className="text-[color:var(--text-muted)]" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-[var(--border-color)] px-3 py-3">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {[
                            { label: "Total In", value: formatCurrency(group.totalIn), bg: "from-[#eefce9] to-[#f8fff5]" },
                            { label: "Total Out", value: formatCurrency(group.totalOut), bg: "from-[#fff0f4] to-[#fff8fa]" },
                            { label: "Net", value: formatCurrency(group.net), bg: "from-[#eef4ff] to-[#f7fbff]" },
                            { label: "Cash in Hand", value: formatCurrency(group.cashInHand), bg: "from-[#f2f0ff] to-[#faf9ff]" },
                            { label: "Online", value: formatCurrency(group.onlineAmount), bg: "from-[#ecfbff] to-[#f8feff]" },
                            { label: "Notes", value: group.notes, bg: "from-[#fff4e8] to-[#fffaf2]" },
                          ].map((s) => (
                            <div key={s.label} className={`rounded-xl border border-[var(--border-strong)] bg-gradient-to-br ${s.bg} p-2.5`}>
                              <p className="text-[10px] text-[color:var(--text-secondary)]">{s.label}</p>
                              <p className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">{s.value}</p>
                            </div>
                          ))}
                        </div>

                        {group.denominations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {group.denominations.map((d) => (
                              <span key={d.value} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-medium text-[color:var(--text-primary)]">
                                ₹{d.value} x {d.count}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          {group.items.map((entry, idx) => (
                            <div key={entry._id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2.5">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--text-strong)]">#{idx + 1}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${entry.entryType === "credit" ? "bg-emerald-500/12 text-emerald-600" : "bg-rose-500/12 text-rose-600"}`}>{entry.entryType}</span>
                                    {entry.sentToRoles?.length > 0 && <span className="rounded-full bg-[#0b2b63]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0b2b63]">Shared</span>}
                                  </div>
                                  <p className="text-base font-semibold text-[color:var(--text-strong)]">{entry.payeeName}</p>
                                  <p className="text-xs text-[color:var(--text-secondary)]">
                                    {new Date(entry.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {entry.creatorName}
                                  </p>
                                  <p className="text-xs text-[color:var(--text-secondary)]">{entry.notesCount} notes{entry.cardSwipe?.enabled ? ` • Card +${entry.cardSwipe.chargePercent}%` : ""}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-[color:var(--text-strong)]">{formatCurrency(entry.totalAmount)}</p>
                                  <div className="mt-2 flex justify-end gap-1.5">
                                    <button type="button" onClick={() => navigator.clipboard.writeText(`${entry.payeeName} - ${formatCurrency(entry.totalAmount)}`)}
                                      className="flex items-center gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-[10px] font-semibold text-[color:var(--text-primary)]">
                                      <Copy size={11} /> Copy
                                    </button>
                                    <button type="button" onClick={() => handleDeleteEntry(entry)}
                                      className="flex items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-red-600">
                                      <Trash2 size={11} /> Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 grid grid-cols-3 gap-1.5">
                                {[["Cash", entry.cashTotal], ["Online", entry.onlineAmount], ["Card", entry.cardSwipe?.finalAmount || 0]].map(([l, v]) => (
                                  <div key={l} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] px-1 py-1">
                                    <p className="text-[10px] text-[color:var(--text-secondary)]">{l}</p>
                                    <p className="mt-0.5 text-xs font-semibold text-[color:var(--text-strong)]">{formatCurrency(v)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border-color)] bg-[var(--bg-panel)] px-10 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
            <div className="grid grid-cols-3 text-center">
              <div className="border-r border-[var(--border-color)]">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-secondary)]">Total In</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600">{formatCurrency(footerSummary.totalIn)}</p>
              </div>
              <div className="border-r border-[var(--border-color)]">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-secondary)]">Total Out</p>
                <p className="mt-1 text-sm font-semibold text-rose-600">{formatCurrency(footerSummary.totalOut)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-secondary)]">Net</p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">{formatCurrency(footerSummary.net)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR TAB */}
      {activeTab === "calculator" && (
        <div className="px-3 pt-3 pb-4 space-y-3 sm:px-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowGstSettings(true)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2.5 text-[color:var(--text-primary)] shadow-[var(--shadow-soft)]">
              <Settings2 size={16} />
            </button>
            <div className="flex-1 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] px-4 py-3 text-right shadow-[var(--shadow-soft)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Calculator Display</p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--text-strong)]">{calculatorDisplay}</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            <div className="flex items-center justify-center text-[10px] font-semibold text-emerald-600">GST+</div>
            {gstSettings.plus.map((v) => (
              <button key={`gp-${v}`} type="button" onClick={() => applyQuickGst(v, "plus")}
                className="rounded-xl bg-[#f7fff7] py-2.5 text-xs font-semibold text-emerald-600 shadow-[var(--shadow-soft)]">+{v}%</button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            <div className="flex items-center justify-center text-[10px] font-semibold text-rose-600">GST-</div>
            {gstSettings.minus.map((v) => (
              <button key={`gm-${v}`} type="button" onClick={() => applyQuickGst(v, "minus")}
                className="rounded-xl bg-[#fff7f9] py-2.5 text-xs font-semibold text-rose-600 shadow-[var(--shadow-soft)]">-{v}%</button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {["AC","C","%","/","7","8","9","x","4","5","6","-","1","2","3","+","0","00",".","="].map((key) => (
              <button key={key} type="button" onClick={() => onCalculatorPress(key)}
                className={`rounded-2xl py-4 text-lg font-semibold shadow-[var(--shadow-soft)] ${
                  key === "=" ? "bg-[#0ea5e9] text-white" :
                  ["AC","C","%","/","x","-","+"].includes(key) ? "bg-[#179951] text-white" :
                  "border border-[var(--border-strong)] bg-[var(--bg-panel)] text-[color:var(--text-strong)]"
                }`}>
                {key}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* COMPOUND TAB */}
      {activeTab === "compound" && (
        <div className="px-3 pt-3 pb-4 space-y-3 sm:px-4">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#0e5c31_0%,#7cce00_70%)] p-4 text-white">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">Investment</p>
            <h2 className="mt-1 text-xl font-semibold">Compound Interest</h2>
            <p className="mt-1 text-xs text-white/75">Grow your wealth with the power of compounding.</p>
          </div>

          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-3">
            <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Investment</p>
            <div className="space-y-2.5">
              {[
                { label: "Initial Amount", key: "initialAmount" },
                { label: "Contribution Amount", key: "contributionAmount" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <p className="mb-1.5 text-xs font-medium text-[color:var(--text-strong)]">{label}</p>
                  <div className="grid grid-cols-[40px_1fr] overflow-hidden rounded-xl border border-[var(--border-color)]">
                    <div className="flex items-center justify-center bg-[var(--bg-soft)]"><IndianRupee size={15} className="text-[color:var(--text-secondary)]" /></div>
                    <input value={compound[key]} onChange={(e) => setCompound({ ...compound, [key]: Number(e.target.value || 0) })} className="input rounded-none border-0 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-3">
            <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Contribution Interval</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(contributionSteps).map((k) => (
                <button key={k} type="button" onClick={() => setCompound({ ...compound, interval: k })}
                  className={`rounded-xl border py-2.5 text-xs font-medium capitalize ${compound.interval === k ? "border-[#0b2b63] bg-[#179951] text-white" : "border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-primary)]"}`}>
                  {k.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-3">
            <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Time Period</p>
            {[
              { label: "Years to Invest", key: "yearsToInvest", max: 40, suffix: "yr" },
              { label: "Stay Invested", key: "stayInvested", max: 50, suffix: "yr" },
            ].map(({ label, key, max, suffix }) => (
              <div key={key} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[color:var(--text-strong)]">{label}</p>
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-primary)] min-w-[56px] text-center">{compound[key]} {suffix}</div>
                </div>
                <input type="range" min="0" max={max} value={compound[key]} step="1"
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (key === "yearsToInvest") setCompound((c) => ({ ...c, yearsToInvest: val, stayInvested: Math.max(c.stayInvested, val) }))
                    else setCompound((c) => ({ ...c, stayInvested: Math.max(val, c.yearsToInvest) }))
                  }}
                  className="w-full accent-[#0b2b63]" />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-3">
            <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Interest Rate</p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[color:var(--text-strong)]">Annual Rate</p>
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-primary)] min-w-[56px] text-center">{compound.annualRate}%</div>
            </div>
            <input type="range" min="0" max="30" value={compound.annualRate} step="1"
              onChange={(e) => setCompound({ ...compound, annualRate: Number(e.target.value) })}
              className="w-full accent-[#0b2b63]" />
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <button type="button" onClick={() => setCompoundResult(calculateCompound(compound))}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#179951] py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(11,43,99,0.22)]">
              <Percent size={15} /> Calculate
            </button>
            <button type="button" onClick={() => { setCompound({ initialAmount: 0, contributionAmount: 0, interval: "monthly", yearsToInvest: 5, stayInvested: 10, annualRate: 12 }); setCompoundResult(null) }}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-3 text-xs font-semibold text-[color:var(--text-primary)]">
              <RefreshCw size={13} /> Reset
            </button>
            <button type="button" onClick={() => setShowCompoundHelp((c) => !c)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-3 text-xs font-semibold text-[color:var(--text-primary)]">
              <CircleHelp size={13} /> How
            </button>
          </div>

          {showCompoundHelp && (
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-3 text-xs leading-6 text-[color:var(--text-secondary)]">
              Start with an initial amount. Choose contribution interval, how many years you will invest and how many years the money will keep growing. Click Calculate to see future value, total investment and estimated gains.
            </div>
          )}

          {compoundResult && (
            <div className="space-y-2">
              {[
                { title: "Future Value", value: compoundResult.futureValue, bg: "from-[#eef4ff] to-[#f8fbff]" },
                { title: "Invested Amount", value: compoundResult.investedAmount, bg: "from-[#edfcee] to-[#f8fff8]" },
                { title: "Estimated Gains", value: compoundResult.gains, bg: "from-[#fff7eb] to-[#fffdf6]" },
              ].map((r) => (
                <div key={r.title} className={`rounded-2xl border border-[var(--border-strong)] bg-gradient-to-br ${r.bg} p-3`}>
                  <p className="text-xs text-[color:var(--text-secondary)]">{r.title}</p>
                  <p className="mt-1.5 text-xl font-semibold text-[color:var(--text-strong)]">{formatCurrency(r.value)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CUSTOM DIALOG (replaces alert/confirm) */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-xl">
            <div className="p-5 text-center">
              <p className="text-base text-[color:var(--text-strong)]">{dialog.message}</p>
            </div>
            <div className="flex border-t border-[var(--border-color)]">
              {dialog.type === "confirm" ? (
                <>
                  <button
                    onClick={() => { closeDialog(); if (dialog.onConfirm) dialog.onConfirm(); }}
                    className="flex-1 py-3 text-center text-sm font-semibold text-emerald-600 border-r border-[var(--border-color)]"
                  >
                    Yes
                  </button>
                  <button
                    onClick={closeDialog}
                    className="flex-1 py-3 text-center text-sm font-semibold text-rose-600"
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  onClick={closeDialog}
                  className="flex-1 py-3 text-center text-sm font-semibold text-[#179951]"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DENOMINATION SETTINGS MODAL */}
      {showDenominationSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)]">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
              <h3 className="text-base font-semibold text-[color:var(--text-strong)]">Denomination Settings</h3>
              <button type="button" onClick={() => setShowDenominationSettings(false)} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2"><Delete size={15} /></button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {ALL_DENOMINATIONS.map((v) => {
                  const checked = visibleDenominations.includes(v)
                  return (
                    <label key={v} className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2.5">
                      <span className="text-sm font-medium text-[color:var(--text-strong)]">₹{v}</span>
                      <input type="checkbox" checked={checked} onChange={() => setVisibleDenominations((c) => checked ? c.filter((i) => i !== v) : [...c, v].sort((a, b) => b - a))} />
                    </label>
                  )
                })}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowDenominationSettings(false)} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2.5 text-sm font-medium text-[color:var(--text-primary)]">Cancel</button>
                <button type="button" onClick={() => { window.localStorage.setItem(`smart-calculator-denominations-${user?.role}`, JSON.stringify(visibleDenominations)); setShowDenominationSettings(false) }}
                  className="rounded-2xl bg-[#0b2b63] px-4 py-2.5 text-sm font-semibold text-white">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GST SETTINGS MODAL */}
      {showGstSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)]">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
              <h3 className="text-base font-semibold text-[color:var(--text-strong)]">GST Settings</h3>
              <button type="button" onClick={() => setShowGstSettings(false)} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2"><Delete size={15} /></button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-emerald-600">GST+</p>
                  {gstSettings.plus.map((v, i) => (
                    <input key={`gp-${i}`} value={v} onChange={(e) => setGstSettings((c) => ({ ...c, plus: c.plus.map((item, ii) => ii === i ? Number(e.target.value || 0) : item) }))} className="input" />
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-rose-600">GST-</p>
                  {gstSettings.minus.map((v, i) => (
                    <input key={`gm-${i}`} value={v} onChange={(e) => setGstSettings((c) => ({ ...c, minus: c.minus.map((item, ii) => ii === i ? Number(e.target.value || 0) : item) }))} className="input" />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowGstSettings(false)} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2.5 text-sm font-medium text-[color:var(--text-primary)]">Cancel</button>
                <button type="button" onClick={() => { window.localStorage.setItem("smart-calculator-gst", JSON.stringify(gstSettings)); setShowGstSettings(false) }}
                  className="rounded-2xl bg-[#179951] px-4 py-2.5 text-sm font-semibold text-white">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT FILTERS MODAL */}
      {showReportFilters && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:px-4">
          <div className="w-full max-w-sm overflow-hidden rounded-t-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
              <h3 className="text-base font-semibold text-[color:var(--text-strong)]">Report Filters</h3>
              <button type="button" onClick={() => setShowReportFilters(false)} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2"><Delete size={15} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input text-sm" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input text-sm" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-[color:var(--text-strong)]">Entry Type</p>
                <div className="flex gap-2">
                  {["all","credit","debit"].map((t) => (
                    <button key={t} type="button" onClick={() => setHistoryType(t)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-medium capitalize ${historyType === t ? "border-[#0b2b63] bg-[#179951] text-white" : "border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-primary)]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-[color:var(--text-strong)]">Report Type</p>
                <div className="flex gap-2">
                  {[["all-entries","All Entries"],["day-wise","Day-Wise"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setReportType(v)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-medium ${reportType === v ? "border-[#0b2b63] bg-[#179951] text-white" : "border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-primary)]"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={generateReportPdf}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#179951] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(11,43,99,0.22)]">
                <FileText size={15} /> Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}