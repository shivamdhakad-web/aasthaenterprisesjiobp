import { Activity, ArrowLeft, Droplets, Fuel, Gauge, RefreshCw, ShieldCheck, TriangleAlert, TrendingDown, TrendingUp } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Area, AreaChart, Bar, BarChart, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { getMduEntries } from "../../services/mduApi"

const todayKey = () => new Date().toISOString().slice(0, 10)
const currentMonth = () => todayKey().slice(0, 7)
const numberValue = (value) => Number(value || 0)
const keyOf = (value) => String(value || "").slice(0, 10)
const monthOf = (value) => keyOf(value).slice(0, 7)
const yearOf = (value) => keyOf(value).slice(0, 4)
const formatNumber = (value) => numberValue(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })
const formatCurrency = (value) => `Rs. ${numberValue(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
const tooltipStyle = { backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRadius: "12px", color: "var(--text-strong)", fontSize: "12px" }

const varianceOf = (entry) => {
  const expected = numberValue(entry.openingStock) + numberValue(entry.decant) - numberValue(entry.sale)
  return numberValue(entry.lossGain ?? numberValue(entry.physicalStock) - expected)
}
const expectedOf = (entry) => numberValue(entry.openingStock) + numberValue(entry.decant) - numberValue(entry.sale)

function Metric({ label, value, detail, tone = "emerald", icon: Icon }) {
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-600",
    sky: "border-sky-200 bg-sky-50/70 text-sky-600",
    amber: "border-amber-200 bg-amber-50/70 text-amber-600",
    rose: "border-rose-200 bg-rose-50/70 text-rose-600",
  }
  return <article className={`rounded-2xl border p-4 shadow-[var(--shadow-soft)] ${toneClasses[tone]}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">{label}</p><p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">{value}</p><p className="mt-1 text-xs font-medium text-[color:var(--text-secondary)]">{detail}</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm"><Icon size={20} /></span></div></article>
}

function ChartLoader() {
  return <div className="flex h-full items-center justify-center text-sm text-[color:var(--text-secondary)]">Loading chart...</div>
}

