import { useEffect, useState } from "react"
import { getMyShifts } from "../../services/employeeSelfApi"

export default function EmployeeShiftSchedule() {
  const [data, setData] = useState({ today: null, week: [] })

  useEffect(() => {
    const load = async () => {
      const response = await getMyShifts()
      setData(response)
    }

    load()
  }, [])

  const todayShift = data.today

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">
          Shift / Duty Schedule
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          You can check today's shift timings, weekly schedule, and day/night duty info from here.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ScheduleCard label="Today Shift" value={todayShift?.shiftName || "-"} />
        <ScheduleCard label="Start Time" value={todayShift?.startTime || "-"} />
        <ScheduleCard label="End Time" value={todayShift?.endTime || "-"} />
        <ScheduleCard label="Period" value={todayShift?.period || "-"} />
      </div>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Weekly Schedule</h2>
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
            Next 7 days
          </span>
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Shift</th>
                <th>Timing</th>
                <th>Period</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.week.map((item) => (
                <tr key={item.date}>
                  <td>{item.date}</td>
                  <td>{item.dayLabel}</td>
                  <td>{item.shiftName}</td>
                  <td>
                    {item.startTime} - {item.endTime}
                  </td>
                  <td className="capitalize">{item.period}</td>
                  <td>{item.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 md:hidden">
          {data.week.map((item) => (
            <div key={item.date} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[color:var(--text-strong)]">
                    {item.dayLabel} • {item.date}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                    {item.shiftName}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1 text-xs capitalize text-[color:var(--text-secondary)]">
                  {item.period}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--text-primary)]">
                {item.startTime} - {item.endTime}
              </p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{item.notes || "-"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ScheduleCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold capitalize text-[color:var(--text-strong)]">
        {value}
      </p>
    </div>
  )
}
