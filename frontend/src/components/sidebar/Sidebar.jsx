import { useMemo } from "react"
import {
  Activity,
  Bell,
  CreditCard,
  FileText,
  LayoutDashboard,
  Lock,
  Settings,
  Truck,
  Users,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

const routeThemes = [
  {
    match: ["/employees"],
    name: "People Intelligence",
    accent: "#ec4899",
    accent2: "#a855f7",
    soft: "rgba(236, 72, 153, 0.14)",
    active: "rgba(236, 72, 153, 0.16)",
    border: "rgba(236, 72, 153, 0.35)",
  },
  {
    match: ["/expenses"],
    name: "Expense Intelligence",
    accent: "#f59e0b",
    accent2: "#eab308",
    soft: "rgba(245, 158, 11, 0.14)",
    active: "rgba(245, 158, 11, 0.16)",
    border: "rgba(245, 158, 11, 0.36)",
  },
  {
    match: ["/lubricants"],
    name: "Lubricant Intelligence",
    accent: "#22c55e",
    accent2: "#84cc16",
    soft: "rgba(34, 197, 94, 0.13)",
    active: "rgba(34, 197, 94, 0.16)",
    border: "rgba(34, 197, 94, 0.34)",
  },
  {
    match: ["/cardSwipe"],
    name: "Settlement View",
    accent: "#22d3ee",
    accent2: "#f472b6",
    soft: "rgba(34, 211, 238, 0.12)",
    active: "rgba(34, 211, 238, 0.15)",
    border: "rgba(34, 211, 238, 0.34)",
  },
  {
    match: ["/ttdrivers"],
    name: "Tanker Dispatch Atlas",
    accent: "#f8b84e",
    accent2: "#38d978",
    soft: "rgba(248, 184, 78, 0.14)",
    active: "rgba(248, 184, 78, 0.18)",
    border: "rgba(248, 184, 78, 0.4)",
  },
  {
    match: ["/customerdrivers"],
    name: "Driver Intelligence",
    accent: "#38bdf8",
    accent2: "#ec4899",
    soft: "rgba(56, 189, 248, 0.13)",
    active: "rgba(56, 189, 248, 0.16)",
    border: "rgba(56, 189, 248, 0.36)",
  },
  {
    match: ["/dashboard"],
    name: "Command Center",
    accent: "#84cc16",
    accent2: "#22c55e",
    soft: "rgba(132, 204, 22, 0.14)",
    active: "rgba(132, 204, 22, 0.16)",
    border: "rgba(132, 204, 22, 0.35)",
  },
  {
    match: ["/meter-readings", "/tanker-deliveries", "/mobileDispenser"],
    name: "Operations Flow",
    accent: "#60a5fa",
    accent2: "#22d3ee",
    soft: "rgba(96, 165, 250, 0.13)",
    active: "rgba(96, 165, 250, 0.16)",
    border: "rgba(96, 165, 250, 0.34)",
  },
  {
    match: ["/credit-customers"],
    name: "Credit Ledger",
    accent: "#818cf8",
    accent2: "#c084fc",
    soft: "rgba(129, 140, 248, 0.13)",
    active: "rgba(129, 140, 248, 0.16)",
    border: "rgba(129, 140, 248, 0.34)",
  },
  {
    match: ["/secure-notes", "/reminder", "/setting"],
    name: "Secure System",
    accent: "#94a3b8",
    accent2: "#38bdf8",
    soft: "rgba(148, 163, 184, 0.12)",
    active: "rgba(148, 163, 184, 0.16)",
    border: "rgba(148, 163, 184, 0.32)",
  },
]

const defaultTheme = {
  name: "Station Core",
  accent: "#ef4444",
  accent2: "#84cc16",
  soft: "rgba(239, 68, 68, 0.12)",
  active: "rgba(239, 68, 68, 0.15)",
  border: "rgba(239, 68, 68, 0.34)",
}

const sidebarStyles = String.raw`
.station-sidebar {
  --route-accent: #ef4444;
  --route-accent-2: #84cc16;
  --route-soft: rgba(239, 68, 68, 0.12);
  --route-active: rgba(239, 68, 68, 0.15);
  --route-border: rgba(239, 68, 68, 0.34);
  background:
    radial-gradient(circle at 8% 8%, var(--route-soft), transparent 28%),
    radial-gradient(circle at 95% 42%, color-mix(in srgb, var(--route-accent-2) 14%, transparent), transparent 34%),
    linear-gradient(180deg, rgba(8, 10, 15, 0.98), rgba(3, 5, 10, 0.99));
  box-shadow:
    inset -1px 0 0 rgba(255, 255, 255, 0.04),
    24px 0 80px rgba(0, 0, 0, 0.3);
}

.station-sidebar::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(180deg, black, transparent 78%);
  pointer-events: none;
  opacity: 0.42;
}

.station-brand-mark {
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.32), transparent 36%),
    linear-gradient(135deg, var(--route-accent), var(--route-accent-2));
  box-shadow: 0 14px 34px color-mix(in srgb, var(--route-accent) 30%, transparent);
}

.station-theme-chip {
  border-color: var(--route-border);
  background: var(--route-soft);
  color: color-mix(in srgb, var(--route-accent) 72%, white);
}

.station-nav-scroll {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--route-accent) 45%, #334155) transparent;
}

.station-nav-scroll::-webkit-scrollbar {
  width: 5px;
}

.station-nav-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: linear-gradient(180deg, var(--route-accent), rgba(148, 163, 184, 0.3));
}

.station-sidebar-item {
  position: relative;
  overflow: hidden;
}

.station-sidebar-item::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, var(--route-accent), var(--route-accent-2));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.station-sidebar-item-active {
  color: white;
  background:
    linear-gradient(90deg, var(--route-active), rgba(255, 255, 255, 0.045)),
    rgba(255, 255, 255, 0.035);
  border-color: var(--route-border);
  box-shadow:
    0 14px 34px color-mix(in srgb, var(--route-accent) 16%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.station-sidebar-item-active::before {
  opacity: 1;
}

.station-sidebar-item-active .station-sidebar-icon {
  color: var(--route-accent);
}

.station-dev-card {
  background:
    radial-gradient(circle at 20% 0%, var(--route-soft), transparent 40%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02)),
    rgba(8, 12, 22, 0.8);
  border-color: rgba(255, 255, 255, 0.09);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.09);
}
`

function getRouteTheme(pathname) {
  return routeThemes.find((theme) => theme.match.some((route) => pathname === route || pathname.startsWith(`${route}/`))) || defaultTheme
}

export default function Sidebar({ open, setOpen }) {
  const location = useLocation()
  const theme = useMemo(() => getRouteTheme(location.pathname), [location.pathname])

  const themeVars = {
    "--route-accent": theme.accent,
    "--route-accent-2": theme.accent2,
    "--route-soft": theme.soft,
    "--route-active": theme.active,
    "--route-border": theme.border,
  }

  return (
    <>
      <style>{sidebarStyles}</style>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />}

      <div
        style={themeVars}
        className={`
          station-sidebar fixed lg:static top-0 left-0 h-screen w-[240px]
          border-r border-white/10 z-50 transform transition-transform duration-300
          flex flex-col overflow-hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="relative z-10 pt-6 px-4 shrink-0">
          <div className="flex items-center gap-3 pb-4">
            <div className="station-brand-mark w-11 h-11 rounded-2xl flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-white"
              >
                <line x1="3" x2="15" y1="22" y2="22" />
                <line x1="4" x2="14" y1="9" y2="9" />
                <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
                <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
              </svg>
            </div>

            <div>
              <h1 className="text-white font-semibold leading-tight">Aastha Enterprises</h1>
              <p className="text-xs text-gray-400">Jio-bp Station</p>
            </div>
          </div>

          <div className="station-theme-chip rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-[0.16em] uppercase">
            {theme.name}
          </div>
        </div>

        <nav className="station-nav-scroll relative z-10 flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          <SectionLabel text="Operations" />

          <NavLinkItem to="/dashboard" icon={<LayoutDashboard size={18} />} text="Dashboard" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/meter-readings" icon={<Activity size={18} />} text="Meter Readings" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/tanker-deliveries" icon={<Truck size={18} />} text="Tanker Deliveries" pathname={location.pathname} setOpen={setOpen} />

          <SectionLabel text="Management" extraClass="mt-6" />

          <NavLinkItem to="/employees" icon={<Users size={18} />} text="Employees" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/credit-customers" icon={<CreditCard size={18} />} text="Credit Customers" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/expenses" icon={<FileText size={18} />} text="Expenses" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/lubricants" icon={<FileText size={18} />} text="Lubricants" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/mobileDispenser" icon={<FileText size={18} />} text="Mobile Dispenser" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/cardSwipe" icon={<FileText size={18} />} text="Card Swipe" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/ttdrivers" icon={<Truck size={18} />} text="T.T Drivers" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/customerdrivers" icon={<Truck size={18} />} text="Customer Drivers" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/secure-notes" icon={<Lock size={18} />} text="Secure Notes" pathname={location.pathname} setOpen={setOpen} />

          <SectionLabel text="System" extraClass="mt-6" />

          <NavLinkItem to="/reminder" icon={<Bell size={18} />} text="Reminder" pathname={location.pathname} setOpen={setOpen} />
          <NavLinkItem to="/setting" icon={<Settings size={18} />} text="Settings" pathname={location.pathname} setOpen={setOpen} />
        </nav>

        <div className="relative z-10 mx-3 mb-4 rounded-2xl station-dev-card border p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Developed by</p>
          <p
            className="text-sm font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})` }}
          >
            Deepak Nagar
          </p>
        </div>
      </div>
    </>
  )
}

