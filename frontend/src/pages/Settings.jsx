import { useEffect, useState } from "react"
import { getSettings, updateSettings } from "../services/settingsApi"

const defaultSettings = {
  companyName: "",
  stationName: "",
  gstNumber: "",
  address: "",
  contacts: [],
  loginPasswords: {
    admin: "123",
    manager: "456",
    employee: "789",
  },
}

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)

  const loadSettings = async () => {
    const data = await getSettings()

    if (!data) {
      return
    }

    setSettings({
      companyName: data.companyName || "",
      stationName: data.stationName || "",
      gstNumber: data.gstNumber || "",
      address: data.address || "",
      contacts: data.contacts || [],
      loginPasswords: {
        ...defaultSettings.loginPasswords,
        ...(data.loginPasswords || {}),
      },
    })
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const updateField = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const updatePassword = (key, value) => {
    setSettings((current) => ({
      ...current,
      loginPasswords: {
        ...current.loginPasswords,
        [key]: value,
      },
    }))
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
      contacts: current.contacts.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const save = async () => {
    setSaving(true)

    try {
      await updateSettings(settings)
      window.alert("Settings saved")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-5 p-4 text-[color:var(--text-primary)] sm:p-6">
      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Station Settings</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Station details, contact numbers, aur dashboard login passwords yahin se manage honge.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Station Information</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="Company Name"
            value={settings.companyName}
            onChange={(value) => updateField("companyName", value)}
          />
          <Field
            label="Station Name"
            value={settings.stationName}
            onChange={(value) => updateField("stationName", value)}
          />
          <Field
            label="GST Number"
            value={settings.gstNumber}
            onChange={(value) => updateField("gstNumber", value)}
          />
          <Field
            label="Address"
            value={settings.address}
            onChange={(value) => updateField("address", value)}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Dashboard Passwords</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              Admin yahin se admin, manager, aur employee login passwords change kar sakta hai.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field
            label="Admin Password"
            value={settings.loginPasswords.admin}
            type="password"
            onChange={(value) => updatePassword("admin", value)}
          />
          <Field
            label="Manager Password"
            value={settings.loginPasswords.manager}
            type="password"
            onChange={(value) => updatePassword("manager", value)}
          />
          <Field
            label="Employee Master Password"
            value={settings.loginPasswords.employee}
            type="password"
            onChange={(value) => updatePassword("employee", value)}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Contact Numbers</h2>

        <div className="mt-5 overflow-x-auto">
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
                    <button
                      onClick={() => deleteContact(index)}
                      className="text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <input
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="input"
          />
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
    </div>
  )
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input"
      />
    </label>
  )
}
