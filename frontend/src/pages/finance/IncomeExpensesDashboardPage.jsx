import { createElement, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CalendarDays, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { getManualFinanceEntries } from "../../services/manualFinanceEntryApi"

const monthNow = () => new Date().toISOString().slice(0, 7)
const monthName = (key) => {
  if (!key) return "All months"
  const [year, month] = key.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}
const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
const dateKey = (entry) => String(entry.date || "").slice(0, 10)

function Metric({ label, value, icon: Icon, tone, detail }) {
  const styles = {
    emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-600",
    rose: "border-rose-200 bg-rose-50/80 text-rose-600",
    blue: "border-blue-200 bg-blue-50/80 text-blue-600",
    amber: "border-amber-200 bg-amber-50/80 text-amber-700",
  }
  return <article className={`rounded-2xl border p-4 shadow-sm ${styles[tone]}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">{label}</p><p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">{value}</p><p className="mt-1 text-xs text-[color:var(--text-secondary)]">{detail}</p></div><span className="rounded-xl bg-white/70 p-2">{createElement(Icon, { size: 19 })}</span></div></article>
}

export default function IncomeExpensesDashboardPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [month, setMonth] = useState(monthNow())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getManualFinanceEntries()
      setEntries(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load income and expense dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => entries.filter((entry) => !month || dateKey(entry).startsWith(month)), [entries, month])
  const totals = useMemo(() => filtered.reduce((result, entry) => {
    const amount = Number(entry.amount || 0)
    if (entry.type === "income") result.income += amount
    else result.expenses += amount
    result.count += 1
    return result
  }, { income: 0, expenses: 0, count: 0 }), [filtered])

  const daily = useMemo(() => {
    const grouped = filtered.reduce((result, entry) => {
      const key = dateKey(entry)
      if (!key) return result
      result[key] ||= { date: key, income: 0, expenses: 0 }
      result[key][entry.type === "income" ? "income" : "expenses"] += Number(entry.amount || 0)
      return result
    }, {})
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  }, [filtered])

  const categories = useMemo(() => {
    const grouped = filtered.reduce((result, entry) => {
      const key = entry.category || "Uncategorized"
      result[key] ||= { category: key, income: 0, expenses: 0 }
      result[key][entry.type === "income" ? "income" : "expenses"] += Number(entry.amount || 0)
      return result
    }, {})
    return Object.values(grouped).sort((a, b) => (b.income + b.expenses) - (a.income + a.expenses)).slice(0, 8)
  }, [filtered])

  return <main className="mx-auto max-w-[1600px] space-y-5 p-4 pb-20 sm:p-6 lg:p-8">
    <header className="flex flex-col gap-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><button type="button" onClick={() => navigate(-1)} aria-label="Back" className="rounded-xl border border-[var(--border-color)] p-2 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]"><ArrowLeft size={18} /></button><span className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600"><Wallet size={22} /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">Financial Summary</p><h1 className="text-2xl font-black text-[color:var(--text-strong)]">Income & Expenses Dashboard</h1><p className="mt-1 text-sm text-[color:var(--text-secondary)]">Overview for {monthName(month)}</p></div></div>
      <div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3"><CalendarDays size={17} className="text-emerald-600"/><input aria-label="Dashboard month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input !border-0 !bg-transparent !px-0" /></label><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 font-semibold text-[color:var(--text-primary)]"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/>Refresh</button><button type="button" onClick={() => navigate("../income-expenses")} className="rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white">View Entries</button></div>
    </header>

    {error ? <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Income" value={money(totals.income)} icon={TrendingUp} tone="emerald" detail={`${totals.count} total entries in period`} />
      <Metric label="Expenses" value={money(totals.expenses)} icon={TrendingDown} tone="rose" detail="Recorded manual expenses" />
      <Metric label="Net Balance" value={money(totals.income - totals.expenses)} icon={Wallet} tone={totals.income >= totals.expenses ? "blue" : "amber"} detail="Income minus expenses" />
      <Metric label="Average Entry" value={money(totals.count ? (totals.income + totals.expenses) / totals.count : 0)} icon={CalendarDays} tone="amber" detail="Average recorded amount" />
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
      <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-sm sm:p-5"><div className="mb-4"><h2 className="text-lg font-extrabold text-[color:var(--text-strong)]">Daily Income & Expenses</h2><p className="text-sm text-[color:var(--text-secondary)]">Daily totals for {monthName(month)}</p></div><div className="h-[320px] w-full">{daily.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={daily} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)"/><XAxis dataKey="date" tickFormatter={(value) => value.slice(8)} tick={{ fontSize: 11, fill: "var(--text-secondary)" }}/><YAxis tickFormatter={(value) => Number(value).toLocaleString("en-IN")} tick={{ fontSize: 11, fill: "var(--text-secondary)" }}/><Tooltip formatter={(value) => money(value)} labelFormatter={(value) => `Date: ${value}`} contentStyle={{ background: "var(--bg-panel)", borderColor: "var(--border-color)", borderRadius: 12 }}/><Bar dataKey="income" name="Income" fill="#059669" radius={[5, 5, 0, 0]}/><Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[5, 5, 0, 0]}/></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-sm text-[color:var(--text-secondary)]">{loading ? "Loading dashboard..." : "No entries for this period."}</div>}</div></article>
      <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-sm sm:p-5"><h2 className="text-lg font-extrabold text-[color:var(--text-strong)]">Category Breakdown</h2><p className="mb-4 text-sm text-[color:var(--text-secondary)]">Income and expense totals by category</p><div className="space-y-3">{categories.map((item) => <div key={item.category} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3"><div className="mb-2 flex justify-between gap-3"><span className="font-semibold text-[color:var(--text-strong)]">{item.category}</span><span className="text-xs text-[color:var(--text-secondary)]">{money(item.income + item.expenses)}</span></div><div className="flex flex-wrap gap-x-4 gap-y-1 text-xs"><span className="font-semibold text-emerald-600">Income {money(item.income)}</span><span className="font-semibold text-rose-600">Expense {money(item.expenses)}</span></div></div>)}{!categories.length ? <div className="rounded-2xl bg-[var(--bg-soft)] p-6 text-center text-sm text-[color:var(--text-secondary)]">No categories for this period.</div> : null}</div></article>
    </section>

    <section className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-sm"><div className="border-b border-[var(--border-color)] p-4 sm:px-5"><h2 className="text-lg font-extrabold text-[color:var(--text-strong)]">Recent Entries</h2><p className="text-sm text-[color:var(--text-secondary)]">Latest activity in selected period</p></div><div className="overflow-x-auto"><table className="table min-w-[720px]"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>{[...filtered].sort((a, b) => dateKey(b).localeCompare(dateKey(a))).slice(0, 8).map((entry) => <tr key={entry._id}><td>{new Date(`${dateKey(entry)}T00:00:00`).toLocaleDateString("en-IN")}</td><td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${entry.type === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{entry.type === "income" ? "Income" : "Expense"}</span></td><td>{entry.category}</td><td>{entry.description || "-"}</td><td className={`font-bold ${entry.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{money(entry.amount)}</td></tr>)}{!loading && !filtered.length ? <tr><td colSpan="5" className="py-10 text-center text-sm text-[color:var(--text-secondary)]">No entries for this period.</td></tr> : null}</tbody></table></div></section>
  </main>
}