function SectionLabel({ text, extraClass = "" }) {
  return <p className={`text-[11px] uppercase tracking-[0.18em] text-gray-500 px-3 ${extraClass}`}>{text}</p>
}

function NavLinkItem({ to, icon, text, pathname, setOpen }) {
  const active = pathname === to || pathname.startsWith(`${to}/`)

  return (
    <Link to={to} onClick={() => setOpen(false)}>
      <SidebarItem icon={icon} text={text} active={active} />
    </Link>
  )
}

function SidebarItem({ icon, text, active }) {
  return (
    <div
      className={`
        station-sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
        border transition duration-200
        ${
          active
            ? "station-sidebar-item-active"
            : "border-transparent text-gray-400 hover:bg-white/[0.045] hover:text-white hover:border-white/10"
        }
      `}
    >
      <span className="station-sidebar-icon transition-colors">{icon}</span>
      <span className="text-sm font-medium">{text}</span>
    </div>
  )
}



// import { useState } from "react"
// import {
// LayoutDashboard,
// Truck,
// Users,
// CreditCard,
// FileText,
// Bell,
// Lock,
// Settings,
// Activity
// } from "lucide-react"

// import { Link, useLocation } from "react-router-dom"

// export default function Sidebar({open,setOpen}){

// const location = useLocation()

