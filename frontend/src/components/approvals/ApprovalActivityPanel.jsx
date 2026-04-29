import { useEffect, useMemo, useState } from "react"
import { ClipboardCheck, Eye, X } from "lucide-react"
import { getApprovals } from "../../services/approvalApi"

const statusClasses = {
  pending: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10",
  approved: "text-green-300 border-green-500/30 bg-green-500/10",
  rejected: "text-red-300 border-red-500/30 bg-red-500/10",
}

export default function ApprovalActivityPanel({ moduleKey, title }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const load = async () => {
    try {
      const data = await getApprovals()
      setItems(data.filter((item) => item.moduleKey === moduleKey).slice(0, 4))
    } catch {
      setItems([])
    }
  }

  useEffect(() => {
    load()
    const handleRefresh = () => load()
    window.addEventListener("approval:created", handleRefresh)
    return () => window.removeEventListener("approval:created", handleRefresh)
  }, [moduleKey])

  const counts = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "pending").length,
      approved: items.filter((item) => item.status === "approved").length,
      rejected: items.filter((item) => item.status === "rejected").length,
    }),
    [items],
  )

  return (
    <>
      <div className="m-4 rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
              Manager Approval Activity
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <CountPill label="Pending" value={counts.pending} tone="text-yellow-300 border-yellow-500/20 bg-yellow-500/10" />
            <CountPill label="Approved" value={counts.approved} tone="text-green-300 border-green-500/20 bg-green-500/10" />
            <CountPill label="Rejected" value={counts.rejected} tone="text-red-300 border-red-500/20 bg-red-500/10" />
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-500"
            >
              <ClipboardCheck size={16} />
              View pending / approved list
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#1F2937] bg-[#0B0F17]">
            <div className="flex items-center justify-between border-b border-[#1F2937] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500">{title}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Approval status list</h3>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg border border-[#1F2937] p-2 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(88vh-82px)] space-y-3 overflow-y-auto p-5">
              {items.length ? (
                items.map((item) => (
                  <div key={item._id} className="rounded-xl border border-[#1F2937] bg-[#04060B] p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-medium text-white">
                            {item.summary || `${item.operation} request`}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] uppercase ${statusClasses[item.status]}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                        {item.reviewNote ? (
                          <p className="mt-2 text-xs text-gray-400">{item.reviewNote}</p>
                        ) : null}
                      </div>

                      <button
                        onClick={() => setSelectedItem(item)}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-400"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No approval requests for this page in the last 7 days.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedItem ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[#1F2937] bg-[#0B0F17]">
            <div className="flex items-center justify-between border-b border-[#1F2937] px-5 py-4">
              <h3 className="text-lg font-semibold text-white">Approval Details</h3>
              <button onClick={() => setSelectedItem(null)} className="rounded-lg border border-[#1F2937] p-2 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-gray-200">
                {JSON.stringify(selectedItem.payload || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function CountPill({ label, value, tone }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${tone}`}>
      {label}: {value}
    </span>
  )
}
