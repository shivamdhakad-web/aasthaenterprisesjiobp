import { useEffect, useMemo, useState } from "react"
import { Eye, X } from "lucide-react"
import { approveRequest, getApprovals, rejectRequest } from "../../services/approvalApi"
import { useAuth } from "../../contexts/AuthContext"

const badgeStyles = {
  pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  approved: "border-green-500/30 bg-green-500/10 text-green-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
}

const formatDay = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

export default function ApprovalsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)

  const load = async () => {
    const data = await getApprovals()
    setItems(data)
  }

  useEffect(() => {
    load()
  }, [])

  const groupedItems = useMemo(() => {
    const groups = {}

    items.forEach((item) => {
      const key = formatDay(item.createdAt)
      if (!groups[key]) {
        groups[key] = []
      }

      groups[key].push(item)
    })

    return Object.entries(groups)
  }, [items])

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5">
        <h1 className="text-2xl font-semibold text-white">
          {user?.role === "Admin" ? "Approval Center" : "My Approval History"}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Last 7 days ki requests date-wise yahin milengi. Old approval records backend se auto
          cleanup ho rahe hain.
        </p>
      </div>

      {groupedItems.length ? (
        groupedItems.map(([date, dateItems]) => (
          <section key={date} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-[0.24em] text-gray-500">{date}</h2>
              <span className="rounded-full border border-[#1F2937] bg-[#0B0F17] px-3 py-1 text-xs text-gray-300">
                {dateItems.length} request{dateItems.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid gap-4">
              {dateItems.map((item) => (
                <div key={item._id} className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          {item.summary || `${item.moduleLabel} ${item.operation}`}
                        </h3>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs uppercase ${badgeStyles[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-400">
                        {item.moduleLabel} • {item.operation} • {new Date(item.createdAt).toLocaleTimeString()}
                      </p>
                      <p className="mt-3 text-sm text-gray-300">
                        Requested by {item.requester?.name || item.requester?.role}
                      </p>
                      {item.reviewNote ? (
                        <p className="mt-2 text-sm text-gray-400">Note: {item.reviewNote}</p>
                      ) : null}
                      {item.errorMessage ? (
                        <p className="mt-2 text-sm text-red-300">Error: {item.errorMessage}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200"
                      >
                        <Eye size={16} />
                        View
                      </button>

                      {user?.role === "Admin" && item.status === "pending" ? (
                        <>
                          <button
                            onClick={async () => {
                              await approveRequest(item._id)
                              load()
                            }}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              await rejectRequest(item._id)
                              load()
                            }}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-6 text-sm text-gray-400">
          No approval requests found in the last 7 days.
        </div>
      )}

      {selectedItem ? (
        <ApprovalDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      ) : null}
    </div>
  )
}

function ApprovalDetailsModal({ item, onClose }) {
  const { user } = useAuth()
  const isManagerView = user?.role === "Manager"

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-[#1F2937] bg-[#0B0F17]">
        <div className="flex items-start justify-between border-b border-[#1F2937] px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Approval Details</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {item.summary || `${item.moduleLabel} ${item.operation}`}
            </h2>
          </div>

          <button onClick={onClose} className="rounded-lg border border-[#1F2937] p-2 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div
          className={`max-h-[calc(90vh-88px)] overflow-y-auto p-5 ${
            isManagerView ? "" : "grid gap-5 xl:grid-cols-[320px_1fr]"
          }`}
        >
          <div className="space-y-3">
            <MetaCard label="Module" value={item.moduleLabel} />
            <MetaCard label="Operation" value={item.operation} />
            <MetaCard label="Status" value={item.status} />
            <MetaCard label="Requested By" value={item.requester?.name || item.requester?.role || "-"} />
            <MetaCard label="Created At" value={new Date(item.createdAt).toLocaleString()} />
            <MetaCard label="Processed At" value={item.processedAt ? new Date(item.processedAt).toLocaleString() : "-"} />
            <MetaCard label="Review Note" value={item.reviewNote || "-"} />
          </div>

          {!isManagerView ? (
            <div className="space-y-5">
              <JsonBlock title="Payload" value={item.payload} />
              <JsonBlock title="Meta" value={item.meta} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#04060B] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  )
}

function JsonBlock({ title, value }) {
  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#04060B] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{title}</p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-gray-200">
        {JSON.stringify(value || {}, null, 2)}
      </pre>
    </div>
  )
}