// return(

// <>

// {/* BACKDROP */}

// {open && (

// <div
// onClick={()=>setOpen(false)}
// className="fixed inset-0 bg-black/50 z-40 lg:hidden"
// />

// )}


// {/* SIDEBAR */}

// <div className={`
// fixed lg:static top-0 left-0 h-screen w-[240px] bg-[#04060B]
// border-r border-[#1A1D26] z-50 transform transition-transform
// flex flex-col overflow-hidden
// ${open ? "translate-x-0" : "-translate-x-full"}
// lg:translate-x-0
// `}>

// <div className="pt-6 pl-6 shrink-0">

// <div className="flex items-center gap-3 pb-3">

// <div className="w-9 h-9 rounded-lg bg-lime-500 flex items-center justify-center">
// <svg
// xmlns="http://www.w3.org/2000/svg"
// width="24"
// height="24"
// viewBox="0 0 24 24"
// fill="none"
// stroke="currentColor"
// strokeWidth="2"
// strokeLinecap="round"
// strokeLinejoin="round"
// className="w-5 h-5 text-white"
// >
// <line x1="3" x2="15" y1="22" y2="22"></line>
// <line x1="4" x2="14" y1="9" y2="9"></line>
// <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path>
// <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path>
// </svg>
// </div>

// <div>

