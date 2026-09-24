import { useEffect, useMemo, useState } from "react"
import {
  Clock3,
  Laptop,
  Loader2,
  LogOut,
  MonitorSmartphone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react"
import { getLoginSessions, terminateLoginSession } from "../../services/loginSessionApi"

const filters = {
  status: ["all", "Active", "Logged Out", "Expired", "Terminated"],
  role: ["all", "Admin", "Manager", "Employee"],
}

const formatDateTime = (value) => {
  if (!value) return "-"
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const statusClass = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Logged Out": "border-slate-200 bg-slate-50 text-slate-600",
  Expired: "border-amber-200 bg-amber-50 text-amber-700",
  Terminated: "border-rose-200 bg-rose-50 text-rose-700",
}

function MetricCard({ label, value, tone, icon: Icon }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
          {label}
        </p>
        <Icon size={18} />
      </div>
      <p className="mt-3 text-3xl font-black text-[color:var(--text-strong)]">{value}</p>
    </div>
  )
}

export default function LoginSessionsPage() {
  const [sessions, setSessions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [role, setRole] = useState("all")
  const [confirmSession, setConfirmSession] = useState(null)

  const params = useMemo(() => ({ search, status, role }), [role, search, status])

  const loadSessions = async () => {
    try {
      const data = await getLoginSessions(params)
      setSessions(data.sessions || [])
      setSummary(data.summary || null)
    } catch {
      setSessions([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
    const interval = window.setInterval(loadSessions, 30000)
    return () => window.clearInterval(interval)
  }, [params])

  const handleTerminate = async () => {
    if (!confirmSession) return
    setBusyId(confirmSession.id)
    try {
      await terminateLoginSession(confirmSession.id)
      setConfirmSession(null)
      await loadSessions()
    } finally {
      setBusyId("")
    }
  }

  if (loading && !sessions.length) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-5 py-4 text-sm font-bold text-[color:var(--text-secondary)] shadow-[var(--shadow-soft)]">
          <Loader2 className="animate-spin text-emerald-600" size={20} />
          Loading login sessions...
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 overflow-x-hidden p-4 font-sans sm:p-6 lg:p-5">
      <section className="rounded-[15px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <MonitorSmartphone size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[color:var(--text-strong)]">
                Login Sessions
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              loadSessions()
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] transition hover:bg-[var(--bg-hover)]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Logins" value={summary?.activeSessions || 0} icon={ShieldCheck} tone="border-emerald-200 bg-emerald-50/80 text-emerald-600" />
        <MetricCard label="Today Logins" value={summary?.todayLogins || 0} icon={Clock3} tone="border-blue-200 bg-blue-50/80 text-blue-600" />
        <MetricCard label="Total Sessions" value={summary?.totalSessions || 0} icon={UserRound} tone="border-violet-200 bg-violet-50/80 text-violet-600" />
        <MetricCard label="Unique Devices" value={summary?.uniqueDevices || 0} icon={Laptop} tone="border-amber-200 bg-amber-50/80 text-amber-600" />
      </div>

      <section className="rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-[var(--shadow-soft)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <label className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search user, role, device, IP..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
          >
            {filters.status.map((item) => (
              <option key={item} value={item}>{item === "all" ? "All Status" : item}</option>
            ))}
          </select>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
          >
            {filters.role.map((item) => (
              <option key={item} value={item}>{item === "all" ? "All Roles" : item}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-[var(--bg-soft)] text-xs font-black uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Device</th>
                <th className="px-5 py-4">IP Address</th>
                <th className="px-5 py-4">Login Time</th>
                <th className="px-5 py-4">Logout Time</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {sessions.map((session) => (
                <tr key={session.id} className="transition hover:bg-[var(--bg-soft)]">
                  <td className="px-5 py-4">
                    <p className="font-bold text-[color:var(--text-strong)]">{session.userName}</p>
                    <p className="text-xs font-bold text-[color:var(--text-secondary)]">{session.userRole}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-[color:var(--text-strong)]">{session.deviceType}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">{session.browser} • {session.os}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[color:var(--text-secondary)]">{session.ipAddress}</td>
                  <td className="px-5 py-4 font-semibold text-[color:var(--text-secondary)]">{formatDateTime(session.loginAt)}</td>
                  <td className="px-5 py-4 font-semibold text-[color:var(--text-secondary)]">{formatDateTime(session.logoutAt)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass[session.status] || statusClass.Expired}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {session.status === "Active" ? (
                      <button
                        type="button"
                        onClick={() => setConfirmSession(session)}
                        className="inline-flex items-center justify-center rounded-xl p-2 text-rose-600 transition hover:bg-rose-50"
                        title="Force logout"
                      >
                        <LogOut size={18} />
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-[color:var(--text-muted)]">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {!sessions.length ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm font-bold text-[color:var(--text-secondary)]">
                    No login sessions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {confirmSession ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[color:var(--text-strong)]">Force Logout?</h2>
                <p className="mt-1 text-sm font-medium text-[color:var(--text-secondary)]">
                  This will end the active session for {confirmSession.userName}.
                </p>
              </div>
              <button type="button" onClick={() => setConfirmSession(null)} className="rounded-full p-2 hover:bg-[var(--bg-soft)]">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmSession(null)} className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTerminate}
                disabled={busyId === confirmSession.id}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {busyId === confirmSession.id ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                Force Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
