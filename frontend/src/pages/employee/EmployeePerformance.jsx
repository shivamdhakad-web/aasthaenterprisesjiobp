import { useEffect, useMemo, useState } from "react"
import { getMyPerformance } from "../../services/employeeSelfApi"

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

export default function EmployeePerformance() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const load = async () => {
      const response = await getMyPerformance()
      setData(response)
    }

    load()
  }, [])

  const monthMax = useMemo(() => {
    const salesMax = Math.max(...(data?.monthly?.sales || []).map((item) => item.value), 0)
    const expensesMax = Math.max(...(data?.monthly?.expenses || []).map((item) => item.value), 0)
    return Math.max(salesMax, expensesMax, 1)
  }, [data])

  const weekMax = useMemo(() => {
    const salesMax = Math.max(...(data?.weekly?.sales || []).map((item) => item.value), 0)
    const expensesMax = Math.max(...(data?.weekly?.expenses || []).map((item) => item.value), 0)
    return Math.max(salesMax, expensesMax, 1)
  }, [data])

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Performance</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Month-wise and week-wise performance of lubricant sales and employee expenses is tracked here.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <MetricCard label="Sales This Month" value={formatCurrency(data?.summary?.sales?.month)} />
        <MetricCard label="Expenses This Month" value={formatCurrency(data?.summary?.expenses?.month)} />
        <MetricCard
          label="Net This Month"
          value={formatCurrency(data?.summary?.netMonth)}
          className="col-span-2 xl:col-span-1"
        />
        <MetricCard label="Sales This Week" value={formatCurrency(data?.summary?.sales?.week)} />
        <MetricCard label="Expenses This Week" value={formatCurrency(data?.summary?.expenses?.week)} />
        <MetricCard
          label="Total Sales"
          value={formatCurrency(data?.summary?.sales?.total)}
          className="col-span-2 xl:col-span-1"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SeriesCard
          title="Monthly Lubricant Sales"
          items={data?.monthly?.sales || []}
          maxValue={monthMax}
          tone="bg-green-500"
        />
        <SeriesCard
          title="Monthly Employee Expenses"
          items={data?.monthly?.expenses || []}
          maxValue={monthMax}
          tone="bg-red-500"
        />
        <SeriesCard
          title="Weekly Lubricant Sales"
          items={data?.weekly?.sales || []}
          maxValue={weekMax}
          tone="bg-blue-500"
        />
        <SeriesCard
          title="Weekly Employee Expenses"
          items={data?.weekly?.expenses || []}
          maxValue={weekMax}
          tone="bg-yellow-500"
        />
      </div>
    </div>
  )
}

function MetricCard({ label, value, className = "" }) {
  return (
    <div className={`card ${className}`.trim()}>
      <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">{value}</p>
    </div>
  )
}

function SeriesCard({ title, items, maxValue, tone }) {
  return (
    <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
      <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-[color:var(--text-secondary)]">{item.label}</span>
              <span className="font-medium text-[color:var(--text-strong)]">
                {formatCurrency(item.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]">
              <div
                className={`h-full rounded-full ${tone}`}
                style={{ width: `${Math.max((item.value / maxValue) * 100, item.value ? 8 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
