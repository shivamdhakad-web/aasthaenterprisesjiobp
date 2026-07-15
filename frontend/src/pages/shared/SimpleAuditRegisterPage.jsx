import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../../components/MobileActionFab"
import { useAuth } from "../../contexts/AuthContext"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"

const today = () => new Date().toISOString().slice(0, 10)
const currentMonth = () => new Date().toISOString().slice(0, 7)
const numberValue = (value) => Number(value || 0)

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")
const formatNumber = (value, suffix = "") => `${Number(value || 0).toLocaleString("en-IN")}${suffix}`
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

const buildBulkDefaults = (config) => {
  const base = config.empty()

  return {
    values: Object.fromEntries(
      (config.bulkDefaults || []).map((item) => [item.key, base[item.key] ?? ""]),
    ),
    applied: Object.fromEntries((config.bulkDefaults || []).map((item) => [item.key, false])),
  }
}

export default function SimpleAuditRegisterPage({ config }) {
  const { user } = useAuth()
  const isManager = user?.role === "Manager"
  const { canUse } = useManagerDashboardSettings(config.pageKey, isManager)
  const canManagerUse = (key) => !isManager || canUse(key)

  const [entries, setEntries] = useState([])
  const [search, setSearch] = useState("")
  const [monthFilter, setMonthFilter] = useState(currentMonth())
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [actionChoiceOpen, setActionChoiceOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportFormat, setReportFormat] = useState("pdf")
  const [monthDeleteOpen, setMonthDeleteOpen] = useState(false)
  const [deleteMonthValue, setDeleteMonthValue] = useState(currentMonth())
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState(config.empty())
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmState, setConfirmState] = useState(null)
  const [openCard, setOpenCard] = useState(null)

  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkDefaults, setBulkDefaults] = useState(buildBulkDefaults(config))
  const [bulkRows, setBulkRows] = useState([config.empty()])
  const [bulkSaving, setBulkSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!notice.text) return undefined
    const timeout = window.setTimeout(() => setNotice({ type: "", text: "" }), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const load = async () => {
    const data = await config.api.list()
    setEntries(Array.isArray(data) ? data : [])
  }

  const hasDateRangeFilter = Boolean(fromDate || toDate)

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const matchesSearch = config.searchFields
          .map((key) => entry[key])
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
        const entryDate = entry.date ? String(entry.date).slice(0, 10) : ""
        const entryMonth = entryDate ? entryDate.slice(0, 7) : ""

        const matchesFromDate = !fromDate || (entryDate && entryDate >= fromDate)
        const matchesToDate = !toDate || (entryDate && entryDate <= toDate)
        const matchesMonth = hasDateRangeFilter || !monthFilter || entryMonth === monthFilter

        return matchesSearch && matchesMonth && matchesFromDate && matchesToDate
      }),
    [config.searchFields, entries, fromDate, hasDateRangeFilter, monthFilter, search, toDate],
  )

  const summary = config.summary(filteredEntries)

  const openCreate = () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add entries." })
      return
    }

    setEditData(null)
    setForm(config.empty())
    setModalOpen(true)
  }

  const openBulkCreate = () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add entries." })
      return
    }

    const defaults = buildBulkDefaults(config)
    setBulkDefaults(defaults)
    setBulkRows([
      { ...config.empty(), ...defaults.values },
      { ...config.empty(), ...defaults.values },
    ])
    setBulkOpen(true)
  }

  const updateBulkRow = (index, key, value) => {
    setBulkRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    )
  }

  const updateBulkDefault = (key, value) => {
    setBulkDefaults((current) => {
      const shouldApplyRows = !current.applied[key]
      const next = {
        values: { ...current.values, [key]: value },
        applied: { ...current.applied, [key]: true },
      }

      if (shouldApplyRows) {
        setBulkRows((rows) => rows.map((row) => ({ ...row, [key]: value })))
      }

      return next
    })
  }

  const addBulkRow = () =>
    setBulkRows((current) => [...current, { ...config.empty(), ...bulkDefaults.values }])

  const removeBulkRow = (index) => {
    setBulkRows((current) => (current.length > 1 ? current.filter((_, rowIndex) => rowIndex !== index) : current))
  }

  const saveBulk = async () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add entries." })
      return
    }

    const validRows = bulkRows.filter((row) => config.requiredFields.some((key) => String(row[key] || "").trim()))
    const hasMissing = validRows.some((row) => config.requiredFields.some((key) => !String(row[key] || "").trim()))

    if (!validRows.length || hasMissing) {
      setNotice({ type: "error", text: "Please complete required fields in every filled row." })
      return
    }

    setBulkSaving(true)

    try {
      await Promise.all(
        validRows.map((row) =>
          config.api.add({
            ...config.buildPayload(row),
            createdBy: user?.name || user?.role || "Admin",
          }),
        ),
      )
      setBulkOpen(false)
      setBulkDefaults(buildBulkDefaults(config))
      setBulkRows([config.empty()])
      await load()
      setNotice({ type: "success", text: `${validRows.length} ${config.title} entries saved successfully.` })
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to save multiple entries." })
    } finally {
      setBulkSaving(false)
    }
  }
  const openEdit = (entry) => {
    if (!canManagerUse("editEntry")) {
      setNotice({ type: "error", text: "You do not have access to edit entries." })
      return
    }

    setEditData(entry)
    setForm({ ...config.empty(), ...entry })
    setModalOpen(true)
  }

  const save = async () => {
    if (!canManagerUse(editData ? "editEntry" : "addEntry")) {
      setNotice({ type: "error", text: "You do not have access to save entries." })
      return
    }

    const missing = config.requiredFields.find((key) => !String(form[key] || "").trim())
    if (missing) {
      setNotice({ type: "error", text: "Please complete all required fields." })
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...config.buildPayload(form),
        createdBy: user?.name || user?.role || "Admin",
      }

      if (editData) {
        await config.api.update(editData._id, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: `${config.title} entry updated successfully.` })
      } else {
        await config.api.add(payload)
        setNotice({ type: "success", text: `${config.title} entry saved successfully.` })
      }

      setModalOpen(false)
      setEditData(null)
      setForm(config.empty())
      await load()
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to save entry." })
    } finally {
      setSaving(false)
    }
  }

  const askDelete = (entry) => {
    if (!canManagerUse("deleteEntry")) {
      setNotice({ type: "error", text: "You do not have access to delete entries." })
      return
    }

    setConfirmState({
      title: `Delete ${config.title} Entry`,
      description: `Delete entry dated ${formatDate(entry.date)}? This action cannot be undone.`,
      onConfirm: async () => {
        await config.api.remove(entry._id)
        await load()
        setNotice({ type: "success", text: `${config.title} entry deleted successfully.` })
      },
    })
  }

  const clearFilters = () => {
    setSearch("")
    setMonthFilter(currentMonth())
    setFromDate("")
    setToDate("")
  }

  const getReportValue = (entry, column) => {
    if (column.render) return String(column.render(entry) ?? "-")
    return String(entry[column.key] ?? "-")
  }

  const exportReport = () => {
    const fileBase = `${config.title.replace(/\s+/g, "_")}_Report`
    const headers = config.columns.map((column) => column.label)
    const rows = filteredEntries.map((entry) => config.columns.map((column) => getReportValue(entry, column)))

    if (reportFormat === "excel") {
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, config.title.slice(0, 28))
      XLSX.writeFile(workbook, `${fileBase}.xlsx`)
    } else {
      const doc = new jsPDF({ orientation: "landscape" })
      doc.setFontSize(16)
      doc.text(config.title, 14, 16)
      doc.setFontSize(10)
      doc.text(
        `Month: ${hasDateRangeFilter ? "All" : monthFilter || "All"}  From: ${fromDate || "All"}  To: ${toDate || "All"}  Records: ${filteredEntries.length}`,
        14,
        24,
      )
      autoTable(doc, {
        startY: 30,
        head: [headers],
        body: rows,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      })
      doc.save(`${fileBase}.pdf`)
    }

    setReportOpen(false)
  }

  const deleteSelectedMonth = async () => {
    if (!canManagerUse("deleteEntry")) {
      setNotice({ type: "error", text: "You do not have access to delete entries." })
      return
    }

    const targets = entries.filter((entry) => String(entry.date || "").slice(0, 7) === deleteMonthValue)
    if (!targets.length) {
      setNotice({ type: "error", text: "No entries found for selected month." })
      return
    }

    try {
      await Promise.all(targets.map((entry) => config.api.remove(entry._id)))
      setMonthDeleteOpen(false)
      await load()
      setNotice({ type: "success", text: `${targets.length} ${config.title} entries deleted successfully.` })
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to delete selected month." })
    }
  }

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden p-3 text-[color:var(--text-primary)] sm:p-5">
    
      <div className="mb-4 rounded-2xl border border-[var(--border-color)] bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Fuel Pump SVG */}
          <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.iconBg || "bg-emerald-50"}`}
        >
          {config.icon}
        </div>

          <div>

            <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-strong)]">
              {config.title}
            </h1>
            
          </div>
        </div>

        <div className="h-1 w-16 rounded-full bg-emerald-200"></div>
      </div>
    </div>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summary.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
  <input
    value={search}
    onChange={(event) => setSearch(event.target.value)}
    placeholder={config.searchPlaceholder}
    className="input w-full lg:max-w-[420px]"
  />

  <div className="hidden gap-3 lg:ml-auto lg:flex">
    {canManagerUse("addEntry") && (
      <button
        type="button"
        onClick={() => setActionChoiceOpen(true)}
        className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm"
      >
        + Add Entry
      </button>
    )}



    <button
      type="button"
      onClick={() => setReportOpen(true)}
      className="rounded-2xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-sm"
    >
      Generate Report
    </button>


    {canManagerUse("deleteEntry") && (
      <button
        type="button"
        onClick={() => {
          setDeleteMonthValue(monthFilter || currentMonth())
          setMonthDeleteOpen(true)
        }}
        className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-semibold text-red-500"
      >
        Delete Month
      </button>
    )}
  </div>
</div>

<div className="mb-5 rounded-3xl border border-[var(--border-color)] bg-white p-3 shadow-sm">
  <div className="grid gap-3 lg:grid-cols-[250px_210px_210px_auto]">
    <input
      type="month"
      value={monthFilter}
      onChange={(event) => setMonthFilter(event.target.value)}
      className="input"
    />

    <input
      type="date"
      value={fromDate}
      onChange={(event) => setFromDate(event.target.value)}
      className="input"
    />

    <input
      type="date"
      value={toDate}
      onChange={(event) => setToDate(event.target.value)}
      className="input"
    />

    <button
      type="button"
      onClick={clearFilters}
      className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)]"
    >
      Clear Filters
    </button>
  </div>
</div>

      <div className="hidden min-w-0 max-w-full overflow-x-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] sm:block">
        <table className="table min-w-[980px] text-sm">
          <thead>
            <tr>
              {config.columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th>Audit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry._id}>
                {config.columns.map((column) => (
                  <td key={column.key} className={column.className?.(entry) || ""}>
                    {column.render ? column.render(entry) : entry[column.key] || "-"}
                  </td>
                ))}
                <td className="text-left text-xs leading-5 text-[color:var(--text-secondary)]">
                  <div>Edited: {formatDateTime(entry.lastEditedAt)}</div>
                  <div>
                    By: {entry.lastEditedBy || "-"} {entry.lastEditedByRole ? `(${entry.lastEditedByRole})` : ""}
                  </div>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    {canManagerUse("editEntry") ? (
                      <button type="button" onClick={() => openEdit(entry)} className="text-blue-500">
                        Edit
                      </button>
                    ) : null}
                    {canManagerUse("deleteEntry") ? (
                      <button type="button" onClick={() => askDelete(entry)} className="text-red-500">
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

      <div className="space-y-4 sm:hidden">
        {filteredEntries.map((entry) => {
          const isOpen = openCard === entry._id
          return (
            <div
              key={entry._id}
              onClick={() => setOpenCard(isOpen ? null : entry._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[color:var(--text-secondary)]">{formatDate(entry.date)}</p>
                  <p className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">{config.mobileTitle(entry)}</p>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-500">
                  {config.mobileBadge(entry)}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {config.mobileFields.slice(0, 4).map((field) => (
                  <InfoBox key={field.key} label={field.label} value={field.render ? field.render(entry) : entry[field.key] || "-"} />
                ))}
              </div>

              {isOpen ? (
                <div className="mt-4 border-t border-[var(--border-color)] pt-3">
                  <InfoLine label="Last Edited" value={formatDateTime(entry.lastEditedAt)} />
                  <InfoLine label="Edited By" value={entry.lastEditedBy ? `${entry.lastEditedBy} (${entry.lastEditedByRole || "-"})` : "-"} />
                  <div className="mt-3 flex gap-2">
                    {canManagerUse("editEntry") ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          openEdit(entry)
                        }}
                        className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                      >
                        Edit
                      </button>
                    ) : null}
                    {canManagerUse("deleteEntry") ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          askDelete(entry)
                        }}
                        className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {actionChoiceOpen ? (
        <ActionChoiceModal
          title={`Add ${config.title} Entry`}
          onClose={() => setActionChoiceOpen(false)}
          onSingle={() => {
            setActionChoiceOpen(false)
            openCreate()
          }}
          onMultiple={() => {
            setActionChoiceOpen(false)
            openBulkCreate()
          }}
        />
      ) : null}

      {modalOpen ? (
        <EntryModal
          title={editData ? `Edit ${config.title} Entry` : `Add ${config.title} Entry`}
          fields={config.fields}
          form={form}
          setForm={setForm}
          onClose={() => setModalOpen(false)}
          onSave={save}
          saving={saving}
          preview={config.preview(form)}
        />
      ) : null}

      {bulkOpen ? (
        <BulkEntryModal
          title={`Add Multiple ${config.title} Entries`}
          fields={config.fields}
          bulkDefaultsConfig={config.bulkDefaults || []}
          bulkDefaults={bulkDefaults.values}
          updateBulkDefault={updateBulkDefault}
          rows={bulkRows}
          updateRow={updateBulkRow}
          addRow={addBulkRow}
          removeRow={removeBulkRow}
          onClose={() => {
            setBulkOpen(false)
            setBulkDefaults(buildBulkDefaults(config))
            setBulkRows([config.empty()])
          }}
          onSave={saveBulk}
          saving={bulkSaving}
        />
      ) : null}
      {confirmState ? (
        <ConfirmDialog
          title={confirmState.title}
          description={confirmState.description}
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            try {
              await confirmState.onConfirm()
            } catch (error) {
              setNotice({ type: "error", text: error?.response?.data?.message || "Unable to delete entry." })
            } finally {
              setConfirmState(null)
            }
          }}
        />
      ) : null}

      {reportOpen ? (
        <ReportModal
          title={`Generate ${config.title} Report`}
          format={reportFormat}
          setFormat={setReportFormat}
          count={filteredEntries.length}
          onClose={() => setReportOpen(false)}
          onDownload={exportReport}
        />
      ) : null}

      {monthDeleteOpen ? (
        <DeleteMonthModal
          title={`Delete ${config.title} Month`}
          value={deleteMonthValue}
          setValue={setDeleteMonthValue}
          onClose={() => setMonthDeleteOpen(false)}
          onDelete={deleteSelectedMonth}
        />
      ) : null}

      <MobileActionFab
        actions={[
          {
            label: "Generate Report",
            className: "bg-purple-600",
            onClick: () => setReportOpen(true),
          },
          canManagerUse("deleteEntry")
            ? {
                label: "Delete Month",
                className: "bg-red-600",
                onClick: () => {
                  setDeleteMonthValue(monthFilter || currentMonth())
                  setMonthDeleteOpen(true)
                },
              }
            : null,
          canManagerUse("addEntry")
            ? {
                label: "Add Entry",
                className: "bg-blue-600",
                onClick: () => setActionChoiceOpen(true),
              }
            : null,
        ].filter(Boolean)}
      />
    </div>
  )
}

export const helpers = { today, currentMonth, numberValue, formatDate, formatNumber }

function ActionChoiceModal({ title, onClose, onSingle, onMultiple }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 text-[color:var(--text-primary)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm leading-6 text-[color:var(--text-secondary)]">Choose how you want to add entries.</p>
        <div className="mt-5 grid gap-3">
          <button type="button" onClick={onSingle} className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">
            Single Entry
          </button>
          <button type="button" onClick={onMultiple} className="rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white">
            Multiple Entries
          </button>
          <button type="button" onClick={onClose} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function EntryModal({ title, fields, form, setForm, onClose, onSave, saving, preview }) {
  const update = (key, value) => setForm({ ...form, [key]: value })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 text-[color:var(--text-primary)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) =>
            field.type === "select" ? (
              <select
                key={field.key}
                value={form[field.key] ?? ""}
                onChange={(event) => update(field.key, event.target.value)}
                className={field.full ? "input sm:col-span-2" : "input"}
              >
                <option value="">{field.label}</option>
                {(field.options || []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                key={field.key}
                type={field.type || "text"}
                value={form[field.key] ?? ""}
                placeholder={field.label}
                onChange={(event) => update(field.key, event.target.value)}
                className={field.full ? "input sm:col-span-2" : "input"}
              />
            ),
          )}
        </div>

        {preview ? (
          <div className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
            <p className="text-sm text-[color:var(--text-secondary)]">{preview.label}</p>
            <p className={`mt-2 text-2xl font-bold ${preview.className}`}>{preview.value}</p>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2">
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

function BulkEntryModal({
  title,
  fields,
  bulkDefaultsConfig = [],
  bulkDefaults = {},
  updateBulkDefault,
  rows,
  updateRow,
  addRow,
  removeRow,
  onClose,
  onSave,
  saving,
}) {
  const visibleFields = fields.filter((field) => !field.bulkHidden)
  const defaultFields = bulkDefaultsConfig
    .map((item) => fields.find((field) => field.key === item.key))
    .filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 text-[color:var(--text-primary)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Fill multiple rows and save them together.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2">
            <X size={16} />
          </button>
        </div>

        {defaultFields.length ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {defaultFields.map((field) =>
              field.type === "select" ? (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                    Default {field.label}
                  </span>
                  <select
                    value={bulkDefaults[field.key] ?? ""}
                    onChange={(event) => updateBulkDefault(field.key, event.target.value)}
                    className="input"
                  >
                    <option value="">{field.label}</option>
                    {(field.options || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                    Default {field.label}
                  </span>
                  <input
                    type={field.type || "text"}
                    value={bulkDefaults[field.key] ?? ""}
                    placeholder={field.label}
                    onChange={(event) => updateBulkDefault(field.key, event.target.value)}
                    className="input"
                  />
                </label>
              ),
            )}
          </div>
        ) : null}

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div key={index} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-semibold text-[color:var(--text-strong)]">Entry {index + 1}</p>
                <button type="button" onClick={() => removeRow(index)} className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm text-red-500">
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleFields.map((field) =>
                  field.type === "select" ? (
                    <select
                      key={field.key}
                      value={row[field.key] ?? ""}
                      onChange={(event) => updateRow(index, field.key, event.target.value)}
                      className={field.full ? "input lg:col-span-3" : "input"}
                    >
                      <option value="">{field.label}</option>
                      {(field.options || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      key={field.key}
                      type={field.type || "text"}
                      value={row[field.key] ?? ""}
                      placeholder={field.label}
                      onChange={(event) => updateRow(index, field.key, event.target.value)}
                      className={field.full ? "input lg:col-span-3" : "input"}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button type="button" onClick={addRow} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-medium text-emerald-600">
            + Add Row
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2">
              Cancel
            </button>
            <button type="button" onClick={onSave} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
function ReportModal({ title, format, setFormat, count, onClose, onDownload }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 text-[color:var(--text-primary)]">
        <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{count} records will be exported.</p>
        <select value={format} onChange={(event) => setFormat(event.target.value)} className="input mt-4 w-full">
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
        </select>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2">
            Cancel
          </button>
          <button type="button" onClick={onDownload} className="rounded-xl bg-purple-600 px-4 py-2 text-white">
            Download
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteMonthModal({ title, value, setValue, onClose, onDelete }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 text-[color:var(--text-primary)]">
        <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">Select a month to permanently delete all entries from that month.</p>
        <input type="month" value={value} onChange={(event) => setValue(event.target.value)} className="input mt-4 w-full" />
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2">
            Cancel
          </button>
          <button type="button" onClick={onDelete} className="rounded-xl bg-red-600 px-4 py-2 text-white">
            Delete Month
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, tone = "blue" }) {
  const tones = {
    blue: "border-blue-200/70 bg-blue-50/80 text-blue-600",
    green: "border-green-200/70 bg-green-50/80 text-green-600",
    rose: "border-rose-200/70 bg-rose-50/80 text-rose-600",
    amber: "border-amber-200/70 bg-amber-50/80 text-amber-600",
    violet: "border-violet-200/70 bg-violet-50/80 text-violet-600",
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_12px_24px_rgba(16,24,20,0.05)] ${tones[tone] || tones.blue}`}>
      <p className="font-semibold tracking-[0.18em] text-[color:var(--text-secondary)] text-[13px]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
      <p className="text-xs text-[color:var(--text-secondary)]">{label}</p>
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
    <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${notice.type === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"}`}>
      {notice.text}
    </div>
  )
}

function ConfirmDialog({ title, description, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2 text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}


