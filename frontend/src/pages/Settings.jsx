import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../services/settingsApi";

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
};

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  // Track password visibility for each role
  const [showPasswords, setShowPasswords] = useState({
    admin: false,
    manager: false,
    employee: false,
  });

  const loadSettings = async () => {
    const data = await getSettings();
    if (!data) return;
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
    });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateField = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updatePassword = (key, value) => {
    setSettings((current) => ({
      ...current,
      loginPasswords: { ...current.loginPasswords, [key]: value },
    }));
  };

  const togglePasswordVisibility = (role) => {
    setShowPasswords((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const addContact = () => {
    if (!name.trim() || !phone.trim()) return;
    setSettings((current) => ({
      ...current,
      contacts: [...current.contacts, { name: name.trim(), phone: phone.trim() }],
    }));
    setName("");
    setPhone("");
  };

  const deleteContact = (index) => {
    setSettings((current) => ({
      ...current,
      contacts: current.contacts.filter((_, i) => i !== index),
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      window.alert("Settings saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-5 p-4 text-[color:var(--text-primary)] sm:p-6">
      {/* Header */}
      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Station Settings</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Station details, contact numbers, and dashboard login passwords will be managed from here.
        </p>
      </section>

      {/* Station Information */}
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

      {/* Dashboard Passwords with show/hide toggle */}
      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Dashboard Passwords</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            Admin yahin se admin, manager, aur employee login passwords change kar sakta hai.
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <PasswordField
            label="Admin Password"
            value={settings.loginPasswords.admin}
            show={showPasswords.admin}
            onToggle={() => togglePasswordVisibility("admin")}
            onChange={(value) => updatePassword("admin", value)}
          />
          <PasswordField
            label="Manager Password"
            value={settings.loginPasswords.manager}
            show={showPasswords.manager}
            onToggle={() => togglePasswordVisibility("manager")}
            onChange={(value) => updatePassword("manager", value)}
          />
          <PasswordField
            label="Employee Master Password"
            value={settings.loginPasswords.employee}
            show={showPasswords.employee}
            onToggle={() => togglePasswordVisibility("employee")}
            onChange={(value) => updatePassword("employee", value)}
          />
        </div>
      </section>

      {/* Contact Numbers – table on desktop, cards on mobile */}
      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">Contact Numbers</h2>

        {/* Desktop Table */}
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

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden mt-4">
          {settings.contacts.map((contact, index) => (
            <div
              key={`${contact.phone}-${index}`}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 flex justify-between items-center"
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
          {settings.contacts.length === 0 && (
            <p className="text-center text-[color:var(--text-secondary)] py-4">No contacts added yet.</p>
          )}
        </div>

        {/* Add Contact Form */}
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

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn btn-purple w-full sm:w-auto">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// Regular text input field
function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input"
      />
    </label>
  );
}

// Password input with eye toggle
function PasswordField({ label, value, show, onToggle, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)]"
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m-3.65 3.65l-3.65 3.65" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}