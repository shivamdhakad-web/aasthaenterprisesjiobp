import { useEffect, useMemo, useState } from "react"
import { CircleAlert, Pencil, Plus, Trash2, Wallet, X } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"
import { addManualFinanceEntry, deleteManualFinanceEntry, getManualFinanceEntries, requestManualFinanceEntry, requestManualFinanceEntryChange, updateManualFinanceEntry } from "../../services/manualFinanceEntryApi"

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
const currentMonth = () => today().slice(0, 7)
const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
const dateLabel = (value) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN") : "-"
const emptyForm = () => ({ date: today(), type: "income", category: "", description: "", amount: "", paymentMode: "Cash" })
const inputClass = "input w-full"

export default function ManualFinanceEntriesPage() {
  const { user } = useAuth()
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
        {canManagerUse("addEntry") ? <button type="button" onClick={() => { setEditingEntry(null); setForm(emptyForm()); setOpen(true) }} className="ml-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-blue-700"><Plus size={17} />Add Entry</button> : null}
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
