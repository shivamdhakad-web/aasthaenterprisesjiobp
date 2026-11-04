import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { ArrowDownLeft, ArrowUpRight, BarChart3, ChevronDown, CircleAlert, FileText, Filter, Home, Layers, List, MoreVertical, Pencil, Plus, Search, Trash2, Wallet, X } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"
import { addManualFinanceEntries, addManualFinanceEntry, deleteManualFinanceEntry, deleteManualFinanceMonth, getManualFinanceEntries, requestManualFinanceEntry, requestManualFinanceEntryChange, requestManualFinanceMonthDelete, updateManualFinanceEntry } from "../../services/manualFinanceEntryApi"

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
const currentMonth = () => today().slice(0, 7)
const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
const dateLabel = (value) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN") : "-"
const emptyForm = () => ({ date: today(), type: "income", category: "", description: "", amount: "", paymentMode: "Cash" })
const nextDate = (value, offset) => {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
const monthLabel = (value) => {
  const [year, month] = value.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}
const inputClass = "input w-full"

export default function ManualFinanceEntriesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user?.role === "Manager"
  const { canUse } = useManagerDashboardSettings("manualFinanceEntries", isManager)
  const canManagerUse = (key) => !isManager || canUse(key)
  const [entries, setEntries] = useState([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [month, setMonth] = useState(currentMonth())
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkRows, setBulkRows] = useState([emptyForm()])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [confirmMonthDelete, setConfirmMonthDelete] = useState(false)
  const [entryModePrompt, setEntryModePrompt] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [deletingEntry, setDeletingEntry] = useState(null)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [mobileTimeframe, setMobileTimeframe] = useState("monthIncome")
  const [showMobileTimeDropdown, setShowMobileTimeDropdown] = useState(false)
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false)
  const [mobileSelectedEntry, setMobileSelectedEntry] = useState(null)
  const [mobileActiveTab, setMobileActiveTab] = useState("entries")

  const load = async () => {
    setLoading(true)
    try {
      setEntries(await getManualFinanceEntries())
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to load financial entries." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!notice.text) return undefined
    const timer = window.setTimeout(() => setNotice({ type: "", text: "" }), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    const hasDateRange = Boolean(fromDate || toDate)
    return entries.filter((entry) => {
      const date = String(entry.date || "").slice(0, 10)
      const matchesSearch = !query || [entry.type, entry.category, entry.description, entry.paymentMode, entry.addedBy].some((value) => String(value || "").toLowerCase().includes(query))
      return matchesSearch && (!typeFilter || entry.type === typeFilter) &&
        (!categoryFilter || entry.category === categoryFilter) &&
        (!fromDate || date >= fromDate) && (!toDate || date <= toDate) &&
        (hasDateRange || !month || date.startsWith(month))
    }).sort((a, b) => String(b.date).localeCompare(String(a.date)))
  }, [entries, search, typeFilter, categoryFilter, fromDate, toDate, month])

  const categories = useMemo(() => [...new Set(entries.map((entry) => entry.category).filter(Boolean))].sort(), [entries])

  const summary = useMemo(() => {
    const dateNow = today()
    const weekStart = new Date(`${dateNow}T00:00:00`)
    weekStart.setDate(weekStart.getDate() - 6)
    const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`
    const result = { todayIncome: 0, todayExpense: 0, monthIncome: 0, monthExpense: 0, weekNet: 0 }
    filteredEntries.forEach((entry) => {
      const date = String(entry.date || "").slice(0, 10)
      const amount = Number(entry.amount || 0) * (entry.type === "expense" ? -1 : 1)
      if (date === dateNow) result[entry.type === "income" ? "todayIncome" : "todayExpense"] += Math.abs(amount)
      if (date.startsWith(month)) result[entry.type === "income" ? "monthIncome" : "monthExpense"] += Math.abs(amount)
      if (date >= weekKey && date <= dateNow) result.weekNet += amount
    })
    return result
  }, [filteredEntries, month])

  const mobileHeroAmount = useMemo(() => {
    const type = mobileTimeframe === "monthExpense" ? "expense" : "income"
    const selectedMonth = month || currentMonth()
    const periodEntries = filteredEntries.filter((entry) => entry.type === type && String(entry.date || "").slice(0, 10).startsWith(selectedMonth))
    const total = periodEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    return { label: type === "income" ? "Month Income" : "Month Expense", value: money(total), count: periodEntries.length }
  }, [filteredEntries, mobileTimeframe, month])

  const saveEntry = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice({ type: "", text: "" })
    try {
      const payload = { ...form, amount: Number(form.amount), addedBy: user?.name || "" }
      if (editingEntry && user?.role === "Manager") {
        await requestManualFinanceEntryChange({ operation: "update", id: editingEntry._id, entry: payload })
        setNotice({ type: "success", text: "Edit sent for Admin approval." })
      } else if (editingEntry) {
        await updateManualFinanceEntry(editingEntry._id, payload)
        setNotice({ type: "success", text: "Financial entry updated." })
        await load()
      } else if (user?.role === "Manager") {
        await requestManualFinanceEntry(payload)
        setNotice({ type: "success", text: "Entry sent for Admin approval." })
      } else {
        await addManualFinanceEntry(payload)
        setNotice({ type: "success", text: "Financial entry saved." })
        await load()
      }
      setOpen(false)
      setEditingEntry(null)
      setForm(emptyForm())
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to save this entry." })
    } finally {
      setSaving(false)
    }
  }

  const editEntry = (entry) => {
    if (!canManagerUse("editEntry")) {
      setNotice({ type: "error", text: "You do not have access to edit financial entries." })
      return
    }
    setEditingEntry(entry)
    setForm({ date: entry.date?.slice(0, 10) || today(), type: entry.type, category: entry.category || "", description: entry.description || "", amount: String(entry.amount ?? ""), paymentMode: entry.paymentMode || "Cash" })
    setOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingEntry) return
    if (!canManagerUse("deleteEntry")) {
      setNotice({ type: "error", text: "You do not have access to delete financial entries." })
      setDeletingEntry(null)
      return
    }
    try {
      if (user?.role === "Manager") {
        await requestManualFinanceEntryChange({ operation: "delete", id: deletingEntry._id, entry: deletingEntry })
        setNotice({ type: "success", text: "Delete request sent for Admin approval." })
      } else {
        await deleteManualFinanceEntry(deletingEntry._id)
        setNotice({ type: "success", text: "Financial entry deleted." })
        await load()
      }
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to delete this entry." })
    } finally {
      setDeletingEntry(null)
    }
  }

  const addBulkRow = () => setBulkRows((rows) => [...rows, { ...emptyForm(), date: nextDate(rows[rows.length - 1]?.date || today(), 1) }])
  const updateBulkRow = (index, key, value) => setBulkRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const saveBulkRows = async (event) => {
    event.preventDefault()
    setBulkSaving(true)
    setNotice({ type: "", text: "" })
    try {
      const payload = bulkRows.map((row) => ({ ...row, amount: Number(row.amount), addedBy: user?.name || "" }))
      if (isManager) {
        for (const entry of payload) await requestManualFinanceEntry(entry)
        setNotice({ type: "success", text: `${payload.length} entries sent for Admin approval.` })
      } else {
        const result = await addManualFinanceEntries(payload)
        setNotice({ type: "success", text: `${result.createdCount} financial entries saved.` })
        await load()
      }
      setBulkOpen(false)
      setBulkRows([emptyForm()])
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to save multiple entries." })
    } finally {
      setBulkSaving(false)
    }
  }

  const deleteSelectedMonth = async () => {
    const [year, selectedMonth] = month.split("-")
    try {
      if (isManager) {
        await requestManualFinanceMonthDelete({ year, month: selectedMonth })
        setNotice({ type: "success", text: `Delete request for ${monthLabel(month)} sent for Admin approval.` })
      } else {
        const result = await deleteManualFinanceMonth(year, selectedMonth)
        setNotice({ type: "success", text: `${result.deletedCount} entries from ${monthLabel(month)} deleted.` })
        await load()
      }
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to delete this month's entries." })
    } finally {
      setConfirmMonthDelete(false)
    }
  }

  const generateReport = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    doc.setFillColor(0, 150, 105)
    doc.rect(0, 0, 210, 31, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Income & Expenses Report", 14, 15)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`Aastha Enterprises  |  ${month ? monthLabel(month) : "All dates"}`, 14, 23)
    const income = filteredEntries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    const expense = filteredEntries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    autoTable(doc, {
      startY: 38,
      head: [["Date", "Type", "Category", "Description", "Amount", "Payment"]],
      body: filteredEntries.map((entry) => [dateLabel(entry.date), entry.type === "income" ? "Income" : "Expense", entry.category, entry.description || "-", money(entry.amount), entry.paymentMode || "Cash"]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [0, 150, 105] },
      alternateRowStyles: { fillColor: [242, 248, 245] },
      margin: { left: 14, right: 14 },
    })
    const summaryY = (doc.lastAutoTable?.finalY || 42) + 9
    doc.setTextColor(25, 40, 35)
    doc.setFont("helvetica", "bold")
    doc.text(`Income: ${money(income)}     Expenses: ${money(expense)}     Net: ${money(income - expense)}`, 14, Math.min(summaryY, 280))
    doc.save(`Income_Expenses_${month || "All"}.pdf`)
  }

  const clearFilters = () => {
    setSearch("")
    setTypeFilter("")
    setCategoryFilter("")
    setFromDate("")
    setToDate("")
    setMonth("")
  }

  return (
    <div className="mx-auto min-h-screen min-w-0 w-full max-w-[1600px] overflow-x-hidden bg-[var(--bg-main)] p-3 pb-28 text-[color:var(--text-primary)] transition-colors duration-300 sm:p-6 lg:p-8 lg:pb-6">
      <section className="space-y-2 lg:hidden">
        <div className="mb-2 flex min-h-[52px] items-center gap-2.5 rounded-[17px] border border-emerald-100 bg-gradient-to-r from-[var(--bg-panel)] to-emerald-50/70 px-2.5 shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-700/20"><Wallet size={16} strokeWidth={2.3} /></div>
          <div className="min-w-0"><h1 className="truncate text-[16px] font-black leading-tight tracking-[-0.02em] text-[color:var(--text-strong)]">Income &amp; Expenses</h1><p className="mt-0.5 truncate text-[8px] font-semibold tracking-wide text-[color:var(--text-secondary)]">Station income and expense register</p></div>
          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
        </div>

        <div className="relative z-20 mb-2">
          <div className="relative min-h-[125px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#087b5a] via-[#069f70] to-[#08c38b] px-5 pb-4 pt-5 text-white shadow-xl shadow-emerald-900/10">
            <div className="relative z-10 pr-32"><p className="text-[14px] font-semibold text-white">{mobileHeroAmount.label}</p><p className="mt-2 truncate text-[32px] font-black leading-none tracking-tight">{mobileHeroAmount.value}</p><p className="mt-2 text-[11px] font-semibold text-white/80">{mobileHeroAmount.count} filtered entries</p></div>
            <svg viewBox="0 0 360 120" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 left-0 h-[115px] w-full">
              <defs><linearGradient id="manualFinanceHeroGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8affd1" stopOpacity="0.25" /><stop offset="100%" stopColor="#8affd1" stopOpacity="0" /></linearGradient></defs>
              <path d="M0 92 C42 104 65 72 106 78 C145 84 150 99 188 84 C226 68 238 91 270 66 C304 40 316 59 360 28" fill="none" stroke="#7cf7c5" strokeOpacity="0.8" strokeWidth="3" strokeLinecap="round" />
              <path d="M0 92 C42 104 65 72 106 78 C145 84 150 99 188 84 C226 68 238 91 270 66 C304 40 316 59 360 28 L360 120 L0 120 Z" fill="url(#manualFinanceHeroGrad)" />
              <circle cx="270" cy="66" r="5" fill="white" />
            </svg>
          </div>
          <button type="button" aria-haspopup="listbox" aria-expanded={showMobileTimeDropdown} onClick={() => setShowMobileTimeDropdown((isOpen) => !isOpen)} className="absolute right-4 top-4 z-30 inline-flex h-10 min-w-[116px] items-center justify-between gap-2 rounded-[14px] border border-white/20 bg-white/15 px-3 text-[13px] font-bold !text-white shadow-inner backdrop-blur-sm active:scale-[0.98]" style={{ color: "#fff" }}>
            <span className="!text-white" style={{ color: "#fff" }}>{mobileHeroAmount.label}</span><ChevronDown size={16} className={`!text-white transition-transform ${showMobileTimeDropdown ? "rotate-180" : ""}`} style={{ color: "#fff" }} />
          </button>
          {showMobileTimeDropdown ? <>
            <button type="button" aria-label="Close time period options" onClick={() => setShowMobileTimeDropdown(false)} className="fixed inset-0 z-40 cursor-default" />
            <div role="listbox" aria-label="Income and expenses time period" className="absolute right-4 top-[62px] z-50 w-44 overflow-hidden rounded-[16px] border border-white/10 bg-[#083f34] p-1.5 text-white shadow-2xl">
              {[{ key: "monthIncome", label: "Month Income" }, { key: "monthExpense", label: "Month Expense" }].map((period) => (
                <button key={period.key} type="button" role="option" aria-selected={mobileTimeframe === period.key} onClick={() => { setMobileTimeframe(period.key); setShowMobileTimeDropdown(false) }} className={`flex min-h-11 w-full items-center rounded-xl px-3 text-left text-[13px] font-semibold transition-colors ${mobileTimeframe === period.key ? "bg-emerald-500 !text-white" : "text-white/90 hover:bg-white/10"}`} style={{ color: mobileTimeframe === period.key ? "#fff" : "rgba(255,255,255,.9)" }}>{period.label}</button>
              ))}
            </div>
          </> : null}
        </div>

        <div className="mb-2 flex items-center gap-2.5">
          <div className="relative flex-1"><Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)]" /><input aria-label="Search income and expenses" placeholder="Search income & expenses..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-[45px] w-full rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] py-2 pl-11 pr-4 text-[14px] font-medium text-[color:var(--text-primary)] shadow-sm outline-none transition-colors placeholder:text-[color:var(--text-secondary)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" /></div>
          <button type="button" onClick={clearFilters} className="inline-flex h-[45px] items-center gap-2 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 text-[14px] font-bold text-emerald-600 shadow-sm transition-colors active:scale-95 dark:text-emerald-400">Clear</button>
        </div>

        {notice.text ? <div role="status" className={`mb-2 flex items-center gap-2 rounded-xl border px-3 py-3 text-sm ${notice.type === "error" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}><CircleAlert size={17} className="shrink-0" />{notice.text}</div> : null}

        <div id="manual-finance-entries-mobile" className="mb-2 flex items-center justify-between px-1 pt-1"><h2 className="text-sm font-black text-[color:var(--text-strong)]">Income &amp; Expenses Entries</h2><span className="text-xs font-semibold text-[color:var(--text-secondary)]">{filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}</span></div>
        <div className="mb-24 space-y-3">
          {loading ? <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-center shadow-sm"><p className="text-sm font-bold text-[color:var(--text-secondary)]">Loading entries...</p></div> : null}
          {!loading && filteredEntries.length === 0 ? <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-center shadow-sm"><p className="text-sm font-bold text-[color:var(--text-secondary)]">No entries found matching your search.</p></div> : null}
          {!loading && filteredEntries.map((entry) => {
            const isIncome = entry.type === "income"
            const EntryIcon = isIncome ? ArrowUpRight : ArrowDownLeft
            return (
              <article key={entry._id} onClick={() => setMobileSelectedEntry(entry)} className="group relative flex min-h-[68px] cursor-pointer items-center justify-between gap-2 rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2.5 shadow-sm transition-colors active:scale-[0.985]">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[16px] border ${isIncome ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-rose-200 bg-rose-50 text-rose-600"}`}><EntryIcon size={21} /></div>
                  <div className="min-w-0"><h3 className="truncate text-[13px] font-extrabold leading-tight text-[color:var(--text-strong)]">{entry.category || "Other"}</h3><div className="mt-1 flex min-w-0 items-center gap-1.5"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isIncome ? "bg-emerald-500" : "bg-rose-500"}`} /><p className="truncate text-[11px] font-semibold text-[color:var(--text-secondary)]">{isIncome ? "Income" : "Expense"} · {dateLabel(entry.date)}</p></div></div>
                </div>
                <div className="flex shrink-0 items-center gap-1"><div className="text-right"><p className={`text-[13px] font-extrabold tracking-tight ${isIncome ? "text-emerald-600" : "text-rose-600"}`}>{isIncome ? "+" : "−"} {money(entry.amount)}</p><span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">{entry.paymentMode || "Cash"}</span></div>
                  <button type="button" aria-label="View entry options" onClick={(event) => { event.stopPropagation(); setMobileSelectedEntry(entry) }} className="flex h-9 w-8 items-center justify-center rounded-xl text-[color:var(--text-secondary)] transition-colors"><MoreVertical size={19} /></button>
                </div>
              </article>
            )
          })}
        </div>

        {canManagerUse("addEntry") ? <div className="fixed bottom-[82px] right-5 z-30"><button type="button" aria-label="Add income or expense" onClick={() => setEntryModePrompt(true)} className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-emerald-600 !text-white shadow-xl shadow-emerald-600/30 transition active:scale-90"><Plus size={29} strokeWidth={2.6} className="!text-white" /></button></div> : null}
        <nav className="fixed bottom-0 left-0 right-0 z-40 mx-3 mb-2 flex h-[72px] items-center justify-around rounded-[25px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-2 shadow-lg transition-colors duration-300">
          <button type="button" onClick={() => { setMobileActiveTab("entries"); document.getElementById("manual-finance-entries-mobile")?.scrollIntoView({ behavior: "smooth", block: "start" }) }} className={`flex min-w-[58px] flex-col items-center gap-1 transition-colors ${mobileActiveTab === "entries" ? "font-extrabold text-emerald-600 dark:text-emerald-400" : "text-[color:var(--text-secondary)]"}`}><List size={21} /><span className="text-[10px]">Entries</span><span className={`mt-0.5 h-[3px] w-8 rounded-full ${mobileActiveTab === "entries" ? "bg-emerald-600 dark:bg-emerald-400" : "opacity-0"}`} /></button>
          <button type="button" disabled={!canManagerUse("generateReport")} onClick={() => { setMobileActiveTab("reports"); generateReport() }} className={`flex min-w-[58px] flex-col items-center gap-1 transition-colors disabled:opacity-40 ${mobileActiveTab === "reports" ? "font-extrabold text-emerald-600 dark:text-emerald-400" : "text-[color:var(--text-secondary)]"}`}><FileText size={21} /><span className="text-[10px]">Reports</span><span className="mt-0.5 h-[3px] w-8 opacity-0" /></button>
          <button type="button" onClick={() => { setMobileActiveTab("filters"); setShowMobileFilterModal(true) }} className={`flex min-w-[58px] flex-col items-center gap-1 transition-colors ${mobileActiveTab === "filters" ? "font-extrabold text-emerald-600 dark:text-emerald-400" : "text-[color:var(--text-secondary)]"}`}><Filter size={21} /><span className="text-[10px]">Filters</span><span className="mt-0.5 h-[3px] w-8 opacity-0" /></button>
          <button type="button" onClick={() => navigate(isManager ? "/manager/income-expenses-dashboard" : "/admin/income-expenses-dashboard")} className="flex min-w-[58px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"><Home size={21} /><span className="text-[10px]">Dashboard</span><span className="mt-0.5 h-[3px] w-8 opacity-0" /></button>
        </nav>

        {showMobileFilterModal ? <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-4" onClick={(event) => { if (event.target === event.currentTarget) setShowMobileFilterModal(false) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="manual-finance-filter-title" className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl sm:rounded-[28px]">
            <div className="mb-5 flex items-center justify-between border-b border-[var(--border-color)] pb-4"><div className="flex items-center gap-2"><Filter size={19} className="text-emerald-500" /><h3 id="manual-finance-filter-title" className="text-base font-extrabold text-[color:var(--text-strong)]">Filter Entries</h3></div><button type="button" aria-label="Close filters" onClick={() => setShowMobileFilterModal(false)} className="rounded-xl p-2 text-[color:var(--text-secondary)]"><X size={19} /></button></div>
            <div className="space-y-4">
              <label className="block space-y-2 text-xs font-bold text-[color:var(--text-secondary)]">Entry Type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={inputClass}><option value="">All Types</option><option value="income">Income</option><option value="expense">Expense</option></select></label>
              <label className="block space-y-2 text-xs font-bold text-[color:var(--text-secondary)]">Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={inputClass}><option value="">All Categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3"><label className="space-y-2 text-xs font-bold text-[color:var(--text-secondary)]">From Date<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={inputClass} /></label><label className="space-y-2 text-xs font-bold text-[color:var(--text-secondary)]">To Date<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className={inputClass} /></label></div>
              <label className="block space-y-2 text-xs font-bold text-[color:var(--text-secondary)]">Month Filter<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={inputClass} /></label>
            </div>
            <div className="mt-6 flex gap-3"><button type="button" onClick={clearFilters} className="flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] py-3 text-sm font-bold text-[color:var(--text-primary)]">Reset</button><button type="button" onClick={() => setShowMobileFilterModal(false)} className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20">Apply Filters</button></div>
            {canManagerUse("deleteMonth") ? <button type="button" disabled={!month} onClick={() => { setShowMobileFilterModal(false); setConfirmMonthDelete(true) }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-700 disabled:opacity-50"><Trash2 size={16} />Delete Selected Month</button> : null}
          </div>
        </div> : null}

        {mobileSelectedEntry ? <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={(event) => { if (event.target === event.currentTarget) setMobileSelectedEntry(null) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="manual-finance-entry-detail-title" className="w-full max-w-lg rounded-t-[28px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl sm:rounded-[28px]">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-4"><div className="min-w-0"><h3 id="manual-finance-entry-detail-title" className="truncate text-base font-extrabold text-[color:var(--text-strong)]">{mobileSelectedEntry.category || "Other"}</h3><p className={`mt-1 text-xs font-bold ${mobileSelectedEntry.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{mobileSelectedEntry.type === "income" ? "Income" : "Expense"} · {dateLabel(mobileSelectedEntry.date)}</p></div><button type="button" aria-label="Close entry details" onClick={() => setMobileSelectedEntry(null)} className="rounded-xl p-2 text-[color:var(--text-secondary)]"><X size={19} /></button></div>
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"><p className={`text-2xl font-black ${mobileSelectedEntry.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{mobileSelectedEntry.type === "income" ? "+" : "−"} {money(mobileSelectedEntry.amount)}</p><p className="mt-1 text-xs text-[color:var(--text-secondary)]">Payment: {mobileSelectedEntry.paymentMode || "Cash"} · Added by: {mobileSelectedEntry.addedBy || "-"}</p>{mobileSelectedEntry.description ? <p className="mt-3 break-words text-sm text-[color:var(--text-primary)]">{mobileSelectedEntry.description}</p> : null}{mobileSelectedEntry.lastEditedAt ? <p className="mt-3 border-t border-[var(--border-color)] pt-2 text-xs text-[color:var(--text-secondary)]">Edited {new Date(mobileSelectedEntry.lastEditedAt).toLocaleDateString("en-IN")} by {mobileSelectedEntry.lastEditedBy || "-"}</p> : <p className="mt-3 border-t border-[var(--border-color)] pt-2 text-xs text-[color:var(--text-secondary)]">Not edited yet</p>}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {canManagerUse("editEntry") ? <button type="button" onClick={() => { const entry = mobileSelectedEntry; setMobileSelectedEntry(null); editEntry(entry) }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 text-sm font-bold text-white"><Pencil size={17} />Edit Entry</button> : null}
              {canManagerUse("deleteEntry") ? <button type="button" onClick={() => { setDeletingEntry(mobileSelectedEntry); setMobileSelectedEntry(null) }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-3 text-sm font-bold text-white"><Trash2 size={17} />Delete Entry</button> : null}
              <button type="button" onClick={() => setMobileSelectedEntry(null)} className="col-span-2 min-h-12 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-sm font-bold text-[color:var(--text-primary)]">Cancel</button>
            </div>
          </div>
        </div> : null}
      </section>
      <section className="hidden lg:block">
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-3 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Wallet size={21} /></div>
        <div className="flex items-center gap-3"><h1 className="text-xl font-extrabold tracking-tight text-[color:var(--text-strong)]">Income & Expenses</h1><span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-600">{filteredEntries.length} {filteredEntries.length === 1 ? "item" : "items"}</span></div>
        <div className="ml-auto h-0.5 w-12 rounded-full bg-emerald-500/30" />
      </div>

      <section className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard label="Today Income" value={money(summary.todayIncome)} tone="emerald" />
        <SummaryCard label="Today Expense" value={money(summary.todayExpense)} tone="rose" />
        <SummaryCard label="Month Income" value={money(summary.monthIncome)} tone="blue" />
        <SummaryCard label="Month Expense" value={money(summary.monthExpense)} tone="violet" />
      </section>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input placeholder="Search income and expenses..." value={search} onChange={(event) => setSearch(event.target.value)} className="input w-full lg:max-w-[420px]" />
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <button type="button" onClick={() => navigate(isManager ? "/manager/income-expenses-dashboard" : "/admin/income-expenses-dashboard")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 font-medium text-emerald-700"><BarChart3 size={17} />Dashboard</button>
          {canManagerUse("addEntry") ? <button type="button" onClick={() => setEntryModePrompt(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white"><Plus size={17} />Add Entry</button> : null}
          {canManagerUse("generateReport") ? <button type="button" onClick={generateReport} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 font-medium text-amber-50"><FileText size={17} />Generate Report</button> : null}
          {canManagerUse("deleteMonth") ? <button type="button" disabled={!month} onClick={() => setConfirmMonthDelete(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 font-medium text-amber-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={17} />Delete Month</button> : null}
        </div>
      </div>

      {notice.text ? <div role="status" className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === "error" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}><CircleAlert size={17} />{notice.text}</div> : null}

      <div className="mb-5 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,170px)_minmax(0,210px)_minmax(0,160px)_minmax(0,160px)_minmax(0,190px)_auto]">
          <select aria-label="Entry type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={inputClass}><option value="">All Types</option><option value="income">Income</option><option value="expense">Expense</option></select>
          <select aria-label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={inputClass}><option value="">All Categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
          <input aria-label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={inputClass} />
          <input aria-label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className={inputClass} />
          <input aria-label="Filter by month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={inputClass} />
          <button type="button" onClick={clearFilters} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)]">Clear Filters</button>
        </div>
      </div>

      <div className="max-h-[620px] overflow-x-auto overflow-y-auto rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-sm">
        <table className="table min-w-[920px]">
          <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th><th>Payment Mode</th><th>Added By</th><th>Audit</th><th>Action</th></tr></thead>
          <tbody>
            {filteredEntries.map((entry) => <tr key={entry._id}>
              <td>{dateLabel(entry.date)}</td>
              <td><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${entry.type === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{entry.type}</span></td>
              <td>{entry.category}</td><td>{entry.description || "-"}</td>
              <td className={`font-semibold ${entry.type === "income" ? "text-emerald-600" : "text-rose-500"}`}>{money(entry.amount)}</td>
              <td>{entry.paymentMode || "Cash"}</td><td>{entry.addedBy || "-"}</td>
              <td className="text-xs text-[color:var(--text-secondary)]">{entry.lastEditedAt ? <><span className="block">Edited: {new Date(entry.lastEditedAt).toLocaleDateString("en-IN")}</span><span>By: {entry.lastEditedBy || "-"} {entry.lastEditedByRole ? `(${entry.lastEditedByRole})` : ""}</span></> : <span>Not edited yet</span>}</td>
              <td><div className="flex items-center justify-center gap-3">{canManagerUse("editEntry") ? <button type="button" aria-label="Edit entry" title="Edit entry" onClick={() => editEntry(entry)} className="text-blue-600 hover:text-blue-800"><Pencil size={17} /></button> : null}{canManagerUse("deleteEntry") ? <button type="button" aria-label="Delete entry" title="Delete entry" onClick={() => setDeletingEntry(entry)} className="text-rose-600 hover:text-rose-800"><Trash2 size={17} /></button> : null}</div></td>
            </tr>)}
            {!loading && filteredEntries.length === 0 ? <tr><td colSpan="9" className="py-12 text-center text-sm text-[color:var(--text-muted)]">No entries match these filters.</td></tr> : null}
            {loading ? <tr><td colSpan="9" className="py-12 text-center text-sm text-[color:var(--text-muted)]">Loading entries...</td></tr> : null}
          </tbody>
        </table>
      </div>
      </section>

      {open ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
        <form onSubmit={saveEntry} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-xl font-extrabold text-[color:var(--text-strong)]">{editingEntry ? "Edit Income or Expense" : "Add Income or Expense"}</h2><p className="mt-1 text-sm text-[color:var(--text-secondary)]">Manager changes are submitted to Admin for approval.</p></div><button type="button" aria-label="Close" onClick={() => { setOpen(false); setEditingEntry(null) }} className="rounded-xl p-2 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]"><X size={19} /></button></div>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--bg-soft)] p-1">{[{ value: "income", label: "Income" }, { value: "expense", label: "Expense" }].map((item) => <button key={item.value} type="button" onClick={() => setForm((prev) => ({ ...prev, type: item.value }))} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${form.type === item.value ? item.value === "income" ? "bg-emerald-500 text-amber-50" : "bg-rose-500 text-amber-50" : "text-[color:var(--text-secondary)]"}`}>{item.label}</button>)}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-[color:var(--text-secondary)]">Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className={inputClass} /></label>
            <label className="space-y-1.5 text-xs font-semibold text-[color:var(--text-secondary)]">Amount<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className={inputClass} /></label>
            <label className="space-y-1.5 text-xs font-semibold text-[color:var(--text-secondary)]">Category<input required maxLength={60} placeholder={form.type === "income" ? "e.g. Other income" : "e.g. Station maintenance"} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass} /></label>
            <label className="space-y-1.5 text-xs font-semibold text-[color:var(--text-secondary)]">Payment Mode<select value={form.paymentMode} onChange={(event) => setForm({ ...form, paymentMode: event.target.value })} className={inputClass}><option>Cash</option><option>UPI</option><option>Bank</option><option>Card</option><option>Other</option></select></label>
            <label className="space-y-1.5 text-xs font-semibold text-[color:var(--text-secondary)] sm:col-span-2">Description<textarea rows="3" maxLength={300} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${inputClass} resize-y`} /></label>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setOpen(false); setEditingEntry(null) }} className="rounded-xl border border-[var(--border-color)] px-5 py-2.5 text-sm font-semibold text-[color:var(--text-secondary)]">Cancel</button><button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : user?.role === "Manager" ? "Send for Approval" : editingEntry ? "Save Changes" : "Save Entry"}</button></div>
        </form>
      </div> : null}
      {deletingEntry ? <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeletingEntry(null) }}><div role="dialog" aria-modal="true" aria-labelledby="delete-entry-title" className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl"><h2 id="delete-entry-title" className="text-lg font-extrabold text-[color:var(--text-strong)]">Delete financial entry?</h2><p className="mt-2 text-sm text-[color:var(--text-secondary)]">{user?.role === "Manager" ? "This delete request will be sent to Admin for approval." : `Delete ${deletingEntry.category} entry of ${money(deletingEntry.amount)}? This cannot be undone.`}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeletingEntry(null)} className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" onClick={confirmDelete} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">{user?.role === "Manager" ? "Request Delete" : "Delete"}</button></div></div></div> : null}
      {bulkOpen ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget && !bulkSaving) setBulkOpen(false) }}><form onSubmit={saveBulkRows} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-[color:var(--text-strong)]">Add Multiple Income & Expense Entries</h2><p className="mt-1 text-sm text-[color:var(--text-secondary)]">Each new row starts one day after the previous row.</p></div><button type="button" aria-label="Close" disabled={bulkSaving} onClick={() => setBulkOpen(false)} className="rounded-xl p-2 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]"><X size={19} /></button></div>
        <label className="mb-4 block max-w-xs space-y-1.5 text-xs font-semibold text-[color:var(--text-secondary)]">Default Date<input type="date" value={bulkRows[0]?.date || today()} onChange={(event) => setBulkRows((rows) => rows.map((row, index) => ({ ...row, date: nextDate(event.target.value, index) })))} className={inputClass} /></label>
        <div className="space-y-3">{bulkRows.map((row, index) => <section key={index} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--text-secondary)]">Entry {index + 1}</h3>{bulkRows.length > 1 ? <button type="button" onClick={() => setBulkRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} className="text-rose-600" aria-label={`Remove entry ${index + 1}`}><Trash2 size={17} /></button> : null}</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-xs font-semibold text-[color:var(--text-secondary)]">Date<input required type="date" value={row.date} onChange={(event) => updateBulkRow(index, "date", event.target.value)} className={inputClass} /></label>
          <label className="space-y-1 text-xs font-semibold text-[color:var(--text-secondary)]">Type<select value={row.type} onChange={(event) => updateBulkRow(index, "type", event.target.value)} className={inputClass}><option value="income">Income</option><option value="expense">Expense</option></select></label>
          <label className="space-y-1 text-xs font-semibold text-[color:var(--text-secondary)]">Amount<input required type="number" min="0.01" step="0.01" value={row.amount} onChange={(event) => updateBulkRow(index, "amount", event.target.value)} className={inputClass} /></label>
          <label className="space-y-1 text-xs font-semibold text-[color:var(--text-secondary)]">Category<input required maxLength={60} value={row.category} onChange={(event) => updateBulkRow(index, "category", event.target.value)} className={inputClass} /></label>
          <label className="space-y-1 text-xs font-semibold text-[color:var(--text-secondary)]">Payment Mode<select value={row.paymentMode} onChange={(event) => updateBulkRow(index, "paymentMode", event.target.value)} className={inputClass}><option>Cash</option><option>UPI</option><option>Bank</option><option>Card</option><option>Other</option></select></label>
          <label className="space-y-1 text-xs font-semibold text-[color:var(--text-secondary)]">Description<input maxLength={300} value={row.description} onChange={(event) => updateBulkRow(index, "description", event.target.value)} className={inputClass} /></label>
        </div></section>)}</div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button type="button" onClick={addBulkRow} className="rounded-xl border border-blue-300 px-4 py-2.5 text-sm font-semibold text-blue-600">+ Add Another Row</button><div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" disabled={bulkSaving} onClick={() => setBulkOpen(false)} className="rounded-xl border border-[var(--border-color)] px-5 py-2.5 text-sm font-semibold">Cancel</button><button disabled={bulkSaving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{bulkSaving ? "Saving..." : isManager ? "Send Entries for Approval" : "Save Entries"}</button></div></div>
      </form></div> : null}
      {confirmMonthDelete ? <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3"><div role="dialog" aria-modal="true" aria-labelledby="delete-month-title" className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl"><h2 id="delete-month-title" className="text-lg font-extrabold text-[color:var(--text-strong)]">Delete selected month?</h2><p className="mt-2 text-sm text-[color:var(--text-secondary)]">{isManager ? `This will request Admin approval to delete all entries for ${monthLabel(month)}.` : `This permanently deletes all ${entries.filter((entry) => String(entry.date || "").slice(0, 7) === month).length} entries for ${monthLabel(month)}.`}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmMonthDelete(false)} className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" onClick={deleteSelectedMonth} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">{isManager ? "Request Delete" : "Delete Month"}</button></div></div></div> : null}
      {entryModePrompt ? <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setEntryModePrompt(false) }}>
        <section role="dialog" aria-modal="true" aria-labelledby="entry-mode-title" className="w-full max-w-md rounded-[28px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl sm:p-6">
          <div className="relative mb-5 text-center lg:mb-4 lg:text-left">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 lg:hidden"><BarChart3 size={25} /></div>
            <button type="button" onClick={() => setEntryModePrompt(false)} className="absolute right-0 top-0 rounded-xl p-2 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]" aria-label="Close"><X size={19} /></button>
            <h2 id="entry-mode-title" className="pr-9 text-xl font-extrabold text-[color:var(--text-strong)] lg:text-lg"><span className="lg:hidden">Choose Entry Mode</span><span className="hidden lg:inline">Add Income &amp; Expense Entry</span></h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">Choose how you want to record your income or expenses.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <button type="button" onClick={() => { setEntryModePrompt(false); setEditingEntry(null); setForm(emptyForm()); setOpen(true) }} className="flex min-h-[150px] flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center transition active:scale-[0.98]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20"><Plus size={25} className="text-white" /></span>
              <span><span className="block text-sm font-extrabold text-[color:var(--text-strong)]">Single Entry</span><span className="mt-1 block text-[11px] leading-4 text-[color:var(--text-secondary)]">Record one item</span></span>
            </button>
            <button type="button" onClick={() => { setEntryModePrompt(false); setBulkRows([emptyForm()]); setBulkOpen(true) }} className="flex min-h-[150px] flex-col items-center justify-center gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-3 text-center transition active:scale-[0.98]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-md shadow-teal-700/20"><Layers size={24} className="text-white" /></span>
              <span><span className="block text-sm font-extrabold text-[color:var(--text-strong)]">Multiple Entries</span><span className="mt-1 block text-[11px] leading-4 text-[color:var(--text-secondary)]">Add several together</span></span>
            </button>
          </div>

          <div className="hidden gap-3 lg:grid">
            <button type="button" onClick={() => { setEntryModePrompt(false); setEditingEntry(null); setForm(emptyForm()); setOpen(true) }} className="rounded-2xl bg-blue-600 px-4 py-4 text-center font-semibold text-white">Single Entry</button>
            <button type="button" onClick={() => { setEntryModePrompt(false); setBulkRows([emptyForm()]); setBulkOpen(true) }} className="rounded-2xl bg-emerald-600 px-4 py-4 text-center font-semibold text-white">Multiple Entries</button>
          </div>
          <button type="button" onClick={() => setEntryModePrompt(false)} className="mt-3 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--text-primary)]">Cancel</button>
        </section>
      </div> : null}
    </div>
  )
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/5",
    rose: "border-rose-200 bg-rose-50/80 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/5",
    blue: "border-blue-200 bg-blue-50/80 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/5",
    violet: "border-violet-200 bg-violet-50/80 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/5",
  }
  return <div className={`min-w-0 rounded-2xl border px-3 py-3 sm:px-4 sm:py-4 ${tones[tone]}`}><p className="truncate text-[10px] font-medium tracking-[0.12em] text-[color:var(--text-secondary)] sm:text-xs sm:tracking-[0.18em]">{label}</p><p className="mt-2 truncate text-xl font-black sm:mt-3 sm:text-2xl">{value}</p></div>
}
