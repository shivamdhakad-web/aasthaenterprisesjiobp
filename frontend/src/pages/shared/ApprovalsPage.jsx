import { useEffect, useMemo, useState } from "react"
import { Check, ChevronRight, Eye, Layers, MousePointer2, RefreshCw, X } from "lucide-react"
import { approveRequest, getApprovals, rejectRequest } from "../../services/approvalApi"
import { useAuth } from "../../contexts/AuthContext"

const badgeStyles = {
  pending: "border-amber-200 bg-amber-50 text-amber-600",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-600",
  rejected: "border-rose-200 bg-rose-50 text-rose-600",
}

const moduleColumns = {
  "card-swipe": [
    { label: "Date", keys: ["date"], type: "date" },
    { label: "Time", keys: ["time"] },
    { label: "Amount", keys: ["amount"], type: "currency" },
    { label: "Charges", keys: ["charges"], type: "currency", className: "font-semibold text-emerald-600" },
    { label: "Machine", keys: ["machine"] },
    { label: "Payment", keys: ["paymentMethod", "payment"] },
    { label: "Remark", keys: ["remark"] },
  ],
  expenses: [
    { label: "Date", keys: ["date"], type: "date" },
    { label: "Category", keys: ["category"] },
    { label: "Description", keys: ["description", "remark"] },
    { label: "Amount", keys: ["amount"], type: "currency", className: "font-semibold" },
    { label: "Payment Mode", keys: ["paymentMode"] },
    { label: "Added By", keys: ["addedBy", "createdBy"] },
  ],
  "lubricant-sales": [
    { label: "Date", keys: ["date"], type: "date" },
    { label: "Product", keys: ["productName", "product", "name"] },
    { label: "Qty", keys: ["quantity", "qty"] },
    { label: "Rate", keys: ["rate", "price"], type: "currency" },
    { label: "Amount", keys: ["amount", "total"], type: "currency", className: "font-semibold" },
    { label: "Payment", keys: ["paymentMode", "paymentMethod"] },
    { label: "Remark", keys: ["remark"] },
  ],
  dcd: [
    { label: "Date", keys: ["date"], type: "date" },
    { label: "Product", keys: ["product"] },
    { label: "Volume", keys: ["volume", "qty"] },
    { label: "Purchase Price", keys: ["purchasePrice"], type: "currency" },
    { label: "Sale Price", keys: ["salePrice"], type: "currency" },
    { label: "Margin", keys: ["margin"], type: "currency", className: "font-semibold text-blue-600" },
    { label: "Shift", keys: ["shift"] },
    { label: "Remark", keys: ["remark"] },
  ],
  mdu: [
    { label: "Date", keys: ["date"], type: "date" },
    { label: "Product", keys: ["product"] },
    { label: "Opening", keys: ["openingStock", "opStock"] },
    { label: "Decant", keys: ["decant"] },
    { label: "Sale", keys: ["sale"] },
    { label: "Physical Stock", keys: ["physicalStock"] },
    { label: "Loss/Gain", keys: ["lossGain", "lossOrGain"], className: "font-semibold" },
    { label: "Rate", keys: ["rate"], type: "currency" },
  ],
  "invoice-details": [
    { label: "Date", keys: ["date"], type: "date" },
    { label: "Product", keys: ["product"] },
    { label: "Qty", keys: ["qty", "quantity"] },
    { label: "Invoice Amount", keys: ["invoiceAmount"], type: "currency" },
    { label: "Transport Cost", keys: ["transportCost"], type: "currency" },
    { label: "LFR", keys: ["lfr"] },
    { label: "RSP", keys: ["rsp"] },
    { label: "Margin", keys: ["margin"], className: "font-semibold text-blue-600" },
  ],
  "daily-sales": [
    { label: "Date", keys: ["date"], type: "date" },
    { label: "Product", keys: ["product", "category"] },
    { label: "Sales", keys: ["sales", "sale"] },
    { label: "Rate", keys: ["rate"], type: "currency" },
    { label: "Amount", keys: ["amount"], type: "currency" },
    { label: "Profit", keys: ["profit"], type: "currency", className: "font-semibold text-emerald-600" },
  ],
  attendance: [
    { label: "Date", keys: ["date"], type: "date" },
    { label: "Employee", keys: ["employeeName", "name"], source: "meta" },
    { label: "Status", keys: ["status"] },
    { label: "Short", keys: ["shortage"], type: "currency" },
    { label: "Cash", keys: ["advanceCash"], type: "currency" },
    { label: "Petrol", keys: ["advancePetrol"], type: "currency" },
    { label: "Bonus", keys: ["bonusAmount"], type: "currency", className: "text-violet-600" },
    { label: "Remark", keys: ["remark"] },
  ],
  employees: [
    { label: "Name", keys: ["name"] },
    { label: "Role", keys: ["role"] },
    { label: "Shift", keys: ["shift"] },
    { label: "Phone", keys: ["phone"] },
    { label: "Salary", keys: ["salary"], type: "currency" },
  ],
  "tanker-deliveries": [
    { label: "Date", keys: ["date"], type: "date" },
    { label: "Product", keys: ["product"] },
    { label: "Invoice No", keys: ["invoiceNo", "invoiceNumber"] },
    { label: "Qty", keys: ["quantity", "qty"] },
    { label: "Loss/Gain", keys: ["lossGain", "lossOrGain"] },
    { label: "Driver", keys: ["driverName", "driver"] },
    { label: "Remark", keys: ["remark"] },
  ],
}

