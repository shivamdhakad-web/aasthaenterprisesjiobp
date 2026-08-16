import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CreditCard,
  Gauge,
  Landmark,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { getEntries } from "../../services/cardSwipeApi"

const todayKey = () => new Date().toISOString().slice(0, 10)
const currentMonth = () => todayKey().slice(0, 7)
const numberValue = (value) => Number(value || 0)
const dateKey = (value) => String(value || "").slice(0, 10)
const monthKey = (value) => dateKey(value).slice(0, 7)
const yearKey = (value) => dateKey(value).slice(0, 4)
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const pieColors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ec4899"]
const chartTooltip = {
  backgroundColor: "var(--bg-panel)",
  border: "1px solid var(--border-color)",
  borderRadius: "12px",
  color: "var(--text-strong)",
  fontSize: "12px",
}

const formatCurrency = (value) => `Rs. ${numberValue(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
const formatDate = (value) => {
  const key = dateKey(value)
  if (!key) return "-"
  const [year, month, day] = key.split("-")
  return `${day}/${month}/${year}`
}

function MetricCard({ label, value, helper, tone, icon: Icon }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50/70 text-blue-600",
    teal: "border-teal-200 bg-teal-50/70 text-teal-600",
    violet: "border-violet-200 bg-violet-50/70 text-violet-600",
    amber: "border-amber-200 bg-amber-50/70 text-amber-600",
  }

  return (
    <section className={`rounded-2xl border p-4 shadow-[var(--shadow-soft)] ${tones[tone] || tones.blue}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">{value}</p>
          <p className="mt-1 text-xs font-medium text-[color:var(--text-secondary)]">{helper}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/75 shadow-sm">
          <Icon size={20} />
        </span>
      </div>
    </section>
  )
}

function ChangeLine({ label, current, previous, preferHigher = true }) {
  const change = previous ? ((current - previous) / Math.abs(previous)) * 100 : current ? 100 : 0
  const good = preferHigher ? change >= 0 : change <= 0
  const Icon = change >= 0 ? TrendingUp : TrendingDown

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] py-3 last:border-0">
      <div>
        <p className="text-sm font-semibold text-[color:var(--text-primary)]">{label}</p>
        <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">Previous: {formatCurrency(previous)}</p>
      </div>
      <div className={`inline-flex items-center gap-1 text-sm font-bold ${good ? "text-emerald-600" : "text-rose-600"}`}>
        <Icon size={16} />
        {Math.abs(change).toFixed(1)}%
      </div>
    </div>
  )
}

