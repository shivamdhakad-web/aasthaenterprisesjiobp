import {
  Activity,
  ArrowRight,
  Award,
  Calculator,
  ChevronRight,
  Clock,
  CreditCard,
  Droplets,
  FileSpreadsheet,
  Fuel,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, defaultRoute, user } = useAuth()

  const handleDashboardClick = () => {
    navigate(isAuthenticated ? defaultRoute : "/login")
  }

  const features = [
    {
      icon: Fuel,
      title: "Daily Fuel & DSR Sales",
      description: "Real-time nozzle sales tracking, DSR register logging, rate management, and profit/loss calculation.",
      badge: "Core Sales",
      iconBg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      icon: Truck,
      title: "MDU & Mobile Dispenser",
      description: "Track opening stock, decant deliveries, mobile sales, physical stock audits, and loss/gain metrics.",
      badge: "Logistics",
      iconBg: "bg-cyan-500/10 text-cyan-600",
    },
    {
      icon: Droplets,
      title: "Lubricants & Products",
      description: "Complete lubricant inventory stock tracking, unit profit analysis, cost price management, and bulk sales.",
      badge: "Inventory",
      iconBg: "bg-amber-500/10 text-amber-600",
    },
    {
      icon: CreditCard,
      title: "Credit Ledger & Billing",
      description: "Manage credit customers, fuel issuance entries, payments received, outstanding balance ledgers, and statement PDFs.",
      badge: "Finance",
      iconBg: "bg-purple-500/10 text-purple-600",
    },
    {
      icon: Users,
      title: "Staff Attendance & Payroll",
      description: "Shift logging, daily employee attendance tracking, bonus management, salary ledger, and automated payslips.",
      badge: "Workforce",
      iconBg: "bg-rose-500/10 text-rose-600",
    },
    {
      icon: Calculator,
      title: "Smart Density & Tools",
      description: "ASTM table 53B 15°C fuel density conversion, cash note denomination counter, and GST compound tools.",
      badge: "Audit Vault",
      iconBg: "bg-teal-500/10 text-teal-600",
    },
  ]

  const stats = [
    { label: "24/7 Operations", value: "Round the Clock", sub: "Live Station Tracking", icon: Clock },
    { label: "Precision Audits", value: "100% AccuCheck", sub: "Stock & Density Verification", icon: ShieldCheck },
    { label: "Automated Reports", value: "PDF & Excel", sub: "Instant Register Exports", icon: FileSpreadsheet },
    { label: "Role Security", value: "Admin & Manager", sub: "Protected Data Vault", icon: Award },
  ]

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] text-[color:var(--text-primary)] font-sans transition-colors duration-300 overflow-x-hidden">
      
      {/* HERO SECTION WITH THEME OVERLAY */}
      <div className="relative w-full border-b border-[var(--border-color)]">
        
        {/* BACKGROUND STATION IMAGE */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/locate-station-fuel.jpeg')",
          }}
        />

        {/* THEME ADAPTIVE OVERLAY (Bright in Light Mode, Dark in Night Mode) */}
        <div className="absolute inset-0 bg-[var(--theme-home-overlay)] backdrop-blur-[2px]" />

        {/* NAVIGATION HEADER */}
        <header className="relative z-20 w-full px-3 py-3 sm:px-8 lg:px-20 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-topbar)] backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-600/30 font-black">
              <Fuel size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-[color:var(--text-strong)] sm:text-xl">
                  Jio-bp <span className="text-emerald-600">Fuel Station</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/20">
                  <Activity size={10} className="animate-ping text-emerald-600" /> Active
                </span>
              </div>
              <p className="text-[11px] font-medium text-[color:var(--text-secondary)]">Aastha Enterprises • Fuel Management Deck</p>
            </div>
          </div>

          <button
            onClick={handleDashboardClick}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 hover:bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isAuthenticated ? (
              <>
                <LayoutDashboard size={16} /> Open Dashboard
              </>
            ) : (
              <>
                <LogIn size={16} /> Login to Station
              </>
            )}
            <ArrowRight size={16} />
          </button>
        </header>

        {/* HERO MAIN BODY */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8 max-w-5xl mx-auto">
          
          {/* BADGE */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-4 shadow-sm">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Next-Gen Jio-bp Station & Retail Management Portal</span>
          </div>

          {/* MAIN TITLE */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[color:var(--text-strong)] tracking-tight leading-[1.15] mb-6">
            Intelligent Fuel Operations for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Jio-bp Fuel Station
            </span>
          </h1>

          {/* SUBTITLE */}
          <p className="max-w-2xl text-base sm:text-lg text-[color:var(--text-primary)] font-medium leading-relaxed mb-5 ">
            Complete management deck for daily fuel sales, mobile dispenser logistics, density audits, lubricant stock, credit ledgers, and staff attendance.
          </p>

          {/* MAIN BUTTON */}
          <div className="w-full max-w-sm mb-9">
            <button
              onClick={handleDashboardClick}
              className="w-full group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <LayoutDashboard size={20} />
              <span>{isAuthenticated ? `Welcome, ${user?.name || 'User'}` : "Go to Dashboard"}</span>
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* LIVE STATION PRICE TICKER CARDS */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]">
            <div className="flex flex-col items-center p-3 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">HSD Diesel</span>
              <span className="text-base font-extrabold text-[color:var(--text-strong)] mt-0.5">High Speed</span>
              <span className="text-[11px] font-medium text-[color:var(--text-secondary)]">Live Meter Sale</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">MS Petrol</span>
              <span className="text-base font-extrabold text-[color:var(--text-strong)] mt-0.5">Motor Spirit</span>
              <span className="text-[11px] font-medium text-[color:var(--text-secondary)]">Density Verified</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Lubricants</span>
              <span className="text-base font-extrabold text-[color:var(--text-strong)] mt-0.5">Engine Oil</span>
              <span className="text-[11px] font-medium text-[color:var(--text-secondary)]">In Stock</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">MDU Express</span>
              <span className="text-base font-extrabold text-[color:var(--text-strong)] mt-0.5">Mobile Dispenser</span>
              <span className="text-[11px] font-medium text-[color:var(--text-secondary)]">Active Logistics</span>
            </div>
          </div>

        </div>
      </div>

      {/* OPERATIONAL HIGHLIGHTS BAR */}
      <div className="w-full border-b border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-color)] shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[color:var(--text-strong)] leading-snug">{stat.value}</h4>
                  <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">{stat.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FEATURE CARDS SECTION */}
      <section className="py-14 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--text-strong)] tracking-tight">
            Integrated Station Registers & Management Deck
          </h2>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)] max-w-2xl mx-auto">
            Engineered for Jio-bp station managers and owners to simplify audit records, track daily profits, and manage station workflow.
          </p>
        </div>

        {/* FEATURE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                onClick={handleDashboardClick}
                className="group cursor-pointer rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg}`}>
                      <Icon size={22} />
                    </div>
                    <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-[11px] font-semibold text-[color:var(--text-primary)]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-[color:var(--text-strong)] mb-2 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  <span>Explore Module</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-8 text-center text-xs text-[color:var(--text-secondary)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Fuel size={16} className="text-emerald-600" />
            <span className="font-bold text-[color:var(--text-strong)]">Jio-bp Fuel Station Management System</span>
          </div>
          <p>© {new Date().getFullYear()} Aastha Enterprises Jio-bp. All Rights Reserved.</p>
          <button
            onClick={handleDashboardClick}
            className="text-emerald-600 hover:underline font-bold"
          >
            {isAuthenticated ? "Go to Dashboard" : "Sign In to Station"}
          </button>
        </div>
      </footer>

    </div>
  )
}