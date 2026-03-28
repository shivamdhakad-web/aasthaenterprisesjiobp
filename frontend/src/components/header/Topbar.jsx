import { Menu, Bell } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { getReminders } from "../../services/reminderApi"

export default function Topbar({ toggleSidebar }) {

  const [openMenu, setOpenMenu] = useState(false)
  const [notifyCount, setNotifyCount] = useState(0)

  // 🔥 STRING → DATE CONVERT
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

  // 🔥 REMINDER COUNT FUNCTION (IMPORTANT)
  const loadReminderCount = async () => {
    try {

      const res = await getReminders()
      const now = new Date()

      const count = res.filter(r => {

        if (r.completed) return false

        const reminderTime = parseDate(r.dateTime)
        const diff = reminderTime - now

        return diff > 0 && diff <= 24 * 60 * 60 * 1000

      }).length

      setNotifyCount(count)

    } catch (err) {
      console.error("Reminder Error:", err)
    }
  }

  // 🔥 FIRST LOAD + AUTO REFRESH
  useEffect(() => {

    loadReminderCount()

    const interval = setInterval(loadReminderCount, 10000) // हर 10 sec

    return () => clearInterval(interval)

  }, [])

  // 🔥 INSTANT UPDATE (जब reminder add हो)
  useEffect(() => {

    const handleUpdate = () => {
      loadReminderCount()
    }

    window.addEventListener("storage", handleUpdate)

    return () => window.removeEventListener("storage", handleUpdate)

  }, [])

  // 🔥 OUTSIDE CLICK CLOSE
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest(".profile-menu")) {
        setOpenMenu(false)
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  // 🔥 LOGOUT
  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  return (

    <div className="flex items-center justify-between p-3 bg-[#04060B] border-b border-[#1A1D26]">

      {/* LEFT */}
      <div className="flex items-center gap-3 w-full">

        <button
          onClick={toggleSidebar}
          className="lg:hidden text-white"
        >
          <Menu size={22} />
        </button>

        <input
          placeholder="Search..."
          className="bg-[#0A0D14] border border-[#1A1D26] text-sm px-3 py-2 rounded-lg w-full max-w-[250px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* 🔔 NOTIFICATION */}
        <Link
          to="/reminder"
          className="relative text-gray-400 hover:text-white transition"
        >

          <Bell size={18} />

          {notifyCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full font-bold animate-pulse">
              {notifyCount > 99 ? "99+" : notifyCount}
            </span>
          )}

        </Link>

        {/* PROFILE */}
        <div className="relative profile-menu">

          <div
            onClick={() => setOpenMenu(!openMenu)}
            className="flex items-center gap-2 cursor-pointer select-none"
          >

            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-semibold">
              bp
            </div>

            <div className="text-xs hidden sm:block text-gray-300">
              Owner
            </div>

          </div>

          {/* DROPDOWN */}
          {openMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-[#0B0F17] border border-[#1F2937] rounded-xl shadow-2xl z-[999] overflow-hidden">

              <div className="px-3 py-2 text-xs text-gray-400 border-b border-[#1F2937]">
                Signed in as
                <div className="text-white text-sm font-medium">
                  Owner
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#111827] transition"
              >
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

    </div>

  )
}