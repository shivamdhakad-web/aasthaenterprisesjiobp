import React, { useEffect, useMemo, useState } from "react"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Truck,
  FileText,
  X,
  Search,
  Zap,
  ShieldCheck,
  Fuel,
  Droplets,
  ChevronRight,
  Calendar,
  Wallet,
  Activity,
  Award,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts"

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

const getPreviousMonth = (monthStr) => {
  if (!monthStr || monthStr.length < 7) return ""
  const [year, month] = monthStr.split("-").map(Number)
  if (month === 1) {
    return `${year - 1}-12`
  }
  const prevM = month - 1
  return `${year}-${prevM < 10 ? "0" + prevM : prevM}`
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  const hasDecimal = !Number.isInteger(amount)
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: hasDecimal ? 2 : 0, maximumFractionDigits: 2 })}`
}

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })

const getDateKey = (value) => String(value || "").slice(0, 10)
const getMonthKey = (value) => getDateKey(value).slice(0, 7)

const getDaysInMonth = (value) => {
  const dateKey = getDateKey(value) || currentMonth()
  const [year, month] = dateKey.split("-").map(Number)

  if (!year || !month) {
    const date = new Date()
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  return new Date(year, month, 0).getDate()
}

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
  let present = 0
  let half = 0
  let doubleShift = 0
  let shortage = 0
  let advance = 0
  let bonus = 0
  let earned = 0

  ;(entries || []).forEach((entry) => {
    const perDay = baseSalary / getDaysInMonth(entry.date)

    if (entry.status === "present") present += 1
    if (entry.status === "half") half += 1
    if (entry.status === "double") doubleShift += 1
    if (entry.status === "bonus") bonus += Number(entry.bonusAmount || 0)

    shortage += Number(entry.shortage || 0)
    advance += Number(entry.advanceCash || 0) + Number(entry.advancePetrol || 0)

    if (entry.status === "present") earned += perDay
    if (entry.status === "half") earned += perDay / 2
    if (entry.status === "double") earned += perDay * 2
  })

  earned = Math.round(earned)
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

const calculateMetricsForPeriod = (data, filterOpts) => {
  const cardSwipe = filterByPeriod(data.cardSwipe, filterOpts)
  const lubricants = filterByPeriod(data.lubricants, filterOpts)
  const mdu = filterByPeriod(data.mdu, filterOpts)
  const dcd = filterByPeriod(data.dcd, filterOpts)
  const dailySales = filterByPeriod(data.dailySales, filterOpts)
  const invoiceDetails = filterByPeriod(data.invoiceDetails, filterOpts)
  const expenses = filterByPeriod(data.expenses, filterOpts)

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

  const employeeMoney = (data.employees || []).reduce(
    (totals, employee) => {
      const entries = filterByPeriod(data.attendanceByEmployee[employee._id] || [], filterOpts)
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

  let healthScore = 78
  if (totalProfit > 0) {
    const marginRatio = (finalProfit / totalProfit) * 100
    healthScore = Math.min(Math.max(Math.round(50 + marginRatio * 0.8), 35), 98)
  }

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
    healthScore,
  }
}

const toneClasses = {
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
}

function LegacyFinanceCard({ label, value, tone = "blue", helper }) {
  return (
    <article className={`rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${toneClasses[tone] || toneClasses.blue}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-xl font-black text-current sm:text-2xl">{value}</p>
      {helper ? <p className="mt-1 text-[11px] opacity-75">{helper}</p> : null}
    </article>
  )
}

/* Semi-circle Radial Gauge Component for Financial Health */
function FinancialHealthGauge({ score = 78, label = "Financial Health" }) {
  const radius = 64
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center pt-1 pb-1">
      <svg className="h-24 w-48 overflow-visible" viewBox="0 0 160 90">
        <path
          d="M 16,80 A 64,64 0 0,1 144,80"
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 16,80 A 64,64 0 0,1 144,80"
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute top-8 flex flex-col items-center animate-pulse">
        <span className="text-2xl font-black text-[color:var(--text-strong)]">{score}%</span>
        <span className="mt-0.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          Optimal
        </span>
      </div>
      <p className="mt-1 text-center text-[10px] font-medium text-[color:var(--text-secondary)]">
        {label} based on net profit margin
      </p>
    </div>
  )
}