export default function CardSwipeDashboardPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [mode, setMode] = useState("monthly")
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear] = useState(todayKey().slice(0, 4))
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [machine, setMachine] = useState("all")
  const [payment, setPayment] = useState("all")

  const loadEntries = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getEntries()
      setEntries(Array.isArray(response) ? response : response?.entries || [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load card swipe data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [])

  const machineOptions = useMemo(
    () => [...new Set(entries.map((entry) => entry.machine).filter(Boolean))],
    [entries],
  )
  const paymentOptions = useMemo(
    () => [...new Set(entries.map((entry) => entry.paymentMethod).filter(Boolean))],
    [entries],
  )
  const years = useMemo(
    () => [...new Set([todayKey().slice(0, 4), ...entries.map((entry) => yearKey(entry.date)).filter(Boolean)])].sort().reverse(),
    [entries],
  )

  const applyFilters = (source, period) =>
    source.filter((entry) => {
      const entryDate = dateKey(entry.date)
      const matchesDates = period?.from && period?.to
        ? entryDate >= period.from && entryDate <= period.to
        : fromDate && toDate
          ? entryDate >= fromDate && entryDate <= toDate
          : mode === "yearly"
            ? yearKey(entry.date) === (period?.year || year)
            : monthKey(entry.date) === (period?.month || month)
      return matchesDates
        && (machine === "all" || entry.machine === machine)
        && (payment === "all" || entry.paymentMethod === payment)
    })

  const selectedEntries = useMemo(() => applyFilters(entries), [entries, mode, month, year, fromDate, toDate, machine, payment])

  const previousPeriod = useMemo(() => {
    if (fromDate && toDate) {
      const from = new Date(`${fromDate}T00:00:00`)
      const to = new Date(`${toDate}T00:00:00`)
      const span = Math.max(1, Math.round((to - from) / 86400000) + 1)
      const prevTo = new Date(from)
      prevTo.setDate(prevTo.getDate() - 1)
      const prevFrom = new Date(prevTo)
      prevFrom.setDate(prevFrom.getDate() - span + 1)
      return { from: dateKey(prevFrom), to: dateKey(prevTo) }
    }
    if (mode === "yearly") return { year: String(Number(year) - 1) }
    const base = new Date(`${month}-01T00:00:00`)
    base.setMonth(base.getMonth() - 1)
    return { month: dateKey(base).slice(0, 7) }
  }, [mode, month, year, fromDate, toDate])

  const previousEntries = useMemo(() => applyFilters(entries, previousPeriod), [entries, previousPeriod, mode, month, year, fromDate, toDate, machine, payment])
  const summarize = (source) => source.reduce(
    (summary, entry) => ({
      amount: summary.amount + numberValue(entry.amount),
      charges: summary.charges + numberValue(entry.charges),
      count: summary.count + 1,
    }),
    { amount: 0, charges: 0, count: 0 },
  )
  const summary = useMemo(() => summarize(selectedEntries), [selectedEntries])
  const previousSummary = useMemo(() => summarize(previousEntries), [previousEntries])
  const netSettlement = summary.amount - summary.charges
  const chargeRate = summary.amount ? (summary.charges / summary.amount) * 100 : 0

  const dailyTrend = useMemo(() => {
    const grouped = new Map()
    selectedEntries.forEach((entry) => {
      const key = dateKey(entry.date)
      if (!key) return
      const item = grouped.get(key) || { date: key, amount: 0, charges: 0 }
      item.amount += numberValue(entry.amount)
      item.charges += numberValue(entry.charges)
      grouped.set(key, item)
    })
    return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date)).map((item) => ({ ...item, label: item.date.slice(8, 10) }))
  }, [selectedEntries])

  const machineData = useMemo(() => {
    const grouped = new Map()
    selectedEntries.forEach((entry) => {
      const key = entry.machine || "Unspecified"
      const item = grouped.get(key) || { name: key, amount: 0, charges: 0, count: 0 }
      item.amount += numberValue(entry.amount)
      item.charges += numberValue(entry.charges)
      item.count += 1
      grouped.set(key, item)
    })
    return [...grouped.values()].sort((a, b) => b.amount - a.amount)
  }, [selectedEntries])

  const paymentData = useMemo(() => {
    const grouped = new Map()
    selectedEntries.forEach((entry) => {
      const key = entry.paymentMethod || "Unspecified"
      const item = grouped.get(key) || { name: key, amount: 0, charges: 0, count: 0 }
      item.amount += numberValue(entry.amount)
      item.charges += numberValue(entry.charges)
      item.count += 1
      grouped.set(key, item)
    })
    return [...grouped.values()].sort((a, b) => b.amount - a.amount)
  }, [selectedEntries])

  const timeData = useMemo(() => {
    const buckets = [
      { name: "Morning", amount: 0, count: 0 },
      { name: "Afternoon", amount: 0, count: 0 },
      { name: "Evening", amount: 0, count: 0 },
      { name: "Night", amount: 0, count: 0 },
    ]
    selectedEntries.forEach((entry) => {
      const hour = Number(String(entry.time || "0").split(":")[0])
      const index = hour < 12 ? 0 : hour < 17 ? 1 : hour < 21 ? 2 : 3
      buckets[index].amount += numberValue(entry.amount)
      buckets[index].count += 1
    })
    return buckets
  }, [selectedEntries])

  const clearFilters = () => {
    setMode("monthly")
    setMonth(currentMonth())
    setYear(todayKey().slice(0, 4))
    setFromDate("")
    setToDate("")
    setMachine("all")
    setPayment("all")
  }
  const peakTime = [...timeData].sort((a, b) => b.amount - a.amount)[0]

  return (
    <div className="w-full p-4 text-[color:var(--text-primary)] sm:p-6">
      <section className="mb-5 overflow-hidden rounded-2xl border border-blue-200 bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-blue-50 via-white to-teal-50 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><CreditCard size={22} /></span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Card Swipe Analytics</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[color:var(--text-strong)]">Swipe Control Room</h1>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Track settlement performance, machine activity, and payment behaviour.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadEntries} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm font-semibold"><RefreshCw size={16} /> Refresh</button>
            <button type="button" onClick={() => navigate("/admin/card-swipe")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><ArrowLeft size={16} /> Card Swipe Register</button>
          </div>
        </div>
      </section>

      {error ? <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      <section className="mb-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="flex rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-1">
            {["monthly", "yearly"].map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${mode === item ? "bg-blue-600 text-white shadow-sm" : "text-[color:var(--text-secondary)]"}`}>{item}</button>)}
          </div>
          {mode === "monthly" ? <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Period<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input min-w-[150px]" /></label> : <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Year<select value={year} onChange={(event) => setYear(event.target.value)} className="input min-w-[130px]">{years.map((item) => <option key={item}>{item}</option>)}</select></label>}
          <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">From Date<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="input min-w-[150px]" /></label>
          <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">To Date<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="input min-w-[150px]" /></label>
          <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Machine<select value={machine} onChange={(event) => setMachine(event.target.value)} className="input min-w-[150px]"><option value="all">All Machines</option>{machineOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Payment<select value={payment} onChange={(event) => setPayment(event.target.value)} className="input min-w-[150px]"><option value="all">All Payments</option>{paymentOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button onClick={clearFilters} className="rounded-xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold">Clear</button>
        </div>
      </section>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Swiped" value={formatCurrency(summary.amount)} helper={`${summary.count} transaction${summary.count === 1 ? "" : "s"} selected`} tone="blue" icon={CreditCard} />
        <MetricCard label="Total Charges" value={formatCurrency(summary.charges)} helper={`${chargeRate.toFixed(2)}% effective charge rate`} tone="amber" icon={Banknote} />
        <MetricCard label="Net Settlement" value={formatCurrency(netSettlement)} helper="Swipe value after all charges" tone="teal" icon={Landmark} />
        <MetricCard label="Leading Machine" value={machineData[0]?.name || "-"} helper={machineData[0] ? formatCurrency(machineData[0].amount) : "No transactions"} tone="violet" icon={WalletCards} />
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Settlement Movement</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Swipe volume vs charges</h2></div><CalendarDays className="text-blue-600" size={20} /></div>
          <div className="h-72">{loading ? <ChartLoader /> : <ResponsiveContainer width="100%" height="100%"><LineChart data={dailyTrend}><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltip} formatter={(value) => formatCurrency(value)} /><Line type="monotone" dataKey="amount" name="Swipe Amount" stroke="#2563eb" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="charges" name="Charges" stroke="#f59e0b" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2"><Gauge size={19} className="text-teal-600" /><h2 className="text-lg font-black text-[color:var(--text-strong)]">Period Pulse</h2></div>
          <div className="mt-3 rounded-xl bg-teal-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Net settlement</p><p className="mt-1 text-3xl font-black text-teal-700">{formatCurrency(netSettlement)}</p><p className="mt-1 text-xs text-teal-800">{peakTime?.name || "No peak"} is the highest activity window.</p></div>
          <div className="mt-2"><ChangeLine label="Swipe Amount" current={summary.amount} previous={previousSummary.amount} /><ChangeLine label="Charges" current={summary.charges} previous={previousSummary.charges} preferHigher={false} /><ChangeLine label="Net Settlement" current={netSettlement} previous={previousSummary.amount - previousSummary.charges} /></div>
        </div>
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] xl:col-span-2"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Machine Performance</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Machine leaderboard</h2></div><div className="h-72">{loading ? <ChartLoader /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={machineData} layout="vertical" margin={{ left: 12 }}><XAxis type="number" tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} /><YAxis dataKey="name" type="category" width={70} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltip} formatter={(value) => formatCurrency(value)} /><Bar dataKey="amount" name="Swipe Amount" radius={[0, 8, 8, 0]} fill="#8b5cf6" /></BarChart></ResponsiveContainer>}</div></div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="mb-3"><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Payment Mix</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Method distribution</h2></div><div className="h-44">{loading ? <ChartLoader /> : <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentData} dataKey="amount" nameKey="name" innerRadius={42} outerRadius={67} paddingAngle={3}>{paymentData.map((item, index) => <Cell key={item.name} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip contentStyle={chartTooltip} formatter={(value) => formatCurrency(value)} /></PieChart></ResponsiveContainer>}</div><div className="space-y-2">{paymentData.map((item, index) => <div className="flex items-center justify-between text-sm" key={item.name}><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />{item.name}</span><strong>{formatCurrency(item.amount)}</strong></div>)}</div></div>
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-rose-600">Transaction Timing</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Time of day activity</h2></div><div className="h-60">{loading ? <ChartLoader /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={timeData}><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><Tooltip contentStyle={chartTooltip} formatter={(value) => formatCurrency(value)} /><Bar dataKey="amount" fill="#14b8a6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>}</div></div>
        <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]"><div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Recent Transactions</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Latest swipe activity</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{selectedEntries.length} records</span></div><div className="max-h-72 overflow-auto"><table className="min-w-full text-sm"><thead className="sticky top-0 bg-[var(--bg-soft)] text-left text-xs uppercase tracking-wide text-[color:var(--text-muted)]"><tr><th className="px-5 py-3">Date</th><th className="px-3 py-3">Machine</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Charges</th></tr></thead><tbody>{selectedEntries.slice().sort((a, b) => `${dateKey(b.date)}${b.time || ""}`.localeCompare(`${dateKey(a.date)}${a.time || ""}`)).slice(0, 8).map((entry) => <tr key={entry._id || `${entry.date}-${entry.time}-${entry.amount}`} className="border-t border-[var(--border-color)]"><td className="px-5 py-3 font-medium">{formatDate(entry.date)}<span className="ml-1 text-xs text-[color:var(--text-muted)]">{entry.time || ""}</span></td><td className="px-3 py-3">{entry.machine || "-"}</td><td className="px-3 py-3">{entry.paymentMethod || "-"}</td><td className="px-3 py-3 text-right font-bold">{formatCurrency(entry.amount)}</td><td className="px-5 py-3 text-right text-amber-700">{formatCurrency(entry.charges)}</td></tr>)}{!loading && !selectedEntries.length ? <tr><td colSpan="5" className="px-5 py-8 text-center text-sm text-[color:var(--text-muted)]">No card swipe transactions match these filters.</td></tr> : null}</tbody></table></div></div>
      </section>
    </div>
  )
}

function ChartLoader() {
  return <div className="flex h-full items-center justify-center text-sm font-medium text-[color:var(--text-muted)]">Loading dashboard data...</div>
}
