import React, { useEffect, useMemo, useState } from "react"
import {
  Activity,
  BadgeIndianRupee,
  CalendarDays,
  CreditCard,
  Droplets,
  FileText,
  Fuel,
  Receipt,
  RefreshCw,
  Truck,
  Users,
  Wallet,
} from "lucide-react"

import { getAttendance } from "../../services/attendanceApi"
import { getEntries as getCardSwipeEntries } from "../../services/cardSwipeApi"
import { getCustomerLedger, getCustomers } from "../../services/customerApi"
import { getDailySales } from "../../services/dailySaleApi"
import { getDcdEntries } from "../../services/dcdApi"
import { getEmployees } from "../../services/employeeApi"
import { getExpenses } from "../../services/expenseApi"
import { getInvoiceDetails } from "../../services/invoiceDetailApi"
import { getLubricants } from "../../services/lubricantApi"
import * as campaApi from "../../services/campaApi"
import { getMduEntries } from "../../services/mduApi"

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const dateKey = (value) => String(value || "").slice(0, 10)
const numberValue = (value) => Number(value || 0)
const sum = (items, selector) => (items || []).reduce((total, item) => total + numberValue(selector(item)), 0)
const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })

function formatDate(value) {
  const key = dateKey(value)
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : key || "Undated"
}

function MetricPill({ label, value, tone = "emerald" }) {
  const tones = {
    emerald: { panel: "border-emerald-200/70 bg-emerald-50/80 dark:border-emerald-500/25 dark:bg-emerald-500/10", value: "text-emerald-600" },
    blue: { panel: "border-blue-200/70 bg-blue-50/80 dark:border-blue-500/25 dark:bg-blue-500/10", value: "text-blue-600" },
    amber: { panel: "border-amber-200/70 bg-amber-50/80 dark:border-amber-500/25 dark:bg-amber-500/10", value: "text-amber-600" },
    rose: { panel: "border-rose-200/70 bg-rose-50/80 dark:border-rose-500/25 dark:bg-rose-500/10", value: "text-rose-600" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80 dark:border-violet-500/25 dark:bg-violet-500/10", value: "text-violet-600" },
    cyan: { panel: "border-cyan-200/70 bg-cyan-50/80 dark:border-cyan-500/25 dark:bg-cyan-500/10", value: "text-cyan-600" },
  }
  const current = tones[tone] || tones.emerald

  return (
    <div className={`min-w-0 rounded-lg border px-2.5 py-1.5 ${current.panel}`}>
      <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.1em] text-[color:var(--text-secondary)]">{label}</p>
      <p className={`mt-0.5 truncate text-[11px] font-black ${current.value}`}>{value}</p>
    </div>
  )
}

