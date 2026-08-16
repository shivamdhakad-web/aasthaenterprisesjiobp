import {
  ArrowLeft,
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  IndianRupee,
  ReceiptText,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
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

import { getExpenses } from "../../services/expenseApi"

const todayKey = () => new Date().toISOString().slice(0, 10)
const currentMonth = () => todayKey().slice(0, 7)
const numberValue = (value) => Number(value || 0)
const dateKey = (value) => String(value || "").slice(0, 10)
const monthKey = (value) => dateKey(value).slice(0, 7)
const yearKey = (value) => dateKey(value).slice(0, 4)
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const formatCurrency = (value) =>
  `Rs. ${numberValue(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
const formatShortDate = (value) => {
  const key = dateKey(value)
  if (!key) return "-"
  const [year, month, day] = key.split("-")
  return `${day}/${month}/${year}`
}

const chartTooltip = {
  backgroundColor: "var(--bg-panel)",
  border: "1px solid var(--border-color)",
  borderRadius: "12px",
  color: "var(--text-strong)",
  fontSize: "12px",
}

function MetricCard({ label, value, helper, tone, icon: Icon }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-600",
    rose: "border-rose-200 bg-rose-50/60 text-rose-600",
    blue: "border-blue-200 bg-blue-50/60 text-blue-600",
    amber: "border-amber-200 bg-amber-50/60 text-amber-600",
  }

  return (
    <section className={`rounded-2xl border p-4 shadow-[var(--shadow-soft)] ${tones[tone] || tones.emerald}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">{value}</p>
          <p className="mt-1 text-xs font-medium text-[color:var(--text-secondary)]">{helper}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm">
          <Icon size={20} />
        </div>
      </div>
    </section>
  )
}

function ComparisonCard({ label, current, previous, format = formatCurrency }) {
  const change = previous ? ((current - previous) / Math.abs(previous)) * 100 : current ? 100 : 0
  const isUp = change >= 0

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-xl font-black text-[color:var(--text-strong)]">{format(current)}</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${isUp ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
      <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Previous: {format(previous)}</p>
    </div>
  )
}

function ExpenseHealthGauge({ score, label, detail }) {
  const radius = 66
  const circumference = Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <svg className="h-36 w-64 overflow-visible" viewBox="0 0 180 104" aria-label={`Expense health ${score}%`}>
        <path d="M 24,88 A 66,66 0 0,1 156,88" fill="none" stroke="#e2e8f0" strokeWidth="13" strokeLinecap="round" />
        <path d="M 24,88 A 66,66 0 0,1 156,88" fill="none" stroke="url(#expense-health-gradient)" strokeWidth="13" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
        <defs><linearGradient id="expense-health-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" /><stop offset="52%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
      </svg>
      <div className="-mt-16 text-center"><p className="text-3xl font-black text-[color:var(--text-strong)]">{score}%</p><span className="mt-1 inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">{label}</span></div>
      <p className="mt-5 max-w-[230px] text-center text-xs leading-5 text-[color:var(--text-secondary)]">{detail}</p>
    </div>
  )
}