// <h1 className="text-white font-semibold">
// Aastha Enterprises
// </h1>

// <p className="text-xs text-gray-400">
// Jio-bp Station
// </p>

// </div>

// </div>

// </div>


// <nav className="flex-1 px-3 py-4  space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">

// <p className="text-xs text-gray-500 px-3">
// OPERATIONS
// </p>

// <Link to="/dashboard" onClick={()=>setOpen(false)}>
// <SidebarItem
// icon={<LayoutDashboard size={18}/>}
// text="Dashboard"
// active={location.pathname === "/dashboard"}
// />
// </Link>

// <Link to="/meter-readings" onClick={()=>setOpen(false)}>
// <SidebarItem
// icon={<Activity size={18}/>}
// text="Meter Readings"
// active={location.pathname === "/meter-readings"}
// />
// </Link>

// <Link to="/tanker-deliveries" onClick={()=>setOpen(false)}>
// <SidebarItem
// icon={<Truck size={18}/>}
// text="Tanker Deliveries"
// active={location.pathname === "/tanker-deliveries"}
// />
// </Link>

// <p className="text-xs text-gray-500 px-3 mt-6">
// MANAGEMENT
// </p>

// <Link to="/employees" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<Users size={18}/>} text="Employees" active={location.pathname === "/employees"}/>
// </Link>

// <Link to="/credit-customers" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<CreditCard size={18}/>} text="Credit Customers" active={location.pathname === "/credit-customers"}/>
// </Link>

// <Link to="/expenses" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<FileText size={18}/>} text="Expenses" active={location.pathname === "/expenses"}/>
// </Link>

// <Link to="/lubricants" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<FileText size={18}/>} text="Lubricants" active={location.pathname === "/lubricants"}/>
// </Link>

// <Link to="/mobileDispenser" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<FileText size={18}/>} text="Mobile Dispenser" active={location.pathname === "/mobileDispenser"}/>
// </Link>

// <Link to="/cardSwipe" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<FileText size={18}/>} text="Card Swipe" active={location.pathname === "/cardSwipe"}/>
// </Link>

// <Link to="/ttdrivers" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<Truck size={18}/>} text="T.T Drivers" active={location.pathname === "/ttdrivers"}/>
// </Link>

// <Link to="/customerdrivers" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<Truck size={18}/>} text="Customer Drivers" active={location.pathname === "/customerdrivers"}/>
// </Link>

// <Link to="/secure-notes" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<Lock size={18}/>} text="Secure Notes" active={location.pathname === "/secure-notes"}/>
// </Link>

// <p className="text-xs text-gray-500 px-3 mt-6">
// SYSTEM
// </p>

// <Link to="/reminder" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<Bell size={18}/>} text="Reminder" active={location.pathname === "/reminder"}/>
// </Link>

// <Link to="/setting" onClick={()=>setOpen(false)}>
// <SidebarItem icon={<Settings size={18}/>} text="Settings" active={location.pathname === "/setting"}/>
// </Link>



// </nav>

// <div className="mx-3 mb-4 pb-4 pr-4 pl-4 pt-3 rounded-2xl bg-gradient-to-br from-[#0B0F17] to-[#111827] border border-[#1A1D26] text-center shadow-lg">

//   <p className="text-xs text-gray-400 mb-1">
//     Developed by
//   </p>

//   <p className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
//     Deepak Nagar
//   </p>

// </div>


// </div>

// </>

// )

// }



// function SidebarItem({icon,text,active}){

// return(

// <div
// className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition
// ${active
// ? "bg-[#1A1D26] text-red-500"
// : "text-gray-400 hover:bg-[#0A0D14] hover:text-white"
// }`}
// >

// {icon}

// <span className="text-sm">
// {text}
// </span>

// </div>

// )
// }