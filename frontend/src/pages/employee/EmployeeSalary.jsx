import { useEffect, useState } from "react"
import { getSalarySummary } from "../../services/salaryApi"

export default function EmployeeSalary() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [summary, setSummary] = useState(null)

  const load = async (targetMonth = month) => {
    const data = await getSalarySummary(null, targetMonth)
    setSummary(data)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">My Salary</h1>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              Salary report attendance, shortage, aur advance ke basis par auto calculate hoti hai.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="input w-full sm:w-[180px]"
            />
            <button onClick={() => load(month)} className="btn btn-green w-full sm:w-auto">
              Load
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SalaryCard label="Present" value={summary?.breakdown?.present || 0} accent="text-green-300" />
        <SalaryCard label="Double" value={summary?.breakdown?.double || 0} accent="text-blue-300" />
        <SalaryCard label="Half" value={summary?.breakdown?.half || 0} accent="text-yellow-300" />
        <SalaryCard label="Absent" value={summary?.breakdown?.absent || 0} accent="text-red-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 sm:p-5">
          <p className="text-sm text-[color:var(--text-secondary)]">Salary Breakdown</p>
          <div className="mt-4 space-y-3">
            <LineItem label="Base Salary" value={`Rs. ${summary?.employee?.salary || 0}`} />
            <LineItem label="Earned" value={`Rs. ${summary?.breakdown?.earned || 0}`} />
            <LineItem label="Shortage" value={`Rs. ${summary?.breakdown?.shortage || 0}`} />
            <LineItem label="Advance" value={`Rs. ${summary?.breakdown?.advance || 0}`} />
          </div>
        </section>

        <section className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 sm:p-5">
          <p className="text-sm text-green-700">Final Estimated Salary</p>
          <p className="mt-3 text-3xl font-semibold text-[color:var(--text-strong)] sm:text-4xl">
            Rs. {summary?.breakdown?.final?.toLocaleString?.() || 0}
          </p>
          <p className="mt-4 text-sm text-green-700">
            Month: {summary?.month || month}
          </p>
        </section>
      </div>
    </div>
  )
}

function SalaryCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
      <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  )
}

function LineItem({ label, value }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[color:var(--text-secondary)]">{label}</span>
      <span className="font-medium text-[color:var(--text-strong)]">{value}</span>
    </div>
  )
}
