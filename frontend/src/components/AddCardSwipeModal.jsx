import { Plus, X } from "lucide-react"
import { useEffect, useState } from "react"

import { addEntry, updateEntry } from "../services/cardSwipeApi"

const getToday = () => new Date().toISOString().slice(0, 10)

const defaultForm = (machineOptions = [], paymentMethodOptions = []) => ({
  date: getToday(),
  time: "",
  amount: "",
  charges: "",
  paymentMethod: paymentMethodOptions[0] || "Online",
  txnDetails: "",
  machine: machineOptions[0] || "Self",
  remark: "",
})

export default function AddCardSwipeModal({
  open,
  onClose,
  onSave,
  editData,
  machineOptions = ["Self", "DSM"],
  paymentMethodOptions = ["Online", "Cash"],
  currentUser,
}) {
  const [form, setForm] = useState(defaultForm(machineOptions, paymentMethodOptions))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [optionBuilder, setOptionBuilder] = useState({ field: "", value: "" })
  const [localMachineOptions, setLocalMachineOptions] = useState(machineOptions)
  const [localPaymentOptions, setLocalPaymentOptions] = useState(paymentMethodOptions)

  useEffect(() => {
    if (!open) {
      return
    }

    setError("")
    setOptionBuilder({ field: "", value: "" })
    setLocalMachineOptions(machineOptions)
    setLocalPaymentOptions(paymentMethodOptions)

    if (editData) {
      setForm({
        date: editData.date?.split("T")[0] || getToday(),
        time: editData.time || "",
        amount: String(editData.amount ?? ""),
        charges: String(editData.charges ?? ""),
        paymentMethod: editData.paymentMethod || paymentMethodOptions[0] || "Online",
        txnDetails: editData.txnDetails || "",
        machine: editData.machine || machineOptions[0] || "Self",
        remark: editData.remark || "",
      })
      return
    }

    setForm(defaultForm(machineOptions, paymentMethodOptions))
  }, [editData, machineOptions, open, paymentMethodOptions])

  if (!open) {
    return null
  }

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addCustomOption = (field) => {
    const value = optionBuilder.value.trim()

    if (!value) {
      setError("Please enter a value before adding it.")
      return
    }

    if (field === "machine") {
      setLocalMachineOptions((current) => [...new Set([...current, value])])
      setField("machine", value)
    }

    if (field === "paymentMethod") {
      setLocalPaymentOptions((current) => [...new Set([...current, value])])
      setField("paymentMethod", value)
    }

    setOptionBuilder({ field: "", value: "" })
    setError("")
  }

  const handleSave = async () => {
    if (!form.date || !form.amount || !form.charges || !form.machine || !form.paymentMethod) {
      setError("Date, amount, charges, machine, and payment method are required.")
      return
    }

    setSaving(true)
    setError("")

    try {
      const payload = {
        ...form,
        time: form.time || "",
        amount: Number(form.amount || 0),
        charges: Number(form.charges || 0),
      }

      if (editData?._id) {
        await updateEntry(editData._id, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: currentUser?.name || "Admin",
          lastEditedByRole: currentUser?.role || "Admin",
        })
      } else {
        await addEntry(payload)
      }

      await onSave?.()
      onClose?.()
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save card swipe entry.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 text-[color:var(--text-primary)] shadow-[0_24px_70px_rgba(15,23,42,0.35)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">
            {editData ? "Edit Card Swipe" : "Add Card Swipe"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2 text-[color:var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        {error ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3">
          <input
            type="date"
            value={form.date}
            onChange={(event) => setField("date", event.target.value)}
            className="input"
          />

          <input
            type="time"
            value={form.time}
            onChange={(event) => setField("time", event.target.value)}
            className="input"
          />

          <input
            placeholder="Amount"
            value={form.amount}
            onChange={(event) => setField("amount", event.target.value)}
            className="input"
          />

          <input
            placeholder="Charges"
            value={form.charges}
            onChange={(event) => setField("charges", event.target.value)}
            className="input"
          />

          <InlineOptionSelect
            label="Payment Method"
            field="paymentMethod"
            value={form.paymentMethod}
            options={localPaymentOptions}
            optionBuilder={optionBuilder}
            setOptionBuilder={setOptionBuilder}
            onChange={(value) => setField("paymentMethod", value)}
            onAdd={() => addCustomOption("paymentMethod")}
          />

          <input
            placeholder="Transaction Details"
            value={form.txnDetails}
            onChange={(event) => setField("txnDetails", event.target.value)}
            className="input"
          />

          <InlineOptionSelect
            label="Machine"
            field="machine"
            value={form.machine}
            options={localMachineOptions}
            optionBuilder={optionBuilder}
            setOptionBuilder={setOptionBuilder}
            onChange={(value) => setField("machine", value)}
            onAdd={() => addCustomOption("machine")}
          />

          <input
            placeholder="Remark"
            value={form.remark}
            onChange={(event) => setField("remark", event.target.value)}
            className="input"
          />
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
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

function InlineOptionSelect({
  label,
  field,
  value,
  options,
  onChange,
  optionBuilder,
  setOptionBuilder,
  onAdd,
}) {
  const isActive = optionBuilder.field === field

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="input flex-1">
          {options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() =>
            setOptionBuilder((current) => ({
              field: current.field === field ? "" : field,
              value: "",
            }))
          }
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-primary)]"
          title={`Add ${label}`}
        >
          <Plus size={18} />
        </button>
      </div>

      {isActive ? (
        <div className="flex gap-2">
          <input
            placeholder={`New ${label}`}
            value={optionBuilder.value}
            onChange={(event) => setOptionBuilder({ field, value: event.target.value })}
            className="input flex-1"
          />
          <button type="button" onClick={onAdd} className="rounded-xl bg-blue-600 px-4 py-2 text-white">
            Add
          </button>
        </div>
      ) : null}
    </div>
  )
}
