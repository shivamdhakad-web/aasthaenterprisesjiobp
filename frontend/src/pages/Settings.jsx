import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  changeDashboardPassword,
  getSettings,
  updateSettings,
} from "../services/settingsApi"

const defaultSettings = {
  companyName: "",
  stationName: "",
  gstNumber: "",
  address: "",
  contacts: [],
}

const defaultPasswordForm = {
  role: "admin",
  unlockPassword: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

const passwordRoles = [
  {
    key: "admin",
    label: "Admin Password",
    description: "Admin login password change karne ke liye master unlock password, current password, aur naya password dena zaroori hoga.",
  },
  {
    key: "manager",
    label: "Manager Password",
    description: "Manager dashboard ka main login password bhi isi secure flow se update hoga.",
  },
  {
    key: "employee",
    label: "Employee Master Password",
    description: "Employee master login password ko update karne ke baad saare active sessions logout ho jayenge.",
  },
]

export default function Settings() {
  const { user, logout } = useAuth()
  const [settings, setSettings] = useState(defaultSettings)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm)

  const isAdmin = user?.role === "Admin"

  const loadSettings = async () => {
    const data = await getSettings()
    if (!data) return

    setSettings({
      companyName: data.companyName || "",
      stationName: data.stationName || "",
      gstNumber: data.gstNumber || "",
      address: data.address || "",
      contacts: Array.isArray(data.contacts) ? data.contacts : [],
    })
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const updateField = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const addContact = () => {
    if (!name.trim() || !phone.trim()) {
      return
    }

    setSettings((current) => ({
      ...current,
      contacts: [...current.contacts, { name: name.trim(), phone: phone.trim() }],
    }))
    setName("")
    setPhone("")
  }

  const deleteContact = (index) => {
    setSettings((current) => ({
      ...current,
      contacts: current.contacts.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const response = await updateSettings(settings)
      window.alert(response?.message || "Settings saved")
      await loadSettings()
    } catch (error) {
      window.alert(error?.response?.data?.message || "Settings save nahi ho paye")
    } finally {
      setSaving(false)
    }
  }

  const openPasswordModal = (role) => {
    setPasswordForm({
      ...defaultPasswordForm,
      role,
    })
    setPasswordModalOpen(true)
  }

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    setPasswordForm(defaultPasswordForm)
  }

  const submitPasswordChange = async () => {
    if (!passwordForm.unlockPassword.trim()) {
      window.alert("Master unlock password required hai")
      return
    }

    if (!passwordForm.currentPassword.trim()) {
      window.alert("Current password required hai")
      return
    }

    if (!passwordForm.newPassword.trim()) {
      window.alert("New password required hai")
      return
    }

    if (passwordForm.newPassword.trim() !== passwordForm.confirmPassword.trim()) {
      window.alert("New password aur confirm password match nahi kar rahe")
      return
    }

    setPasswordSaving(true)
    try {
      const response = await changeDashboardPassword({
        role: passwordForm.role,
        unlockPassword: passwordForm.unlockPassword,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      window.alert(response?.message || "Password updated successfully")
      closePasswordModal()
      logout()

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    } catch (error) {
      window.alert(error?.response?.data?.message || "Password change nahi ho paya")
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-5 p-4 text-[color:var(--text-primary)] sm:p-6">
      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Station Settings</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Station details, contacts, aur secure dashboard controls yahin se manage honge.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Station Information</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Company Name" value={settings.companyName} onChange={(value) => updateField("companyName", value)} />
          <Field label="Station Name" value={settings.stationName} onChange={(value) => updateField("stationName", value)} />
          <Field label="GST Number" value={settings.gstNumber} onChange={(value) => updateField("gstNumber", value)} />
          <Field label="Address" value={settings.address} onChange={(value) => updateField("address", value)} />
        </div>
      </section>

      {isAdmin ? (
        <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Dashboard Passwords</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              Yahan se admin, manager, aur employee dashboard passwords change honge. Save hote hi saare devices logout ho jayenge, aur session waise bhi 5 din me auto-expire hoga.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {passwordRoles.map((role) => (
              <div
                key={role.key}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 shadow-[0_12px_24px_rgba(16,24,20,0.05)]"
              >
                <p className="text-sm font-semibold text-[color:var(--text-strong)]">{role.label}</p>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-[color:var(--text-secondary)]">
                  {role.description}
                </p>
                
                <button
                  type="button"
                  onClick={() => openPasswordModal(role.key)}
                  className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm"
                >
                  Change Password
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Contact Numbers</h2>

        <div className="hidden overflow-x-auto md:block">
          <table className="table min-w-[520px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {settings.contacts.map((contact, index) => (
                <tr key={`${contact.phone}-${index}`}>
                  <td>{contact.name}</td>
                  <td>{contact.phone}</td>
                  <td>
                    <button onClick={() => deleteContact(index)} className="text-red-500 hover:text-red-400">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {settings.contacts.map((contact, index) => (
            <div
              key={`${contact.phone}-${index}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
            >
              <div>
                <p className="text-base font-semibold text-[color:var(--text-strong)]">{contact.name}</p>
                <p className="text-sm text-[color:var(--text-secondary)]">{contact.phone}</p>
              </div>
              <button
                onClick={() => deleteContact(index)}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-500"
              >
                Delete
              </button>
            </div>
          ))}
          {settings.contacts.length === 0 ? (
            <p className="py-4 text-center text-[color:var(--text-secondary)]">No contacts added yet.</p>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} className="input" />
          <input placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} className="input" />
          <button onClick={addContact} className="btn btn-green w-full md:w-auto">
            Add Contact
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn btn-purple w-full sm:w-auto">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {passwordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_24px_48px_rgba(16,24,20,0.16)]">
            <h3 className="text-xl font-semibold text-[color:var(--text-strong)]">
              Change {passwordRoles.find((role) => role.key === passwordForm.role)?.label}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              Pehle master unlock password do, phir current password, phir new password. Save ke baad saare devices aur active logins logout ho jayenge.
            </p>

            <div className="mt-5 grid gap-4">
              <PasswordInput
                label="JioBP Master Unlock Password"
                value={passwordForm.unlockPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, unlockPassword: value }))}
              />
              <PasswordInput
                label="Current Password"
                value={passwordForm.currentPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
              />
              <PasswordInput
                label="New Password"
                value={passwordForm.newPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
              />
              <PasswordInput
                label="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPasswordChange}
                disabled={passwordSaving}
                className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordSaving ? "Saving..." : "Save Password"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="input" />
    </label>
  )
}

function PasswordInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">{label}</span>
      <input type="password" value={value} onChange={(event) => onChange(event.target.value)} className="input" />
    </label>
  )
}
