import { useEffect, useMemo, useState } from "react"

const getTodayString = () => new Date().toISOString().slice(0, 10)

const buildEmptyRow = (employeeId = "") => ({
  employeeId,
  date: getTodayString(),
  status: "present",
  shortage: "",
  advanceCash: "",
  advancePetrol: "",
  remark: "",
})

const buildEmptyForm = (employeeId = "") => ({
  employeeId,
  ...buildEmptyRow(),
})

const buildMultipleState = (employeeId = "") => ({
  employeeId,
  entries: [buildEmptyRow(employeeId), buildEmptyRow(employeeId)],
})

export default function AttendanceModal({
  open,
  onClose,
  onSave,
  editData,
  employees = [],
  selectedEmployeeId = "",
  showEmployeeSelector = false,
  saving = false,
  entryMode = "single",
}) {
  const initialSingleForm = useMemo(() => {
    if (editData) {
      return {
        employeeId: selectedEmployeeId,
        date: editData.date ? String(editData.date).slice(0, 10) : getTodayString(),
        status: editData.status || "present",
        shortage: editData.shortage ?? "",
        advanceCash: editData.advanceCash ?? "",
        advancePetrol: editData.advancePetrol ?? "",
        remark: editData.remark ?? "",
      }
    }

    return buildEmptyForm(selectedEmployeeId)
  }, [editData, selectedEmployeeId])

  const [form, setForm] = useState(initialSingleForm)
  const [bulkState, setBulkState] = useState(buildMultipleState(selectedEmployeeId))

  useEffect(() => {
    setForm(initialSingleForm)
  }, [initialSingleForm])

  useEffect(() => {
    setBulkState(buildMultipleState(selectedEmployeeId))
  }, [selectedEmployeeId, entryMode, open])

  if (!open) {
    return null
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleBulkRootChange = (event) => {
    const { name, value } = event.target
    setBulkState((current) => ({ ...current, [name]: value }))
  }

  const updateBulkRow = (index, name, value) => {
    setBulkState((current) => ({
      ...current,
      entries: current.entries.map((entry, rowIndex) =>
        rowIndex === index ? { ...entry, [name]: value } : entry,
      ),
    }))
  }

  const addBulkRow = () => {
    setBulkState((current) => ({
      ...current,
      entries: [...current.entries, buildEmptyRow(current.employeeId)],
    }))
  }

  const removeBulkRow = (index) => {
    setBulkState((current) => ({
      ...current,
      entries: current.entries.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  const saveLabel = saving ? "Saving..." : entryMode === "multiple" && !editData ? "Save Entries" : "Save"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_24px_48px_rgba(15,23,42,0.24)] sm:p-6">
        <h2 className="text-lg font-semibold text-[color:var(--text-strong)] sm:text-xl">
          {editData
            ? "Edit Attendance Entry"
            : entryMode === "multiple"
              ? "Add Multiple Attendance Entries"
              : "Add Attendance Entry"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          Current date is filled by default. Use multiple mode to add several attendance records in one save.
        </p>

        {entryMode === "multiple" && !editData ? (
          <div className="mt-5 space-y-4">
            {showEmployeeSelector ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                  Default Employee
                </span>
                <select
                  name="employeeId"
                  value={bulkState.employeeId}
                  onChange={(event) => {
                    handleBulkRootChange(event)
                    setBulkState((current) => ({
                      ...current,
                      employeeId: event.target.value,
                      entries: current.entries.map((entry) => ({
                        ...entry,
                        employeeId: entry.employeeId || event.target.value,
                      })),
                    }))
                  }}
                  className="input"
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
              {bulkState.entries.map((entry, index) => (
                <div
                  key={`attendance-row-${index}`}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                      Entry {index + 1}
                    </p>
                    {bulkState.entries.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeBulkRow(index)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {showEmployeeSelector ? (
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                          Employee
                        </span>
                        <select
                          value={entry.employeeId || bulkState.employeeId}
                          onChange={(event) => updateBulkRow(index, "employeeId", event.target.value)}
                          className="input"
                        >
                          <option value="">Select employee</option>
                          {employees.map((employee) => (
                            <option key={employee._id} value={employee._id}>
                              {employee.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                        Date
                      </span>
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(event) => updateBulkRow(index, "date", event.target.value)}
                        className="input"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                        Status
                      </span>
                      <select
                        value={entry.status}
                        onChange={(event) => updateBulkRow(index, "status", event.target.value)}
                        className="input"
                      >
                        <option value="present">Present</option>
                        <option value="half">Half Shift</option>
                        <option value="absent">Absent</option>
                        <option value="double">Double Shift</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                        Shortage (+ / -)
                      </span>
                      <input
                        type="number"
                        value={entry.shortage}
                        onChange={(event) => updateBulkRow(index, "shortage", event.target.value)}
                        placeholder="0"
                        className="input"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                        Advance Cash
                      </span>
                      <input
                        type="number"
                        value={entry.advanceCash}
                        onChange={(event) => updateBulkRow(index, "advanceCash", event.target.value)}
                        placeholder="0"
                        className="input"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                        Advance Petrol
                      </span>
                      <input
                        type="number"
                        value={entry.advancePetrol}
                        onChange={(event) => updateBulkRow(index, "advancePetrol", event.target.value)}
                        placeholder="0"
                        className="input"
                      />
                    </label>

                    <label className="block sm:col-span-2 xl:col-span-3">
                      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                        Remark
                      </span>
                      <input
                        value={entry.remark}
                        onChange={(event) => updateBulkRow(index, "remark", event.target.value)}
                        placeholder="Remark"
                        className="input"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addBulkRow}
              className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-600"
            >
              + Add Another Row
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {showEmployeeSelector ? (
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                  Employee
                </span>
                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                Date
              </span>
              <input type="date" name="date" value={form.date} onChange={handleChange} className="input" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                Status
              </span>
              <select name="status" value={form.status} onChange={handleChange} className="input">
                <option value="present">Present</option>
                <option value="half">Half Shift</option>
                <option value="absent">Absent</option>
                <option value="double">Double Shift</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                Shortage (+ / -)
              </span>
              <input type="number" name="shortage" placeholder="0" value={form.shortage} onChange={handleChange} className="input" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                Advance Cash
              </span>
              <input type="number" name="advanceCash" placeholder="0" value={form.advanceCash} onChange={handleChange} className="input" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                Advance Petrol
              </span>
              <input type="number" name="advancePetrol" placeholder="0" value={form.advancePetrol} onChange={handleChange} className="input" />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                Remark
              </span>
              <input name="remark" placeholder="Remark" value={form.remark} onChange={handleChange} className="input" />
            </label>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-2xl bg-green-600 px-4 py-3 font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() =>
              onSave(
                entryMode === "multiple" && !editData
                  ? { mode: "multiple", employeeId: bulkState.employeeId, entries: bulkState.entries }
                  : { mode: "single", ...form },
              )
            }
            disabled={saving}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
