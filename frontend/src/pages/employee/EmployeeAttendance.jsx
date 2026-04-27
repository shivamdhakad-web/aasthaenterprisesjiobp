import { useEffect, useState } from "react"
import MobileActionFab from "../../components/MobileActionFab"
import {
  addMyAttendance,
  getMyAttendance,
  updateMyAttendance,
} from "../../services/employeeSelfApi"

const initialForm = {
  date: new Date().toISOString().slice(0, 10),
  status: "present",
  remark: "",
}

export default function EmployeeAttendance() {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editing, setEditing] = useState(null)
  const [showMobileForm, setShowMobileForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  const load = async () => {
    const data = await getMyAttendance()
    setEntries(data)
  }

  useEffect(() => {
    load()
  }, [])

  const openForm = (entry = null) => {
    if (entry) {
      setEditing(entry)
      setForm({
        date: new Date(entry.date).toISOString().slice(0, 10),
        status: entry.status,
        remark: entry.remark || "",
      })
    } else {
      setEditing(null)
      setForm(initialForm)
    }

    setShowMobileForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const submit = async () => {
    if (editing && !editing.canEdit) return

    if (editing) {
      await updateMyAttendance(editing._id, form)
      setSuccessMessage("Updated Successfully")
      setShowSuccessPopup(true)
    } else {
      await addMyAttendance(form)
      setSuccessMessage("Submitted Successfully")
      setShowSuccessPopup(true)
    }

    setForm(initialForm)
    setEditing(null)
    setShowMobileForm(false)
    load()
  }

  const readOnlyMode = Boolean(editing && !editing.canEdit)

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div
        className={`rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 sm:p-5 ${
          showMobileForm || editing ? "block" : "hidden sm:block"
        }`}
      >
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">My Attendance</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Current month ke entries yahin se mark ya update kar sakte ho.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <input
            type="date"
            value={form.date}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="input"
          />
          <select
            value={form.status}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            className="input"
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="double">Double Shift</option>
            <option value="half">Half Shift</option>
          </select>
          <input
            value={form.remark}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, remark: event.target.value })}
            placeholder="Remark"
            className="input"
          />
          <button
            onClick={submit}
            disabled={readOnlyMode}
            className="btn btn-green w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editing ? (readOnlyMode ? "View Only" : "Update Entry") : "Save Entry"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Remark</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="capitalize">{entry.status}</td>
                  <td>{entry.remark || "-"}</td>
                  <td>
                    <button onClick={() => openForm(entry)} className="text-blue-500">
                      {entry.canEdit ? "Edit" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {entries.map((entry) => (
            <div
              key={entry._id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
            >
              <p className="text-sm text-[color:var(--text-secondary)]">
                {new Date(entry.date).toLocaleDateString()}
              </p>
              <p className="mt-2 text-lg font-medium capitalize text-[color:var(--text-strong)]">
                {entry.status}
              </p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                {entry.remark || "No remark"}
              </p>
              <button
                onClick={() => openForm(entry)}
                className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-500"
              >
                {entry.canEdit ? "Edit entry" : "View entry"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <MobileActionFab
        actions={[
          {
            label: "New Entry",
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
