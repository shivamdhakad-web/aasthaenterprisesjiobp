import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import MobileActionFab from "../../components/MobileActionFab"
import { useAuth } from "../../contexts/AuthContext"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"

const today = () => new Date().toISOString().slice(0, 10)
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

export default function SimpleAuditRegisterPage({ config }) {
  const { user } = useAuth()
  const isManager = user?.role === "Manager"
  const { canUse } = useManagerDashboardSettings(config.pageKey, isManager)
  const canManagerUse = (key) => !isManager || canUse(key)

  const [entries, setEntries] = useState([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState(config.empty())
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmState, setConfirmState] = useState(null)
  const [openCard, setOpenCard] = useState(null)

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

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) =>
        config.searchFields
          .map((key) => entry[key])
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [config.searchFields, entries, search],
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

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden p-3 text-[color:var(--text-primary)] sm:p-5">
      <section className="mb-4 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_14px_28px_rgba(16,24,20,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">{config.kicker}</p>
        <h1 className="mt-2 text-2xl font-bold text-[color:var(--text-strong)] sm:text-3xl">{config.title}</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{config.description}</p>
      </section>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
        {summary.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={config.searchPlaceholder}
          className="input w-full sm:max-w-[460px]"
        />
        {canManagerUse("addEntry") ? (
          <button
            type="button"
            onClick={openCreate}
            className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm sm:inline-flex"
          >
            + Add Entry
          </button>
        ) : null}
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

      <MobileActionFab
        actions={[
          canManagerUse("addEntry")
            ? {
                label: "Add Entry",
                className: "bg-blue-600",
                onClick: openCreate,
              }
            : null,
        ].filter(Boolean)}
      />
    </div>
  )
}

export const helpers = { today, numberValue, formatDate, formatNumber }

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
          {fields.map((field) => (
            <input
              key={field.key}
              type={field.type || "text"}
              value={form[field.key] ?? ""}
              placeholder={field.label}
              onChange={(event) => update(field.key, event.target.value)}
              className={field.full ? "input sm:col-span-2" : "input"}
            />
          ))}
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

function SummaryCard({ label, value, tone = "blue" }) {
  const tones = {
    blue: "border-blue-200/70 bg-blue-50/80 text-blue-600",
    green: "border-green-200/70 bg-green-50/80 text-green-600",
    rose: "border-rose-200/70 bg-rose-50/80 text-rose-600",
    amber: "border-amber-200/70 bg-amber-50/80 text-amber-600",
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_12px_24px_rgba(16,24,20,0.05)] ${tones[tone] || tones.blue}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">{label}</p>
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
