import { useEffect, useMemo, useState } from "react"
import { ClipboardCheck, Eye, X } from "lucide-react"
import { getApprovals } from "../../services/approvalApi"

const statusClasses = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

const formatCurrency = (val) => {
  if (val == null || isNaN(val) || val === "") return "-"
  return `Rs. ${Number(val).toLocaleString("en-IN")}`
}

const formatNumber = (val, suffix = "") => {
  if (val == null || isNaN(val) || val === "") return "-"
  return `${Number(val).toLocaleString("en-IN")}${suffix}`
}

const formatDate = (val) => {
  if (!val) return "-"
  try {
    return new Date(val).toLocaleDateString("en-IN")
  } catch {
    return String(val)
  }
}

const formatDateTime = (val) => {
  if (!val) return "-"
  return new Date(val).toLocaleString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// MODULE-SPECIFIC TABLE SCHEMAS (Matches each page's table format 100%)
const getModuleTableSchema = (moduleKey, title) => {
  const key = String(moduleKey || "").toLowerCase().replace(/[^a-z]/g, "")
  const titleKey = String(title || "").toLowerCase().replace(/[^a-z]/g, "")

  if (key.includes("expense") || titleKey.includes("expense")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Category", render: (item) => item.payload?.category || "-" },
        { label: "Description", render: (item) => item.payload?.description || "-" },
        { label: "Amount", render: (item) => formatCurrency(item.payload?.amount), className: "font-semibold text-rose-500" },
        { label: "Payment Mode", render: (item) => item.payload?.paymentMode || "-" },
        { label: "Added By", render: (item) => item.payload?.addedBy || item.requester?.name || "-" },
      ],
    }
  }

  if (key.includes("lubricant") || titleKey.includes("lubricant")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Product", render: (item) => item.payload?.product || "-" },
        { label: "Qty", render: (item) => formatNumber(item.payload?.quantity) },
        { label: "Price", render: (item) => formatCurrency(item.payload?.price) },
        { label: "Total", render: (item) => formatCurrency(item.payload?.total || (Number(item.payload?.quantity || 0) * Number(item.payload?.price || 0))), className: "font-semibold text-rose-500" },
        { label: "Unit Profit", render: (item) => formatCurrency(item.payload?.unitProfit), className: "font-semibold text-emerald-500" },
        { label: "Total Profit", render: (item) => formatCurrency(item.payload?.totalProfit), className: "font-semibold text-emerald-500" },
        { label: "Sold By", render: (item) => item.payload?.soldBy || item.requester?.name || "-" },
      ],
    }
  }

  if (key === "mdu" || titleKey.includes("mdu")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Op. Stock", render: (item) => formatNumber(item.payload?.openingStock) },
        { label: "Decant", render: (item) => formatNumber(item.payload?.decant) },
        { label: "Sale", render: (item) => formatNumber(item.payload?.sale) },
        { label: "Physical Stock", render: (item) => formatNumber(item.payload?.physicalStock) },
        { label: "Loss/Gain", render: (item) => formatNumber(item.payload?.lossGain), className: "font-semibold text-emerald-500" },
        { label: "Rate", render: (item) => formatNumber(item.payload?.rate) },
        { label: "Remark", render: (item) => item.payload?.remark || "-" },
      ],
    }
  }

  if (key.includes("dailysales") || titleKey.includes("dailysales")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Product", render: (item) => item.payload?.product || "-" },
        { label: "Sale", render: (item) => formatNumber(item.payload?.sale) },
        { label: "Rate", render: (item) => formatNumber(item.payload?.rate) },
        { label: "Loss/Gain", render: (item) => formatNumber(item.payload?.lossGain), className: "font-semibold text-emerald-500" },
        { label: "Profit", render: (item) => formatCurrency(item.payload?.profit), className: "font-semibold text-emerald-500" },
        { label: "Remark", render: (item) => item.payload?.remark || "-" },
      ],
    }
  }

  if (key.includes("invoicedetail") || titleKey.includes("invoicedetail")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Product", render: (item) => item.payload?.product || "-" },
        { label: "Qty", render: (item) => formatNumber(item.payload?.qty) },
        { label: "Invoice Amount", render: (item) => formatCurrency(item.payload?.invoiceAmount) },
        { label: "Transport Cost", render: (item) => formatCurrency(item.payload?.transportCost) },
        { label: "LFR", render: (item) => formatCurrency(item.payload?.lfr) },
        { label: "Purchase Amount", render: (item) => formatCurrency(item.payload?.purchaseAmount) },
        { label: "RSP", render: (item) => formatCurrency(item.payload?.rsp) },
        { label: "Margin", render: (item) => formatCurrency(item.payload?.margin), className: "font-semibold text-emerald-500" },
        { label: "Remark", render: (item) => item.payload?.remark || "-" },
      ],
    }
  }

  if (key === "dcd" || titleKey.includes("dcd")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Product", render: (item) => item.payload?.product || "-" },
        { label: "Volume", render: (item) => formatNumber(item.payload?.volume) },
        { label: "Purchase Price", render: (item) => formatCurrency(item.payload?.purchasePrice) },
        { label: "Sale Price", render: (item) => formatCurrency(item.payload?.salePrice) },
        { label: "Profit", render: (item) => formatCurrency(item.payload?.profit), className: "font-semibold text-emerald-500" },
        { label: "Shift", render: (item) => item.payload?.shift || "-" },
        { label: "Remark", render: (item) => item.payload?.remark || "-" },
      ],
    }
  }

  if (key.includes("tanker") || titleKey.includes("tanker")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Product", render: (item) => item.payload?.product || "-" },
        { label: "Invoice Vol", render: (item) => formatNumber(item.payload?.invoiceVol) },
        { label: "Recd Vol", render: (item) => formatNumber(item.payload?.recdVol) },
        { label: "Dip Before", render: (item) => formatNumber(item.payload?.dipBefore) },
        { label: "Dip After", render: (item) => formatNumber(item.payload?.dipAfter) },
        { label: "Shortage", render: (item) => formatNumber(item.payload?.shortage) },
        { label: "Transporter", render: (item) => item.payload?.transporter || "-" },
      ],
    }
  }

  if (key.includes("card") || titleKey.includes("card")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Machine", render: (item) => item.payload?.machine || "-" },
        { label: "Payment Method", render: (item) => item.payload?.paymentMethod || "-" },
        { label: "Amount", render: (item) => formatCurrency(item.payload?.amount) },
        { label: "Net Received", render: (item) => formatCurrency(item.payload?.netReceived) },
        { label: "Added By", render: (item) => item.payload?.addedBy || item.requester?.name || "-" },
      ],
    }
  }

  if (key.includes("customer") || titleKey.includes("customer")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Customer", render: (item) => item.payload?.customerName || item.payload?.customer || "-" },
        { label: "Vehicle No", render: (item) => item.payload?.vehicleNo || "-" },
        { label: "Fuel Type", render: (item) => item.payload?.fuelType || "-" },
        { label: "Litres", render: (item) => formatNumber(item.payload?.litres) },
        { label: "Amount", render: (item) => formatCurrency(item.payload?.amount) },
      ],
    }
  }

  if (key.includes("employee") || titleKey.includes("employee")) {
    return {
      columns: [
        { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
        { label: "Employee", render: (item) => item.payload?.employeeName || item.payload?.name || "-" },
        { label: "Shift", render: (item) => item.payload?.shift || "-" },
        { label: "Attendance", render: (item) => item.payload?.attendance || item.payload?.status || "-" },
        { label: "Bonus", render: (item) => formatCurrency(item.payload?.bonus) },
        { label: "Advance", render: (item) => formatCurrency(item.payload?.advance) },
      ],
    }
  }

  // DEFAULT SCHEMA FOR OTHER PAGES
  return {
    columns: [
      { label: "Date", render: (item) => formatDate(item.payload?.date || item.createdAt) },
      { label: "Type / Category", render: (item) => item.payload?.category || item.payload?.product || item.moduleLabel || "-" },
      { label: "Description / Summary", render: (item) => item.payload?.description || item.summary || `${item.operation} request` },
      { label: "Amount / Value", render: (item) => formatCurrency(item.payload?.amount || item.payload?.total || item.payload?.sale) },
      { label: "Submitted By", render: (item) => item.payload?.addedBy || item.requester?.name || "-" },
    ],
  }
}

