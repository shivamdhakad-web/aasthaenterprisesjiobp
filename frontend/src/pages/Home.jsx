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
    { label: "Unified Operations", value: "One Station View", sub: "Sales, stock & staff in one place", icon: LayoutDashboard },
  ]

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] text-[color:var(--text-primary)] font-sans transition-colors duration-300 overflow-x-hidden">
      
      <section className="relative isolate min-h-[650px] overflow-hidden bg-[#10251f] text-white sm:min-h-[680px]">
        <img
          src="/locate-station-fuel.jpeg"
          alt="Jio-bp fuel station"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071711]/85 via-[#071711]/60 to-[#071711]/15" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-transparent to-[#071711]/45" />

        <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between border-b border-white/20 px-3 py-3 sm:px-8 sm:py-4 lg:px-12">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-amber-50 shadow-lg shadow-black/20 sm:h-11 sm:w-11">
              <Fuel size={21} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-amber-50 sm:text-xl">
                  Jio-bp <span className="text-emerald-300">Fuel Station</span>
                </span>
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200/30 bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 sm:inline-flex">
                  <Activity size={11} className="text-emerald-300" /> Station portal
                </span>
              </div>
              <p className="text-[11px] font-medium text-white/75">Aastha Enterprises</p>
            </div>
          </div>

          <button
            onClick={handleDashboardClick}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-amber-50 shadow-lg shadow-black/20 transition-colors hover:bg-emerald-400 sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            {isAuthenticated ? (
              <>
                <LayoutDashboard size={16} /> <span className="hidden sm:inline">Open Dashboard</span><span className="sm:hidden">Open</span>
              </>
            ) : (
              <>
                <LogIn size={16} /> <span className="hidden sm:inline">Login to Station</span><span className="sm:hidden">Login</span>
              </>
            )}
            <ArrowRight size={16} className="hidden sm:block" />
          </button>
        </header>

        <div className="mx-auto flex min-h-[590px] w-full max-w-[1440px] items-center px-5 pb-16 pt-24 sm:px-10 lg:px-12">
          <div className="max-w-2xl">
            <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-emerald-200 sm:text-sm">
              <span className="h-px w-8 bg-emerald-300" /> Aastha Enterprises
            </p>
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-amber-50 sm:text-5xl">
              Jio-bp Fuel Station
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              A clearer way to manage daily fuel sales, station operations, team records and accounts.
            </p>
            <button
              onClick={handleDashboardClick}
              className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-gray-200 shadow-xl shadow-black/20 transition-colors hover:bg-emerald-400"
            >
              <LayoutDashboard size={18} />
              <span>{isAuthenticated ? `Welcome, ${user?.name || "User"}` : "Go to Dashboard"}</span>
              <ChevronRight size={18} />
            </button>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/25 pt-5 text-sm font-medium text-white/85">
              <span className="flex items-center gap-2"><Fuel size={16} className="text-emerald-300" /> Fuel sales</span>
              <span className="flex items-center gap-2"><Truck size={16} className="text-emerald-300" /> Station logistics</span>
              <span className="flex items-center gap-2"><Users size={16} className="text-emerald-300" /> Team operations</span>
            </div>
          </div>
        </div>
      </section>

      {/* OPERATIONAL HIGHLIGHTS BAR */}
      <div className="w-full border-b border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-6">
        <div className="max-w-[1450px] mx-auto grid grid-cols-2 gap-4 xl:grid-cols-5">
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
