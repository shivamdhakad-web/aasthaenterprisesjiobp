import { useEffect, useState } from "react"
import { getEmployeeOverview } from "../../services/employeeSelfApi"
import { getNotifications } from "../../services/notificationApi"
import { getSalarySummary } from "../../services/salaryApi"
import { useTheme } from "../../contexts/ThemeContext"

export default function EmployeeOverview() {
  const { isDayTheme } = useTheme()
  const [overview, setOverview] = useState(null)
  const [salary, setSalary] = useState(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewData, salaryData, notifications] = await Promise.all([
          getEmployeeOverview(),
          getSalarySummary(),
          getNotifications(),
        ])

        setOverview(overviewData)
        setSalary(salaryData)
        setUnread(notifications.filter((item) => !item.isRead).length)
      } catch {
        setOverview(null)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div
        className={`rounded-3xl border p-6 ${
          isDayTheme
            ? "border-[var(--border-strong)] bg-[linear-gradient(135deg,#ffffff_0%,#f7fff1_52%,#edf7df_100%)] shadow-[0_24px_50px_rgba(16,24,20,0.07)]"
            : "border-[#1A1D26] bg-gradient-to-r from-[#0B0F17] via-[#112018] to-[#0B0F17]"
        }`}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-green-300">Employee Dashboard</p>
        <h1 className={`mt-3 text-3xl font-semibold ${isDayTheme ? "text-[color:var(--text-strong)]" : "text-white"}`}>
          {overview?.employee?.name || "My work summary"}
        </h1>
        <p className={`mt-2 text-sm ${isDayTheme ? "text-[color:var(--text-secondary)]" : "text-gray-400"}`}>
          Attendance, lubricant sales, salary, and admin notices all stay connected from one
          place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Role" value={overview?.employee?.role || "-"} accent="text-white" />
        <InfoCard label="Shift" value={overview?.employee?.shift || "-"} accent="text-blue-300" />
        <InfoCard
          label="Attendance Entries"
          value={overview?.totals?.attendanceCount || 0}
          accent="text-green-300"
        />
        <InfoCard label="Unread Notices" value={unread} accent="text-yellow-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5 xl:col-span-2">
          <p className="text-sm text-gray-400">Current Month Salary</p>
          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MiniStat label="Present" value={salary?.breakdown?.present || 0} />
            <MiniStat label="Double Shift" value={salary?.breakdown?.double || 0} />
            <MiniStat label="Half Shift" value={salary?.breakdown?.half || 0} />
            <MiniStat label="Absent" value={salary?.breakdown?.absent || 0} />
          </div>
          <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
            <p className="text-sm text-green-200">Estimated Final Salary</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              Rs. {salary?.breakdown?.final?.toLocaleString?.() || 0}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5">
          <p className="text-sm text-gray-400">My Activity</p>
          <div className="mt-4 space-y-3">
            <ActivityRow label="Lubricant Sales Added" value={overview?.totals?.salesCount || 0} />
            <ActivityRow label="Shortage" value={`Rs. ${salary?.breakdown?.shortage || 0}`} />
            <ActivityRow label="Advance" value={`Rs. ${salary?.breakdown?.advance || 0}`} />
            <ActivityRow label="Earned" value={`Rs. ${salary?.breakdown?.earned || 0}`} />
          </div>
        </section>
      </div>
    </div>
  )
}

function InfoCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#04060B] p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  )
}

function ActivityRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#1F2937] bg-[#04060B] px-3 py-3 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}
