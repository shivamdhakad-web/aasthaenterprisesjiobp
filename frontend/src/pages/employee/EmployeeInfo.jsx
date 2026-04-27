import { useEffect, useState } from "react"
import { getMyInfo } from "../../services/employeeSelfApi"

const infoRows = [
  ["Role", "role"],
  ["Shift", "shift"],
  ["Phone", "phone"],
  ["Salary", "salary"],
  ["T-shirt", "tshirt"],
  ["Pant", "pant"],
  ["Shoes", "shoes"],
  ["Status", "status"],
]

const formatValue = (key, value) => {
  if (key === "salary") {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`
  }

  return value || "-"
}

export default function EmployeeInfo() {
  const [employee, setEmployee] = useState(null)

  useEffect(() => {
    const load = async () => {
      const data = await getMyInfo()
      setEmployee(data)
    }

    load()
  }, [])

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">
          Employee Information
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[color:var(--text-strong)]">
          {employee?.name || "My profile"}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Admin dashboard me jo employee profile details save hui hain, wahi yahan read-only mode me
          dikh rahi hain.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {infoRows.map(([label, key]) => (
          <div key={key} className="card">
            <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
              {formatValue(key, employee?.[key])}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Profile Snapshot</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoLine label="Employee name" value={employee?.name} />
          <InfoLine label="Phone number" value={employee?.phone} />
          <InfoLine label="Role in system" value={employee?.role} />
          <InfoLine label="Default shift" value={employee?.shift} />
          <InfoLine label="Uniform size" value={`T-shirt ${employee?.tshirt || "-"} • Pant ${employee?.pant || "-"}`} />
          <InfoLine label="Safety shoes" value={employee?.shoes} />
        </div>
      </section>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[color:var(--text-strong)]">{value || "-"}</p>
    </div>
  )
}
