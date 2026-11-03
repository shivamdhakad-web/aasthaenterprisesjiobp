import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { BarChart3, CircleAlert, FileText, Pencil, Plus, Trash2, Wallet, X } from "lucide-react"
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
    <div className="mx-auto max-w-[1600px] p-4 pb-20 sm:p-6 lg:p-8">
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
      {entryModePrompt ? <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="entry-mode-title" className="w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><div><h2 id="entry-mode-title" className="text-lg font-bold text-[color:var(--text-strong)]">Add Income & Expense Entry</h2><p className="mt-1 text-sm text-[color:var(--text-secondary)]">Choose how you want to add entries.</p></div><button type="button" onClick={() => setEntryModePrompt(false)} className="rounded-xl p-2 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]" aria-label="Close"><X size={18} /></button></div><div className="grid gap-3"><button type="button" onClick={() => { setEntryModePrompt(false); setEditingEntry(null); setForm(emptyForm()); setOpen(true) }} className="rounded-2xl bg-blue-600 px-4 py-4 text-center font-semibold text-white">Single Entry</button><button type="button" onClick={() => { setEntryModePrompt(false); setBulkRows([emptyForm()]); setBulkOpen(true) }} className="rounded-2xl bg-emerald-600 px-4 py-4 text-center font-semibold text-white">Multiple Entries</button><button type="button" onClick={() => setEntryModePrompt(false)} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]">Cancel</button></div></section></div> : null}
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
  return <div className={`rounded-2xl border px-4 py-4 ${tones[tone]}`}><p className="text-xs font-medium tracking-[0.18em] text-[color:var(--text-secondary)]">{label}</p><p className="mt-3 text-2xl font-black">{value}</p></div>
}