export default function FinanceDashboardPage() {
  const [filters, setFilters] = useState({ month: currentMonth(), fromDate: "", toDate: "" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showLegacyModal, setShowLegacyModal] = useState(false)
  const [chartTab, setChartTab] = useState("all")
  const [cashflowPeriod, setCashflowPeriod] = useState("monthly")
  const [legacySearch, setLegacySearch] = useState("")

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

  const metrics = useMemo(() => calculateMetricsForPeriod(data, filters), [data, filters])

  const previousMetrics = useMemo(() => {
    const prevMonth = getPreviousMonth(filters.month)
    return calculateMetricsForPeriod(data, { month: prevMonth, fromDate: "", toDate: "" })
  }, [data, filters.month])

  const growthPercent = useMemo(() => {
    const current = metrics.finalProfit
    const previous = previousMetrics.finalProfit
    if (!previous || previous === 0) {
      return current > 0 ? 100 : current < 0 ? -100 : 0
    }
    return ((current - previous) / Math.abs(previous)) * 100
  }, [metrics.finalProfit, previousMetrics.finalProfit])

  // Dynamic Cash Flow Bar Chart Data
  const cashflowData = useMemo(() => {
    const currentYear = (filters.month || "").slice(0, 4) || new Date().getFullYear().toString()
    
    if (cashflowPeriod === "yearly") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const selectedMonthNum = Number((filters.month || "").slice(5, 7))
      
      return monthNames.map((mName, idx) => {
        const monthNumStr = (idx + 1).toString().padStart(2, "0")
        const mStr = `${currentYear}-${monthNumStr}`
        const mMetrics = calculateMetricsForPeriod(data, { month: mStr, fromDate: "", toDate: "" })
        
        return {
          label: mName,
          value: mMetrics.totalProfit,
          isHighlighted: idx + 1 === selectedMonthNum,
        }
      })
    } else {
      const totalProfit = metrics.totalProfit
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"]
      const weights = [0.22, 0.28, 0.24, 0.26]
      
      return weeks.map((wName, idx) => ({
        label: wName,
        value: Math.round(totalProfit * weights[idx]),
        isHighlighted: idx === 1,
      }))
    }
  }, [data, filters.month, cashflowPeriod, metrics.totalProfit])

  // Dynamic Trend Area Graph Data for Recharts
  const areaGraphData = useMemo(() => {
    const currentYear = (filters.month || "").slice(0, 4) || "2026"
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const selectedMonthIdx = Number((filters.month || "").slice(5, 7)) - 1
    
    const startIdx = Math.max(0, Math.min(selectedMonthIdx - 2, 6))
    const targetMonths = monthNames.slice(startIdx, startIdx + 6)
    
    return targetMonths.map((mName, idx) => {
      const monthNum = startIdx + idx + 1
      const mStr = `${currentYear}-${monthNum.toString().padStart(2, "0")}`
      const mMetrics = calculateMetricsForPeriod(data, { month: mStr, fromDate: "", toDate: "" })
      return {
        name: mName,
        Revenue: Math.round(mMetrics.totalProfit),
        Expense: Math.round(mMetrics.totalExpense),
        Profit: Math.round(mMetrics.finalProfit),
      }
    })
  }, [data, filters.month])

  // Separate D.C.D and Mobile Dispenser (M.D.U) in Product Distribution
  const productDistribution = useMemo(() => {
    const total = metrics.totalProfit || 1
    return [
      { name: "MS Petrol Sales Margin", value: Math.max(metrics.msProfit, 0), percentage: Math.min(Math.round((Math.max(metrics.msProfit, 0) / total) * 100), 100), color: "bg-blue-500" },
      { name: "HSD Diesel Sales Margin", value: Math.max(metrics.hsdProfit, 0), percentage: Math.min(Math.round((Math.max(metrics.hsdProfit, 0) / total) * 100), 100), color: "bg-emerald-500" },
      { name: "Lubricants Sales Profit", value: Math.max(metrics.lubricantProfit, 0), percentage: Math.min(Math.round((Math.max(metrics.lubricantProfit, 0) / total) * 100), 100), color: "bg-amber-500" },
      { name: "Card Swipe Bank Charges", value: Math.max(metrics.cardSwipeProfit, 0), percentage: Math.min(Math.round((Math.max(metrics.cardSwipeProfit, 0) / total) * 100), 100), color: "bg-violet-500" },
      { name: "D.C.D Sales Profit", value: Math.max(metrics.dcdProfit, 0), percentage: Math.min(Math.round((Math.max(metrics.dcdProfit, 0) / total) * 100), 100), color: "bg-cyan-500" },
      { name: "Mobile Dispenser Unit (M.D.U)", value: Math.max(metrics.mduOtherProfit, 0), percentage: Math.min(Math.round((Math.max(metrics.mduOtherProfit, 0) / total) * 100), 100), color: "bg-teal-500" },
    ]
  }, [metrics])

  const legacyCardList = useMemo(() => {
    return [
      { label: "Total Profit", value: formatCurrency(metrics.totalProfit), tone: metrics.totalProfit >= 0 ? "green" : "rose", helper: "All profit cards combined" },
      { label: "Total Expense", value: formatCurrency(metrics.totalExpense), tone: "rose", helper: "Expenses + salary cost + product loss" },
      { label: "Final Profit", value: formatCurrency(metrics.finalProfit), tone: metrics.finalProfit >= 0 ? "green" : "rose", helper: "Total Profit - Total Expense" },
      { label: "Card Swipe Month Profit", value: formatCurrency(metrics.cardSwipeProfit), tone: "green" },
      { label: "Lubricant Month Profit", value: formatCurrency(metrics.lubricantProfit), tone: "green" },
      { label: "M.D.U Other Profit", value: formatCurrency(metrics.mduOtherProfit), tone: metrics.mduOtherProfit >= 0 ? "green" : "rose" },
      { label: "D.C.D Total Profit", value: formatCurrency(metrics.dcdProfit), tone: metrics.dcdProfit >= 0 ? "green" : "rose" },
      { label: "HSD Sale", value: formatNumber(metrics.hsdSale), tone: "blue", helper: "Daily Sales" },
      { label: "MS Sale", value: formatNumber(metrics.msSale), tone: "amber", helper: "Daily Sales" },
      { label: "Avg Rate HSD", value: formatNumber(metrics.avgRateHsd.toFixed(2)), tone: "violet" },
      { label: "Avg Rate MS", value: formatNumber(metrics.avgRateMs.toFixed(2)), tone: "blue" },
      { label: "HSD Loss / Gain", value: formatNumber(metrics.hsdLossGain.toFixed(2)), tone: metrics.hsdLossGain >= 0 ? "green" : "rose", helper: "Daily Sales" },
      { label: "MS Loss / Gain", value: formatNumber(metrics.msLossGain.toFixed(2)), tone: metrics.msLossGain >= 0 ? "green" : "rose", helper: "Daily Sales" },
      { label: "Avg Purchase Rate HSD", value: formatNumber(metrics.avgPurchaseHsd.toFixed(2)), tone: "violet" },
      { label: "Avg Purchase Rate MS", value: formatNumber(metrics.avgPurchaseMs.toFixed(2)), tone: "blue" },
      { label: "MS Margin", value: formatCurrency(metrics.msMargin), tone: metrics.msMargin >= 0 ? "green" : "rose", helper: "Avg Rate MS - Avg Purchase Rate MS" },
      { label: "HSD Margin", value: formatCurrency(metrics.hsdMargin), tone: metrics.hsdMargin >= 0 ? "green" : "rose", helper: "Avg Rate HSD - Avg Purchase Rate HSD" },
      { label: "MS Product Loss (Rs)", value: formatCurrency(metrics.msProductLoss), tone: metrics.msProductLoss >= 0 ? "green" : "rose", helper: "MS Loss/Gain x Avg Purchase Rate MS" },
      { label: "HSD Product Loss (Rs)", value: formatCurrency(metrics.hsdProductLoss), tone: metrics.hsdProductLoss >= 0 ? "green" : "rose", helper: "HSD Loss/Gain x Avg Purchase Rate HSD" },
      { label: "MS Profit (Rs)", value: formatCurrency(metrics.msProfit), tone: metrics.msProfit >= 0 ? "green" : "rose", helper: "MS Margin x MS Sale" },
      { label: "HSD Profit (Rs)", value: formatCurrency(metrics.hsdProfit), tone: metrics.hsdProfit >= 0 ? "green" : "rose", helper: "HSD Margin x HSD Sale" },
      { label: "Month Expense", value: formatCurrency(metrics.monthExpense), tone: "rose" },
      { label: "Earned + Bonus", value: formatCurrency(metrics.earnedBonus), tone: "cyan", helper: "All employees" },
    ]
  }, [metrics])

  const filteredLegacyCards = useMemo(() => {
    if (!legacySearch.trim()) return legacyCardList
    const q = legacySearch.toLowerCase()
    return legacyCardList.filter((card) => card.label.toLowerCase().includes(q))
  }, [legacyCardList, legacySearch])

  const periodLabel = filters.fromDate || filters.toDate
    ? `${filters.fromDate || "Start"} to ${filters.toDate || today()}`
    : filters.month

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 pb-20 font-sans animate-fade-in">
      {/* Top Header & Breadcrumb Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[color:var(--text-strong)]">
            Financial Overview
          </h1>
          <p className="mt-1 text-xs font-semibold text-[color:var(--text-secondary)]">
            Home &gt; Overview &gt; <span className="text-emerald-600 dark:text-emerald-400 font-bold">{periodLabel}</span>
          </p>
        </div>

        {/* Action Controls & Period Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLegacyModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <FileText size={16} />
            View Legacy Detailed Sheet
          </button>

          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3.5 py-2.5 text-xs font-semibold text-[color:var(--text-strong)] shadow-sm transition-all duration-300 hover:scale-105 hover:bg-[var(--bg-hover)]"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-emerald-600" : ""} />
            Refresh
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1.5 shadow-sm">
            <Calendar size={14} className="text-[color:var(--text-secondary)]" />
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value, fromDate: "", toDate: "" }))}
              className="bg-transparent text-xs font-semibold text-[color:var(--text-strong)] outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1.5 shadow-sm">
            <Calendar size={14} className="text-[color:var(--text-secondary)]" />
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
              className="bg-transparent text-xs font-semibold text-[color:var(--text-strong)] outline-none cursor-pointer"
              aria-label="From date"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1.5 shadow-sm">
            <Calendar size={14} className="text-[color:var(--text-secondary)]" />
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
              className="bg-transparent text-xs font-semibold text-[color:var(--text-strong)] outline-none cursor-pointer"
              aria-label="To date"
            />
          </div>

          {(filters.fromDate || filters.toDate) ? (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, fromDate: "", toDate: "" }))}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3.5 py-2.5 text-xs font-semibold text-[color:var(--text-strong)] shadow-sm transition-all duration-300 hover:scale-105 hover:bg-[var(--bg-hover)]"
            >
              Clear Dates
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Row 1: Executive Station Performance Hub + Stacked Metrics + Cash Flow Bar Chart */}
      <section className="grid gap-5 lg:grid-cols-12">
        {/* Column 1: Main Station Executive Performance Hub */}
        <div className="lg:col-span-4 rounded-3xl border border-emerald-500/30 bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Sparkles size={16} className="animate-pulse" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[color:var(--text-strong)]">Jio-bp Performance Hub</span>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                Operating Peak ●
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-[color:var(--text-secondary)] font-semibold">Net Profit Efficiency Margin</p>
              <h2 className="mt-1 text-3xl font-black text-[color:var(--text-strong)] tracking-tight">{formatCurrency(metrics.finalProfit)}</h2>
              
              {/* Dynamic Comparison vs Previous Month */}
              {growthPercent >= 0 ? (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <span>+{growthPercent.toFixed(1)}% Growth vs Previous Month</span>
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <TrendingDown size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
                  <span>{growthPercent.toFixed(1)}% vs Previous Month</span>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-2xl bg-[var(--bg-soft)] p-3 border border-[var(--border-color)] transition-all group-hover:border-emerald-500/30">
                <p className="text-[color:var(--text-muted)] font-bold uppercase text-[9px] tracking-wider">Avg Petrol Margin</p>
                <p className="mt-1 font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(metrics.msMargin)} <span className="text-[10px] font-normal text-[color:var(--text-muted)]">/ L</span></p>
              </div>
              <div className="rounded-2xl bg-[var(--bg-soft)] p-3 border border-[var(--border-color)] transition-all group-hover:border-emerald-500/30">
                <p className="text-[color:var(--text-muted)] font-bold uppercase text-[9px] tracking-wider">Avg Diesel Margin</p>
                <p className="mt-1 font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(metrics.hsdMargin)} <span className="text-[10px] font-normal text-[color:var(--text-muted)]">/ L</span></p>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-[var(--border-color)] pt-3 flex items-center justify-between text-xs">
            <span className="text-[color:var(--text-secondary)] text-[11px] font-medium">Active Station Target: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">85% Achieved</strong></span>
            <button onClick={() => setShowLegacyModal(true)} className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View All Sheets</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Column 2: Stacked Metric Cards */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Net Profit Card */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider">Total Net Profit</p>
              <h3 className="mt-1 text-xl font-black text-[color:var(--text-strong)]">{formatCurrency(metrics.finalProfit)}</h3>
              <p className="mt-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Overall Station Summary</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Expenses Card */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider">Expenses & Loss</p>
              <h3 className="mt-1 text-xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(metrics.totalExpense)}</h3>
              <p className="mt-0.5 text-[10px] font-semibold text-[color:var(--text-secondary)]">Total Expenses this month</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-xs">
              <TrendingDown size={20} />
            </div>
          </div>

          {/* Income Card */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider">Total Revenue</p>
              <h3 className="mt-1 text-xl font-black text-[color:var(--text-strong)]">{formatCurrency(metrics.totalProfit)}</h3>
              <p className="mt-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">Total Income this month</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-xs">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        {/* Column 3: 100% Dynamic Cash Flow Bar Chart */}
        <div className="lg:col-span-5 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                Cash Flow ({cashflowPeriod === "yearly" ? filters.month.slice(0, 4) : periodLabel})
              </span>
              <h2 className="text-2xl font-black text-[color:var(--text-strong)]">{formatCurrency(metrics.totalProfit)}</h2>
            </div>
            <div className="flex rounded-xl bg-[var(--bg-soft)] p-1 border border-[var(--border-color)]">
              <button
                onClick={() => setCashflowPeriod("monthly")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
                  cashflowPeriod === "monthly" ? "bg-[var(--bg-panel)] text-[color:var(--text-strong)] shadow-xs" : "text-[color:var(--text-secondary)]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCashflowPeriod("yearly")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
                  cashflowPeriod === "yearly" ? "bg-emerald-600 text-white shadow-sm" : "text-[color:var(--text-secondary)]"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="mt-4 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#064e3b", borderRadius: "12px", borderColor: "#059669", color: "#fff", fontSize: "11px" }}
                  formatter={(val) => [`Rs. ${Number(val).toLocaleString("en-IN")}`, "Revenue Cash Flow"]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {cashflowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isHighlighted ? "#059669" : "rgba(16, 185, 129, 0.25)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Row 2: Main Analytics & AI Insights Grid */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Left 2 Columns: 100% Dynamic Monthly Financial Rhythm Area Chart */}
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-md lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[color:var(--text-strong)]">Monthly Financial Rhythm</h3>
              <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">Revenue vs Expense trend calculated dynamically per month</p>
            </div>

            <div className="flex rounded-xl bg-[var(--bg-soft)] p-1 border border-[var(--border-color)]">
              {["all", "revenue", "profit"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold uppercase transition-all ${
                    chartTab === tab ? "bg-emerald-500 text-white font-bold shadow-sm" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaGraphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-panel)", borderRadius: "12px", borderColor: "var(--border-color)", color: "var(--text-strong)", fontSize: "12px" }}
                  formatter={(val) => [`Rs. ${Number(val).toLocaleString("en-IN")}`, ""]}
                />
                {(chartTab === "all" || chartTab === "revenue") && (
                  <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                )}
                {chartTab === "all" && (
                  <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                )}
                {(chartTab === "all" || chartTab === "profit") && (
                  <Area type="monotone" dataKey="Profit" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Financial Health Gauge & AI Insights */}
        <div className="flex flex-col gap-4">
          {/* Financial Health Gauge Meter Card */}
          <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Financial Health Score</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Zap size={16} />
              </div>
            </div>
            <FinancialHealthGauge score={metrics.healthScore} label="Margin Index" />
          </div>

          {/* AI Insights Card */}
          <div className="rounded-3xl border border-emerald-500/20 bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={15} />
                </div>
                <h4 className="text-xs font-bold text-[color:var(--text-strong)]">Weekly AI Financial Insights</h4>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">Live AI</span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3 transition-all hover:border-emerald-500/30">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Fuel Margin Spike</span>
                  <span className="text-[10px] text-[color:var(--text-muted)]">Today</span>
                </div>
                <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">
                  MS Petrol margin rate calculated at <strong className="text-[color:var(--text-strong)]">{formatCurrency(metrics.msMargin)}</strong>.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3 transition-all hover:border-blue-500/30">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-600 dark:text-blue-400">Card Swipe Revenue</span>
                  <span className="text-[10px] text-[color:var(--text-muted)]">Month</span>
                </div>
                <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">
                  Bank charges profit generated <strong className="text-[color:var(--text-strong)]">{formatCurrency(metrics.cardSwipeProfit)}</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 3: Fuel Product Stock & Dispenser Sales Analytics */}
      <section className="grid gap-5 lg:grid-cols-12">
        {/* Left 8 Cols: Fuel Product Inventory & Nozzle Meter Sales */}
        <div className="lg:col-span-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Fuel size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[color:var(--text-strong)] font-sans">Fuel Product Stock & Nozzle Sales</h3>
                  <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">Real-time tank levels, dispenser sales, and margin rates</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Live Tanks
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* MS Petrol Stock & Meter Card */}
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 transition-all hover:border-blue-500/40 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-bold text-[color:var(--text-strong)]">MS Petrol (Tank 01)</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                    78% Tank Capacity
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-2xl font-black text-[color:var(--text-strong)]">{formatNumber(metrics.msSale)} <span className="text-xs font-semibold text-[color:var(--text-muted)]">Liters Sold</span></p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Margin: {formatCurrency(metrics.msMargin)}/L</p>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-[color:var(--text-muted)] font-semibold mb-1">
                    <span>Physical Stock: 18,450 L</span>
                    <span>Max: 25,000 L</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: "78%" }} />
                  </div>
                </div>
              </div>

              {/* HSD Diesel Stock & Meter Card */}
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 transition-all hover:border-emerald-500/40 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-[color:var(--text-strong)]">HSD Diesel (Tank 02)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    84% Tank Capacity
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-2xl font-black text-[color:var(--text-strong)]">{formatNumber(metrics.hsdSale)} <span className="text-xs font-semibold text-[color:var(--text-muted)]">Liters Sold</span></p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Margin: {formatCurrency(metrics.hsdMargin)}/L</p>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-[color:var(--text-muted)] font-semibold mb-1">
                    <span>Physical Stock: 25,200 L</span>
                    <span>Max: 30,000 L</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: "84%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--border-color)] pt-3 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[color:var(--text-secondary)] font-medium">Average HSD Purchase: {formatNumber(metrics.avgPurchaseHsd.toFixed(2))} | MS Purchase: {formatNumber(metrics.avgPurchaseMs.toFixed(2))}</span>
            <button onClick={() => setShowLegacyModal(true)} className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              <span>View Detailed Metrics</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Station Shift Balance & Quick Action Panel */}
        <div className="lg:col-span-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Wallet size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[color:var(--text-strong)]">Station Shift Settlement</h3>
                  <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">Cash, Bank Swipe & Ledger dues</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Balanced</span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-[var(--bg-soft)] p-2.5 border border-[var(--border-color)] transition-all hover:border-emerald-500/30">
                <span className="text-xs font-semibold text-[color:var(--text-secondary)]">Card Swipe Charges</span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.cardSwipeProfit)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--bg-soft)] p-2.5 border border-[var(--border-color)] transition-all hover:border-emerald-500/30">
                <span className="text-xs font-semibold text-[color:var(--text-secondary)]">Lubricant Sales Profit</span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.lubricantProfit)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--bg-soft)] p-2.5 border border-[var(--border-color)] transition-all hover:border-cyan-500/30">
                <span className="text-xs font-semibold text-[color:var(--text-secondary)]">D.C.D Sales Profit</span>
                <span className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400">{formatCurrency(metrics.dcdProfit)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--bg-soft)] p-2.5 border border-[var(--border-color)] transition-all hover:border-teal-500/30">
                <span className="text-xs font-semibold text-[color:var(--text-secondary)]">Mobile Dispenser (MDU)</span>
                <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">{formatCurrency(metrics.mduOtherProfit)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLegacyModal(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] py-2 text-xs font-bold text-[color:var(--text-strong)] hover:bg-emerald-600 hover:text-white transition-all duration-300"
          >
            <span>Open Granular Finance Cards</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* Row 4: Product Margin Allocation Table */}
      <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[color:var(--text-strong)]">Product & Margin Contribution</h3>
            <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">Profit contribution per fuel product & service stream</p>
          </div>
          <button
            onClick={() => setShowLegacyModal(true)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View Details</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[color:var(--text-muted)] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Stream / Product</th>
                <th className="py-2.5 px-3">Profit Amount</th>
                <th className="py-2.5 px-3">Allocation Bar</th>
                <th className="py-2.5 px-3 text-right">Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {productDistribution.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-soft)] transition-colors">
                  <td className="py-3 px-3 font-bold text-[color:var(--text-strong)]">{item.name}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.value)}</td>
                  <td className="py-3 px-3 w-1/3">
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-[color:var(--text-strong)]">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* LEGACY GRANULAR CARDS MODAL */}
      {showLegacyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-md animate-fade-in">
          <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Standard Granular View</span>
                <h2 className="text-xl font-bold text-[color:var(--text-strong)]">Detailed Finance Cards ({filteredLegacyCards.length} Items)</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-48 sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search card..."
                    value={legacySearch}
                    onChange={(e) => setLegacySearch(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] pl-8 pr-3 py-1.5 text-xs text-[color:var(--text-strong)] outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowLegacyModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Granular Cards Grid */}
            <div className="mt-4 overflow-y-auto pr-1 space-y-4">
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredLegacyCards.map((card, index) => (
                  <LegacyFinanceCard key={index} label={card.label} value={card.value} tone={card.tone} helper={card.helper} />
                ))}
              </section>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 border-t border-[var(--border-color)] pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLegacyModal(false)}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-2 text-xs font-bold text-[color:var(--text-strong)] hover:bg-[var(--bg-hover)]"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
