import { Bell, Bot, Menu, MoonStar, Search, SunMedium, ZoomIn, RotateCcw } from "lucide-react"
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
  const [showZoomMenu, setShowZoomMenu] = useState(false)
  const [notifyCount, setNotifyCount] = useState(0)
  const [searchText, setSearchText] = useState("")
  const { user, logout } = useAuth()
  const { theme, isDayTheme, toggleTheme, zoomLevel = 90, zoomIn, zoomOut, resetZoom } = useTheme()
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
      if (!event.target.closest(".zoom-menu")) {
        setShowZoomMenu(false)
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
  const displayZoom = zoomLevel || 90

  return (
    <div className="theme-topbar relative z-10 flex items-center justify-between border-b px-4 py-4 transition-colors duration-300 lg:px-5">
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
        {/* UI ZOOM CONTROLLER - Hidden on mobile (<768px), visible on desktop */}
        <div className="relative zoom-menu hidden md:block">
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            title={`UI Display Zoom: ${displayZoom}%`}
            className="inline-flex h-12 items-center gap-1.5 rounded-2xl border border-[color:var(--border-color)] bg-[var(--bg-panel)] px-3 text-xs font-semibold text-[color:var(--text-strong)] shadow-sm transition hover:bg-[var(--bg-soft)]"
          >
            <ZoomIn size={16} className="text-emerald-500" />
            <span>{displayZoom}%</span>
          </button>

          {showZoomMenu ? (
            <div className="theme-surface absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between border-b border-[color:var(--border-color)] pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                  UI DISPLAY ZOOM
                </span>
                <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-500">
                  {displayZoom}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 py-1">
                <button
                  onClick={() => zoomOut?.()}
                  disabled={displayZoom <= 80}
                  className="flex h-9 w-10 items-center justify-center rounded-xl border border-[color:var(--border-color)] bg-[var(--bg-soft)] font-bold text-[color:var(--text-strong)] transition hover:bg-[var(--bg-hover)] disabled:opacity-30"
                >
                  -
                </button>
                <span className="text-xs font-semibold text-[color:var(--text-strong)]">
                  {displayZoom}%
                </span>
                <button
                  onClick={() => zoomIn?.()}
                  disabled={displayZoom >= 150}
                  className="flex h-9 w-10 items-center justify-center rounded-xl border border-[color:var(--border-color)] bg-[var(--bg-soft)] font-bold text-[color:var(--text-strong)] transition hover:bg-[var(--bg-hover)] disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => resetZoom?.()}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[color:var(--border-color)] bg-[var(--bg-soft)] py-2 text-xs font-medium text-[color:var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[color:var(--text-strong)]"
              >
                <RotateCcw size={13} />
                Reset to Default (90%)
              </button>
            </div>
          ) : null}
        </div>

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

        {user?.role === "Admin" ? (
          <Link
            to="/admin/ai-chat"
            title="Open AI Chat"
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100"
          >
            <span className="absolute -top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              New
            </span>
            <Bot size={19} />
          </Link>
        ) : null}

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

        <div className="relative z-20 profile-menu">
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
            <div className="theme-surface absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border shadow-2xl">
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
