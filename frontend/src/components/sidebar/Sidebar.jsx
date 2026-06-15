import { Link, useLocation } from "react-router-dom"
import { navigationByRole, roleBadges } from "../../config/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import useEmployeeDashboardSettings from "../../hooks/useEmployeeDashboardSettings"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"

export default function Sidebar({ open, setOpen }) {
  const location = useLocation()
  const { user } = useAuth()
  const { isDayTheme } = useTheme()
  const employeeDashboardSettings = useEmployeeDashboardSettings("", user?.role === "Employee")
  const managerDashboardSettings = useManagerDashboardSettings("", user?.role === "Manager")
  const baseItems = navigationByRole[user?.role] || []
  const items =
    user?.role === "Employee"
      ? employeeDashboardSettings.loading
        ? []
        : mergeNavigation(baseItems, employeeDashboardSettings.pages)
      : user?.role === "Manager"
        ? managerDashboardSettings.loading
          ? []
          : mergeNavigation(baseItems, managerDashboardSettings.pages)
        : baseItems
  const badge = roleBadges[user?.role]
  const BadgeIcon = badge?.icon
  const badgeTone = isDayTheme ? badge?.dayTone : badge?.tone

  return (
    <>
      {open ? (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
      ) : null}

      <div
        className={`
theme-sidebar fixed top-0 left-0 z-50 flex h-screen w-[240px] flex-col overflow-hidden border-r transition-transform
${open ? "translate-x-0" : "-translate-x-full"}
lg:static lg:translate-x-0
`}
      >
        <div className="shrink-0 px-5 pt-5">
          <div className="flex items-center gap-3 border-b border-[color:var(--border-color)] pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-500 shadow-[0_14px_24px_rgba(155,229,100,0.28)]">
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
                className="h-5 w-5 text-white"
              >
                <line x1="3" x2="15" y1="22" y2="22"></line>
                <line x1="4" x2="14" y1="9" y2="9"></line>
                <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path>
                <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path>
              </svg>
            </div>

            <div>
              <h1 className="theme-text-strong text-[1.05rem] font-semibold">Aastha Enterprises</h1>
              <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Jio-bp Station</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
          <p className="px-3 text-xs uppercase tracking-[0.26em] text-[color:var(--text-muted)]">
            {user?.role === "Employee" ? "SELF SERVICE" : "CONTROL PANEL"}
          </p>

          {items.map((item) => {
            const Icon = item.icon
            const active =
              location.pathname === item.path ||
              (item.path !== `/${user?.role?.toLowerCase?.()}` &&
                location.pathname.startsWith(`${item.path}/`))

            return (
              <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
                <SidebarItem
                  icon={<Icon size={18} />}
                  text={item.label}
                  active={active}
                  isDayTheme={isDayTheme}
                />
              </Link>
            )
          })}
        </nav>

        <div className={`mx-4 mb-5 rounded-[28px] border bg-gradient-to-br p-4 shadow-lg ${badgeTone}`}>
          <div className="flex items-center gap-3">
            {BadgeIcon ? (
              <div
                className={`rounded-2xl p-2.5 ${
                  isDayTheme
                    ? "border border-white/90 bg-white shadow-sm"
                    : "border border-white/10 bg-white/10"
                }`}
              >
                <BadgeIcon size={18} />
              </div>
            ) : null}

            <div>
              <p
                className={`text-xs uppercase tracking-[0.22em] ${
                  isDayTheme ? "text-[color:var(--text-muted)]" : "text-white/75"
                }`}
              >
                Active Role
              </p>
              <p
                className={`text-sm font-semibold ${
                  isDayTheme ? "text-[color:var(--text-strong)]" : "text-white"
                }`}
              >
                {badge?.label || user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function mergeNavigation(baseItems, pages = []) {
  if (!pages.length) {
    return baseItems
  }

  const baseByKey = new Map(baseItems.map((item) => [item.key, item]))

  return pages
    .map((page) => {
      const baseItem = baseByKey.get(page.key)

      if (!baseItem || page.hidden) {
        return null
      }

      return {
        ...baseItem,
        label: page.label || baseItem.label,
        path: page.path || baseItem.path,
        order: Number(page.order || 0),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
}

function SidebarItem({ icon, text, active, isDayTheme }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
        active
          ? isDayTheme
            ? "border-[var(--border-strong)] bg-white text-[color:var(--text-strong)] shadow-[0_14px_26px_rgba(16,24,20,0.06)]"
            : "border-transparent bg-[var(--bg-subtle)] text-red-500"
          : "border-transparent text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)] hover:text-[color:var(--text-strong)]"
      }`}
    >
      {icon}
      <span className="text-[0.98rem]">{text}</span>
    </div>
  )
}
