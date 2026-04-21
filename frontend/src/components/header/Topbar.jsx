import { useEffect, useMemo, useState } from "react"
import { Bell, LogOut, Menu, Search } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { getReminders } from "../../services/reminderApi"

const routeThemes = [
  {
    match: ["/employees"],
    name: "People Intelligence",
    accent: "#ec4899",
    accent2: "#a855f7",
    soft: "rgba(236, 72, 153, 0.14)",
    border: "rgba(236, 72, 153, 0.36)",
  },
  {
    match: ["/expenses"],
    name: "Expense Intelligence",
    accent: "#f59e0b",
    accent2: "#eab308",
    soft: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.36)",
  },
  {
    match: ["/lubricants"],
    name: "Lubricant Intelligence",
    accent: "#22c55e",
    accent2: "#84cc16",
    soft: "rgba(34, 197, 94, 0.13)",
    border: "rgba(34, 197, 94, 0.34)",
  },
  {
    match: ["/cardSwipe"],
    name: "Settlement View",
    accent: "#22d3ee",
    accent2: "#f472b6",
    soft: "rgba(34, 211, 238, 0.12)",
    border: "rgba(34, 211, 238, 0.34)",
  },
  {
    match: ["/ttdrivers"],
    name: "Tanker Dispatch Atlas",
    accent: "#f8b84e",
    accent2: "#38d978",
    soft: "rgba(248, 184, 78, 0.14)",
    border: "rgba(248, 184, 78, 0.4)",
  },
  {
    match: ["/customerdrivers"],
    name: "Driver Intelligence",
    accent: "#38bdf8",
    accent2: "#ec4899",
    soft: "rgba(56, 189, 248, 0.13)",
    border: "rgba(56, 189, 248, 0.36)",
  },
  {
    match: ["/dashboard"],
    name: "Command Center",
    accent: "#84cc16",
    accent2: "#22c55e",
    soft: "rgba(132, 204, 22, 0.14)",
    border: "rgba(132, 204, 22, 0.35)",
  },
  {
    match: ["/meter-readings", "/tanker-deliveries", "/mobileDispenser"],
    name: "Operations Flow",
    accent: "#60a5fa",
    accent2: "#22d3ee",
    soft: "rgba(96, 165, 250, 0.13)",
    border: "rgba(96, 165, 250, 0.34)",
  },
  {
    match: ["/credit-customers"],
    name: "Credit Ledger",
    accent: "#818cf8",
    accent2: "#c084fc",
    soft: "rgba(129, 140, 248, 0.13)",
    border: "rgba(129, 140, 248, 0.34)",
  },
  {
    match: ["/secure-notes", "/reminder", "/setting"],
    name: "Secure System",
    accent: "#94a3b8",
    accent2: "#38bdf8",
    soft: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.32)",
  },
]

const defaultTheme = {
  name: "Station Core",
  accent: "#ef4444",
  accent2: "#84cc16",
  soft: "rgba(239, 68, 68, 0.12)",
  border: "rgba(239, 68, 68, 0.34)",
}

const topbarStyles = String.raw`
.station-topbar {
  --route-accent: #ef4444;
  --route-accent-2: #84cc16;
  --route-soft: rgba(239, 68, 68, 0.12);
  --route-border: rgba(239, 68, 68, 0.34);
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 28% 0%, var(--route-soft), transparent 38%),
    linear-gradient(180deg, rgba(8, 10, 15, 0.98), rgba(3, 5, 10, 0.98));
  box-shadow:
    inset 0 -1px 0 rgba(255, 255, 255, 0.06),
    0 16px 48px rgba(0, 0, 0, 0.26);
}

.station-topbar::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--route-accent), var(--route-accent-2), transparent);
  opacity: 0.58;
  pointer-events: none;
}

.station-search {
  border-color: rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.018)),
    rgba(6, 8, 13, 0.76);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.station-search:focus-within {
  border-color: var(--route-border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 3px var(--route-soft),
    0 12px 34px color-mix(in srgb, var(--route-accent) 15%, transparent);
}

.station-theme-pill {
  border-color: var(--route-border);
  background: var(--route-soft);
  color: color-mix(in srgb, var(--route-accent) 72%, white);
}

.station-bell:hover {
  color: var(--route-accent);
}

.station-profile-dot {
  background:
    radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.35), transparent 35%),
    linear-gradient(135deg, var(--route-accent), var(--route-accent-2));
  box-shadow: 0 12px 30px color-mix(in srgb, var(--route-accent) 28%, transparent);
}

.station-profile-menu {
  border-color: var(--route-border);
  background:
    radial-gradient(circle at 12% 0%, var(--route-soft), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.02)),
    rgba(8, 12, 20, 0.96);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
`

