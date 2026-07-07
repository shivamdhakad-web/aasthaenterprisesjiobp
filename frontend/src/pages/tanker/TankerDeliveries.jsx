import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../../components/MobileActionFab"
import { useAuth } from "../../contexts/AuthContext"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"
import {
  addDelivery,
  deleteDelivery,
  getDeliveries,
  updateDelivery,
} from "../../services/tankerApi"

const getToday = () => new Date().toISOString().slice(0, 10)
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

const emptyDelivery = () => ({
  date: getToday(),
  truckNo: "",
  transportName: "",
  driverName: "",
  number: "",
  product: "Diesel",
  qty: "",
  initialStock: "",
  initialTemp: "",
  finalStock: "",
  finalTemp: "",
  fuelSales: "",
  unloadedQty: "",
})

const numberValue = (value) => Number(value || 0)

const formatDate = (value) => {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("en-IN")
}

const formatDateTime = (value) => {
  if (!value) return "Not edited yet"
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN")
const formatLiters = (value) => `${formatNumber(value)} L`

const normalizeDelivery = (delivery = {}) => ({
  ...emptyDelivery(),
  ...delivery,
  truckNo: delivery.truckNo || delivery.invoice || "",
  transportName: delivery.transportName || delivery.supplier || "",
  product: delivery.product || delivery.fuel || "Diesel",
  qty: delivery.qty ?? delivery.quantity ?? "",
  lossGain: delivery.lossGain ?? numberValue(delivery.qty ?? delivery.quantity) - numberValue(delivery.unloadedQty),
})

const buildPayload = (form, user) => {
  const qty = numberValue(form.qty)
  const unloadedQty = numberValue(form.unloadedQty)

  return {
    ...form,
    qty,
    quantity: qty,
    initialStock: numberValue(form.initialStock),
    initialTemp: numberValue(form.initialTemp),
    finalStock: numberValue(form.finalStock),
    finalTemp: numberValue(form.finalTemp),
    fuelSales: numberValue(form.fuelSales),
    unloadedQty,
    lossGain: qty - unloadedQty,
    supplier: form.transportName,
    fuel: form.product,
    invoice: form.truckNo,
    createdBy: user?.name || user?.role || "Admin",
  }
}

export default function TankerDeliveries() {
  const { user } = useAuth()
  const isManager = user?.role === "Manager"
  const { canUse } = useManagerDashboardSettings("tankerDeliveries", isManager)
  const canManagerUse = (buttonKey) => !isManager || canUse(buttonKey)

  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportFormat, setReportFormat] = useState("pdf")
  const [deleteMonthOpen, setDeleteMonthOpen] = useState(false)
  const [deleteMonthValue, setDeleteMonthValue] = useState(getCurrentMonth())
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState(emptyDelivery())
  const [openCard, setOpenCard] = useState(null)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmState, setConfirmState] = useState(null)
  const [saving, setSaving] = useState(false)
  const [entryModePrompt, setEntryModePrompt] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkRows, setBulkRows] = useState([emptyDelivery()])

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!notice.text) return undefined

    const timeout = window.setTimeout(() => setNotice({ type: "", text: "" }), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const load = async () => {
    const res = await getDeliveries()
    setData(Array.isArray(res) ? res.map(normalizeDelivery) : [])
  }

  const filteredData = useMemo(
    () =>
      data.filter((delivery) => {
        const target = [
          delivery.date,
          delivery.truckNo,
          delivery.transportName,
          delivery.driverName,
          delivery.number,
          delivery.product,
          delivery.qty,
          delivery.unloadedQty,
        ]
          .join(" ")
          .toLowerCase()

        return (
          target.includes(search.toLowerCase()) &&
          (!productFilter || delivery.product === productFilter) &&
          (!dateFilter || delivery.date === dateFilter)
        )
      }),
    [data, dateFilter, productFilter, search],
  )

  const productOptions = useMemo(
    () => [...new Set(["Diesel", "Petrol", "Premium", ...data.map((item) => item.product).filter(Boolean)])],
    [data],
  )

  const totalQty = filteredData.reduce((sum, item) => sum + numberValue(item.qty), 0)
  const totalUnloaded = filteredData.reduce((sum, item) => sum + numberValue(item.unloadedQty), 0)
  const totalLoss = filteredData.reduce((sum, item) => {
    const value = numberValue(item.lossGain)
    return value < 0 ? sum + Math.abs(value) : sum
  }, 0)
  const totalGain = filteredData.reduce((sum, item) => {
    const value = numberValue(item.lossGain)
    return value > 0 ? sum + value : sum
  }, 0)

  const openCreate = () => {
    if (!canManagerUse("addDelivery")) {
      setNotice({ type: "error", text: "You do not have access to record tanker deliveries." })
      return
    }

    setEdit(null)
    setForm(emptyDelivery())
    setOpen(true)
  }

  const openEdit = (delivery) => {
    if (!canManagerUse("editDelivery")) {
      setNotice({ type: "error", text: "You do not have access to edit tanker deliveries." })
      return
    }

    setEdit(delivery)
    setForm(normalizeDelivery(delivery))
    setOpen(true)
  }

  const openEntryModePrompt = () => {
    if (!canManagerUse("addDelivery")) {
      setNotice({ type: "error", text: "You do not have access to record tanker deliveries." })
      return
    }

    setEntryModePrompt(true)
  }

  const openBulkModal = () => {
    if (!canManagerUse("addDelivery")) {
      setNotice({ type: "error", text: "You do not have access to record tanker deliveries." })
      return
    }

    setBulkRows([emptyDelivery()])
    setBulkOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setEdit(null)
    setForm(emptyDelivery())
  }

  const save = async () => {
    if (!canManagerUse(edit ? "editDelivery" : "addDelivery")) {
      setNotice({ type: "error", text: "You do not have access to save tanker deliveries." })
      return
    }

    if (!form.date || !form.truckNo || !form.transportName || !form.driverName || !form.product || !form.qty) {
      setNotice({ type: "error", text: "Please complete date, truck, transport, driver, product, and quantity." })
      return
    }

    setSaving(true)

    try {
      const payload = buildPayload(form, user)

      if (edit) {
        await updateDelivery(edit._id, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: "Tanker delivery updated successfully." })
      } else {
        await addDelivery(payload)
        setNotice({ type: "success", text: "Tanker delivery saved successfully." })
      }

      closeModal()
      await load()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save tanker delivery.",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateBulkRow = (index, key, value) => {
    setBulkRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    )
  }

  const addBulkRow = () => {
    setBulkRows((current) => [...current, emptyDelivery()])
  }

  const removeBulkRow = (index) => {
    setBulkRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)))
  }

  const saveBulk = async () => {
    if (!canManagerUse("addDelivery")) {
      setNotice({ type: "error", text: "You do not have access to record tanker deliveries." })
      return
    }

    const invalid = bulkRows.some(
      (row) => !row.date || !row.truckNo || !row.transportName || !row.driverName || !row.product || !row.qty,
    )

    if (invalid) {
      setNotice({ type: "error", text: "Please complete every tanker delivery row before saving." })
      return
    }

    setBulkSaving(true)

    try {
      for (const row of bulkRows) {
        await addDelivery(buildPayload(row, user))
      }

      setBulkOpen(false)
      setBulkRows([emptyDelivery()])
      await load()
      setNotice({ type: "success", text: "Multiple tanker delivery entries saved successfully." })
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save multiple tanker deliveries.",
      })
    } finally {
      setBulkSaving(false)
    }
  }

  const askDelete = (delivery) => {
    if (!canManagerUse("deleteDelivery")) {
      setNotice({ type: "error", text: "You do not have access to delete tanker deliveries." })
      return
    }

    setConfirmState({
      title: "Delete Tanker Delivery",
      description: `Delete delivery for truck ${delivery.truckNo || "-"} on ${formatDate(delivery.date)}? This action cannot be undone.`,
      actionLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        await deleteDelivery(delivery._id)
        await load()
        setNotice({ type: "success", text: "Tanker delivery deleted successfully." })
      },
    })
  }

  const exportTankerReport = () => {
    const headers = [
      "Date",
      "Truck No.",
      "Transport Name",
      "Driver Name",
      "Number",
      "Product",
      "Qty.",
      "Initial Stock",
      "Initial Temp",
      "Final Stock",
      "Final Temp",
      "Fuel Sales",
      "Unloaded Qty",
      "Loss/Gain",
      "Last Edited",
      "Edited By",
    ]
    const rows = filteredData.map((delivery) => [
      formatDate(delivery.date),
      delivery.truckNo || "-",
      delivery.transportName || "-",
      delivery.driverName || "-",
      delivery.number || "-",
      delivery.product || "-",
      formatNumber(delivery.qty),
      formatNumber(delivery.initialStock),
      delivery.initialTemp || 0,
      formatNumber(delivery.finalStock),
      delivery.finalTemp || 0,
      formatNumber(delivery.fuelSales),
      formatNumber(delivery.unloadedQty),
      formatNumber(delivery.lossGain),
      formatDateTime(delivery.lastEditedAt),
      delivery.lastEditedBy ? `${delivery.lastEditedBy} (${delivery.lastEditedByRole || "-"})` : "-",
    ])

    if (reportFormat === "excel") {
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, "Tanker Deliveries")
      XLSX.writeFile(workbook, "Tanker_Deliveries_Report.xlsx")
    } else {
      const doc = new jsPDF({ orientation: "landscape" })
      doc.setFontSize(16)
      doc.text("Tanker Deliveries Report", 14, 16)
      doc.setFontSize(10)
      doc.text(`Product: ${productFilter || "All"}  Date: ${dateFilter || "All"}  Records: ${filteredData.length}`, 14, 24)
      autoTable(doc, {
        startY: 30,
        head: [headers],
        body: rows,
        styles: { fontSize: 6, cellPadding: 1.6 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      })
      doc.save("Tanker_Deliveries_Report.pdf")
    }

    setReportOpen(false)
  }

  const deleteSelectedMonth = async () => {
    if (!canManagerUse("deleteDelivery")) {
      setNotice({ type: "error", text: "You do not have access to delete tanker deliveries." })
      return
    }

    const targets = data.filter((delivery) => String(delivery.date || "").slice(0, 7) === deleteMonthValue)
    if (!targets.length) {
      setNotice({ type: "error", text: "No tanker deliveries found for selected month." })
      return
    }

    try {
      await Promise.all(targets.map((delivery) => deleteDelivery(delivery._id)))
      setDeleteMonthOpen(false)
      await load()
      setNotice({ type: "success", text: `${targets.length} tanker deliveries deleted successfully.` })
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to delete selected month." })
    }
  }

  const clearFilters = () => {
    setProductFilter("")
    setDateFilter("")
  }

  const filterContent = (
    <>
      <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className="input">
        <option value="">All Products</option>
        {productOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dateFilter}
        onChange={(event) => setDateFilter(event.target.value)}
        className="input"
      />

      <button
        onClick={clearFilters}
        className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)] sm:justify-self-start"
      >
        Clear Filters
      </button>
    </>
  )

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden p-3 text-[color:var(--text-primary)] sm:p-5">
      <div className="mb-4 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_14px_28px_rgba(16,24,20,0.06)]">
        <h1 className="text-2xl font-bold text-[color:var(--text-strong)] sm:text-3xl">Tanker Deliveries</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Record incoming stock, unloading details, temperature, loss/gain, and audit history.
        </p>
      </div>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard label="Deliveries" value={filteredData.length} tone="blue" />
        <SummaryCard label="Total Quantity" value={formatLiters(totalQty)} tone="emerald" />
        <SummaryCard label="Unloaded Qty" value={formatLiters(totalUnloaded)} tone="violet" />
        <SummaryCard label="Loss" value={formatLiters(totalLoss)} tone="rose" />
        <SummaryCard label="Gain" value={formatLiters(totalGain)} tone="green" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search truck, transport, driver, number, product"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[460px]"
        />

        {canManagerUse("addDelivery") ? (
          <button
            onClick={openEntryModePrompt}
            className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
          >
            Record Delivery
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="hidden rounded-2xl bg-purple-600 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          Generate Report
        </button>
        {canManagerUse("deleteDelivery") ? (
          <button
            type="button"
            onClick={() => {
              setDeleteMonthValue(getCurrentMonth())
              setDeleteMonthOpen(true)
            }}
            className="hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-medium text-red-500 sm:inline-flex"
          >
            Delete Month
          </button>
        ) : null}
      </div>

      <div className="mb-3 sm:hidden">
        <button
          onClick={() => setShowFilter((current) => !current)}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)]"
        >
          {showFilter ? "Hide Filters" : "Filters"}
        </button>
      </div>

      <div className={`mb-4 gap-3 sm:grid sm:grid-cols-3 ${showFilter ? "grid" : "hidden sm:grid"}`}>
        {filterContent}
      </div>

      <div className="hidden max-h-[560px] min-w-0 max-w-full overflow-x-auto overflow-y-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] sm:block">
        <table className="table min-w-[1480px] text-xs">
          <thead>
            <tr>
              <th>Date</th>
              <th>Truck No.</th>
              <th>Transport Name</th>
              <th>Driver Name</th>
              <th>Number</th>
              <th>Product</th>
              <th>Qty.</th>
              <th>Initial Stock (Ltr.)</th>
              <th>Initial Temp (*C)</th>
              <th>Final Stock</th>
              <th>Final Temp</th>
              <th>Fuel Sales</th>
              <th>Unloaded Qty</th>
              <th>Loss/Gain</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((delivery) => (
              <tr key={delivery._id}>
                <td>{formatDate(delivery.date)}</td>
                <td>{delivery.truckNo || "-"}</td>
                <td>{delivery.transportName || "-"}</td>
                <td>{delivery.driverName || "-"}</td>
                <td>{delivery.number || "-"}</td>
                <td>{delivery.product || "-"}</td>
                <td>{formatNumber(delivery.qty)}</td>
                <td>{formatNumber(delivery.initialStock)}</td>
                <td>{delivery.initialTemp || 0}</td>
                <td>{formatNumber(delivery.finalStock)}</td>
                <td>{delivery.finalTemp || 0}</td>
                <td>{formatNumber(delivery.fuelSales)}</td>
                <td>{formatNumber(delivery.unloadedQty)}</td>
                <td className={numberValue(delivery.lossGain) >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-red-500"}>
                  {formatNumber(delivery.lossGain)}
                </td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    {canManagerUse("editDelivery") ? (
                      <button onClick={() => openEdit(delivery)} className="text-blue-500">
                        Edit
                      </button>
                    ) : null}
                    {canManagerUse("deleteDelivery") ? (
                      <button onClick={() => askDelete(delivery)} className="text-red-500">
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="max-h-[640px] space-y-4 overflow-y-auto pr-1 sm:hidden">
        {filteredData.map((delivery) => {
          const isOpen = openCard === delivery._id

          return (
            <div
              key={delivery._id}
              onClick={() => setOpenCard(isOpen ? null : delivery._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] transition active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">
                    {delivery.product || "Product"}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">
                    {delivery.truckNo || "-"}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {delivery.transportName || "-"} • {formatDate(delivery.date)}
                  </p>
                </div>

                <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-500">
                  {formatLiters(delivery.qty)}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <InfoBox label="Driver" value={delivery.driverName || "-"} />
                <InfoBox label={numberValue(delivery.lossGain) < 0 ? "Loss" : "Gain"} value={formatLiters(Math.abs(numberValue(delivery.lossGain)))} />
              </div>

              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoBox label="Number" value={delivery.number || "-"} />
                    <InfoBox label="Unloaded" value={formatLiters(delivery.unloadedQty)} />
                    <InfoBox label="Initial Stock" value={formatLiters(delivery.initialStock)} />
                    <InfoBox label="Final Stock" value={formatLiters(delivery.finalStock)} />
                    <InfoBox label="Initial Temp" value={delivery.initialTemp || 0} />
                    <InfoBox label="Final Temp" value={delivery.finalTemp || 0} />
                  </div>

                  <InfoLine label="Fuel Sales" value={formatLiters(delivery.fuelSales)} />
                  <InfoLine label="Last Edited" value={formatDateTime(delivery.lastEditedAt)} />
                  <InfoLine label="Edited By" value={delivery.lastEditedBy ? `${delivery.lastEditedBy} (${delivery.lastEditedByRole || "-"})` : "-"} />

                  {canManagerUse("editDelivery") || canManagerUse("deleteDelivery") ? (
                    <div className="flex gap-2">
                      {canManagerUse("editDelivery") ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            openEdit(delivery)
                          }}
                          className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                        >
                          Edit
                        </button>
                      ) : null}
                      {canManagerUse("deleteDelivery") ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            askDelete(delivery)
                          }}
                          className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {open ? (
        <DeliveryModal
          title={edit ? "Edit Tanker Delivery" : "Record Tanker Delivery"}
          form={form}
          setForm={setForm}
          productOptions={productOptions}
          onClose={closeModal}
          onSave={save}
          saving={saving}
        />
      ) : null}

      {bulkOpen ? (
        <DeliveryBulkModal
          rows={bulkRows}
          productOptions={productOptions}
          updateRow={updateBulkRow}
          addRow={addBulkRow}
          removeRow={removeBulkRow}
          onClose={() => setBulkOpen(false)}
          onSave={saveBulk}
          saving={bulkSaving}
        />
      ) : null}

      {confirmState ? (
        <ConfirmDialog
          title={confirmState.title}
          description={confirmState.description}
          actionLabel={confirmState.actionLabel}
          variant={confirmState.variant}
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            try {
              await confirmState.onConfirm?.()
            } catch (error) {
              setNotice({
                type: "error",
                text: error?.response?.data?.message || "Unable to complete this action.",
              })
            } finally {
              setConfirmState(null)
            }
          }}
        />
      ) : null}

      {reportOpen ? (
        <ReportModal
          format={reportFormat}
          setFormat={setReportFormat}
          count={filteredData.length}
          onClose={() => setReportOpen(false)}
          onDownload={exportTankerReport}
        />
      ) : null}

      {deleteMonthOpen ? (
        <DeleteMonthModal
          value={deleteMonthValue}
          setValue={setDeleteMonthValue}
          onClose={() => setDeleteMonthOpen(false)}
          onDelete={deleteSelectedMonth}
        />
      ) : null}

      {entryModePrompt ? (
        <ConfirmDialog
          title="Record Tanker Delivery"
          description="Choose whether you want to save one tanker delivery or add multiple tanker deliveries together."
          actionLabel="Single Entry"
          secondaryLabel="Multiple Entry"
          variant="primary"
          onCancel={() => setEntryModePrompt(false)}
          onConfirm={() => {
            setEntryModePrompt(false)
            openCreate()
          }}
          onSecondaryAction={() => {
            setEntryModePrompt(false)
            openBulkModal()
          }}
        />
      ) : null}

      <MobileActionFab
        actions={[
          {
            label: "Generate Report",
            className: "bg-purple-600",
            onClick: () => setReportOpen(true),
          },
          canManagerUse("deleteDelivery")
            ? {
                label: "Delete Month",
                className: "bg-red-600",
                onClick: () => {
                  setDeleteMonthValue(getCurrentMonth())
                  setDeleteMonthOpen(true)
                },
              }
            : null,
          canManagerUse("addDelivery")
            ? {
                label: "Record Delivery",
                className: "bg-blue-600",
                onClick: openEntryModePrompt,
              }
            : null,
        ].filter(Boolean)}
      />
    </div>
  )
}

function ReportModal({ format, setFormat, count, onClose, onDownload }) {
  return (
    <ModalShell title="Generate Tanker Report" onClose={onClose} maxWidth="max-w-sm">
      <p className="text-sm text-[color:var(--text-secondary)]">{count} records will be exported.</p>
      <select value={format} onChange={(event) => setFormat(event.target.value)} className="input mt-4 w-full">
        <option value="pdf">PDF</option>
        <option value="excel">Excel</option>
      </select>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]">
          Cancel
        </button>
        <button type="button" onClick={onDownload} className="rounded-xl bg-purple-600 px-4 py-2 text-white">
          Download
        </button>
      </div>
    </ModalShell>
  )
}

function DeleteMonthModal({ value, setValue, onClose, onDelete }) {
  return (
    <ModalShell title="Delete Tanker Month" onClose={onClose} maxWidth="max-w-sm">
      <p className="text-sm leading-6 text-[color:var(--text-secondary)]">Select a month to delete tanker delivery records from that month.</p>
      <input type="month" value={value} onChange={(event) => setValue(event.target.value)} className="input mt-4 w-full" />
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]">
          Cancel
        </button>
        <button type="button" onClick={onDelete} className="rounded-xl bg-red-600 px-4 py-2 text-white">
          Delete Month
        </button>
      </div>
    </ModalShell>
  )
}

function DeliveryModal({ title, form, setForm, productOptions, onClose, onSave, saving }) {
  const lossGain = numberValue(form.qty) - numberValue(form.unloadedQty)

  return (
    <ModalShell title={title} onClose={onClose} maxWidth="max-w-2xl">
      <DeliveryFields form={form} setForm={setForm} productOptions={productOptions} />

      <div className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
        <p className="text-sm text-[color:var(--text-secondary)]">Loss / Gain</p>
        <p className={`mt-2 text-2xl font-bold ${lossGain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
          {formatLiters(lossGain)}
        </p>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </ModalShell>
  )
}

function DeliveryBulkModal({ rows, productOptions, updateRow, addRow, removeRow, onClose, onSave, saving }) {
  return (
    <ModalShell title="Record Multiple Tanker Deliveries" onClose={onClose} maxWidth="max-w-3xl">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        {rows.map((row, index) => {
          const lossGain = numberValue(row.qty) - numberValue(row.unloadedQty)

          return (
            <div key={`bulk-tanker-${index}`} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-semibold text-[color:var(--text-strong)]">Entry {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm text-red-500"
                >
                  Remove
                </button>
              </div>

              <DeliveryFields
                form={row}
                setForm={(next) => {
                  Object.entries(next).forEach(([key, value]) => updateRow(index, key, value))
                }}
                productOptions={productOptions}
                compact
              />

              <div className="mt-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 text-sm">
                <span className="text-[color:var(--text-secondary)]">Loss / Gain: </span>
                <span className={`font-semibold ${lossGain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatLiters(lossGain)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-4 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 font-medium text-[color:var(--text-primary)]"
      >
        + Add Another Row
      </button>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Entries"}
        </button>
      </div>
    </ModalShell>
  )
}

function DeliveryFields({ form, setForm, productOptions, compact = false }) {
  const update = (key, value) => setForm({ ...form, [key]: value })

  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
      <input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} className="input" />
      <input placeholder="Truck No." value={form.truckNo} onChange={(event) => update("truckNo", event.target.value)} className="input" />
      <input placeholder="Transport Name" value={form.transportName} onChange={(event) => update("transportName", event.target.value)} className="input" />
      <input placeholder="Driver Name" value={form.driverName} onChange={(event) => update("driverName", event.target.value)} className="input" />
      <input placeholder="Number" value={form.number} onChange={(event) => update("number", event.target.value)} className="input" />
      <select value={form.product} onChange={(event) => update("product", event.target.value)} className="input">
        {productOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <input placeholder="Qty." value={form.qty} onChange={(event) => update("qty", event.target.value)} className="input" />
      <input placeholder="Initial Stock (ltr.)" value={form.initialStock} onChange={(event) => update("initialStock", event.target.value)} className="input" />
      <input placeholder="Initial Temp (*C)" value={form.initialTemp} onChange={(event) => update("initialTemp", event.target.value)} className="input" />
      <input placeholder="Final Stock" value={form.finalStock} onChange={(event) => update("finalStock", event.target.value)} className="input" />
      <input placeholder="Final Temp" value={form.finalTemp} onChange={(event) => update("finalTemp", event.target.value)} className="input" />
      <input placeholder="Fuel Sales" value={form.fuelSales} onChange={(event) => update("fuelSales", event.target.value)} className="input" />
      <input placeholder="Unloaded Qty" value={form.unloadedQty} onChange={(event) => update("unloadedQty", event.target.value)} className="input" />
    </div>
  )
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    blue: { panel: "border-blue-200/70 bg-blue-50/80", value: "text-blue-600" },
    emerald: { panel: "border-emerald-200/70 bg-emerald-50/80", value: "text-emerald-600" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80", value: "text-violet-600" },
    green: { panel: "border-green-200/70 bg-green-50/80", value: "text-green-600" },
    rose: { panel: "border-rose-200/70 bg-rose-50/80", value: "text-rose-600" },
  }
  const current = tones[tone] || tones.blue

  return (
    <div className={`rounded-2xl border p-3 shadow-[0_12px_24px_rgba(16,24,20,0.05)] sm:p-4 ${current.panel}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)] sm:text-xs">{label}</p>
      <p className={`mt-2 text-xl font-extrabold sm:text-2xl ${current.value}`}>{value}</p>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
      <p className="text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-1 font-semibold text-[color:var(--text-strong)]">{value}</p>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-[color:var(--text-secondary)]">{label}</span>
      <span className="text-right font-medium text-[color:var(--text-strong)]">{value}</span>
    </div>
  )
}

function InlineNotice({ notice }) {
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
        notice.type === "error"
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {notice.text}
    </div>
  )
}

function ModalShell({ title, onClose, children, maxWidth = "max-w-md" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 py-6 sm:items-center sm:p-4">
      <div className={`max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 text-[color:var(--text-primary)] sm:p-6`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2 text-[color:var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ConfirmDialog({
  title,
  description,
  actionLabel,
  variant,
  secondaryLabel = "",
  onCancel,
  onConfirm,
  onSecondaryAction,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.22)]">
        <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
          >
            Cancel
          </button>
          {secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-600"
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-white ${variant === "danger" ? "bg-red-600" : "bg-blue-600"}`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

