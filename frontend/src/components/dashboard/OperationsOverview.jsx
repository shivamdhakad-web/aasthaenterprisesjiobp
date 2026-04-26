import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getApprovals } from "../../services/approvalApi"
import { getEntries as getCardSwipeEntries } from "../../services/cardSwipeApi"
import { getEmployeeChoices } from "../../services/authApi"
import { getDailyReports } from "../../services/dailyReportApi"
import { getExpenses } from "../../services/expenseApi"
import { getLubricants, getProducts } from "../../services/lubricantApi"
import { getEntries as getMobileEntries, getSettings as getMobileSettings } from "../../services/mobileDispenserApi"
import { getNotifications } from "../../services/notificationApi"
import { useTheme } from "../../contexts/ThemeContext"

const quickLinksByRole = {
  Admin: [
    { label: "Approval Center", path: "/admin/approvals" },
    { label: "Employee Daily Reports", path: "/admin/daily-reports" },
    { label: "Employees", path: "/admin/employees" },
    { label: "Mobile Dispenser", path: "/admin/mobile-dispenser" },
  ],
  Manager: [
    { label: "Approval Status", path: "/manager/approvals" },
    { label: "Employee Daily Reports", path: "/manager/daily-reports" },
    { label: "Notifications", path: "/manager/notifications" },
    { label: "Mobile Dispenser", path: "/manager/mobile-dispenser" },
  ],
}

const chartColors = ["#22C55E", "#38BDF8", "#F59E0B"]

const formatDateKey = (value) => {
  const date = new Date(value)
  return date.toISOString().slice(0, 10)
}

const isSameMonth = (value, monthKey) => formatDateKey(value).slice(0, 7) === monthKey

const buildDailyWindow = (days = 7) => {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let index = days - 1; index >= 0; index -= 1) {
    const current = new Date(today)
    current.setDate(today.getDate() - index)
    result.push(current.toISOString().slice(0, 10))
  }

  return result
}

