import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  BadgeIndianRupee,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Droplets,
  FileText,
  Fuel,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
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
import { getMduEntries } from "../../services/mduApi"

const today = () => new Date().toISOString().slice(0, 10)
const dateKey = (value) => String(value || "").slice(0, 10)
const numberValue = (value) => Number(value || 0)

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })

const sum = (items, selector) =>
  (items || []).reduce((total, item) => total + numberValue(selector(item)), 0)

function MetricPill({ label, value, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  }

  return (
    <div className={`rounded-xl border px-2.5 py-1.5 ${tones[tone] || tones.emerald}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-80">{label}</p>
      <p className="mt-0.5 text-xs font-black">{value}</p>
    </div>
  )
}

function SummaryCard({ label, value, tone = "emerald" }) {
  const tones = {
    emerald: { panel: "border-emerald-200/70 bg-emerald-50/80", value: "text-emerald-600" },
    rose: { panel: "border-rose-200/70 bg-rose-50/80", value: "text-rose-600" },
    amber: { panel: "border-amber-200/70 bg-amber-50/80", value: "text-amber-600" },
    blue: { panel: "border-blue-200/70 bg-blue-50/80", value: "text-blue-600" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80", value: "text-violet-600" },
  }
  const current = tones[tone] || tones.blue

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] ${current.panel}`}>
      <p className="font-semibold tracking-[0.18em] text-[color:var(--text-secondary)] text-[13px]">{label}</p>
      <p className={`mt-3 text-2xl font-extrabold ${current.value}`}>{value}</p>
    </div>
  )
}

function ModuleCard({ icon: Icon, title, subtitle, value, helper, tone = "emerald", className = "", children }) {
  const tones = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    violet: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
    cyan: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  }

  return (
    <section className={`flex flex-col rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{subtitle}</p>
          <h3 className="mt-1 text-base font-black text-[color:var(--text-strong)]">{title}</h3>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${tones[tone] || tones.emerald}`}>
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-3 pb-2 border-b border-[var(--border-color)]">
        <p className="text-xl font-black text-[color:var(--text-strong)]">{value}</p>
        <p className="mt-0.5 text-xs font-semibold text-[color:var(--text-secondary)]">{helper}</p>
      </div>

      <div className="mt-3 flex-1 flex flex-col justify-between space-y-2">{children}</div>
    </section>
  )
}