function getRouteTheme(pathname) {
  return routeThemes.find((theme) => theme.match.some((route) => pathname === route || pathname.startsWith(`${route}/`))) || defaultTheme
}

export default function Topbar({ toggleSidebar }) {
  const location = useLocation()
  const theme = useMemo(() => getRouteTheme(location.pathname), [location.pathname])

  const [openMenu, setOpenMenu] = useState(false)
  const [notifyCount, setNotifyCount] = useState(0)

  const themeVars = {
    "--route-accent": theme.accent,
    "--route-accent-2": theme.accent2,
    "--route-soft": theme.soft,
    "--route-border": theme.border,
  }

  const parseDate = (str) => {
    try {
      const [datePart, timePart] = str.split(", ")
      const [day, month, year] = datePart.split("/")
      const [time, ampm] = timePart.split(" ")
      let [hours, minutes] = time.split(":")

      hours = Number(hours)
      minutes = Number(minutes)

      if (ampm === "PM" && hours !== 12) hours += 12
      if (ampm === "AM" && hours === 12) hours = 0

      return new Date(year, month - 1, day, hours, minutes)
    } catch {
      return new Date()
    }
  }

  const loadReminderCount = async () => {
    try {
      const res = await getReminders()
      const now = new Date()

      const count = res.filter((reminder) => {
        if (reminder.completed) return false

        const reminderTime = parseDate(reminder.dateTime)
        const diff = reminderTime - now

        return diff > 0 && diff <= 24 * 60 * 60 * 1000
      }).length

      setNotifyCount(count)
    } catch (err) {
      console.error("Reminder Error:", err)
    }
  }

  useEffect(() => {
    loadReminderCount()

    const interval = setInterval(loadReminderCount, 10000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleUpdate = () => {
      loadReminderCount()
    }

    window.addEventListener("storage", handleUpdate)

    return () => window.removeEventListener("storage", handleUpdate)
  }, [])

  useEffect(() => {
    const handleClick = (event) => {
      if (!event.target.closest(".profile-menu")) {
        setOpenMenu(false)
      }
    }

    document.addEventListener("click", handleClick)

    return () => document.removeEventListener("click", handleClick)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  return (
    <>
      <style>{topbarStyles}</style>

      <div style={themeVars} className="station-topbar flex items-center justify-between p-3">
        <div className="relative z-10 flex items-center gap-3 w-full">
          <button onClick={toggleSidebar} className="lg:hidden text-white hover:opacity-80 transition">
            <Menu size={22} />
          </button>

          <div className="station-search flex items-center gap-2 rounded-2xl border px-3 py-2 w-full max-w-[320px] transition">
            <Search size={16} className="text-gray-500" />
            <input
              placeholder="Search..."
              className="bg-transparent text-sm w-full text-white placeholder:text-gray-500 focus:outline-none"
            />
          </div>

          <div className="station-theme-pill hidden md:flex rounded-full border px-3 py-2 text-[11px] font-bold tracking-[0.16em] uppercase">
            {theme.name}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <Link to="/reminder" className="station-bell relative text-gray-400 transition">
            <Bell size={18} />

            {notifyCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full font-bold animate-pulse">
                {notifyCount > 99 ? "99+" : notifyCount}
              </span>
            )}
          </Link>

          <div className="relative profile-menu">
            <div onClick={() => setOpenMenu(!openMenu)} className="flex items-center gap-2 cursor-pointer select-none">
              <div className="station-profile-dot w-9 h-9 rounded-full flex items-center justify-center text-xs text-white font-bold">
                bp
              </div>

              <div className="hidden sm:block">
                <p className="text-xs text-white leading-tight">Owner</p>
                <p className="text-[10px] text-gray-500 leading-tight">{theme.name}</p>
              </div>
            </div>

            {openMenu && (
              <div className="station-profile-menu absolute right-0 mt-3 w-48 rounded-2xl border z-[999] overflow-hidden">
                <div className="px-4 py-3 text-xs text-gray-400 border-b border-white/10">
                  Signed in as
                  <div className="text-white text-sm font-semibold mt-1">Owner</div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm text-red-300 hover:bg-white/5 transition"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}






// import { Menu, Bell } from "lucide-react"
// import { Link } from "react-router-dom"
// import { useState, useEffect } from "react"
// import { getReminders } from "../../services/reminderApi"

// export default function Topbar({ toggleSidebar }) {

//   const [openMenu, setOpenMenu] = useState(false)
//   const [notifyCount, setNotifyCount] = useState(0)

//   // 🔥 STRING → DATE CONVERT
//   const parseDate = (str) => {
//     try {
//       const [datePart, timePart] = str.split(", ")
//       const [day, month, year] = datePart.split("/")

//       const [time, ampm] = timePart.split(" ")
//       let [hours, minutes] = time.split(":")

//       hours = Number(hours)
//       minutes = Number(minutes)

//       if (ampm === "PM" && hours !== 12) hours += 12
//       if (ampm === "AM" && hours === 12) hours = 0

//       return new Date(year, month - 1, day, hours, minutes)

//     } catch {
//       return new Date()
//     }
//   }

//   // 🔥 REMINDER COUNT FUNCTION (IMPORTANT)
//   const loadReminderCount = async () => {
//     try {

//       const res = await getReminders()
//       const now = new Date()

//       const count = res.filter(r => {

//         if (r.completed) return false

//         const reminderTime = parseDate(r.dateTime)
//         const diff = reminderTime - now

//         return diff > 0 && diff <= 24 * 60 * 60 * 1000

//       }).length

//       setNotifyCount(count)

//     } catch (err) {
//       console.error("Reminder Error:", err)
//     }
//   }

//   // 🔥 FIRST LOAD + AUTO REFRESH
//   useEffect(() => {

//     loadReminderCount()

//     const interval = setInterval(loadReminderCount, 10000) // हर 10 sec

//     return () => clearInterval(interval)

//   }, [])

//   // 🔥 INSTANT UPDATE (जब reminder add हो)
//   useEffect(() => {

//     const handleUpdate = () => {
//       loadReminderCount()
//     }

//     window.addEventListener("storage", handleUpdate)

//     return () => window.removeEventListener("storage", handleUpdate)

//   }, [])

//   // 🔥 OUTSIDE CLICK CLOSE
//   useEffect(() => {
//     const handleClick = (e) => {
//       if (!e.target.closest(".profile-menu")) {
//         setOpenMenu(false)
//       }
//     }

//     document.addEventListener("click", handleClick)
//     return () => document.removeEventListener("click", handleClick)
//   }, [])

//   // 🔥 LOGOUT
//   const handleLogout = () => {
//     localStorage.clear()
//     window.location.href = "/"
//   }

//   return (

//     <div className="flex items-center justify-between p-3 bg-[#04060B] border-b border-[#1A1D26]">

//       {/* LEFT */}
//       <div className="flex items-center gap-3 w-full">

//         <button
//           onClick={toggleSidebar}
//           className="lg:hidden text-white"
//         >
//           <Menu size={22} />
//         </button>

//         <input
//           placeholder="Search..."
//           className="bg-[#0A0D14] border border-[#1A1D26] text-sm px-3 py-2 rounded-lg w-full max-w-[250px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
//         />

//       </div>

//       {/* RIGHT */}
//       <div className="flex items-center gap-4">

//         {/* 🔔 NOTIFICATION */}
//         <Link
//           to="/reminder"
//           className="relative text-gray-400 hover:text-white transition"
//         >

//           <Bell size={18} />

//           {notifyCount > 0 && (
//             <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full font-bold animate-pulse">
//               {notifyCount > 99 ? "99+" : notifyCount}
//             </span>
//           )}

//         </Link>

//         {/* PROFILE */}
//         <div className="relative profile-menu">

//           <div
//             onClick={() => setOpenMenu(!openMenu)}
//             className="flex items-center gap-2 cursor-pointer select-none"
//           >

//             <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-semibold">
//               bp
//             </div>

//             <div className="text-xs hidden sm:block text-gray-300">
//               Owner
//             </div>

//           </div>

//           {/* DROPDOWN */}
//           {openMenu && (
//             <div className="absolute right-0 mt-2 w-40 bg-[#0B0F17] border border-[#1F2937] rounded-xl shadow-2xl z-[999] overflow-hidden">

//               <div className="px-3 py-2 text-xs text-gray-400 border-b border-[#1F2937]">
//                 Signed in as
//                 <div className="text-white text-sm font-medium">
//                   Owner
//                 </div>
//               </div>

//               <button
//                 onClick={handleLogout}
//                 className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#111827] transition"
//               >
//                 Logout
//               </button>

//             </div>
//           )}

//         </div>

//       </div>

//     </div>

//   )
// }