export default function ApprovalActivityPanel({ moduleKey, title }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [statusFilter, setStatusFilter] = useState("all")

  const schema = useMemo(() => getModuleTableSchema(moduleKey, title), [moduleKey, title])

  const load = async () => {
    try {
      const data = await getApprovals()
      setItems(data.filter((item) => item.moduleKey === moduleKey))
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

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return items
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

  return (
    <>
      {/* MANAGER APPROVAL ACTIVITY HEADER CARD */}
      <div className=" mt-3 ml-5 mr-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm text-[color:var(--text-primary)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-secondary)] font-semibold">
              Manager Approval Activity
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-[color:var(--text-strong)]">{title}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <CountPill label="Pending" value={counts.pending} tone="bg-amber-500/10 text-amber-600 border-amber-500/20" />
            <CountPill label="Approved" value={counts.approved} tone="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" />
            <CountPill label="Rejected" value={counts.rejected} tone="bg-rose-500/10 text-rose-600 border-rose-500/20" />
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-500/20 transition-colors"
            >
              <ClipboardCheck size={16} />
              View pending / approved list
            </button>
          </div>
        </div>
      </div>

      {/* APPROVAL STATUS LIST MODAL (DYNAMIC PAGE TABLE FORMAT) */}
      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-2xl text-[color:var(--text-primary)] flex flex-col">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
              <div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                  {title}
                </span>
                <h3 className="mt-1 text-xl font-extrabold text-[color:var(--text-strong)]">
                  Approval status list
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* STATUS FILTER BUTTONS */}
                <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-1">
                  {["all", "pending", "approved", "rejected"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase transition-all ${
                        statusFilter === st
                          ? "bg-[var(--bg-panel)] text-[color:var(--text-strong)] shadow-sm"
                          : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* DYNAMIC PAGE TABLE CONTAINER */}
            <div className="max-h-[calc(90vh-90px)] flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-4">
              {filteredItems.length ? (
                <div className="max-h-[580px] overflow-y-auto overflow-x-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-sm">
                  <table className="table min-w-[900px] text-sm w-full">
                    <thead className="sticky top-0 z-10 bg-[var(--bg-panel)] border-b border-[var(--border-strong)] shadow-sm">
                      <tr>
                        {schema.columns.map((col) => (
                          <th key={col.label} className="py-3 px-4 text-left font-semibold text-[color:var(--text-secondary)]">
                            {col.label}
                          </th>
                        ))}
                        <th className="py-3 px-4 text-right font-semibold text-[color:var(--text-secondary)] min-w-[220px]">
                          Action & Submission Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {filteredItems.map((item) => (
                        <tr key={item._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                          {schema.columns.map((col) => (
                            <td key={col.label} className={`py-3 px-4 ${col.className || ""}`}>
                              {col.render(item)}
                            </td>
                          ))}
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2.5 whitespace-nowrap ml-auto">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase border shrink-0 ${
                                  statusClasses[item.status] || statusClasses.pending
                                }`}
                              >
                                {item.status}
                              </span>
                              <span className="text-[11px] text-[color:var(--text-secondary)] font-mono shrink-0">
                                {formatDateTime(item.createdAt)}
                              </span>
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-500/20 transition-colors shrink-0"
                              >
                                <Eye size={13} />
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] p-8 text-center text-sm text-[color:var(--text-secondary)]">
                  No approval requests found for this page in the selected status.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* STRUCTURED ITEM DETAIL MODAL */}
      {selectedItem ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-2xl text-[color:var(--text-primary)] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
              <div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase border ${
                    statusClasses[selectedItem.status] || statusClasses.pending
                  }`}
                >
                  {selectedItem.status}
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-[color:var(--text-strong)]">
                  {selectedItem.summary || `${selectedItem.moduleLabel} Details`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)]">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[var(--border-color)]">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-[color:var(--text-secondary)] w-1/3 bg-[var(--bg-soft)]">
                        Module
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[color:var(--text-strong)]">
                        {selectedItem.moduleLabel}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-[color:var(--text-secondary)] bg-[var(--bg-soft)]">
                        Operation
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[color:var(--text-strong)]">
                        {selectedItem.operation}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-[color:var(--text-secondary)] bg-[var(--bg-soft)]">
                        Submitted Date & Time
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs font-semibold text-blue-600">
                        {formatDateTime(selectedItem.createdAt)}
                      </td>
                    </tr>

                    {/* DYNAMIC PAYLOAD RENDER */}
                    {Object.entries(selectedItem.payload || {}).map(([key, val]) => {
                      if (typeof val === "object" && val !== null) return null
                      const formattedKey = key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())

                      return (
                        <tr key={key}>
                          <td className="py-2.5 px-4 font-semibold text-[color:var(--text-secondary)] bg-[var(--bg-soft)]">
                            {formattedKey}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[color:var(--text-strong)]">
                            {key.toLowerCase().includes("amount") || key.toLowerCase().includes("total") || key.toLowerCase().includes("price")
                              ? formatCurrency(val)
                              : String(val ?? "-")}
                          </td>
                        </tr>
                      )
                    })}

                    {selectedItem.reviewNote ? (
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-[color:var(--text-secondary)] bg-[var(--bg-soft)]">
                          Review Note
                        </td>
                        <td className="py-2.5 px-4 font-medium text-amber-600">
                          {selectedItem.reviewNote}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function CountPill({ label, value, tone }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${tone}`}>
      {label}: {value}
    </span>
  )
}
