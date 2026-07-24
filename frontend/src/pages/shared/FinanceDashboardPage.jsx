import { useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"

import { getEntries as getCardSwipeEntries } from "../../services/cardSwipeApi"
import { getLubricants } from "../../services/lubricantApi"
import { getMduEntries } from "../../services/mduApi"
import { getDcdEntries } from "../../services/dcdApi"
import { getDailySales } from "../../services/dailySaleApi"
import { getInvoiceDetails } from "../../services/invoiceDetailApi"
import { getExpenses } from "../../services/expenseApi"
import { getEmployees } from "../../services/employeeApi"
import { getAttendance } from "../../services/attendanceApi"

const currentMonth = () => new Date().toISOString().slice(0, 7)
const today = () => new Date().toISOString().slice(0, 10)
const numberValue = (value) => Number(value || 0)
const formatCurrency = (value) => {
  const amount = Number(value || 0)
  const hasDecimal = !Number.isInteger(amount)
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: hasDecimal ? 2 : 0, maximumFractionDigits: 2 })}`
}
const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })

const getDateKey = (value) => String(value || "").slice(0, 10)
const getMonthKey = (value) => getDateKey(value).slice(0, 7)

const filterByPeriod = (entries, filters) => {
  const useDateRange = Boolean(filters.fromDate || filters.toDate)

  return (entries || []).filter((entry) => {
    const dateKey = getDateKey(entry.date)
    if (!dateKey) return false

    if (useDateRange) {
      return (!filters.fromDate || dateKey >= filters.fromDate) && (!filters.toDate || dateKey <= filters.toDate)
    }

    return getMonthKey(entry.date) === filters.month
  })
}

const calculateAttendanceSummary = (employee, entries) => {
  const baseSalary = Number(employee?.salary || 0)
  const perDay = baseSalary / 30
  let present = 0
  let half = 0
  let doubleShift = 0
  let shortage = 0
  let advance = 0
  let bonus = 0

  ;(entries || []).forEach((entry) => {
    if (entry.status === "present") present += 1
    if (entry.status === "half") half += 1
    if (entry.status === "double") doubleShift += 1
    if (entry.status === "bonus") bonus += Number(entry.bonusAmount || 0)

    shortage += Number(entry.shortage || 0)
    advance += Number(entry.advanceCash || 0) + Number(entry.advancePetrol || 0)
  })

  const earned = Math.round(present * perDay + half * (perDay / 2) + doubleShift * (perDay * 2))
  return { earned, bonus, final: Math.round(earned + bonus + shortage - advance) }
}

const getMduLossGain = (entry) =>
  Number(
    entry.lossGain ??
      numberValue(entry.physicalStock) -
        (numberValue(entry.openingStock) + numberValue(entry.decant) - numberValue(entry.sale)),
  )

const getDcdProfit = (entry) =>
  Number(entry.profit ?? (numberValue(entry.salePrice) - numberValue(entry.purchasePrice)) * numberValue(entry.volume))

const getDailySaleProfit = (entry) => Number(entry.profit ?? numberValue(entry.sale) * numberValue(entry.rate))

const getLfrAmount = (entry) => numberValue(entry.qty) * numberValue(entry.lfr)

const getPurchaseAmount = (entry) =>
  Number(
    entry.purchaseAmount ??
      (numberValue(entry.qty)
        ? (numberValue(entry.invoiceAmount) + numberValue(entry.transportCost)) / numberValue(entry.qty) +
          numberValue(entry.lfr)
        : 0),
  )

const toneClasses = {
  green: "border-emerald-200 bg-emerald-50/80 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  blue: "border-blue-200 bg-blue-50/80 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  violet: "border-violet-200 bg-violet-50/80 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  amber: "border-amber-200 bg-amber-50/80 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "border-rose-200 bg-rose-50/80 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
  cyan: "border-cyan-200 bg-cyan-50/80 text-cyan-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300",
}

function FinanceCard({ label, value, tone = "blue", helper }) {
  return (
    <article className={`rounded-[24px] border p-5 shadow-sm ${toneClasses[tone] || toneClasses.blue}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--text-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-current sm:text-3xl">{value}</p>
      {helper ? <p className="mt-2 text-xs text-[color:var(--text-secondary)]">{helper}</p> : null}
    </article>
  )
}