export default function ExpenseDashboardPage() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState({ month: currentMonth(), year: currentMonth().slice(0, 4), fromDate: "", toDate: "" })
  const [viewMode, setViewMode] = useState("monthly")
  const [cashFlowView, setCashFlowView] = useState("monthly")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await getExpenses()
      setExpenses(Array.isArray(result) ? result : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load expense dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredExpenses = useMemo(() => {
    const useRange = Boolean(filters.fromDate || filters.toDate)
    return expenses.filter((entry) => {
      const key = dateKey(entry.date)
      if (!key) return false
      if (useRange) {
        return (!filters.fromDate || key >= filters.fromDate) && (!filters.toDate || key <= filters.toDate)
      }
      return viewMode === "yearly" ? yearKey(entry.date) === filters.year : monthKey(entry.date) === filters.month
    })
  }, [expenses, filters, viewMode])

  const calculateAnalytics = (records) => {
    const total = records.reduce((sum, entry) => sum + numberValue(entry.amount), 0)
    const categoryTotals = records.reduce((totals, entry) => {
      const category = entry.category || "Uncategorized"
      totals[category] = (totals[category] || 0) + numberValue(entry.amount)
      return totals
    }, {})
    const paymentTotals = records.reduce((totals, entry) => {
      const payment = entry.paymentMode || "Other"
      totals[payment] = (totals[payment] || 0) + numberValue(entry.amount)
      return totals
    }, {})
    const days = [...new Set(records.map((entry) => dateKey(entry.date)))].filter(Boolean)
    const largest = [...records].sort((a, b) => numberValue(b.amount) - numberValue(a.amount))[0]
    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    const paymentData = Object.entries(paymentTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    const dailyData = Object.entries(
      records.reduce((totals, entry) => {
        const key = dateKey(entry.date)
        totals[key] = (totals[key] || 0) + numberValue(entry.amount)
        return totals
      }, {}),
    )
      .map(([date, value]) => ({ date, label: formatShortDate(date).slice(0, 5), value }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      total,
      count: records.length,
      average: records.length ? total / records.length : 0,
      activeDays: days.length,
      largest,
      categoryData,
      paymentData,
      dailyData,
      recentEntries: [...records].sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date))).slice(0, 8),
    }
  }

  const analytics = useMemo(() => calculateAnalytics(filteredExpenses), [filteredExpenses])

  const previousExpenses = useMemo(() => {
    const useRange = Boolean(filters.fromDate || filters.toDate)
    if (useRange && filters.fromDate && filters.toDate) {
      const start = new Date(`${filters.fromDate}T00:00:00`)
      const end = new Date(`${filters.toDate}T00:00:00`)
      const duration = end.getTime() - start.getTime()
      const previousEnd = new Date(start.getTime() - 86400000).toISOString().slice(0, 10)
      const previousStart = new Date(start.getTime() - duration - 86400000).toISOString().slice(0, 10)
      return expenses.filter((entry) => {
        const key = dateKey(entry.date)
        return key >= previousStart && key <= previousEnd
      })
    }

    if (viewMode === "yearly") {
      const previousYear = String(Number(filters.year) - 1)
      return expenses.filter((entry) => yearKey(entry.date) === previousYear)
    }

    const [year, month] = filters.month.split("-").map(Number)
    const previousMonth = new Date(year, month - 2, 1).toISOString().slice(0, 7)
    return expenses.filter((entry) => monthKey(entry.date) === previousMonth)
  }, [expenses, filters, viewMode])

  const previousAnalytics = useMemo(() => calculateAnalytics(previousExpenses), [previousExpenses])

  const yearlySpendData = useMemo(() => {
    return monthNames.map((label, index) => {
      const month = `${filters.year}-${String(index + 1).padStart(2, "0")}`
      return {
        label,
        value: expenses.filter((entry) => monthKey(entry.date) === month).reduce((sum, entry) => sum + numberValue(entry.amount), 0),
        active: month === filters.month,
      }
    })
  }, [expenses, filters.month, filters.year])

  const cashFlowData = useMemo(() => {
    if (cashFlowView === "yearly") return yearlySpendData

    const weeklyTotals = [0, 0, 0, 0]
    filteredExpenses.forEach((entry) => {
      const day = Number(dateKey(entry.date).slice(8, 10))
      const index = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3
      weeklyTotals[index] += numberValue(entry.amount)
    })
    return weeklyTotals.map((value, index) => ({ label: `Week ${index + 1}`, value, active: value === Math.max(...weeklyTotals) && value > 0 }))
  }, [cashFlowView, filteredExpenses, yearlySpendData])

  const health = useMemo(() => {
    const expenseGrowth = previousAnalytics.total ? ((analytics.total - previousAnalytics.total) / Math.abs(previousAnalytics.total)) * 100 : 0
    const topCategoryShare = analytics.total && analytics.categoryData[0] ? (analytics.categoryData[0].value / analytics.total) * 100 : 0
    const score = Math.min(100, Math.max(25, Math.round(96 - Math.max(expenseGrowth, 0) * 0.45 - Math.max(topCategoryShare - 55, 0) * 0.32)))
    const label = score >= 80 ? "Controlled" : score >= 60 ? "Watch" : "Attention"
    return { score, label, expenseGrowth, topCategoryShare }
  }, [analytics, previousAnalytics])

  const periodLabel = filters.fromDate || filters.toDate
    ? `${filters.fromDate || "Start"} to ${filters.toDate || "Today"}`
    : viewMode === "yearly"
      ? `Year ${filters.year}`
      : new Date(`${filters.month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  const categoryColors = ["#059669", "#2563eb", "#d97706", "#7c3aed", "#e11d48", "#0891b2"]

  return (
    <main className="w-full max-w-[100vw] overflow-x-hidden p-4 text-[color:var(--text-primary)] sm:p-6">
      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <ChartNoAxesCombined size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">Expense Intelligence</p>
              <h1 className="mt-1 text-2xl font-black text-[color:var(--text-strong)] sm:text-3xl">Expense Dashboard</h1>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Spend trends, category distribution, payment mix, and recent activity.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2.5 text-sm font-bold text-[color:var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/expenses")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-gray-50 shadow-sm transition-colors hover:bg-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to Expenses
            </button>
          </div>
        </div>
      </section>

      {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <section className="mt-4 grid gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-[var(--shadow-soft)] lg:grid-cols-[auto_minmax(0,210px)_minmax(0,210px)_minmax(0,220px)_minmax(0,220px)_auto]">
        <div className="flex self-end rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-1">
          <button type="button" onClick={() => setViewMode("monthly")} className={`rounded-lg px-3 py-2 text-xs font-bold ${viewMode === "monthly" ? "bg-emerald-600 text-white shadow-sm" : "text-[color:var(--text-secondary)]"}`}>Monthly</button>
          <button type="button" onClick={() => setViewMode("yearly")} className={`rounded-lg px-3 py-2 text-xs font-bold ${viewMode === "yearly" ? "bg-emerald-600 text-white shadow-sm" : "text-[color:var(--text-secondary)]"}`}>Yearly</button>
        </div>
        {viewMode === "monthly" ? <label className="grid gap-1 text-xs font-bold text-[color:var(--text-secondary)]">
          Month
          <input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value, year: event.target.value.slice(0, 4), fromDate: "", toDate: "" }))} className="input" />
        </label> : <label className="grid gap-1 text-xs font-bold text-[color:var(--text-secondary)]">
          Year
          <select value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value, fromDate: "", toDate: "" }))} className="input">
            {[...new Set([currentMonth().slice(0, 4), ...expenses.map((entry) => yearKey(entry.date)).filter(Boolean)])].sort().reverse().map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>}
        <label className="grid gap-1 text-xs font-bold text-[color:var(--text-secondary)]">
          From Date
          <input
            type="date"
            value={filters.fromDate}
          onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
            className="input"
          />
        </label>
        <label className="grid gap-1 text-xs font-bold text-[color:var(--text-secondary)]">
          To Date
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
            className="input"
          />
        </label>
        <button
          type="button"
          onClick={() => setFilters({ month: currentMonth(), year: currentMonth().slice(0, 4), fromDate: "", toDate: "" })}
          className="self-end rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 text-sm font-bold text-[color:var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
        >
          Reset Filters
        </button>
      </section>

      <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--text-secondary)]"><CalendarDays size={16} className="text-emerald-600" /> Showing: {periodLabel}</p>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Expense" value={formatCurrency(analytics.total)} helper={`${analytics.count} recorded expenses`} tone="rose" icon={Wallet} />
        <MetricCard label="Average Expense" value={formatCurrency(analytics.average)} helper="Average per recorded expense" tone="blue" icon={IndianRupee} />
        <MetricCard label="Active Days" value={analytics.activeDays.toLocaleString("en-IN")} helper="Days with expense activity" tone="emerald" icon={CalendarDays} />
        <MetricCard label="Largest Expense" value={formatCurrency(analytics.largest?.amount)} helper={analytics.largest?.category || "No expense in this period"} tone="amber" icon={TrendingDown} />
      </section>

      <section className="mt-5 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-[color:var(--text-strong)]">Period Comparison</h2>
            <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Compare this {viewMode === "yearly" ? "year" : "period"} with the immediately previous equivalent period.</p>
          </div>
          <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-bold text-[color:var(--text-secondary)]">Previous period: {previousAnalytics.count} records</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ComparisonCard label="Expense Total" current={analytics.total} previous={previousAnalytics.total} />
          <ComparisonCard label="Expense Records" current={analytics.count} previous={previousAnalytics.count} format={(value) => Number(value || 0).toLocaleString("en-IN")} />
          <ComparisonCard label="Average Expense" current={analytics.average} previous={previousAnalytics.average} />
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-5">
        <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] xl:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[color:var(--text-strong)]">Daily Expense Trend</h2>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">How spending moved across the selected period.</p>
            </div>
            <ReceiptText className="text-emerald-600" size={22} />
          </div>
          <div className="mt-5 h-64">
            {analytics.dailyData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                  <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="#94a3b8" />
                  <Tooltip contentStyle={chartTooltip} formatter={(value) => [formatCurrency(value), "Expense"]} />
                  <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={3} dot={{ r: 3, fill: "#059669" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] xl:col-span-2">
          <h2 className="text-lg font-black text-[color:var(--text-strong)]">Category Breakdown</h2>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Highest spending categories in this period.</p>
          <div className="mt-5 h-64">
            {analytics.categoryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={94} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip contentStyle={chartTooltip} formatter={(value) => [formatCurrency(value), "Expense"]} />
                  <Bar dataKey="value" radius={[0, 7, 7, 0]}>
                    {analytics.categoryData.map((entry, index) => <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-12">
        <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] xl:col-span-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Expense Cash Flow</p>
              <h2 className="mt-1 text-2xl font-black text-[color:var(--text-strong)]">{formatCurrency(cashFlowData.reduce((sum, item) => sum + item.value, 0))}</h2>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">{cashFlowView === "yearly" ? `Month-wise spend for ${filters.year}` : "Weekly spend for the active period"}</p>
            </div>
            <div className="flex rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-1">
              <button type="button" onClick={() => setCashFlowView("monthly")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${cashFlowView === "monthly" ? "bg-[var(--bg-panel)] text-[color:var(--text-strong)] shadow-sm" : "text-[color:var(--text-secondary)]"}`}>Monthly</button>
              <button type="button" onClick={() => setCashFlowView("yearly")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${cashFlowView === "yearly" ? "bg-emerald-600 text-white shadow-sm" : "text-[color:var(--text-secondary)]"}`}>Yearly</button>
            </div>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="#94a3b8" />
                <Tooltip contentStyle={chartTooltip} formatter={(value) => [formatCurrency(value), "Expense"]} />
                <Bar dataKey="value" radius={[7, 7, 0, 0]}>{cashFlowData.map((item) => <Cell key={item.label} fill={item.active ? "#059669" : "#bfe9dc"} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] xl:col-span-3">
          <div><h2 className="text-lg font-black text-[color:var(--text-strong)]">Expense Health Score</h2><p className="mt-1 text-xs text-[color:var(--text-secondary)]">Spending control against the previous period.</p></div>
          <ExpenseHealthGauge score={health.score} label={health.label} detail={`${health.expenseGrowth > 0 ? `${health.expenseGrowth.toFixed(1)}% higher` : `${Math.abs(health.expenseGrowth).toFixed(1)}% lower`} than the previous period. Top category share: ${health.topCategoryShare.toFixed(1)}%.`} />
        </article>

        <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] xl:col-span-4">
          <h2 className="text-lg font-black text-[color:var(--text-strong)]">Expense Share by Category</h2>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Each slice shows category contribution to total expense.</p>
          <div className="mt-2 h-64">
            {analytics.categoryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.categoryData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={58} outerRadius={92} paddingAngle={3} stroke="none">
                    {analytics.categoryData.map((entry, index) => <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltip} formatter={(value) => [formatCurrency(value), "Expense"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[var(--border-color)] pt-3">
            {analytics.categoryData.slice(0, 6).map((item, index) => <div key={item.name} className="flex min-w-0 items-center gap-2 text-xs"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} /><span className="truncate font-semibold text-[color:var(--text-secondary)]">{item.name}</span><span className="ml-auto font-bold text-[color:var(--text-primary)]">{analytics.total ? ((item.value / analytics.total) * 100).toFixed(0) : 0}%</span></div>)}
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-5">
        <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] xl:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[color:var(--text-strong)]">Monthly Spend Overview</h2>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Actual month-wise expense records for {filters.year}.</p>
            </div>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-700">Year view</span>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlySpendData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="#94a3b8" />
                <Tooltip contentStyle={chartTooltip} formatter={(value) => [formatCurrency(value), "Expense"]} />
                <Bar dataKey="value" radius={[7, 7, 0, 0]}>{yearlySpendData.map((entry) => <Cell key={entry.label} fill={entry.active ? "#059669" : "#93c5fd"} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] xl:col-span-2">
          <h2 className="text-lg font-black text-[color:var(--text-strong)]">Spend Signals</h2>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Quick points from the active period.</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-rose-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Peak Expense Day</p><p className="mt-1 text-base font-black text-[color:var(--text-strong)]">{analytics.dailyData.length ? formatShortDate(analytics.dailyData.reduce((highest, item) => item.value > highest.value ? item : highest).date) : "-"}</p><p className="text-sm font-semibold text-rose-700">{analytics.dailyData.length ? formatCurrency(analytics.dailyData.reduce((highest, item) => item.value > highest.value ? item : highest).value) : formatCurrency(0)}</p></div>
            <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Top Category</p><p className="mt-1 text-base font-black text-[color:var(--text-strong)]">{analytics.categoryData[0]?.name || "-"}</p><p className="text-sm font-semibold text-emerald-700">{formatCurrency(analytics.categoryData[0]?.value)}</p></div>
            <div className="rounded-2xl bg-blue-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Daily Spend Average</p><p className="mt-1 text-base font-black text-[color:var(--text-strong)]">{formatCurrency(analytics.activeDays ? analytics.total / analytics.activeDays : 0)}</p><p className="text-xs text-[color:var(--text-secondary)]">Based on active expense days</p></div>
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-5">
        <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[color:var(--text-strong)]">Payment Mix</h2>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Expense distribution by payment method.</p>
            </div>
            <CreditCard className="text-blue-600" size={21} />
          </div>
          <div className="mt-5 space-y-4">
            {analytics.paymentData.length ? analytics.paymentData.map((item) => {
              const percentage = analytics.total ? (item.value / analytics.total) * 100 : 0
              return (
                <div key={item.name}>
                  <div className="flex justify-between gap-4 text-sm"><span className="font-bold text-[color:var(--text-primary)]">{item.name}</span><span className="font-bold text-[color:var(--text-strong)]">{formatCurrency(item.value)}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]"><div className="h-full rounded-full bg-blue-500" style={{ width: `${percentage}%` }} /></div>
                  <p className="mt-1 text-right text-[11px] font-medium text-[color:var(--text-muted)]">{percentage.toFixed(1)}%</p>
                </div>
              )
            }) : <EmptyState />}
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)] xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] px-5 py-4">
            <div><h2 className="text-lg font-black text-[color:var(--text-strong)]">Recent Expenses</h2><p className="mt-1 text-xs text-[color:var(--text-secondary)]">Latest records from the active period.</p></div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">{analytics.count} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-left text-sm">
              <thead className="bg-[var(--bg-soft)] text-[11px] uppercase tracking-wider text-[color:var(--text-muted)]"><tr><th className="px-5 py-3">Date</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Payment</th><th className="px-5 py-3 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {analytics.recentEntries.length ? analytics.recentEntries.map((entry) => <tr key={entry._id || `${entry.date}-${entry.category}-${entry.amount}`} className="hover:bg-[var(--bg-soft)]"><td className="px-5 py-3 font-semibold">{formatShortDate(entry.date)}</td><td className="px-4 py-3">{entry.category || "-"}</td><td className="max-w-[180px] truncate px-4 py-3 text-[color:var(--text-secondary)]">{entry.description || "-"}</td><td className="px-4 py-3">{entry.paymentMode || "-"}</td><td className="px-5 py-3 text-right font-black text-rose-600">{formatCurrency(entry.amount)}</td></tr>) : <tr><td colSpan="5" className="px-5 py-10 text-center text-sm text-[color:var(--text-secondary)]">No expenses found for this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  )
}

function EmptyState() {
  return <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] px-4 text-center text-sm text-[color:var(--text-secondary)]">No expense data is available for this period.</div>
}
