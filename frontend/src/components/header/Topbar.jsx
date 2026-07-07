import { Bell, Menu, MoonStar, Search, SunMedium } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { getNotifications } from "../../services/notificationApi"
import { navigationByRole } from "../../config/navigation"

const notificationPathByRole = {
  Admin: "/admin/notifications",
  Manager: "/manager/notifications",
  Employee: "/employee/notifications",
}

const tokenizeRoute = (entry) => {
  const tokens = new Set(
    `${entry.label} ${entry.path}`
      .toLowerCase()
      .split(/[\s/-]+/)
      .filter(Boolean),
  )

  return [...tokens]
}

const getRouteScore = (entry, query) => {
  const normalizedLabel = entry.label.toLowerCase()
  const normalizedPath = entry.path.toLowerCase()
  const tokens = tokenizeRoute(entry)

  if (normalizedLabel.startsWith(query)) {
    return 60
  }

  const matchingToken = tokens.find((token) => token.startsWith(query))
  if (matchingToken) {
    return 50 - matchingToken.length / 100
  }

  if (normalizedLabel.includes(query)) {
    return 30
  }

  if (normalizedPath.includes(query)) {
    return 20
  }

  return -1
}

export default function Topbar({ toggleSidebar }) {
  const [openMenu, setOpenMenu] = useState(false)
  const [notifyCount, setNotifyCount] = useState(0)
  const [searchText, setSearchText] = useState("")
  const { user, logout } = useAuth()
  const { theme, isDayTheme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const displayName =
    user?.role === "Employee"
      ? (user?.name || user?.role || "").split(" ")[0]
      : user?.name || user?.role
  const searchableRoutes = useMemo(() => {
    const roleEntries = navigationByRole[user?.role] || []

    return roleEntries.map((entry, index) => ({
      ...entry,
      order: index,
    }))
  }, [location.pathname, user?.role])

  useEffect(() => {
    const load = async () => {
      try {
        const items = await getNotifications()
        setNotifyCount(items.filter((item) => !item.isRead).length)
      } catch {
        setNotifyCount(0)
      }
    }

    load()

    const interval = setInterval(load, 15000)
    const refresh = () => load()

    window.addEventListener("approval:created", refresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener("approval:created", refresh)
    }
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
    logout()
    window.location.href = "/"
  }

  useEffect(() => {
    const query = searchText.trim().toLowerCase()

    if (!query) {
      return undefined
    }

    const bestMatch = searchableRoutes
      .map((entry) => ({
        entry,
        score: getRouteScore(entry, query),
      }))
      .filter((item) => item.score >= 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score
        }

        return left.entry.order - right.entry.order
      })[0]

    if (!bestMatch) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      if (bestMatch.entry.path !== location.pathname) {
        navigate(bestMatch.entry.path)
      }
    }, 180)

    return () => window.clearTimeout(timer)
  }, [location.pathname, navigate, searchText, searchableRoutes])

  const ThemeIcon = theme === "day" ? MoonStar : SunMedium

  return (
    <div className="theme-topbar relative z-[2000] flex items-center justify-between border-b px-4 py-4 transition-colors duration-300 lg:px-5">
      <div className="flex w-full items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="theme-text-strong rounded-2xl border border-[color:var(--border-color)] bg-[var(--bg-panel)] p-3 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="flex h-12 w-full max-w-[430px] items-center gap-3 rounded-2xl border border-[color:var(--border-color)] bg-[var(--bg-soft)] px-4 shadow-[0_10px_24px_rgba(16,24,20,0.04)]">
          <Search size={18} className="text-[color:var(--text-muted)]" />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search dashboards, approvals, notifications..."
            className="w-full border-0 bg-transparent p-0 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)] focus:ring-0"
          />
        </div>
      </div>

      <div className="ml-4 flex items-center gap-3">
        <button
          onClick={toggleTheme}
          title={theme === "day" ? "Switch to night theme" : "Switch to day theme"}
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--border-color)] bg-[var(--theme-toggle-bg)] text-[color:var(--theme-toggle-text)] transition duration-300 hover:-translate-y-0.5 ${
            isDayTheme
              ? "shadow-[0_14px_28px_rgba(155,229,100,0.18)]"
              : "shadow-sm"
          }`}
        >
          <ThemeIcon size={18} />
        </button>

        <Link
          to={notificationPathByRole[user?.role] || "/login"}
          className="relative rounded-2xl border border-transparent p-2.5 text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-color)] hover:bg-[var(--bg-soft)] hover:text-[color:var(--text-strong)]"
        >
          <Bell size={18} />
          {notifyCount > 0 ? (
            <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 py-[1px] text-[10px] font-bold text-white">
              {notifyCount > 99 ? "99+" : notifyCount}
            </span>
          ) : null}
        </Link>

        <div className="relative z-[2100] profile-menu">
          <div
            onClick={() => setOpenMenu(!openMenu)}
            className="flex cursor-pointer items-center gap-3 rounded-2xl px-1 py-1 select-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
              {(user?.name || "bp").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-[color:var(--text-strong)]">
                {displayName}
              </div>
              <div className="text-xs text-[color:var(--text-secondary)]">{user?.role}</div>
            </div>
          </div>

          {openMenu ? (
            <div className="theme-surface absolute right-0 z-[2200] mt-2 w-44 overflow-hidden rounded-xl border shadow-2xl">
              <div className="border-b border-[color:var(--border-strong)] px-3 py-2 text-xs text-[color:var(--text-secondary)]">
                Signed in as
                <div className="theme-text-strong text-sm font-medium">{user?.role}</div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-400 transition hover:bg-[var(--bg-hover)]"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