function SummaryCard({ label, value, helper, tone = "emerald" }) {
  const tones = {
    emerald: { panel: "border-emerald-200/70 bg-emerald-50/80", value: "text-emerald-600" },
    rose: { panel: "border-rose-200/70 bg-rose-50/80", value: "text-rose-600" },
    blue: { panel: "border-blue-200/70 bg-blue-50/80", value: "text-blue-600" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80", value: "text-violet-600" },
    amber: { panel: "border-amber-200/70 bg-amber-50/80", value: "text-amber-600" },
  }
  const current = tones[tone] || tones.emerald

  return (
    <article className={`min-w-0 rounded-2xl border p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] ${current.panel}`}>
      <p className="text-[13px] font-semibold tracking-[0.18em] text-[color:var(--text-secondary)]">{label}</p>
      <p className={`mt-3 truncate text-2xl font-extrabold ${current.value}`}>{value}</p>
      <p className="mt-1 truncate text-[10px] font-medium text-[color:var(--text-secondary)]">{helper}</p>
    </article>
  )
}

function ScrollList({ entries, emptyText }) {
  if (!entries.length) {
    return (
      <div className="flex min-h-16 items-center justify-center rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-4 text-center text-[11px] font-semibold text-[color:var(--text-secondary)]">
        {emptyText}
      </div>
    )
  }

  const groups = entries.reduce((result, entry) => {
    const key = dateKey(entry.date) || "undated"
    if (!result.has(key)) result.set(key, [])
    result.get(key).push(entry)
    return result
  }, new Map())

  return (
    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
      {[...groups.entries()].map(([date, items]) => (
        <div key={date}>
          <div className="sticky top-0 z-[1] mb-1 rounded-md border border-emerald-100 bg-emerald-50/95 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 backdrop-blur dark:border-emerald-500/20 dark:bg-emerald-700 dark:text-amber-50">
            {date === "undated" ? "Date not provided" : formatDate(date)}
          </div>
          <div className="space-y-1.5">
            {items.map((entry, index) => (
              <div key={entry.id || `${date}-${entry.title}-${index}`} className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-[color:var(--text-strong)]">{entry.title}</p>
                  {entry.meta ? <p className="truncate text-[10px] text-[color:var(--text-secondary)]">{entry.meta}</p> : null}
                </div>
                <p className="shrink-0 text-[11px] font-bold text-[color:var(--text-strong)]">{entry.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ModuleCard({ icon, title, subtitle, value, helper, tone, metrics, entries, emptyText }) {
  const iconTones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
    violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-300",
  }

  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2.5">
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${iconTones[tone] || iconTones.emerald}`}>{React.createElement(icon, { size: 16 })}</div>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{subtitle}</p>
          <h2 className="truncate text-sm font-bold text-[color:var(--text-strong)]">{title}</h2>
        </div>
      </div>
      <div className="mt-2.5 border-b border-[var(--border-color)] pb-2">
        <p className="truncate text-lg font-black text-[color:var(--text-strong)]">{value}</p>
        <p className="truncate text-[10px] font-medium text-[color:var(--text-secondary)]">{helper}</p>
      </div>
      <div className="my-2 grid grid-cols-2 gap-1.5">
        {metrics.map((metric) => <MetricPill key={metric.label} {...metric} />)}
      </div>
      <ScrollList entries={entries} emptyText={emptyText} />
    </section>
  )
}

function EmployeeCard({ employee, attendance }) {
  const presentCount = attendance.filter((item) => ["present", "present_half", "half", "double"].includes(item.status)).length
  const absentCount = attendance.filter((item) => item.status === "absent").length
  const shortage = sum(attendance, (item) => item.shortage)
  const advance = sum(attendance, (item) => numberValue(item.advanceCash) + numberValue(item.advancePetrol))
  const bonus = sum(attendance, (item) => item.bonusAmount)
  const entries = attendance.map((item, index) => ({
    id: item._id || `${item.date}-${index}`,
    date: item.date,
    title: item.status || "Present",
    meta: `Shortage ${formatCurrency(item.shortage)} · Advance ${formatCurrency(numberValue(item.advanceCash) + numberValue(item.advancePetrol))} · Bonus ${formatCurrency(item.bonusAmount)}`,
    value: item.role || "Staff",
  }))

  return (
    <article className="min-w-0 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><h3 className="truncate text-xs font-extrabold text-[color:var(--text-strong)]">{employee.name || "Employee"}</h3><p className="mt-0.5 text-[10px] text-[color:var(--text-secondary)]">{presentCount} present · {absentCount} absent · {attendance.length} marked</p></div>
        <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-1 text-[9px] font-bold capitalize text-emerald-700 dark:text-emerald-300">{employee.role || "Staff"}</span>
      </div>
      <div className="my-2 grid grid-cols-3 gap-1">
        <MetricPill label="Shortage" value={formatCurrency(shortage)} tone="rose" />
        <MetricPill label="Advance" value={formatCurrency(advance)} tone="amber" />
        <MetricPill label="Bonus" value={formatCurrency(bonus)} tone="emerald" />
      </div>
      <div className="max-h-[210px] space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {entries.length ? entries.map((entry) => (
          <div key={entry.id} className="rounded-md border border-[var(--border-color)] bg-[var(--bg-panel)] px-2 py-1.5">
            <p className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300">{formatDate(entry.date)}</p>
            <div className="mt-0.5 flex items-start justify-between gap-1.5"><p className="text-[10px] font-bold capitalize text-[color:var(--text-strong)]">{entry.title}</p><p className="text-right text-[9px] text-[color:var(--text-secondary)]">{entry.value}</p></div>
            <p className="mt-0.5 text-[9px] text-[color:var(--text-secondary)]">{entry.meta}</p>
          </div>
        )) : <p className="rounded-md border border-dashed border-[var(--border-color)] px-2 py-3 text-center text-[10px] text-[color:var(--text-secondary)]">No attendance records this month.</p>}
      </div>
    </article>
  )
}

export default function MonthlySnapshotPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState({
    expenses: [], employees: [], attendance: [], cardSwipe: [], lubricants: [], campa: [], mdu: [], dailySales: [], dcd: [], invoices: [], ledger: [],
  })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [expenses, employees, cardSwipe, lubricants, campa, mdu, dailySales, dcd, invoices, customers] = await Promise.all([
        getExpenses(), getEmployees(), getCardSwipeEntries(), getLubricants(), campaApi.getSales(), getMduEntries(), getDailySales(), getDcdEntries(), getInvoiceDetails(), getCustomers(),
      ])

      const [attendanceGroups, ledgerGroups] = await Promise.all([
        Promise.all((employees || []).map(async (employee) => {
          try {
            const records = await getAttendance(employee._id)
            return (records || []).map((item) => ({ ...item, employeeId: employee._id, employeeName: employee.name, employeeRole: employee.role }))
          } catch {
            return []
          }
        })),
        Promise.all((customers || []).map(async (customer) => {
          try {
            const records = await getCustomerLedger(customer._id)
            return (records || []).map((item) => ({ ...item, customerId: customer._id, customerName: customer.name }))
          } catch {
            return []
          }
        })),
      ])

      setData({
        expenses: expenses || [], employees: employees || [], attendance: attendanceGroups.flat(), cardSwipe: cardSwipe || [],
        lubricants: lubricants || [], campa: campa || [], mdu: mdu || [], dailySales: dailySales || [], dcd: dcd || [], invoices: invoices || [], ledger: ledgerGroups.flat(),
      })
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load monthly snapshot.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const snapshot = useMemo(() => {
    const inMonth = (items) => (items || []).filter((item) => dateKey(item.date).slice(0, 7) === selectedMonth)
    const expenses = inMonth(data.expenses)
    const attendance = inMonth(data.attendance)
    const cardSwipe = inMonth(data.cardSwipe)
    const lubricants = inMonth(data.lubricants)
    const campa = inMonth(data.campa)
    const mdu = inMonth(data.mdu)
    const dailySales = inMonth(data.dailySales)
    const dcd = inMonth(data.dcd)
    const invoices = inMonth(data.invoices)
    const ledger = inMonth(data.ledger)

    const expenseTotal = sum(expenses, (item) => item.amount)
    const cardSwipeAmount = sum(cardSwipe, (item) => item.amount)
    const cardSwipeCharges = sum(cardSwipe, (item) => item.charges)
    const lubricantTotal = sum(lubricants, (item) => item.total)
    const lubricantProfit = sum(lubricants, (item) => item.totalProfit)
    const campaTotal = sum(campa, (item) => item.total)
    const campaProfit = sum(campa, (item) => item.totalProfit)
    const mduSale = sum(mdu, (item) => item.sale)
    const mduValue = sum(mdu, (item) => numberValue(item.sale) * numberValue(item.rate))
    const dailySaleValue = sum(dailySales, (item) => numberValue(item.sale) * numberValue(item.rate))
    const dailySaleProfit = sum(dailySales, (item) => item.profit)
    const dcdProfit = sum(dcd, (item) => item.profit)
    const dcdVolume = sum(dcd, (item) => item.volume)
    const invoicePurchase = sum(invoices, (item) => item.purchaseAmount || item.invoiceAmount)
    const creditFuel = sum(ledger.filter((item) => item.type === "fuel"), (item) => item.amount)
    const creditPayment = sum(ledger.filter((item) => item.type === "payment"), (item) => item.payment)
    const presentCount = attendance.filter((item) => ["present", "present_half", "half", "double"].includes(item.status)).length
    const absentCount = attendance.filter((item) => item.status === "absent").length
    const bonusTotal = sum(attendance, (item) => item.bonusAmount)
    const shortageTotal = sum(attendance, (item) => item.shortage)
    const advanceTotal = sum(attendance, (item) => numberValue(item.advanceCash) + numberValue(item.advancePetrol))
    const totalEntries = expenses.length + attendance.length + cardSwipe.length + lubricants.length + campa.length + mdu.length + dailySales.length + dcd.length + invoices.length + ledger.length
    const totalIncome = cardSwipeAmount + lubricantTotal + campaTotal + mduValue + dailySaleValue + dcdProfit + creditPayment
    const netCash = totalIncome - expenseTotal - cardSwipeCharges - creditFuel
    const activeDays = new Set([
      ...expenses, ...attendance, ...cardSwipe, ...lubricants, ...campa, ...mdu, ...dailySales, ...dcd, ...invoices, ...ledger,
    ].map((item) => dateKey(item.date)).filter(Boolean)).size

    return {
      expenses, attendance, cardSwipe, lubricants, campa, mdu, dailySales, dcd, invoices, ledger,
      expenseTotal, cardSwipeAmount, cardSwipeCharges, lubricantTotal, lubricantProfit, campaTotal, campaProfit, mduSale, mduValue,
      dailySaleValue, dailySaleProfit, dcdProfit, dcdVolume, invoicePurchase, creditFuel, creditPayment,
      presentCount, absentCount, bonusTotal, shortageTotal, advanceTotal, totalEntries, totalIncome, netCash, activeDays,
    }
  }, [data, selectedMonth])

  const attendanceByEmployee = useMemo(() => {
    const grouped = new Map()
    snapshot.attendance.forEach((item) => {
      const key = item.employeeId || item.employeeName
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key).push(item)
    })
    grouped.forEach((items) => items.sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date))))
    return grouped
  }, [snapshot.attendance])

  const orderedEntries = (items, mapper) => [...items]
    .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
    .map((item, index) => ({ id: item._id || `${dateKey(item.date)}-${index}`, date: item.date, ...mapper(item) }))

  const moduleCards = [
    {
      title: "Expenses", subtitle: "Station spend", icon: Wallet, tone: "rose", value: formatCurrency(snapshot.expenseTotal),
      helper: `${snapshot.expenses.length} expense entries`,
      metrics: [{ label: "Largest", value: formatCurrency(Math.max(0, ...snapshot.expenses.map((item) => numberValue(item.amount)))), tone: "rose" }, { label: "Categories", value: `${new Set(snapshot.expenses.map((item) => item.category).filter(Boolean)).size}`, tone: "amber" }],
      entries: orderedEntries(snapshot.expenses, (item) => ({ title: item.category || "Expense", meta: item.description || item.paymentMode || "Station expense", value: formatCurrency(item.amount) })), empty: "No expenses this month.",
    },
    {
      title: "Lubricants", subtitle: "Lubricant sales", icon: Droplets, tone: "amber", value: formatCurrency(snapshot.lubricantTotal),
      helper: `${formatCurrency(snapshot.lubricantProfit)} profit · ${snapshot.lubricants.length} sales`,
      metrics: [{ label: "Profit", value: formatCurrency(snapshot.lubricantProfit) }, { label: "Units", value: formatNumber(sum(snapshot.lubricants, (item) => item.quantity)), tone: "amber" }],
      entries: orderedEntries(snapshot.lubricants, (item) => ({ title: item.product || "Product", meta: `${formatNumber(item.quantity)} qty · ${item.soldBy || "Seller"}`, value: formatCurrency(item.total) })), empty: "No lubricant sales this month.",
    },
    {
      title: "Campa", subtitle: "Campa sales", icon: Droplets, tone: "rose", value: formatCurrency(snapshot.campaTotal),
      helper: `${formatCurrency(snapshot.campaProfit)} profit · ${snapshot.campa.length} sales`,
      metrics: [{ label: "Profit", value: formatCurrency(snapshot.campaProfit), tone: "rose" }, { label: "Units", value: formatNumber(sum(snapshot.campa, (item) => item.quantity)), tone: "amber" }],
      entries: orderedEntries(snapshot.campa, (item) => ({ title: item.product || "Campa product", meta: `${formatNumber(item.quantity)} qty · ${item.soldBy || "Seller"}`, value: formatCurrency(item.total) })), empty: "No Campa sales this month.",
    },
    {
      title: "D.C.D", subtitle: "D.C.D entries", icon: Receipt, tone: "violet", value: formatCurrency(snapshot.dcdProfit),
      helper: `${formatNumber(snapshot.dcdVolume)} volume · ${snapshot.dcd.length} entries`,
      metrics: [{ label: "Profit", value: formatCurrency(snapshot.dcdProfit), tone: "violet" }, { label: "Volume", value: `${formatNumber(snapshot.dcdVolume)} L`, tone: "cyan" }],
      entries: orderedEntries(snapshot.dcd, (item) => ({ title: item.product || "D.C.D", meta: `${formatNumber(item.volume)} L · ${item.shift || "Shift"}`, value: formatCurrency(item.profit) })), empty: "No D.C.D entries this month.",
    },
    {
      title: "Daily Sales", subtitle: "Fuel day sheet", icon: Fuel, tone: "emerald", value: formatCurrency(snapshot.dailySaleValue),
      helper: `${formatCurrency(snapshot.dailySaleProfit)} profit · ${snapshot.dailySales.length} entries`,
      metrics: [{ label: "Profit", value: formatCurrency(snapshot.dailySaleProfit) }, { label: "Volume", value: `${formatNumber(sum(snapshot.dailySales, (item) => item.sale))} L`, tone: "amber" }],
      entries: orderedEntries(snapshot.dailySales, (item) => ({ title: item.product || "Fuel", meta: `${formatNumber(item.sale)} L · Rate ${formatCurrency(item.rate)}`, value: formatCurrency(numberValue(item.sale) * numberValue(item.rate)) })), empty: "No daily sales this month.",
    },
    {
      title: "Card Swipe", subtitle: "Swipe register", icon: CreditCard, tone: "blue", value: formatCurrency(snapshot.cardSwipeAmount),
      helper: `${formatCurrency(snapshot.cardSwipeCharges)} charges · ${snapshot.cardSwipe.length} entries`,
      metrics: [{ label: "Net", value: formatCurrency(snapshot.cardSwipeAmount - snapshot.cardSwipeCharges) }, { label: "Charges", value: formatCurrency(snapshot.cardSwipeCharges), tone: "amber" }],
      entries: orderedEntries(snapshot.cardSwipe, (item) => ({ title: item.machine || "Machine", meta: `${item.paymentMethod || "Payment"}${item.time ? ` · ${item.time}` : ""}`, value: formatCurrency(item.amount) })), empty: "No card swipe entries this month.",
    },
    {
      title: "Invoice Details", subtitle: "Purchase view", icon: FileText, tone: "blue", value: formatCurrency(snapshot.invoicePurchase),
      helper: `${snapshot.invoices.length} invoice records`,
      metrics: [{ label: "Invoices", value: `${snapshot.invoices.length}`, tone: "blue" }, { label: "Purchase", value: formatCurrency(snapshot.invoicePurchase), tone: "amber" }],
      entries: orderedEntries(snapshot.invoices, (item) => ({ title: item.product || "Invoice", meta: `${formatNumber(item.qty)} qty · RSP ${formatCurrency(item.rsp)}`, value: formatCurrency(item.purchaseAmount || item.invoiceAmount) })), empty: "No invoices this month.",
    },
    {
      title: "M.D.U", subtitle: "Mobile dispenser", icon: Truck, tone: "cyan", value: `${formatNumber(snapshot.mduSale)} L`,
      helper: `${formatCurrency(snapshot.mduValue)} estimated value · ${snapshot.mdu.length} entries`,
      metrics: [{ label: "Volume", value: `${formatNumber(snapshot.mduSale)} L`, tone: "cyan" }, { label: "Deliveries", value: `${snapshot.mdu.length}`, tone: "blue" }],
      entries: orderedEntries(snapshot.mdu, (item) => ({ title: `Sale ${formatNumber(item.sale)} L`, meta: `Rate ${formatCurrency(item.rate)} · Loss/Gain ${formatNumber(item.lossGain)}`, value: formatCurrency(numberValue(item.sale) * numberValue(item.rate)) })), empty: "No M.D.U entries this month.",
    },
    {
      title: "Credit Customers", subtitle: "Customer ledger", icon: BadgeIndianRupee, tone: "amber", value: formatCurrency(snapshot.creditFuel - snapshot.creditPayment),
      helper: `${formatCurrency(snapshot.creditFuel)} fuel · ${formatCurrency(snapshot.creditPayment)} payment`,
      metrics: [{ label: "Fuel Credit", value: formatCurrency(snapshot.creditFuel), tone: "amber" }, { label: "Payments", value: formatCurrency(snapshot.creditPayment), tone: "emerald" }],
      entries: orderedEntries(snapshot.ledger, (item) => ({ title: item.customerName || "Customer", meta: item.type === "fuel" ? `${item.fuelType || "Fuel"} · ${formatNumber(item.liters)} L issued` : "Payment received", value: item.type === "fuel" ? formatCurrency(item.amount) : formatCurrency(item.payment) })), empty: "No credit activity this month.",
    },
  ]

  const monthLabel = selectedMonth
    ? new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Select a month"

  return (
    <div className="min-h-screen min-w-0 w-full max-w-full overflow-x-hidden bg-[var(--bg-main)] p-3 pb-28 text-[color:var(--text-primary)] transition-colors duration-300 sm:p-5 lg:pb-6">
      <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"><Activity size={20} /></div>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-lg font-black text-[color:var(--text-strong)] sm:text-xl">Monthly Station Snapshot</h1><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{snapshot.totalEntries} entries</span>
          </div></div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2.5 sm:flex-none"><CalendarDays size={15} className="shrink-0 text-[color:var(--text-secondary)]" /><input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="min-w-0 bg-transparent text-xs font-bold text-[color:var(--text-strong)] outline-none" aria-label="Select month" /></label>
          <button type="button" onClick={load} disabled={loading} className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 text-xs font-bold text-[color:var(--text-strong)] shadow-sm transition hover:bg-[var(--bg-hover)] disabled:opacity-60"><RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : ""} />Refresh</button>
        </div>
      </section>

      {error ? <div role="alert" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div> : null}

      <section className="mb-4 grid grid-cols-2 gap-2.5 xl:grid-cols-5">
        <SummaryCard label="Total Income" value={formatCurrency(snapshot.totalIncome)} helper="Recorded station income" tone="emerald" />
        <SummaryCard label="Total Expense" value={formatCurrency(snapshot.expenseTotal + snapshot.cardSwipeCharges)} helper="Expenses and swipe charges" tone="rose" />
        <SummaryCard label="Net Cash View" value={formatCurrency(snapshot.netCash)} helper="After expenses and credit issued" tone={snapshot.netCash >= 0 ? "blue" : "rose"} />
        <SummaryCard label="Monthly Records" value={`${snapshot.totalEntries} entries`} helper={`Across ${moduleCards.length} modules`} tone="violet" />
        <SummaryCard label="Active Days" value={`${snapshot.activeDays} days`} helper={`Activity in ${monthLabel}`} tone="amber" />
      </section>

      <section className="mb-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4">
        <div className="mb-3 flex flex-col gap-2 border-b border-[var(--border-color)] pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-300"><Users size={16} /></div><div><h2 className="text-sm font-extrabold text-[color:var(--text-strong)]">Employee Attendance &amp; Payroll</h2><p className="text-[10px] text-[color:var(--text-secondary)]">{snapshot.presentCount} present · {snapshot.absentCount} absent · {snapshot.attendance.length} marked in {monthLabel}</p></div></div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:flex"><MetricPill label="Present" value={`${snapshot.presentCount}`} /><MetricPill label="Absent" value={`${snapshot.absentCount}`} tone="rose" /><MetricPill label="Bonus" value={formatCurrency(snapshot.bonusTotal)} /><MetricPill label="Shortage" value={formatCurrency(snapshot.shortageTotal)} tone="rose" /><MetricPill label="Advance" value={formatCurrency(snapshot.advanceTotal)} tone="amber" /></div>
        </div>
        {data.employees.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">{data.employees.map((employee) => <EmployeeCard key={employee._id || employee.name} employee={employee} attendance={attendanceByEmployee.get(employee._id || employee.name) || []} />)}</div> : <div className="rounded-lg border border-dashed border-[var(--border-color)] p-5 text-center text-xs font-semibold text-[color:var(--text-secondary)]">{loading ? "Loading employees…" : "No employees found."}</div>}
      </section>

      <div className="mb-2 flex items-baseline justify-between gap-3"><h2 className="text-sm font-extrabold text-[color:var(--text-strong)]">Station Activity</h2><span className="text-[10px] text-[color:var(--text-secondary)]">{monthLabel} · newest entries first</span></div>
      {loading && !snapshot.totalEntries ? <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-center text-xs font-semibold text-[color:var(--text-secondary)]">Loading monthly records…</div> : null}
      <section className="grid min-w-0 grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
        {moduleCards.map((card) => <ModuleCard key={card.title} {...card} />)}
      </section>
      {!loading && !error && snapshot.totalEntries === 0 ? <div className="mt-4 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-panel)] p-5 text-center"><p className="text-sm font-extrabold text-[color:var(--text-strong)]">No activity found for {monthLabel}</p><p className="mt-1 text-[10px] text-[color:var(--text-secondary)]">Choose another month or add records in the related modules.</p></div> : null}
    </div>
  )
}