const hiddenPreviewKeys = new Set(["_id", "id", "createdAt", "updatedAt", "lastEditedAt", "lastEditedBy", "lastEditedByRole", "__v"])

const formatDay = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "-")
const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`
const titleCase = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const getRequestTitle = (item) => item.summary || `${item.moduleLabel || "Request"} ${item.operation || ""}`.trim()
const getPageKey = (item) => item.moduleKey || item.moduleLabel || "other"
const getPageLabel = (item) => item.moduleLabel || titleCase(item.moduleKey || "Other")
const getPendingItems = (items) => items.filter((item) => item.status === "pending")
const getDataSource = (item, source = "both") => {
  const payload = item.payload && typeof item.payload === "object" ? item.payload : {}
  const meta = item.meta && typeof item.meta === "object" ? item.meta : {}
  if (source === "payload") return payload
  if (source === "meta") return meta
  return { ...meta, ...payload }
}
const getFieldValue = (item, column) => {
  const source = getDataSource(item, column.source)
  for (const key of column.keys || []) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key]
    }
  }
  return ""
}
const formatValue = (value, type = "text") => {
  if (value === null || value === undefined || value === "") return "-"
  if (type === "date") return formatDate(value)
  if (type === "datetime") return formatDateTime(value)
  if (type === "currency") return formatCurrency(value)
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
const getColumnsForModule = (moduleKey, items = []) => {
  if (moduleColumns[moduleKey]) return moduleColumns[moduleKey]

  const keys = []
  items.forEach((item) => {
    Object.keys(getDataSource(item)).forEach((key) => {
      if (!hiddenPreviewKeys.has(key) && !keys.includes(key)) keys.push(key)
    })
  })

  return keys.slice(0, 7).map((key) => ({ label: titleCase(key), keys: [key] }))
}
const getPreviewRows = (item) => {
  const rows = [
    ["Summary", getRequestTitle(item)],
    ["Page", getPageLabel(item)],
    ["Operation", titleCase(item.operation || "-")],
    ["Requested By", item.requester?.name || item.requester?.role || "-"],
    ["Requested At", formatDateTime(item.createdAt)],
  ]

  Object.entries(getDataSource(item))
    .filter(([key]) => !hiddenPreviewKeys.has(key))
    .slice(0, 14)
    .forEach(([key, value]) => rows.push([titleCase(key), formatValue(value)]))

  return rows
}

export default function ApprovalsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedPageKey, setSelectedPageKey] = useState("")
  const [selectedIds, setSelectedIds] = useState([])
  const [processing, setProcessing] = useState(false)
  const [notice, setNotice] = useState(null)
  const [confirmState, setConfirmState] = useState(null)

  const load = async () => {
    const data = await getApprovals()
    setItems(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const pageGroups = useMemo(() => {
    const groups = {}

    items.forEach((item) => {
      const key = getPageKey(item)
      if (!groups[key]) {
        groups[key] = {
          key,
          label: getPageLabel(item),
          items: [],
          pending: 0,
          approved: 0,
          rejected: 0,
          latestAt: item.createdAt,
        }
      }

      groups[key].items.push(item)
      groups[key][item.status] = (groups[key][item.status] || 0) + 1
      if (new Date(item.createdAt) > new Date(groups[key].latestAt)) {
        groups[key].latestAt = item.createdAt
      }
    })

    return Object.values(groups).sort((left, right) => {
      if (right.pending !== left.pending) return right.pending - left.pending
      return new Date(right.latestAt) - new Date(left.latestAt)
    })
  }, [items])

  useEffect(() => {
    if (!pageGroups.length) {
      setSelectedPageKey("")
      return
    }

    if (!selectedPageKey || !pageGroups.some((group) => group.key === selectedPageKey)) {
      setSelectedPageKey(pageGroups[0].key)
    }
  }, [pageGroups, selectedPageKey])

  const selectedGroup = pageGroups.find((group) => group.key === selectedPageKey)
  const selectedPageItems = useMemo(
    () => (selectedGroup?.items || []).slice().sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [selectedGroup],
  )
  const pageColumns = useMemo(() => getColumnsForModule(selectedPageKey, selectedPageItems), [selectedPageItems, selectedPageKey])
  const pendingPageItems = getPendingItems(selectedPageItems)
  const selectedPendingIds = selectedIds.filter((id) => pendingPageItems.some((item) => item._id === id))
  const allPendingSelected = pendingPageItems.length > 0 && selectedPendingIds.length === pendingPageItems.length
  const canReview = user?.role === "Admin"

  const setPage = (key) => {
    setSelectedPageKey(key)
    setSelectedIds([])
  }

  const toggleItem = (item) => {
    if (item.status !== "pending") return
    setSelectedIds((current) =>
      current.includes(item._id) ? current.filter((id) => id !== item._id) : [...current, item._id],
    )
  }

  const toggleAll = () => {
    setSelectedIds(allPendingSelected ? [] : pendingPageItems.map((item) => item._id))
  }

  const processRequests = async (ids, action) => {
    if (!ids.length) {
      setNotice({ type: "error", message: "Please select pending requests first." })
      return
    }

    setProcessing(true)
    try {
      for (const id of ids) {
        if (action === "approve") {
          await approveRequest(id)
        } else {
          await rejectRequest(id)
        }
      }
      setSelectedIds([])
      await load()
      setNotice({ type: "success", message: `${ids.length} request(s) ${action === "approve" ? "approved" : "rejected"}.` })
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Unable to process selected requests." })
      await load()
    } finally {
      setProcessing(false)
      setConfirmState(null)
    }
  }

  const requestReviewAction = (ids, action) => {
    const activeIds = ids.filter((id) => pendingPageItems.some((item) => item._id === id))
    if (!activeIds.length) {
      setNotice({ type: "error", message: "Please select pending requests first." })
      return
    }

    setConfirmState({
      title: action === "approve" ? "Approve Requests" : "Reject Requests",
      description: `${action === "approve" ? "Approve" : "Reject"} ${activeIds.length} selected request(s) from ${selectedGroup?.label || "this page"}?`,
      actionLabel: action === "approve" ? "Approve" : "Reject",
      variant: action === "approve" ? "primary" : "danger",
      onConfirm: () => processRequests(activeIds, action),
    })
  }

  return (
    <div className="space-y-5 p-4 text-[color:var(--text-primary)] sm:p-6">
      <section className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_16px_32px_rgba(16,24,20,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[color:var(--text-strong)]">
                {user?.role === "Admin" ? "Approval Center" : "My Approval History"}
              </h1>
              <p className="mt-1 text-sm text-red-700">
                Requests stay available for the last 7 days and are automatically cleaned up after that.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--text-primary)]"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      {notice ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${notice.type === "error" ? "border-rose-200 bg-rose-50 text-rose-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {notice.message}
        </div>
      ) : null}

      {pageGroups.length ? (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">Pages</p>
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600">{pageGroups.length}</span>
              </div>
              <div className="space-y-2">
                {pageGroups.map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setPage(group.key)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedPageKey === group.key ? "border-blue-300 bg-blue-50 text-blue-700" : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-primary)] hover:border-blue-200"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{group.label}</p>
                        <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Latest: {formatDay(group.latestAt)}</p>
                      </div>
                      <ChevronRight size={16} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">{group.pending} pending</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">{group.approved} approved</span>
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">{group.rejected} rejected</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="min-w-0 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)]">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">Selected Page</p>
                <h2 className="mt-1 text-xl font-black text-[color:var(--text-strong)]">{selectedGroup?.label}</h2>
                <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{selectedPageItems.length} request(s), {pendingPageItems.length} pending. Records are retained for 7 days.</p>
              </div>

              {canReview ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleAll}
                    disabled={!pendingPageItems.length || processing}
                    className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MousePointer2 size={15} /> {allPendingSelected ? "Clear Selection" : "Select All"}
                  </button>
                  <button
                    type="button"
                    onClick={() => requestReviewAction(selectedPendingIds, "approve")}
                    disabled={!selectedPendingIds.length || processing}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approve Selected ({selectedPendingIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => requestReviewAction(selectedPendingIds, "reject")}
                    disabled={!selectedPendingIds.length || processing}
                    className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject Selected
                  </button>
                </div>
              ) : null}
            </div>

            <div className="hidden max-w-full overflow-x-auto rounded-[20px] border border-[var(--border-strong)] md:block">
              <table className="table min-w-[1220px] whitespace-nowrap">
                <thead>
                  <tr>
                    {canReview ? <th className="w-[72px]">Select</th> : null}
                    {pageColumns.map((column) => <th key={column.label}>{column.label}</th>)}
                    <th>Status</th>
                    <th>Requested By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPageItems.map((item) => {
                    const isPending = item.status === "pending"
                    const checked = selectedIds.includes(item._id)

                    return (
                      <tr key={item._id}>
                        {canReview ? (
                          <td>
                            <button
                              type="button"
                              onClick={() => toggleItem(item)}
                              disabled={!isPending || processing}
                              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl border ${checked ? "border-blue-500 bg-blue-600 text-white" : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)]"} disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              {checked ? <Check size={16} /> : null}
                            </button>
                          </td>
                        ) : null}
                        {pageColumns.map((column) => (
                          <td key={`${item._id}-${column.label}`} className={`max-w-[150px] whitespace-normal break-words ${column.className || ""}`}>
                            {formatValue(getFieldValue(item, column), column.type)}
                          </td>
                        ))}
                        <td>
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${badgeStyles[item.status] || badgeStyles.pending}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="min-w-[140px]">{item.requester?.name || item.requester?.role || "-"}</td>
                        <td className="min-w-[140px]"> 
                          <div className="flex flex-row flex-nowrap justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600"
                            >
                              <Eye size={14} />
                            </button>
                            {canReview && isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => requestReviewAction([item._id], "approve")}
                                  disabled={processing}
                                  className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestReviewAction([item._id], "reject")}
                                  disabled={processing}
                                  className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {selectedPageItems.map((item) => {
                const isPending = item.status === "pending"
                const checked = selectedIds.includes(item._id)

                return (
                  <div key={item._id} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[color:var(--text-strong)]">{getRequestTitle(item)}</p>
                        <p className="mt-1 text-xs text-[color:var(--text-secondary)]">{titleCase(item.operation || "-")} | {formatDateTime(item.createdAt)}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeStyles[item.status] || badgeStyles.pending}`}>{item.status}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[color:var(--text-secondary)]">
                      {pageColumns.slice(0, 6).map((column) => (
                        <div key={column.label} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2">
                          <p className="font-semibold uppercase tracking-[0.12em]">{column.label}</p>
                          <p className={`mt-1 break-words text-[color:var(--text-strong)] ${column.className || ""}`}>{formatValue(getFieldValue(item, column), column.type)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {canReview ? (
                        <button
                          type="button"
                          onClick={() => toggleItem(item)}
                          disabled={!isPending || processing}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold ${checked ? "bg-blue-600 text-white" : "border border-blue-200 bg-blue-50 text-blue-600"} disabled:opacity-50`}
                        >
                          {checked ? "Selected" : "Select"}
                        </button>
                      ) : null}
                      <button type="button" onClick={() => setSelectedItem(item)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600">View</button>
                      {canReview && isPending ? (
                        <>
                          <button type="button" onClick={() => requestReviewAction([item._id], "approve")} disabled={processing} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve</button>
                          <button type="button" onClick={() => requestReviewAction([item._id], "reject")} disabled={processing} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Reject</button>
                        </>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 text-sm text-[color:var(--text-secondary)]">
          No approval requests found in the last 7 days.
        </div>
      )}

      {selectedItem ? <ApprovalDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}
      {confirmState ? (
        <ConfirmDialog
          title={confirmState.title}
          description={confirmState.description}
          actionLabel={confirmState.actionLabel}
          variant={confirmState.variant}
          processing={processing}
          onCancel={() => setConfirmState(null)}
          onConfirm={confirmState.onConfirm}
        />
      ) : null}
    </div>
  )
}

function ApprovalDetailsModal({ item, onClose }) {
  const { user } = useAuth()
  const isManagerView = user?.role === "Manager"
  const previewRows = getPreviewRows(item)

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_24px_48px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between border-b border-[var(--border-color)] px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">Approval Details</p>
            <h2 className="mt-1 text-xl font-semibold text-[color:var(--text-strong)]">{getRequestTitle(item)}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2 text-[color:var(--text-secondary)]">
            <X size={18} />
          </button>
        </div>

        <div className={`max-h-[calc(90vh-88px)] overflow-y-auto p-5 ${isManagerView ? "" : "grid gap-5 xl:grid-cols-[360px_1fr]"}`}>
          <div className="overflow-hidden rounded-2xl border border-[var(--border-strong)]">
            <table className="table min-w-full">
              <tbody>
                {previewRows.map(([label, value]) => (
                  <tr key={label}>
                    <th className="w-[170px] text-left">{label}</th>
                    <td className="break-words text-left">{value}</td>
                  </tr>
                ))}
                <tr>
                  <th className="text-left">Status</th>
                  <td className="text-left">{item.status}</td>
                </tr>
                <tr>
                  <th className="text-left">Processed At</th>
                  <td className="text-left">{formatDateTime(item.processedAt)}</td>
                </tr>
                <tr>
                  <th className="text-left">Review Note</th>
                  <td className="text-left">{item.reviewNote || "-"}</td>
                </tr>
              </tbody>
            </table>
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

function ConfirmDialog({ title, description, actionLabel, variant, processing, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.22)]">
        <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={processing}
            className={`rounded-xl px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60 ${variant === "danger" ? "bg-red-600" : "bg-emerald-600"}`}
          >
            {processing ? "Processing..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function JsonBlock({ title, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-soft)] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">{title}</p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-[color:var(--text-primary)]">
        {JSON.stringify(value || {}, null, 2)}
      </pre>
    </div>
  )
}


