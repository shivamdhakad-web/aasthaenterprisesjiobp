import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { addNote, updateNote } from "../services/secureNoteApi"

const initialForm = {
  title: "",
  website: "",
  username: "",
  password: "",
  note: "",
  color: "",
}

const colors = [
  "bg-yellow-200",
  "bg-green-200",
  "bg-blue-200",
  "bg-purple-300",
  "bg-pink-300",
  "bg-orange-200",
]

export default function SecureNoteModal({ open, onClose, onSave, editData }) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || "",
        website: editData.website || "",
        username: editData.username || "",
        password: editData.password || "",
        note: editData.note || "",
        color: editData.color || "",
      })
      return
    }

    setForm(initialForm)
  }, [editData, open])

  if (!open) {
    return null
  }

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      window.alert("Title required hai")
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...form,
        color: editData?.color || form.color || colors[Math.floor(Math.random() * colors.length)],
      }

      if (editData) {
        await updateNote(editData._id, payload)
      } else {
        await addNote(payload)
      }

      await onSave?.()
      onClose?.()
      setForm(initialForm)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--text-secondary)]">
                Secure Vault
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--text-strong)]">
                {editData ? "Edit Secure Note" : "Add Secure Note"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3 text-[color:var(--text-secondary)]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[calc(100vh-170px)] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                className="input"
              />
              <input
                name="website"
                placeholder="Website"
                value={form.website}
                onChange={handleChange}
                className="input"
              />
              <input
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                className="input"
              />
              <input
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="input"
              />
            </div>

            <textarea
              name="note"
              placeholder="Private note"
              value={form.note}
              onChange={handleChange}
              rows={6}
              className="input mt-3"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-color)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 text-sm font-medium text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-green w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : editData ? "Update Note" : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
