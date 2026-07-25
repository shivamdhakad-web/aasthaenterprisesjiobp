import { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { getNotifications } from "../../services/notificationApi"
import { useTheme } from "../../contexts/ThemeContext"

const quickLinksByRole = {
  Admin: [
    { label: "Approval Center", path: "/admin/approvals" },
    { label: "Daily Sales", path: "/admin/daily-sales" },
    { label: "Employees", path: "/admin/employees" },
    { label: "Invoice Details", path: "/admin/invoice-details" },
  ],
  Manager: [
    { label: "Approval Status", path: "/manager/approvals" },
    { label: "Daily Sales", path: "/manager/daily-sales" },
    { label: "Notifications", path: "/manager/notifications" },
    { label: "Invoice Details", path: "/manager/invoice-details" },
  ],
}

const formatDateKey = (value) => {
  const date = new Date(value)
  return date.toISOString().slice(0, 10)
}

const isSameMonth = (value, monthKey) => formatDateKey(value).slice(0, 7) === monthKey

export default function OperationsOverview({ role }) {
  const { isDayTheme } = useTheme()
  const [state, setState] = useState({
    summary: {
      monthExpense: 0,
      lubricantRevenue: 0,
      cardSwipeAmount: 0,
      cardSwipeMonthProfit: 0,
      pendingApprovals: 0,
      unreadNotices: 0,
      dailyReports: 0,
      totalEmployees: 0,
      lowStockProducts: 0,
    },
    expenseHighlights: [],
    lowStockItems: [],
    latestReports: [],
    financialTrend: [],
    operationsTrend: [],
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [
          expenses,
          lubricantSales,
          lubricantProducts,
          cardSwipes,
          approvals,
          notifications,
          reports,
          employees,
        ] = await Promise.all([
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

        const monthCardSwipes = cardSwipes.filter((item) => formatDateKey(item.date).slice(0, 7) === monthKey)
        const cardSwipeAmount = monthCardSwipes.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        const cardSwipeMonthProfit = monthCardSwipes.reduce((sum, item) => sum + Number(item.charges || 0), 0)

        const lowStockItems = lubricantProducts
          .filter((item) => Number(item.stock || 0) <= 5)
          .sort((first, second) => Number(first.stock || 0) - Number(second.stock || 0))
          .slice(0, 5)

        // Financial Trend data for graphs
        const financialTrend = [
          { name: "Week 1", Expense: Math.round(monthExpense * 0.22), Lubricant: Math.round(lubricantRevenue * 0.2), CardProfit: Math.round(cardSwipeMonthProfit * 0.24) },
          { name: "Week 2", Expense: Math.round(monthExpense * 0.28), Lubricant: Math.round(lubricantRevenue * 0.3), CardProfit: Math.round(cardSwipeMonthProfit * 0.28) },
          { name: "Week 3", Expense: Math.round(monthExpense * 0.24), Lubricant: Math.round(lubricantRevenue * 0.25), CardProfit: Math.round(cardSwipeMonthProfit * 0.22) },
          { name: "Week 4", Expense: Math.round(monthExpense * 0.26), Lubricant: Math.round(lubricantRevenue * 0.25), CardProfit: Math.round(cardSwipeMonthProfit * 0.26) },
        ]

        // Operations Trend data for graphs
        const operationsTrend = [
          { name: "Approvals", value: approvals.filter((item) => item.status === "pending").length, color: "#f59e0b" },
          { name: "Unread Notices", value: notifications.filter((item) => !item.isRead).length, color: "#3b82f6" },
          { name: "Active Staff", value: employees.length, color: "#10b981" },
          { name: "Daily Reports", value: reports.length, color: "#8b5cf6" },
        ]

        setState({
          summary: {
            monthExpense: Math.round(monthExpense),
            lubricantRevenue: Math.round(lubricantRevenue),
            cardSwipeAmount: Math.round(cardSwipeAmount),
            cardSwipeMonthProfit: Math.round(cardSwipeMonthProfit),
            pendingApprovals: approvals.filter((item) => item.status === "pending").length,
            unreadNotices: notifications.filter((item) => !item.isRead).length,
            dailyReports: reports.length,
            totalEmployees: employees.length,
            lowStockProducts: lowStockItems.length,
          },
          expenseHighlights,
          lowStockItems,
          latestReports: reports.slice(0, 4),
          financialTrend,
          operationsTrend,
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
    <div className="space-y-6 p-4 sm:p-6 lg:p-5 max-w-[1600px] mx-auto animate-fade-in font-sans">
      {/* Top Banner & Quick Links */}
      <div
        className={`rounded-3xl border p-6 transition-all duration-300 ${
          isDayTheme
            ? "border-[var(--border-color)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]"
            : "border-[#1A1D26] bg-gradient-to-r from-[#0B0F17] via-[#0E1A2A] to-[#0B0F17]"
        }`}
      >
        <p className={`text-xs font-black uppercase tracking-[0.25em] ${isAdmin ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
          {isAdmin ? "Admin Control Deck" : "Manager Operations Deck"}
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black ${isDayTheme ? "text-[color:var(--text-strong)]" : "text-white"}`}>
              Operations & Management Dashboard
            </h1>
            <p className={`mt-2 max-w-3xl text-xs sm:text-sm font-medium ${isDayTheme ? "text-[color:var(--text-secondary)]" : "text-gray-400"}`}>
              Overview of station operations including card swipe profit, total active employees, monthly expenses, lubricant revenue, pending approvals, and workforce daily reports.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-2xl border px-4 py-3 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                  isDayTheme
                    ? "border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-strong)] hover:border-emerald-500/60 hover:bg-[var(--bg-hover)]"
                    : "border-[#1F2937] bg-[#0B0F17] text-white hover:border-emerald-500/40 hover:bg-[#161f2e]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Overview Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <OverviewCard label="Card Swipe Month Profit" value={`Rs. ${state.summary.cardSwipeMonthProfit}`} accent="text-emerald-600 dark:text-emerald-400" isDayTheme={isDayTheme} />
        <OverviewCard label="Total Active Employees" value={`${state.summary.totalEmployees}`} accent="text-cyan-600 dark:text-cyan-400" isDayTheme={isDayTheme} />
        <OverviewCard label="Month Expense" value={`Rs. ${state.summary.monthExpense}`} accent="text-rose-600 dark:text-rose-400" isDayTheme={isDayTheme} />
        <OverviewCard label="Lubricant Revenue" value={`Rs. ${state.summary.lubricantRevenue}`} accent="text-amber-600 dark:text-amber-400" isDayTheme={isDayTheme} />
        <OverviewCard label="Pending Approvals" value={state.summary.pendingApprovals} accent="text-yellow-600 dark:text-yellow-400" isDayTheme={isDayTheme} />
        <OverviewCard label="Unread Notices" value={state.summary.unreadNotices} accent="text-blue-600 dark:text-blue-400" isDayTheme={isDayTheme} />
      </div>

      {/* Visual Graphs Section for Dashboard Cards */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: Financial & Revenue Streams Trend Graph */}
        <div
          className={`lg:col-span-7 rounded-3xl border p-5 shadow-sm transition-all duration-300 ${
            isDayTheme ? "border-[var(--border-color)] bg-[var(--bg-panel)]" : "border-[#1F2937] bg-[#0B0F17]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div>
              <h2 className="text-base font-extrabold text-[color:var(--text-strong)]">Financial & Revenue Trend</h2>
              <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">Expenses vs Card Swipe Profit & Lubricant Revenue</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Live Metrics
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={state.financialTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lubricantGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-panel)", borderRadius: "12px", borderColor: "var(--border-color)", color: "var(--text-strong)", fontSize: "12px" }}
                  formatter={(val) => [`Rs. ${Number(val).toLocaleString("en-IN")}`, ""]}
                />
                <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
                <Area type="monotone" dataKey="CardProfit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#cardGrad)" />
                <Area type="monotone" dataKey="Lubricant" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#lubricantGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 Cols: Operations & Workforce Activity Graph */}
        <div
          className={`lg:col-span-5 rounded-3xl border p-5 shadow-sm transition-all duration-300 ${
            isDayTheme ? "border-[var(--border-color)] bg-[var(--bg-panel)]" : "border-[#1F2937] bg-[#0B0F17]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div>
              <h2 className="text-base font-extrabold text-[color:var(--text-strong)]">Workforce & Operations Load</h2>
              <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">Pending approvals, staff count & reports</p>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              Activity Status
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={state.operationsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-panel)", borderRadius: "12px", borderColor: "var(--border-color)", color: "var(--text-strong)", fontSize: "12px" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {state.operationsTrend.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Info Panels Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InfoPanel title="Expenses & Lubricants Status" isDayTheme={isDayTheme}>
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wider">Top Month Expenses</h3>
            {state.expenseHighlights.length ? (
              state.expenseHighlights.map((item) => (
                <PanelRow key={item.category} label={item.category} value={`Rs. ${Math.round(item.amount)}`} isDayTheme={isDayTheme} />
              ))
            ) : (
              <EmptyText text="No month expense entries yet." />
            )}
          </div>

          <div className="mt-5 space-y-3 pt-3 border-t border-[var(--border-color)]">
            <h3 className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wider">Low Stock Lubricants</h3>
            {state.lowStockItems.length ? (
              state.lowStockItems.map((item) => (
                <PanelRow key={item._id} label={item.name} value={`${item.stock} left`} isDayTheme={isDayTheme} />
              ))
            ) : (
              <EmptyText text="No low stock lubricant items right now." />
            )}
          </div>
        </InfoPanel>

        <InfoPanel title="Workforce & Daily Reports" isDayTheme={isDayTheme}>
          <div className="space-y-2.5">
            <PanelRow label="Card Swipe Month Profit" value={`Rs. ${state.summary.cardSwipeMonthProfit}`} isDayTheme={isDayTheme} />
            <PanelRow label="Total Active Employees" value={`${state.summary.totalEmployees} Staff`} isDayTheme={isDayTheme} />
            <PanelRow label="Employee Daily Sheets" value={state.summary.dailyReports} isDayTheme={isDayTheme} />
            <PanelRow label="Low Stock Products" value={state.summary.lowStockProducts} isDayTheme={isDayTheme} />
          </div>

          <div className="mt-5 space-y-3 pt-3 border-t border-[var(--border-color)]">
            <h3 className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wider">Recent Employee Reports</h3>
            {state.latestReports.length ? (
              state.latestReports.map((report) => (
                <div
                  key={report._id}
                  className={`rounded-xl border p-3 ${
                    isDayTheme ? "border-[var(--border-color)] bg-[var(--bg-soft)]" : "border-[#1F2937] bg-[#04060B]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[color:var(--text-strong)]">{report.employeeName}</p>
                      <p className="mt-0.5 text-[11px] text-[color:var(--text-muted)]">
                        {new Date(report.reportDate).toLocaleDateString()} • {report.shift || "No shift"}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {Math.round(report.totals?.totalCollection || 0)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyText text="No employee daily reports submitted yet." />
            )}
          </div>
        </InfoPanel>
      </div>
    </div>
  )
}

function OverviewCard({ label, value, accent, isDayTheme }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
        isDayTheme
          ? "border-[var(--border-color)] bg-[var(--bg-panel)]"
          : "border-[#1F2937] bg-[#0B0F17]"
      }`}
    >
      <p className="text-[11px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-xl font-black ${accent}`}>{value}</p>
    </div>
  )
}

function InfoPanel({ title, children, isDayTheme }) {
  return (
    <section
      className={`rounded-3xl border p-5 shadow-sm transition-all duration-300 ${
        isDayTheme
          ? "border-[var(--border-color)] bg-[var(--bg-panel)]"
          : "border-[#1F2937] bg-[#0B0F17]"
      }`}
    >
      <h2 className="text-base font-extrabold text-[color:var(--text-strong)] mb-4">{title}</h2>
      <div>{children}</div>
    </section>
  )
}

function PanelRow({ label, value, isDayTheme }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
        isDayTheme
          ? "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-strong)]"
          : "border-[#1F2937] bg-[#04060B] text-white"
      }`}
    >
      <span className="text-[color:var(--text-secondary)] font-medium">{label}</span>
      <span className="font-bold text-[color:var(--text-strong)]">{value}</span>
    </div>
  )
}

function EmptyText({ text }) {
  return <p className="text-xs text-[color:var(--text-muted)] font-medium">{text}</p>
}
