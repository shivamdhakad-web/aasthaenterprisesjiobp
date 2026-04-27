import { useEffect, useState } from "react"
import MobileActionFab from "../../components/MobileActionFab"
import { applyMyLeave, getMyLeaves } from "../../services/employeeSelfApi"

const leaveTypes = ["CL", "SL", "PL", "LOP"]

const statusTone = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")

const baseForm = {
  leaveType: "CL",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  reason: "",
}

export default function EmployeeLeave() {
  const [form, setForm] = useState(baseForm)
  const [items, setItems] = useState([])
  const [balances, setBalances] = useState([])
  const [showMobileForm, setShowMobileForm] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const load = async () => {
    const data = await getMyLeaves()
    setItems(data.items || [])
    setBalances(data.balances || [])
  }

  useEffect(() => {
    load()
  }, [])


  const submit = async () => {
  await applyMyLeave(form)

  setSuccessMessage("Leave Submitted ✅")
  setShowSuccessPopup(true)

  setForm(baseForm)
  setShowMobileForm(false)
  load()
}

  const openForm = () => {
    setShowMobileForm(true)
    setForm(baseForm)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
<section
  className={`rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 ${
    showMobileForm ? "block" : "hidden sm:block"
  }`}
>
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Leave Management</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Leave apply yahin se karo. Admin approval ke baad attendance me us date par automatic
          absent mark ho jayega.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {balances.map((balance) => (
          <div key={balance.type} className="card">
            <p className="text-sm text-[color:var(--text-secondary)]">{balance.type} Balance</p>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
              {balance.remaining}
            </p>
            <p className="mt-2 text-xs text-[color:var(--text-secondary)]">
              Used {balance.used} / Total {balance.total}
            </p>
          </div>
        ))}
      </div>

      <section
        className={`rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 ${
          showMobileForm ? "block" : "hidden sm:block"
        }`}
      >
        <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Apply Leave</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={form.leaveType}
            onChange={(event) => setForm({ ...form, leaveType: event.target.value })}
            className="input"
          >
            {leaveTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            className="input"
          />
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            className="input"
          />
          <button onClick={submit} className="btn btn-green w-full">
            Apply Leave
          </button>
        </div>
        <textarea
          value={form.reason}
          onChange={(event) => setForm({ ...form, reason: event.target.value })}
          placeholder="Reason for leave"
          rows={4}
          className="input mt-3"
        />
      </section>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Leave History</h2>
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
            {items.length} request{items.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.leaveType}</td>
                  <td>{formatDate(item.startDate)}</td>
                  <td>{formatDate(item.endDate)}</td>
                  <td>{item.days}</td>
                  <td>{item.reason || "-"}</td>
                  <td>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                    {item.leaveType}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {formatDate(item.startDate)} to {formatDate(item.endDate)}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
                Days: {item.days} • {item.reason || "No reason added"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <MobileActionFab
        actions={[
          {
            label: "Apply Leave",
            className: "bg-green-600",
            onClick: () => openForm(),
          },
        ]}
      />

      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm text-center shadow-xl">
            <h2 className="text-xl font-semibold text-green-600">
                {successMessage}
            </h2>

            <button
                onClick={() => setShowSuccessPopup(false)}
                className="mt-5 w-full bg-green-600 text-white py-2 rounded-xl"
            >
                OK
            </button>
            </div>
        </div>
        )}
    </div>
  )
}