export default function MduDashboardPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [period, setPeriod] = useState("monthly")
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear] = useState(todayKey().slice(0, 4))
  const [until, setUntil] = useState(todayKey())

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await getMduEntries()
      setEntries(Array.isArray(result) ? result : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load M.D.U data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const years = useMemo(() => [...new Set([todayKey().slice(0, 4), ...entries.map((entry) => yearOf(entry.date)).filter(Boolean)])].sort().reverse(), [entries])
  const filtered = useMemo(() => entries.filter((entry) => {
    const date = keyOf(entry.date)
    return period === "all" ? date <= until : period === "yearly" ? yearOf(date) === year : monthOf(date) === month
  }), [entries, period, month, year, until])
  const ordered = useMemo(() => filtered.slice().sort((a, b) => keyOf(a.date).localeCompare(keyOf(b.date))), [filtered])
  const totals = useMemo(() => filtered.reduce((sum, entry) => ({
    opening: sum.opening + numberValue(entry.openingStock), decant: sum.decant + numberValue(entry.decant), sale: sum.sale + numberValue(entry.sale), variance: sum.variance + varianceOf(entry), impact: sum.impact + varianceOf(entry) * numberValue(entry.rate), revenue: sum.revenue + numberValue(entry.sale) * numberValue(entry.rate), records: sum.records + 1,
  }), { opening: 0, decant: 0, sale: 0, variance: 0, impact: 0, revenue: 0, records: 0 }), [filtered])
  const latest = ordered[ordered.length - 1]
  const averageRate = totals.sale ? totals.revenue / totals.sale : 0
  const varianceRate = (Math.abs(totals.variance) / Math.max(totals.decant + totals.opening, 1)) * 100
  const reconciliationScore = Math.max(0, Math.min(100, Math.round(100 - varianceRate * 35 - Math.min(22, filtered.filter((entry) => Math.abs(varianceOf(entry)) > 10).length * 3))))
  const healthLabel = reconciliationScore >= 90 ? "Excellent control" : reconciliationScore >= 72 ? "Stable control" : reconciliationScore >= 50 ? "Review stock flow" : "Immediate review"

  const trend = useMemo(() => {
    const map = new Map()
    ordered.forEach((entry) => {
      const date = keyOf(entry.date)
      const item = map.get(date) || { date, label: date.slice(8, 10), decant: 0, sale: 0, variance: 0, impact: 0, physical: 0, expected: 0, rateValue: 0, rateQty: 0 }
      item.decant += numberValue(entry.decant)
      item.sale += numberValue(entry.sale)
      item.variance += varianceOf(entry)
      item.impact += varianceOf(entry) * numberValue(entry.rate)
      item.physical = numberValue(entry.physicalStock)
      item.expected = expectedOf(entry)
      item.rateValue += numberValue(entry.rate) * numberValue(entry.sale)
      item.rateQty += numberValue(entry.sale)
      map.set(date, item)
    })
    return [...map.values()].map((item) => ({ ...item, avgRate: item.rateQty ? item.rateValue / item.rateQty : 0 }))
  }, [ordered])
  const alerts = useMemo(() => ordered.map((entry) => ({ ...entry, expected: expectedOf(entry), variance: varianceOf(entry), impact: varianceOf(entry) * numberValue(entry.rate) })).filter((entry) => Math.abs(entry.variance) > 0).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 6), [ordered])
  const selectedLabel = period === "all" ? `All records through ${until}` : period === "yearly" ? `Year ${year}` : new Date(`${month}-01T00:00:00`).toLocaleString("en-IN", { month: "long", year: "numeric" })
  const stockStatus = latest ? [{ label: "Opening", value: latest.openingStock }, { label: "Decant", value: latest.decant }, { label: "Sale", value: latest.sale }, { label: "Expected Close", value: expectedOf(latest) }, { label: "Physical Close", value: latest.physicalStock }] : []

  return <div className="w-full p-4 text-[color:var(--text-primary)] sm:p-6">
    <section className="mb-5 overflow-hidden rounded-2xl border border-emerald-200 bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]"><div className="flex flex-col gap-4 border-l-4 border-emerald-500 px-5 py-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-gray-50 shadow-sm"><Fuel size={22} /></span><div><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Mobile Dispenser Control</p><h1 className="mt-1 text-2xl font-black tracking-tight text-[color:var(--text-strong)]">M.D.U Operations Console</h1><p className="mt-1 text-sm text-[color:var(--text-secondary)]">Monitor stock movement, reconciliation quality, physical stock, and variance risk.</p></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2.5 text-sm font-semibold"><RefreshCw size={16} /> Refresh</button><button type="button" onClick={() => navigate("/admin/mdu")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-gray-50"><ArrowLeft size={16} /> M.D.U Register</button></div></div></section>
    {error ? <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
    <section className="mb-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)]"><div className="flex flex-col gap-3 xl:flex-row xl:items-end"><div className="flex rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-1">{[["monthly", "Monthly"], ["yearly", "Yearly"], ["all", "All Time"]].map(([value, label]) => <button key={value} type="button" onClick={() => setPeriod(value)} className={`rounded-lg px-4 py-2 text-sm font-bold ${period === value ? "bg-emerald-600 text-gray-50 shadow-sm" : "text-[color:var(--text-secondary)]"}`}>{label}</button>)}</div>{period === "monthly" ? <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input min-w-[160px]" /></label> : null}{period === "yearly" ? <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Year<select value={year} onChange={(event) => setYear(event.target.value)} className="input min-w-[130px]">{years.map((item) => <option key={item}>{item}</option>)}</select></label> : null}{period === "all" ? <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Include records through<input type="date" value={until} onChange={(event) => setUntil(event.target.value)} className="input min-w-[180px]" /></label> : null}<p className="text-sm font-semibold text-[color:var(--text-secondary)] xl:ml-auto">{selectedLabel}</p></div></section>
    <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Total Decant" value={`${formatNumber(totals.decant)} L`} detail={`${totals.records} register entries`} tone="sky" icon={Droplets} /><Metric label="Total Sale" value={`${formatNumber(totals.sale)} L`} detail={`Avg rate Rs. ${averageRate.toFixed(2)}`} tone="emerald" icon={TrendingUp} /><Metric label="Net Variance" value={`${formatNumber(totals.variance)} L`} detail={totals.variance >= 0 ? "Positive stock gain" : "Loss needs attention"} tone={totals.variance >= 0 ? "amber" : "rose"} icon={Gauge} /><Metric label="Variance Value" value={formatCurrency(totals.impact)} detail="Rate-adjusted stock impact" tone={totals.impact >= 0 ? "emerald" : "rose"} icon={Activity} /></section>
    <section className="mb-5 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
      <article className="rounded-2xl border border-emerald-200 bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">New: Reconciliation Health</p><h2 className="mt-1 text-xl font-black text-[color:var(--text-strong)]">{healthLabel}</h2><p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">The score checks stock variance against the selected stock movement and flags repeated mismatches.</p></div><ShieldCheck className="text-emerald-600" size={26} /></div><div className="mt-6 flex items-center gap-5"><div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[12px] border-emerald-100"><div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-t-emerald-600 border-r-emerald-600" style={{ transform: `rotate(${Math.max(-118, Math.min(118, (reconciliationScore - 50) * 2.35))}deg)` }} /><span className="text-2xl font-black text-emerald-700">{reconciliationScore}</span></div><div className="space-y-2 text-sm"><p><span className="text-[color:var(--text-muted)]">Variance rate:</span> <strong>{varianceRate.toFixed(2)}%</strong></p><p><span className="text-[color:var(--text-muted)]">Mismatch entries:</span> <strong>{alerts.length}</strong></p><p><span className="text-[color:var(--text-muted)]">Stock impact:</span> <strong>{formatCurrency(totals.impact)}</strong></p></div></div></article>
      <article className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-sky-700">Latest Stock Handoff</p><h2 className="mt-1 text-xl font-black text-[color:var(--text-strong)]">Opening to physical close</h2></div><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{latest ? keyOf(latest.date) : "No entry"}</span></div>{latest ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{stockStatus.map((item, index) => <div key={item.label} className={`rounded-xl p-3 ${index === 4 ? "bg-emerald-600 text-white" : "bg-[var(--bg-soft)]"}`}><p className={`text-[11px] font-bold uppercase tracking-wide ${index === 4 ? "text-emerald-100" : "text-[color:var(--text-muted)]"}`}>{item.label}</p><p className="mt-1 text-lg font-black">{formatNumber(item.value)} L</p></div>)}</div> : <p className="mt-6 text-sm text-[color:var(--text-secondary)]">No M.D.U entries in this period.</p>}<div className="mt-5 flex items-center justify-between border-t border-[var(--border-color)] pt-4 text-sm"><span className="text-[color:var(--text-secondary)]">Latest closing difference</span><strong className={latest && varianceOf(latest) < 0 ? "text-rose-600" : "text-emerald-600"}>{latest ? `${formatNumber(varianceOf(latest))} L` : "-"}</strong></div></article>
    </section>
    <section className="mb-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><article className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-sky-700">Stock Movement</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Decant, sale, and physical close</h2></div><div className="h-72">{loading ? <ChartLoader /> : <ResponsiveContainer width="100%" height="100%"><ComposedChart data={trend}><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis yAxisId="left" tickLine={false} axisLine={false}/><YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false}/><Tooltip contentStyle={tooltipStyle}/><Bar yAxisId="left" dataKey="decant" name="Decant" fill="#0ea5e9" radius={[7,7,0,0]}/><Bar yAxisId="left" dataKey="sale" name="Sale" fill="#10b981" radius={[7,7,0,0]}/><Line yAxisId="right" type="monotone" dataKey="physical" name="Physical Stock" stroke="#7c3aed" strokeWidth={3} dot={false}/></ComposedChart></ResponsiveContainer>}</div></article><article className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Expected vs Actual</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Closing stock discipline</h2></div><div className="h-72">{loading ? <ChartLoader /> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="mduExpected" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity=".35"/><stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/></linearGradient><linearGradient id="mduPhysical" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".3"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient></defs><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="expected" name="Expected Close" stroke="#f59e0b" fill="url(#mduExpected)" strokeWidth={3}/><Area type="monotone" dataKey="physical" name="Physical Close" stroke="#10b981" fill="url(#mduPhysical)" strokeWidth={3}/></AreaChart></ResponsiveContainer>}</div></article></section>
    <section className="mb-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><article className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Rate & Output</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Sale volume against rate</h2></div><div className="h-64">{loading ? <ChartLoader /> : <ResponsiveContainer width="100%" height="100%"><ComposedChart data={trend}><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis yAxisId="left" tickLine={false} axisLine={false}/><YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false}/><Tooltip contentStyle={tooltipStyle}/><Bar yAxisId="left" dataKey="sale" name="Sale" fill="#8b5cf6" radius={[7,7,0,0]}/><Line yAxisId="right" type="monotone" dataKey="avgRate" name="Rate" stroke="#f59e0b" strokeWidth={3}/></ComposedChart></ResponsiveContainer>}</div></article><article className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-rose-700">New: Variance Alert Queue</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Largest stock mismatches to review</h2></div><TriangleAlert className="text-rose-600" size={22}/></div><div className="max-h-64 overflow-y-auto pr-1">{alerts.length ? alerts.map((entry) => <div key={entry._id || `${entry.date}-${entry.remark}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--border-color)] py-3 last:border-0"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${entry.variance < 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>{entry.variance < 0 ? <TrendingDown size={18}/> : <TrendingUp size={18}/>}</span><div><p className="font-bold text-[color:var(--text-strong)]">{keyOf(entry.date)} <span className="font-medium text-[color:var(--text-secondary)]">Expected {formatNumber(entry.expected)} L / Physical {formatNumber(entry.physicalStock)} L</span></p><p className="mt-1 text-xs text-[color:var(--text-secondary)]">Impact {formatCurrency(entry.impact)}{entry.remark ? ` · ${entry.remark}` : ""}</p></div><strong className={entry.variance < 0 ? "text-rose-600" : "text-emerald-600"}>{formatNumber(entry.variance)} L</strong></div>) : <p className="py-8 text-center text-sm text-[color:var(--text-secondary)]">No stock variance alerts for this period.</p>}</div></article></section>
    <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-rose-700">Reconciliation History</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Daily variance in litres</h2></div><div className="h-64">{loading ? <ChartLoader /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={trend}><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="variance" name="Loss / Gain" radius={[7,7,0,0]}>{trend.map((item) => <Cell key={item.date} fill={item.variance < 0 ? "#f43f5e" : "#10b981"}/>)}</Bar></BarChart></ResponsiveContainer>}</div></section>
  </div>
}