function MiniList({ items, emptyText }) {
  if (!items?.length) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] p-4 text-center text-xs font-bold text-[color:var(--text-secondary)]">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: "thin" }}>
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 transition hover:bg-[var(--bg-hover)]">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[color:var(--text-strong)]">{item.title}</p>
            <p className="truncate text-[11px] font-semibold text-[color:var(--text-secondary)]">{item.meta}</p>
          </div>
          <p className="shrink-0 text-sm font-black text-[color:var(--text-strong)]">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function HorizontalEmployeeCard({ snapshot }) {
  const scrollContainerRef = useRef(null)

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -300 : 300
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" })
    }
  }

  return (
    <section className="w-full overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300">
      {/* Top Header of Horizontal Employee Card */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Attendance</p>
              <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400">
                Workforce
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
              <h3 className="text-xl font-black text-[color:var(--text-strong)]">Employees</h3>
              <span className="text-xs font-semibold text-[color:var(--text-secondary)]">
                · {snapshot.presentCount} present · {snapshot.absentCount} absent · {snapshot.attendance.length} marked
              </span>
            </div>
          </div>
        </div>

        {/* Quick Metric Pills for Attendance */}
        <div className="flex flex-wrap items-center gap-2">
          <MetricPill label="Present" value={`${snapshot.presentCount}`} tone="emerald" />
          <MetricPill label="Absent" value={`${snapshot.absentCount}`} tone="rose" />
          <MetricPill label="Bonus" value={formatCurrency(snapshot.bonusTotal)} tone="emerald" />
          <MetricPill label="Shortage" value={formatCurrency(snapshot.shortageTotal)} tone="rose" />
          <MetricPill label="Advance" value={formatCurrency(snapshot.advanceTotal)} tone="amber" />

          {snapshot.attendance.length > 3 && (
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => scroll("left")}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)] transition active:scale-95"
                title="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)] transition active:scale-95"
                title="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Employee Cards - Horizontal Row */}
      <div className="mt-4">
        {!snapshot.attendance?.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] p-6 text-center text-xs font-bold text-[color:var(--text-secondary)]">
            No employee attendance marked for this date.
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {snapshot.attendance.map((item, index) => {
              const advance = numberValue(item.advanceCash) + numberValue(item.advancePetrol)
              return (
                <div
                  key={`${item.employeeName}-${index}`}
                  className="min-w-[260px] max-w-[280px] shrink-0 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3.5 shadow-sm transition hover:border-cyan-500/40 hover:bg-[var(--bg-hover)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[color:var(--text-strong)]">
                        {item.employeeName || "Employee"}
                      </p>
                      <p className="text-[11px] font-semibold capitalize text-[color:var(--text-secondary)]">
                        {item.role || "Staff"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black capitalize ${
                        item.status === "absent"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : item.status === "double"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : item.status === "half" || item.status === "present_half"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {item.status || "Present"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2 text-center">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[color:var(--text-muted)]">Shortage</p>
                      <p className={`mt-0.5 text-xs font-black ${numberValue(item.shortage) !== 0 ? "text-rose-600 dark:text-rose-400" : "text-[color:var(--text-strong)]"}`}>
                        {formatCurrency(item.shortage)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2 text-center">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[color:var(--text-muted)]">Advance</p>
                      <p className={`mt-0.5 text-xs font-black ${advance > 0 ? "text-amber-600 dark:text-amber-400" : "text-[color:var(--text-strong)]"}`}>
                        {formatCurrency(advance)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2 text-center">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[color:var(--text-muted)]">Bonus</p>
                      <p className={`mt-0.5 text-xs font-black ${numberValue(item.bonusAmount) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[color:var(--text-strong)]"}`}>
                        {formatCurrency(item.bonusAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default function DailySnapshotPage() {
  const [selectedDate, setSelectedDate] = useState(today())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState({
    expenses: [],
    employees: [],
    attendance: [],
    cardSwipe: [],
    lubricants: [],
    mdu: [],
    dailySales: [],
    dcd: [],
    invoices: [],
    customers: [],
    ledger: [],
  })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [expenses, employees, cardSwipe, lubricants, mdu, dailySales, dcd, invoices, customers] = await Promise.all([
        getExpenses(),
        getEmployees(),
        getCardSwipeEntries(),
        getLubricants(),
        getMduEntries(),
        getDailySales(),
        getDcdEntries(),
        getInvoiceDetails(),
        getCustomers(),
      ])

      const attendancePairs = await Promise.all(
        (employees || []).map(async (employee) => {
          try {
            const entries = await getAttendance(employee._id)
            return (entries || []).map((entry) => ({ ...entry, employeeName: employee.name, employeeSalary: employee.salary }))
          } catch {
            return []
          }
        }),
      )

      const ledgerPairs = await Promise.all(
        (customers || []).map(async (customer) => {
          try {
            const ledger = await getCustomerLedger(customer._id)
            return (ledger || []).map((entry) => ({ ...entry, customerName: customer.name }))
          } catch {
            return []
          }
        }),
      )

      setData({
        expenses: expenses || [],
        employees: employees || [],
        attendance: attendancePairs.flat(),
        cardSwipe: cardSwipe || [],
        lubricants: lubricants || [],
        mdu: mdu || [],
        dailySales: dailySales || [],
        dcd: dcd || [],
        invoices: invoices || [],
        customers: customers || [],
        ledger: ledgerPairs.flat(),
      })
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load daily snapshot.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const snapshot = useMemo(() => {
    const byDate = (items) => (items || []).filter((item) => dateKey(item.date) === selectedDate)
    const expenses = byDate(data.expenses)
    const attendance = byDate(data.attendance)
    const cardSwipe = byDate(data.cardSwipe)
    const lubricants = byDate(data.lubricants)
    const mdu = byDate(data.mdu)
    const dailySales = byDate(data.dailySales)
    const dcd = byDate(data.dcd)
    const invoices = byDate(data.invoices)
    const ledger = byDate(data.ledger)

    const expenseTotal = sum(expenses, (item) => item.amount)
    const cardSwipeAmount = sum(cardSwipe, (item) => item.amount)
    const cardSwipeCharges = sum(cardSwipe, (item) => item.charges)
    const lubricantTotal = sum(lubricants, (item) => item.total)
    const lubricantProfit = sum(lubricants, (item) => item.totalProfit)
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
    const totalEntries =
      expenses.length + attendance.length + cardSwipe.length + lubricants.length + mdu.length + dailySales.length + dcd.length + invoices.length + ledger.length
    const totalIncome = cardSwipeAmount + lubricantTotal + mduValue + dailySaleValue + dcdProfit + creditPayment
    const netCash = totalIncome - expenseTotal - cardSwipeCharges - creditFuel

    return {
      expenses,
      attendance,
      cardSwipe,
      lubricants,
      mdu,
      dailySales,
      dcd,
      invoices,
      ledger,
      expenseTotal,
      cardSwipeAmount,
      cardSwipeCharges,
      lubricantTotal,
      lubricantProfit,
      mduSale,
      mduValue,
      dailySaleValue,
      dailySaleProfit,
      dcdProfit,
      dcdVolume,
      invoicePurchase,
      creditFuel,
      creditPayment,
      presentCount,
      absentCount,
      bonusTotal,
      shortageTotal,
      advanceTotal,
      totalEntries,
      totalIncome,
      netCash,
    }
  }, [data, selectedDate])

  return (
    <div className="min-h-screen min-w-0 w-full max-w-full overflow-x-hidden bg-[var(--bg-main)] p-3 pb-28 text-[color:var(--text-primary)] transition-colors duration-300 sm:p-6 lg:pb-6">
      {/* Top Header Card */}
      <div className="mb-4 rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-[color:var(--text-strong)]">Daily Station Snapshot</h1>
                <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {snapshot.totalEntries} entries
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-[color:var(--text-secondary)]">One selected day, every module summarized in cards.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:ml-auto">
            <label className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3">
              <Calendar size={16} className="text-[color:var(--text-secondary)]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="bg-transparent text-sm font-bold text-[color:var(--text-strong)] outline-none"
              />
            </label>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] shadow-sm transition hover:bg-[var(--bg-hover)] active:scale-95"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-emerald-600" : ""} />
              Refresh
            </button>
          </div>

          <div className="hidden h-0.5 w-12 rounded-full bg-emerald-500/30 xl:block" />
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* 4 Summary Stats Cards */}
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard label="Total Income" value={formatCurrency(snapshot.totalIncome)} tone="emerald" />
        <SummaryCard label="Total Expense" value={formatCurrency(snapshot.expenseTotal + snapshot.cardSwipeCharges)} tone="rose" />
        <SummaryCard label="Net Cash View" value={formatCurrency(snapshot.netCash)} tone={snapshot.netCash >= 0 ? "blue" : "rose"} />
        <SummaryCard label="Daily Records" value={`${snapshot.totalEntries} entries`} tone="violet" />
      </div>

      {/* HORIZONTAL EMPLOYEES CARD (ONLY THIS CARD IS HORIZONTAL AS REQUESTED) */}
      <div className="mb-5">
        <HorizontalEmployeeCard snapshot={snapshot} />
      </div>

      {/* REMAINING MODULE CARDS IN A BALANCED RESPONSIVE GRID (NOT HORIZONTAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Daily Sales */}
        <ModuleCard
          icon={Fuel}
          title="Daily Sales"
          subtitle="Fuel day sheet"
          value={formatCurrency(snapshot.dailySaleValue)}
          helper={`${formatCurrency(snapshot.dailySaleProfit)} profit · ${snapshot.dailySales.length} entries`}
          tone="emerald"
        >
          <MiniList
            emptyText="No daily sales on this day."
            items={snapshot.dailySales.map((item) => ({
              title: item.product || "Fuel",
              meta: `${formatNumber(item.sale)} L · Rate ${formatCurrency(item.rate)}`,
              value: formatCurrency(numberValue(item.sale) * numberValue(item.rate)),
            }))}
          />
        </ModuleCard>

        {/* 2. Card Swipe */}
        <ModuleCard
          icon={CreditCard}
          title="Card Swipe"
          subtitle="Swipe register"
          value={formatCurrency(snapshot.cardSwipeAmount)}
          helper={`${formatCurrency(snapshot.cardSwipeCharges)} charges · ${snapshot.cardSwipe.length} entries`}
          tone="blue"
        >
          <div className="grid grid-cols-2 gap-2 mb-1">
            <MetricPill label="Net" value={formatCurrency(snapshot.cardSwipeAmount - snapshot.cardSwipeCharges)} tone="emerald" />
            <MetricPill label="Charges" value={formatCurrency(snapshot.cardSwipeCharges)} tone="amber" />
          </div>
          <MiniList
            emptyText="No card swipe entries."
            items={snapshot.cardSwipe.map((item) => ({
              title: item.machine || "Machine",
              meta: `${item.paymentMethod || "Payment"} ${item.time ? `· ${item.time}` : ""}`,
              value: formatCurrency(item.amount),
            }))}
          />
        </ModuleCard>

        {/* 3. Expenses */}
        <ModuleCard
          icon={Wallet}
          title="Expenses"
          subtitle="Station spend"
          value={formatCurrency(snapshot.expenseTotal)}
          helper={`${snapshot.expenses.length} expense entries`}
          tone="rose"
        >
          <MiniList
            emptyText="No expenses on this day."
            items={snapshot.expenses.map((item) => ({
              title: item.category || "Expense",
              meta: item.description || item.paymentMode || "Station expense",
              value: formatCurrency(item.amount),
            }))}
          />
        </ModuleCard>

        {/* 4. Lubricants */}
        <ModuleCard
          icon={Droplets}
          title="Lubricants"
          subtitle="Lubricant sales"
          value={formatCurrency(snapshot.lubricantTotal)}
          helper={`${formatCurrency(snapshot.lubricantProfit)} profit · ${snapshot.lubricants.length} sales`}
          tone="amber"
        >
          <MiniList
            emptyText="No lubricant sales."
            items={snapshot.lubricants.map((item) => ({
              title: item.product || "Product",
              meta: `${formatNumber(item.quantity)} qty · ${item.soldBy || "Seller"}`,
              value: formatCurrency(item.total),
            }))}
          />
        </ModuleCard>

        {/* 5. M.D.U */}
        <ModuleCard
          icon={Truck}
          title="M.D.U"
          subtitle="Mobile dispenser"
          value={`${formatNumber(snapshot.mduSale)} L`}
          helper={`${formatCurrency(snapshot.mduValue)} estimated value · ${snapshot.mdu.length} entries`}
          tone="cyan"
        >
          <MiniList
            emptyText="No M.D.U entries."
            items={snapshot.mdu.map((item) => ({
              title: `Sale ${formatNumber(item.sale)} L`,
              meta: `Rate ${formatCurrency(item.rate)} · Loss/Gain ${formatNumber(item.lossGain)}`,
              value: formatCurrency(numberValue(item.sale) * numberValue(item.rate)),
            }))}
          />
        </ModuleCard>

        {/* 6. D.C.D */}
        <ModuleCard
          icon={Receipt}
          title="D.C.D"
          subtitle="D.C.D entries"
          value={formatCurrency(snapshot.dcdProfit)}
          helper={`${formatNumber(snapshot.dcdVolume)} volume · ${snapshot.dcd.length} entries`}
          tone="violet"
        >
          <MiniList
            emptyText="No D.C.D entries."
            items={snapshot.dcd.map((item) => ({
              title: item.product || "D.C.D",
              meta: `${formatNumber(item.volume)} L · ${item.shift || "Shift"}`,
              value: formatCurrency(item.profit),
            }))}
          />
        </ModuleCard>

        {/* 7. Invoice Details */}
        <ModuleCard
          icon={FileText}
          title="Invoice Details"
          subtitle="Purchase view"
          value={formatCurrency(snapshot.invoicePurchase)}
          helper={`${snapshot.invoices.length} invoice records`}
          tone="blue"
        >
          <MiniList
            emptyText="No invoices on this day."
            items={snapshot.invoices.map((item) => ({
              title: item.product || "Invoice",
              meta: `${formatNumber(item.qty)} qty · RSP ${formatCurrency(item.rsp)}`,
              value: formatCurrency(item.purchaseAmount || item.invoiceAmount),
            }))}
          />
        </ModuleCard>

        {/* 8. Credit Customers */}
        <ModuleCard
          icon={BadgeIndianRupee}
          title="Credit Customers"
          subtitle="Customer ledger"
          value={formatCurrency(snapshot.creditFuel - snapshot.creditPayment)}
          helper={`${formatCurrency(snapshot.creditFuel)} fuel · ${formatCurrency(snapshot.creditPayment)} payment`}
          tone="amber"
        >
          <div className="grid grid-cols-2 gap-2 mb-1">
            <MetricPill label="Fuel Given" value={formatCurrency(snapshot.creditFuel)} tone="rose" />
            <MetricPill label="Received" value={formatCurrency(snapshot.creditPayment)} tone="emerald" />
          </div>
          <MiniList
            emptyText="No credit activity."
            items={snapshot.ledger.map((item) => ({
              title: item.customerName || "Customer",
              meta: item.type === "fuel" ? `${item.fuelType || "Fuel"} · ${formatNumber(item.liters)} L` : "Payment received",
              value: item.type === "fuel" ? formatCurrency(item.amount) : formatCurrency(item.payment),
            }))}
          />
        </ModuleCard>
      </div>

      {!loading && snapshot.totalEntries === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-center shadow-[var(--shadow-soft)]">
          <TrendingDown className="mx-auto text-[color:var(--text-secondary)]" size={28} />
          <p className="mt-3 text-lg font-black text-[color:var(--text-strong)]">No activity found for this date</p>
          <p className="mt-1 text-sm font-medium text-[color:var(--text-secondary)]">
            Change the date or add entries in the related modules.
          </p>
        </div>
      ) : null}
    </div>
  )
}