export default function FinanceDashboardPage() {
  const [filters, setFilters] = useState({ month: currentMonth(), fromDate: "", toDate: "" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState({
    cardSwipe: [],
    lubricants: [],
    mdu: [],
    dcd: [],
    dailySales: [],
    invoiceDetails: [],
    expenses: [],
    employees: [],
    attendanceByEmployee: {},
  })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [cardSwipe, lubricants, mdu, dcd, dailySales, invoiceDetails, expenses, employees] = await Promise.all([
        getCardSwipeEntries(),
        getLubricants(),
        getMduEntries(),
        getDcdEntries(),
        getDailySales(),
        getInvoiceDetails(),
        getExpenses(),
        getEmployees(),
      ])

      const attendancePairs = await Promise.all(
        (employees || []).map(async (employee) => {
          try {
            const entries = await getAttendance(employee._id)
            return [employee._id, entries || []]
          } catch {
            return [employee._id, []]
          }
        }),
      )

      setData({
        cardSwipe: cardSwipe || [],
        lubricants: lubricants || [],
        mdu: mdu || [],
        dcd: dcd || [],
        dailySales: dailySales || [],
        invoiceDetails: invoiceDetails || [],
        expenses: expenses || [],
        employees: employees || [],
        attendanceByEmployee: Object.fromEntries(attendancePairs),
      })
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load finance dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const metrics = useMemo(() => {
    const cardSwipe = filterByPeriod(data.cardSwipe, filters)
    const lubricants = filterByPeriod(data.lubricants, filters)
    const mdu = filterByPeriod(data.mdu, filters)
    const dcd = filterByPeriod(data.dcd, filters)
    const dailySales = filterByPeriod(data.dailySales, filters)
    const invoiceDetails = filterByPeriod(data.invoiceDetails, filters)
    const expenses = filterByPeriod(data.expenses, filters)

    const cardSwipeProfit = cardSwipe.reduce((sum, entry) => sum + numberValue(entry.charges), 0)
    const lubricantProfit = lubricants.reduce((sum, entry) => sum + numberValue(entry.totalProfit), 0)

    const mduRateEntries = mdu.filter((entry) => numberValue(entry.rate) > 0)
    const mduAvgRate = mduRateEntries.length
      ? mduRateEntries.reduce((sum, entry) => sum + numberValue(entry.rate), 0) / mduRateEntries.length
      : 0
    const mduLossGain = mdu.reduce((sum, entry) => sum + getMduLossGain(entry), 0)
    const mduOtherProfit = mduLossGain * mduAvgRate

    const dcdProfit = dcd.reduce((sum, entry) => sum + getDcdProfit(entry), 0)

    const hsdDaily = dailySales.filter((entry) => String(entry.product || "").toLowerCase() === "hsd")
    const msDaily = dailySales.filter((entry) => String(entry.product || "").toLowerCase() === "ms")
    const hsdSale = hsdDaily.reduce((sum, entry) => sum + numberValue(entry.sale), 0)
    const msSale = msDaily.reduce((sum, entry) => sum + numberValue(entry.sale), 0)
    const hsdDailyProfit = hsdDaily.reduce((sum, entry) => sum + getDailySaleProfit(entry), 0)
    const msDailyProfit = msDaily.reduce((sum, entry) => sum + getDailySaleProfit(entry), 0)
    const hsdLossGain = hsdDaily.reduce((sum, entry) => sum + numberValue(entry.lossGain), 0)
    const msLossGain = msDaily.reduce((sum, entry) => sum + numberValue(entry.lossGain), 0)
    const avgRateHsd = hsdSale ? hsdDailyProfit / hsdSale : 0
    const avgRateMs = msSale ? msDailyProfit / msSale : 0

    const hsdInvoices = invoiceDetails.filter((entry) => String(entry.product || "").toLowerCase() === "hsd")
    const msInvoices = invoiceDetails.filter((entry) => String(entry.product || "").toLowerCase() === "ms")
    const invoiceTotals = (list) =>
      list.reduce(
        (totals, entry) => ({
          qty: totals.qty + numberValue(entry.qty),
          invoiceAmount: totals.invoiceAmount + numberValue(entry.invoiceAmount),
          transportCost: totals.transportCost + numberValue(entry.transportCost),
          lfrAmount: totals.lfrAmount + getLfrAmount(entry),
        }),
        { qty: 0, invoiceAmount: 0, transportCost: 0, lfrAmount: 0 },
      )
    const hsdInvoiceTotals = invoiceTotals(hsdInvoices)
    const msInvoiceTotals = invoiceTotals(msInvoices)
    const avgPurchaseHsd = hsdInvoiceTotals.qty
      ? (hsdInvoiceTotals.invoiceAmount + hsdInvoiceTotals.transportCost + hsdInvoiceTotals.lfrAmount) /
        hsdInvoiceTotals.qty
      : 0
    const avgPurchaseMs = msInvoiceTotals.qty
      ? (msInvoiceTotals.invoiceAmount + msInvoiceTotals.transportCost + msInvoiceTotals.lfrAmount) /
        msInvoiceTotals.qty
      : 0

    const msMargin = avgRateMs - avgPurchaseMs
    const hsdMargin = avgRateHsd - avgPurchaseHsd
    const msProductLoss = msLossGain * avgPurchaseMs
    const hsdProductLoss = hsdLossGain * avgPurchaseHsd
    const msProfit = msMargin * msSale
    const hsdProfit = hsdMargin * hsdSale

    const monthExpense = expenses.reduce((sum, entry) => sum + numberValue(entry.amount), 0)

    const employeeMoney = data.employees.reduce(
      (totals, employee) => {
        const entries = filterByPeriod(data.attendanceByEmployee[employee._id] || [], filters)
        const summary = calculateAttendanceSummary(employee, entries)
        totals.earned += summary.earned
        totals.bonus += summary.bonus
        return totals
      },
      { earned: 0, bonus: 0 },
    )

    const earnedBonus = employeeMoney.earned + employeeMoney.bonus
    const totalProfit = cardSwipeProfit + lubricantProfit + mduOtherProfit + dcdProfit + msProfit + hsdProfit
    const totalExpense = monthExpense + earnedBonus + Math.abs(msProductLoss) + Math.abs(hsdProductLoss)
    const finalProfit = totalProfit - totalExpense

    return {
      totalProfit,
      totalExpense,
      finalProfit,
      cardSwipeProfit,
      lubricantProfit,
      mduOtherProfit,
      dcdProfit,
      hsdSale,
      msSale,
      avgRateHsd,
      avgRateMs,
      hsdLossGain,
      msLossGain,
      avgPurchaseHsd,
      avgPurchaseMs,
      msMargin,
      hsdMargin,
      msProductLoss,
      hsdProductLoss,
      msProfit,
      hsdProfit,
      monthExpense,
      earnedBonus,
    }
  }, [data, filters])

  const periodLabel = filters.fromDate || filters.toDate
    ? `${filters.fromDate || "Start"} to ${filters.toDate || today()}`
    : filters.month

  const resetFilters = () => setFilters({ month: currentMonth(), fromDate: "", toDate: "" })

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">Finance Control</p>
            <h1 className="mt-2 text-3xl font-semibold text-[color:var(--text-strong)]">Finance Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--text-secondary)]">
              One place for card swipe profit, lubricant profit, M.D.U, D.C.D, daily sales, invoice rates, expenses, and employee salary cost.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-sm font-semibold text-[color:var(--text-strong)]"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-soft)]">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="space-y-2 text-sm font-semibold text-[color:var(--text-secondary)]">
            Month Filter
            <input
              type="month"
              value={filters.month}
              onChange={(event) => setFilters((prev) => ({ ...prev, month: event.target.value, fromDate: "", toDate: "" }))}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-[color:var(--text-strong)] outline-none"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-[color:var(--text-secondary)]">
            From Date
            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value }))}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-[color:var(--text-strong)] outline-none"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-[color:var(--text-secondary)]">
            To Date
            <input
              type="date"
              value={filters.toDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value }))}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-[color:var(--text-strong)] outline-none"
            />
          </label>
          <button
            type="button"
            onClick={resetFilters}
            className="self-end rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[color:var(--text-strong)]"
          >
            Reset
          </button>
        </div>
        <p className="mt-3 text-xs text-[color:var(--text-muted)]">Showing finance cards for: {periodLabel}</p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceCard label="Total Profit" value={formatCurrency(metrics.totalProfit)} tone={metrics.totalProfit >= 0 ? "green" : "rose"} helper="All profit cards combined" />
        <FinanceCard label="Total Expense" value={formatCurrency(metrics.totalExpense)} tone="rose" helper="Expenses + salary cost + product loss" />
        <FinanceCard label="Final Profit" value={formatCurrency(metrics.finalProfit)} tone={metrics.finalProfit >= 0 ? "green" : "rose"} helper="Total Profit - Total Expense" />
        <FinanceCard label="Card Swipe Month Profit" value={formatCurrency(metrics.cardSwipeProfit)} tone="green" />
        <FinanceCard label="Lubricant Month Profit" value={formatCurrency(metrics.lubricantProfit)} tone="green" />
        <FinanceCard label="M.D.U Other Profit" value={formatCurrency(metrics.mduOtherProfit)} tone={metrics.mduOtherProfit >= 0 ? "green" : "rose"} />
        <FinanceCard label="D.C.D Total Profit" value={formatCurrency(metrics.dcdProfit)} tone={metrics.dcdProfit >= 0 ? "green" : "rose"} />
        <FinanceCard label="HSD Sale" value={formatNumber(metrics.hsdSale)} tone="blue" helper="Daily Sales" />
        <FinanceCard label="MS Sale" value={formatNumber(metrics.msSale)} tone="amber" helper="Daily Sales" />
        <FinanceCard label="Avg Rate HSD" value={formatNumber(metrics.avgRateHsd.toFixed(2))} tone="violet" />
        <FinanceCard label="Avg Rate MS" value={formatNumber(metrics.avgRateMs.toFixed(2))} tone="blue" />
        <FinanceCard label="HSD Loss / Gain" value={formatNumber(metrics.hsdLossGain.toFixed(2))} tone={metrics.hsdLossGain >= 0 ? "green" : "rose"} helper="Daily Sales" />
        <FinanceCard label="MS Loss / Gain" value={formatNumber(metrics.msLossGain.toFixed(2))} tone={metrics.msLossGain >= 0 ? "green" : "rose"} helper="Daily Sales" />
        <FinanceCard label="Avg Purchase Rate HSD" value={formatNumber(metrics.avgPurchaseHsd.toFixed(2))} tone="violet" />
        <FinanceCard label="Avg Purchase Rate MS" value={formatNumber(metrics.avgPurchaseMs.toFixed(2))} tone="blue" />
        <FinanceCard label="MS Margin" value={formatCurrency(metrics.msMargin)} tone={metrics.msMargin >= 0 ? "green" : "rose"} helper="Avg Rate MS - Avg Purchase Rate MS" />
        <FinanceCard label="HSD Margin" value={formatCurrency(metrics.hsdMargin)} tone={metrics.hsdMargin >= 0 ? "green" : "rose"} helper="Avg Rate HSD - Avg Purchase Rate HSD" />
        <FinanceCard label="MS Product Loss (Rs)" value={formatCurrency(metrics.msProductLoss)} tone={metrics.msProductLoss >= 0 ? "green" : "rose"} helper="MS Loss/Gain x Avg Purchase Rate MS" />
        <FinanceCard label="HSD Product Loss (Rs)" value={formatCurrency(metrics.hsdProductLoss)} tone={metrics.hsdProductLoss >= 0 ? "green" : "rose"} helper="HSD Loss/Gain x Avg Purchase Rate HSD" />
        <FinanceCard label="MS Profit (Rs)" value={formatCurrency(metrics.msProfit)} tone={metrics.msProfit >= 0 ? "green" : "rose"} helper="MS Margin x MS Sale" />
        <FinanceCard label="HSD Profit (Rs)" value={formatCurrency(metrics.hsdProfit)} tone={metrics.hsdProfit >= 0 ? "green" : "rose"} helper="HSD Margin x HSD Sale" />
        <FinanceCard label="Month Expense" value={formatCurrency(metrics.monthExpense)} tone="rose" />
        <FinanceCard label="Earned + Bonus" value={formatCurrency(metrics.earnedBonus)} tone="cyan" helper="All employees" />
      </section>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-sm text-[color:var(--text-secondary)]">
          Loading finance data...
        </div>
      ) : null}
    </div>
  )
}





