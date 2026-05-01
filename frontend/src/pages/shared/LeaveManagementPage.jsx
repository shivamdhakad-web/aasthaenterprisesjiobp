import { useEffect, useMemo, useState } from "react"
import { getEmployees } from "../../services/employeeApi"
import { decideLeave, getLeaves } from "../../services/leaveApi"

const statusTone = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-"

export default function LeaveManagementPage() {
  const [employees, setEmployees] = useState([])
  const [employeeId, setEmployeeId] = useState("")
  const [status, setStatus] = useState("")
  const [response, setResponse] = useState({ items: [], balancesByEmployee: {} })

  // Custom prompt state
  const [prompt, setPrompt] = useState({
    open: false,
    title: "",
    defaultValue: "",
    onConfirm: null,
  })

  const closePrompt = () => setPrompt({ open: false, title: "", defaultValue: "", onConfirm: null })

  const load = async () => {
    const [employeeData, leaveData] = await Promise.all([
      getEmployees(),
      getLeaves({
        employeeId: employeeId || undefined,
        status: status || undefined,
      }),
    ])

    setEmployees(employeeData)
    setResponse(leaveData)
  }

  useEffect(() => {
    load()
  }, [employeeId, status])

  const totals = useMemo(
    () =>
      response.items.reduce(
        (summary, item) => {
          summary.total += 1
          summary[item.status] += 1
          return summary
        },
        { total: 0, pending: 0, approved: 0, rejected: 0 },
      ),
    [response.items],
  )

  const processDecision = async (item, nextStatus) => {
    const actionText = nextStatus === "approved" ? "Approval" : "Rejection"
    setPrompt({
      open: true,
      title: `${actionText} Note`,
      defaultValue: item.adminNote || "",
      onConfirm: async (note) => {
        await decideLeave(item._id, {
          status: nextStatus,
          adminNote: note,
        })
        load()
        closePrompt()
      },
    })
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">
          Leave Management
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Employee leave requests are approved or rejected here. Attendance on approved leave is automatically marked absent.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard label="Total Requests" value={totals.total} />
        <SummaryCard label="Pending" value={totals.pending} />
        <SummaryCard label="Approved" value={totals.approved} />
        <SummaryCard label="Rejected" value={totals.rejected} />
      </div>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="input">
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>

          <select value={status} onChange={(event) => setStatus(event.target.value)} className="input">
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={() => {
              setEmployeeId("")
              setStatus("")
            }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]"
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="hidden overflow-x-auto lg:block">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Balance</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {response.items.map((item) => {
                const employeeKey = item.employeeId?._id || item.employeeId
                const balanceRow = (response.balancesByEmployee?.[employeeKey] || []).find(
                  (balance) => balance.type === item.leaveType,
                )

                return (
                  <tr key={item._id}>
                    <td>{item.employeeId?.name || "-"}</td>
                    <td>{item.leaveType}</td>
                    <td>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </td>
                    <td>{item.days}</td>
                    <td>{balanceRow ? `${balanceRow.remaining} left` : "-"}</td>
                    <td>{item.reason || "-"}</td>
                    <td>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === "pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => processDecision(item, "approved")}
                            className="rounded-lg bg-green-600 px-3 py-2 text-xs text-white"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => processDecision(item, "rejected")}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs text-white"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[color:var(--text-secondary)]">
                          {item.adminNote || "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 lg:hidden">
          {response.items.map((item) => (
            <div key={item._id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                    {item.employeeId?.name || "-"}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {item.leaveType} • {item.days} day(s)
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
                {formatDate(item.startDate)} to {formatDate(item.endDate)}
              </p>
              <p className="mt-2 text-sm text-[color:var(--text-primary)]">{item.reason || "-"}</p>

              {item.status === "pending" ? (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => processDecision(item, "approved")}
                    className="flex-1 rounded-xl bg-green-600 py-2 text-sm text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => processDecision(item, "rejected")}
                    className="flex-1 rounded-xl bg-red-600 py-2 text-sm text-white"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
                  Admin note: {item.adminNote || "-"}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Custom Prompt Modal */}
      {prompt.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-xl">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{prompt.title}</h3>
              <textarea
                className="input mt-4 w-full"
                rows={3}
                defaultValue={prompt.defaultValue}
                placeholder="Optional note..."
                ref={(el) => {
                  if (el) el.focus()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    prompt.onConfirm?.(e.target.value)
                  }
                }}
              />
            </div>
            <div className="flex border-t border-[var(--border-color)]">
              <button
                onClick={() => {
                  const textarea = document.querySelector("#prompt-textarea")
                  const note = textarea ? textarea.value : ""
                  prompt.onConfirm?.(note)
                }}
                className="flex-1 py-3 text-center text-sm font-semibold text-emerald-600 border-r border-[var(--border-color)]"
              >
                Confirm
              </button>
              <button
                onClick={closePrompt}
                className="flex-1 py-3 text-center text-sm font-semibold text-rose-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">{value}</p>
    </div>
  )
}