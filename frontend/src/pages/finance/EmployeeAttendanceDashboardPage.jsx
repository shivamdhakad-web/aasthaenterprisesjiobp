import { ArrowLeft, CalendarDays, CircleDollarSign, Clock3, RefreshCw, UsersRound, WalletCards } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { getAttendance } from "../../services/attendanceApi"
import { getEmployees } from "../../services/employeeApi"

const todayKey = () => new Date().toISOString().slice(0, 10)
const currentMonth = () => todayKey().slice(0, 7)
const numberValue = (value) => Number(value || 0)
const keyOf = (value) => String(value || "").slice(0, 10)
const monthOf = (value) => keyOf(value).slice(0, 7)
const yearOf = (value) => keyOf(value).slice(0, 4)
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#f43f5e"]
const chartTooltip = { backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRadius: "12px", color: "var(--text-strong)", fontSize: "12px" }

const formatCurrency = (value) => `Rs. ${numberValue(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
const daysInEntryMonth = (date) => {
  const [year, month] = keyOf(date).split("-").map(Number)
  return year && month ? new Date(year, month, 0).getDate() : 30
}

function calculateEmployee(employee, entries) {
  const salary = numberValue(employee?.salary)
  return entries.reduce((result, entry) => {
    const perDay = salary / daysInEntryMonth(entry.date)
    const status = entry.status || "present"
    const units = status === "double" ? 2 : status === "present_half" ? 1.5 : status === "half" ? 0.5 : status === "present" ? 1 : 0
    result.earned += perDay * units
    result.bonus += numberValue(entry.bonusAmount)
    result.shortage += numberValue(entry.shortage)
    result.advance += numberValue(entry.advanceCash) + numberValue(entry.advancePetrol)
    result[status] = (result[status] || 0) + 1
    result.records += 1
    return result
  }, { earned: 0, bonus: 0, shortage: 0, advance: 0, records: 0, present: 0, present_half: 0, half: 0, absent: 0, double: 0 })
}

function MetricCard({ label, value, helper, tone, icon: Icon }) {
  const tones = { blue: "border-blue-200 bg-blue-50/70 text-blue-600", teal: "border-teal-200 bg-teal-50/70 text-teal-600", violet: "border-violet-200 bg-violet-50/70 text-violet-600", rose: "border-rose-200 bg-rose-50/70 text-rose-600" }
  return <section className={`rounded-2xl border p-4 shadow-[var(--shadow-soft)] ${tones[tone] || tones.blue}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">{label}</p><p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">{value}</p><p className="mt-1 text-xs font-medium text-[color:var(--text-secondary)]">{helper}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/75 shadow-sm"><Icon size={20} /></span></div></section>
}

export default function EmployeeAttendanceDashboardPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [attendanceByEmployee, setAttendanceByEmployee] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rangeMode, setRangeMode] = useState("monthly")
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear] = useState(todayKey().slice(0, 4))
  const [throughDate, setThroughDate] = useState(todayKey())

  const loadData = async () => {
    setLoading(true); setError("")
    try {
      const employeeData = await getEmployees()
      const list = Array.isArray(employeeData) ? employeeData : []
      const pairs = await Promise.all(list.map(async (employee) => {
        try { return [employee._id, await getAttendance(employee._id)] } catch { return [employee._id, []] }
      }))
      setEmployees(list)
      setAttendanceByEmployee(Object.fromEntries(pairs.map(([id, rows]) => [id, Array.isArray(rows) ? rows : []])))
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load employees and attendance.")
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const years = useMemo(() => [...new Set([todayKey().slice(0, 4), ...Object.values(attendanceByEmployee).flat().map((entry) => yearOf(entry.date)).filter(Boolean)])].sort().reverse(), [attendanceByEmployee])
  const inRange = (entry) => {
    const date = keyOf(entry.date)
    if (rangeMode === "all") return date <= throughDate
    if (rangeMode === "yearly") return yearOf(date) === year
    return monthOf(date) === month
  }
  const employeeRows = useMemo(() => employees.map((employee) => {
    const all = attendanceByEmployee[employee._id] || []
    const selected = all.filter(inRange)
    const data = calculateEmployee(employee, selected)
    const final = Math.round(data.earned + data.bonus + data.shortage - data.advance)
    return { employee, entries: selected, ...data, final, earned: Math.round(data.earned), active: selected.length > 0 }
  }), [employees, attendanceByEmployee, rangeMode, month, year, throughDate])
  const totals = useMemo(() => employeeRows.reduce((result, row) => ({ earned: result.earned + row.earned, bonus: result.bonus + row.bonus, advance: result.advance + row.advance, shortage: result.shortage + row.shortage, final: result.final + row.final, records: result.records + row.records, active: result.active + (row.active ? 1 : 0) }), { earned: 0, bonus: 0, advance: 0, shortage: 0, final: 0, records: 0, active: 0 }), [employeeRows])
  const statusData = useMemo(() => {
    const totalsByStatus = { present: 0, present_half: 0, half: 0, absent: 0, double: 0 }
    employeeRows.forEach((row) => Object.keys(totalsByStatus).forEach((key) => { totalsByStatus[key] += row[key] || 0 }))
    return [{ name: "Present", value: totalsByStatus.present }, { name: "Present + Half", value: totalsByStatus.present_half }, { name: "Half Shift", value: totalsByStatus.half }, { name: "Absent", value: totalsByStatus.absent }, { name: "Double Shift", value: totalsByStatus.double }].filter((item) => item.value)
  }, [employeeRows])
  const payrollData = useMemo(() => employeeRows.filter((row) => row.records).sort((a, b) => b.final - a.final).slice(0, 8).map((row) => ({ name: row.employee.name?.split(" ")[0] || "Employee", earned: row.earned + row.bonus, advance: row.advance, final: row.final })), [employeeRows])
  const attendanceGrid = useMemo(() => employeeRows.filter((row) => row.records).sort((a, b) => b.records - a.records).slice(0, 10), [employeeRows])
  const periodLabel = rangeMode === "all" ? `All records through ${throughDate}` : rangeMode === "yearly" ? `Year ${year}` : new Date(`${month}-01T00:00:00`).toLocaleString("en-IN", { month: "long", year: "numeric" })

  return <div className="w-full p-4 text-[color:var(--text-primary)] sm:p-6">
    <section className="mb-5 overflow-hidden rounded-2xl border border-violet-200 bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]"><div className="flex flex-col gap-4 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-5 py-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-gray-50 shadow-sm"><UsersRound size={22} /></span><div><p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">Workforce Intelligence</p><h1 className="mt-1 text-2xl font-black tracking-tight text-[color:var(--text-strong)]">Attendance & Payroll Pulse</h1><p className="mt-1 text-sm text-[color:var(--text-secondary)]">Monitor attendance patterns, payroll movements, advances, and employee balances.</p></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm font-semibold"><RefreshCw size={16} /> Refresh</button><button type="button" onClick={() => navigate("/admin/employees")} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-gray-50"><ArrowLeft size={16} /> Employees & Attendance</button></div></div></section>
    {error ? <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
    <section className="mb-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)]"><div className="flex flex-col gap-3 xl:flex-row xl:items-end"><div className="flex flex-wrap rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-gray-50 p-1">{[["monthly", "Monthly"], ["yearly", "Yearly"], ["all", "All Time"]].map(([value, label]) => <button key={value} onClick={() => setRangeMode(value)} className={`rounded-lg px-4 py-2 text-sm font-bold ${rangeMode === value ? "bg-violet-600 text-gray-50 shadow-sm" : "text-[color:var(--text-secondary)]"}`}>{label}</button>)}</div>{rangeMode === "monthly" ? <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input min-w-[160px]" /></label> : null}{rangeMode === "yearly" ? <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Year<select value={year} onChange={(event) => setYear(event.target.value)} className="input min-w-[140px]">{years.map((item) => <option key={item}>{item}</option>)}</select></label> : null}{rangeMode === "all" ? <label className="grid gap-1 text-xs font-semibold text-[color:var(--text-muted)]">Include records through<input type="date" value={throughDate} onChange={(event) => setThroughDate(event.target.value)} className="input min-w-[180px]" /></label> : null}<p className="text-sm font-semibold text-[color:var(--text-secondary)] xl:ml-auto">{periodLabel}</p></div></section>
    <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricCard label="Active Employees" value={`${totals.active}/${employees.length}`} helper={`${totals.records} attendance records`} tone="blue" icon={UsersRound} /><MetricCard label="Earned + Bonus" value={formatCurrency(totals.earned + totals.bonus)} helper={`Bonus: ${formatCurrency(totals.bonus)}`} tone="teal" icon={CircleDollarSign} /><MetricCard label="Total Advances" value={formatCurrency(totals.advance)} helper={`Shortage adjustment: ${formatCurrency(totals.shortage)}`} tone="rose" icon={WalletCards} /><MetricCard label="Final Balance" value={formatCurrency(totals.final)} helper="Earned + bonus + shortage - advance" tone="violet" icon={Clock3} /></section>
    <section className="mb-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="mb-2"><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Attendance Composition</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Shift status mix</h2></div><div className="h-64">{loading ? <Loader /> : <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" outerRadius={88} innerRadius={42} paddingAngle={3}>{statusData.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={chartTooltip} /></PieChart></ResponsiveContainer>}</div><div className="grid grid-cols-2 gap-2">{statusData.map((item, index) => <div key={item.name} className="flex items-center gap-2 text-xs font-semibold"><i className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />{item.name}: {item.value}</div>)}</div></div><div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-teal-600">Payroll Ranking</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Top employee balances</h2></div><div className="h-72">{loading ? <Loader /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={payrollData}><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltip} formatter={(value) => formatCurrency(value)} /><Bar dataKey="earned" name="Earned + Bonus" fill="#14b8a6" radius={[7, 7, 0, 0]} /><Bar dataKey="advance" name="Advance" fill="#f43f5e" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer>}</div></div></section>
    <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]"><div className="flex flex-col gap-2 border-b border-[var(--border-color)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Workforce Board</p><h2 className="mt-1 text-lg font-black text-[color:var(--text-strong)]">Employee attendance and balance overview</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{attendanceGrid.length} active employees</span></div><div className="overflow-x-auto"><table className="min-w-[820px] w-full text-sm"><thead className="bg-[var(--bg-soft)] text-left text-xs uppercase tracking-wide text-[color:var(--text-muted)]"><tr><th className="px-5 py-3">Employee</th><th className="px-3 py-3">Present</th><th className="px-3 py-3">Half / Double</th><th className="px-3 py-3">Absent</th><th className="px-3 py-3 text-right">Earned + Bonus</th><th className="px-3 py-3 text-right">Advance</th><th className="px-5 py-3 text-right">Final Balance</th></tr></thead><tbody>{attendanceGrid.map((row) => <tr key={row.employee._id} className="border-t border-[var(--border-color)]"><td className="px-5 py-3"><p className="font-bold">{row.employee.name}</p><p className="text-xs text-[color:var(--text-muted)]">{row.employee.role || "Employee"}</p></td><td className="px-3 py-3">{row.present + row.present_half}</td><td className="px-3 py-3">{row.half} / {row.double}</td><td className="px-3 py-3">{row.absent}</td><td className="px-3 py-3 text-right font-semibold text-teal-700">{formatCurrency(row.earned + row.bonus)}</td><td className="px-3 py-3 text-right text-rose-700">{formatCurrency(row.advance)}</td><td className={`px-5 py-3 text-right font-black ${row.final >= 0 ? "text-violet-700" : "text-rose-700"}`}>{formatCurrency(row.final)}</td></tr>)}{!loading && !attendanceGrid.length ? <tr><td colSpan="7" className="px-5 py-10 text-center text-sm text-[color:var(--text-muted)]">No attendance records match this period.</td></tr> : null}</tbody></table></div></section>
  </div>
}

function Loader() { return <div className="flex h-full items-center justify-center text-sm font-medium text-[color:var(--text-muted)]">Loading workforce data...</div> }