export default function OperationsOverview({ role }) {
  const { isDayTheme } = useTheme()
  const [state, setState] = useState({
    summary: {
      todaySale: 0,
      todayRevenue: 0,
      currentStock: 0,
      tankLevel: 0,
      monthExpense: 0,
      lubricantRevenue: 0,
      cardSwipeAmount: 0,
      pendingApprovals: 0,
      unreadNotices: 0,
      dailyReports: 0,
      activeEmployees: 0,
      lowStockProducts: 0,
    },
    salesTrend: [],
    revenueTrend: [],
    mixData: [],
    expenseHighlights: [],
    lowStockItems: [],
    latestReports: [],
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [
          mobileEntries,
          mobileSettings,
          expenses,
          lubricantSales,
          lubricantProducts,
          cardSwipes,
          approvals,
          notifications,
          reports,
          employees,
        ] = await Promise.all([
          getMobileEntries(),
          getMobileSettings(),
          getExpenses(),
          getLubricants(),
          getProducts(),
          getCardSwipeEntries(),
          getApprovals(),
          getNotifications(),
          getDailyReports(),
          getEmployeeChoices(),
        ])

        const todayKey = new Date().toISOString().slice(0, 10)
        const monthKey = todayKey.slice(0, 7)

        const trendMap = Object.fromEntries(
          buildDailyWindow(7).map((key) => [
            key,
            {
              date: key.slice(5),
              sale: 0,
              stock: 0,
              gross: 0,
              net: 0,
            },
          ]),
        )

        let todaySale = 0
        let todayRevenue = 0

        mobileEntries.forEach((entry) => {
          const dateKey = formatDateKey(entry.date)
          const saleLiter = Number(entry.saleLiter || 0)
          const stockAdd = Number(entry.stockAdd || 0)
          const gross = Number(entry.profit || 0)
          const net = Number(entry.finalProfit || 0)

          if (dateKey === todayKey) {
            todaySale += saleLiter
            todayRevenue += net
          }

          if (trendMap[dateKey]) {
            trendMap[dateKey].sale += saleLiter
            trendMap[dateKey].stock += stockAdd
            trendMap[dateKey].gross += gross
            trendMap[dateKey].net += net
          }
        })

        const salesTrend = Object.values(trendMap)
        const revenueTrend = Object.values(trendMap)

        const monthExpense = expenses
          .filter((item) => isSameMonth(item.date, monthKey))
          .reduce((sum, item) => sum + Number(item.amount || 0), 0)

        const expenseBuckets = {}
        expenses
          .filter((item) => isSameMonth(item.date, monthKey))
          .forEach((item) => {
            const category = item.category || "Other"
            expenseBuckets[category] = (expenseBuckets[category] || 0) + Number(item.amount || 0)
          })

        const expenseHighlights = Object.entries(expenseBuckets)
          .sort((first, second) => second[1] - first[1])
          .slice(0, 4)
          .map(([category, amount]) => ({
            category,
            amount,
          }))

        const lubricantRevenue = lubricantSales
          .filter((item) => String(item.date || "").slice(0, 7) === monthKey)
          .reduce((sum, item) => sum + Number(item.total || 0), 0)

        const cardSwipeAmount = cardSwipes
          .filter((item) => formatDateKey(item.date).slice(0, 7) === monthKey)
          .reduce((sum, item) => sum + Number(item.amount || 0), 0)

        const lowStockItems = lubricantProducts
          .filter((item) => Number(item.stock || 0) <= 5)
          .sort((first, second) => Number(first.stock || 0) - Number(second.stock || 0))
          .slice(0, 5)

        const currentStock = Number(mobileSettings?.currentStock || 0)
        const openingStock = Number(mobileSettings?.openingStock || 0)
        const tankLevel =
          openingStock > 0 ? Math.min(100, Math.round((currentStock / openingStock) * 100)) : 0

        setState({
          summary: {
            todaySale: Math.round(todaySale),
            todayRevenue: Math.round(todayRevenue),
            currentStock: Math.round(currentStock),
            tankLevel,
            monthExpense: Math.round(monthExpense),
            lubricantRevenue: Math.round(lubricantRevenue),
            cardSwipeAmount: Math.round(cardSwipeAmount),
            pendingApprovals: approvals.filter((item) => item.status === "pending").length,
            unreadNotices: notifications.filter((item) => !item.isRead).length,
            dailyReports: reports.length,
            activeEmployees: employees.length,
            lowStockProducts: lowStockItems.length,
          },
          salesTrend,
          revenueTrend,
          mixData: [
            { name: "Diesel Sold", value: salesTrend.reduce((sum, item) => sum + item.sale, 0) },
            { name: "Stock Added", value: salesTrend.reduce((sum, item) => sum + item.stock, 0) },
            { name: "Current Stock", value: currentStock },
          ],
          expenseHighlights,
          lowStockItems,
          latestReports: reports.slice(0, 4),
        })
      } catch {
        setState((current) => current)
      }
    }

    load()
  }, [role])

  const quickLinks = quickLinksByRole[role] || []
  const isAdmin = role === "Admin"

  return (
    <div className="space-y-6 p-6">
      <div
        className={`rounded-3xl border p-6 ${
          isDayTheme
            ? "border-[var(--border-strong)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fff0_58%,#edf7e0_100%)] shadow-[0_24px_50px_rgba(16,24,20,0.07)]"
            : "border-[#1A1D26] bg-gradient-to-r from-[#0B0F17] via-[#0E1A2A] to-[#0B0F17]"
        }`}
      >
        <p className={`text-xs uppercase tracking-[0.3em] ${isAdmin ? "text-red-300" : "text-blue-300"}`}>
          {isAdmin ? "Admin Control Deck" : "Manager Operations Deck"}
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`text-3xl font-semibold ${isDayTheme ? "text-[color:var(--text-strong)]" : "text-white"}`}>
              Mobile dispenser linked dashboard
            </h1>
            <p className={`mt-2 max-w-3xl text-sm ${isDayTheme ? "text-[color:var(--text-secondary)]" : "text-gray-400"}`}>
              Diesel sold, net revenue, current stock, recent sales trend, and support modules like
              expenses, lubricants, card swipe, approvals, notices, and employee daily sheets all
              flow into this summary.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  isDayTheme
                    ? "border-[var(--border-color)] bg-white text-[color:var(--text-strong)] hover:border-[#9be564] hover:bg-[#f7fbf1]"
                    : "border-[#1F2937] bg-black/20 text-gray-200 hover:border-red-500/30 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard label="Diesel Sold Today" value={`${state.summary.todaySale} L`} accent="text-cyan-300" />
        <OverviewCard label="Revenue Today" value={`Rs. ${state.summary.todayRevenue}`} accent="text-green-300" />
        <OverviewCard
          label="Tank Level / Current Stock"
          value={`${state.summary.tankLevel}% / ${state.summary.currentStock} L`}
          accent="text-white"
        />
        <OverviewCard label="Pending Approvals" value={state.summary.pendingApprovals} accent="text-yellow-300" />
        <OverviewCard label="Unread Notices" value={state.summary.unreadNotices} accent="text-blue-300" />
        <OverviewCard label="Month Expense" value={`Rs. ${state.summary.monthExpense}`} accent="text-red-300" />
        <OverviewCard
          label="Lubricant Revenue"
          value={`Rs. ${state.summary.lubricantRevenue}`}
          accent="text-emerald-300"
        />
        <OverviewCard label="Card Swipe Total" value={`Rs. ${state.summary.cardSwipeAmount}`} accent="text-orange-300" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ChartCard title="Today Sales Trend">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={state.salesTrend}>
              <defs>
                <linearGradient id="saleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1F2535" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Area type="monotone" dataKey="sale" stroke="#38BDF8" fill="url(#saleGradient)" />
              <Area type="monotone" dataKey="stock" stroke="#22C55E" fill="url(#stockGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fuel Mix">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={state.mixData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {state.mixData.map((item, index) => (
                  <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {state.mixData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm text-gray-300">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                  {item.name}
                </span>
                <span>{Math.round(item.value)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ChartCard title="Fuel Revenue Trend">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={state.revenueTrend}>
              <CartesianGrid stroke="#1F2535" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="gross" fill="#38BDF8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="net" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="space-y-4">
          <InfoPanel title="Expenses">
            {state.expenseHighlights.length ? (
              state.expenseHighlights.map((item) => (
                <PanelRow key={item.category} label={item.category} value={`Rs. ${Math.round(item.amount)}`} />
              ))
            ) : (
              <EmptyText text="No month expense entries yet." />
            )}
          </InfoPanel>

          <InfoPanel title="Lubricants">
            {state.lowStockItems.length ? (
              state.lowStockItems.map((item) => (
                <PanelRow key={item._id} label={item.name} value={`${item.stock} left`} />
              ))
            ) : (
              <EmptyText text="No low stock lubricant items right now." />
            )}
          </InfoPanel>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <InfoPanel title="Card Swipe and Workforce">
          <PanelRow label="Monthly Card Swipe" value={`Rs. ${state.summary.cardSwipeAmount}`} />
          <PanelRow label="Active Employees" value={state.summary.activeEmployees} />
          <PanelRow label="Employee Daily Sheets" value={state.summary.dailyReports} />
          <PanelRow label="Low Stock Products" value={state.summary.lowStockProducts} />
        </InfoPanel>

        <InfoPanel title="Latest Employee Daily Reports">
          {state.latestReports.length ? (
            state.latestReports.map((report) => (
              <div
                key={report._id}
                className="rounded-xl border border-[#1F2937] bg-[#04060B] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{report.employeeName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(report.reportDate).toLocaleDateString()} • {report.shift || "No shift"}
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                    Rs. {Math.round(report.totals?.totalCollection || 0)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <EmptyText text="No employee daily reports submitted yet." />
          )}
        </InfoPanel>
      </div>
    </div>
  )
}

function OverviewCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function InfoPanel({ title, children }) {
  return (
    <section className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function PanelRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#1F2937] bg-[#04060B] px-4 py-3 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}

function EmptyText({ text }) {
  return <p className="text-sm text-gray-500">{text}</p>
}
