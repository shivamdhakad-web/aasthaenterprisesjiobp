import { useEffect, useState } from "react"
import MobileActionFab from "../../components/MobileActionFab"
import {
  addMyExpense,
  getMyExpenses,
  updateMyExpense,
} from "../../services/employeeSelfApi"

const categories = ["Travel", "Stationery", "Food", "Repair", "Misc"]
const paymentModes = ["Cash", "UPI", "Bank"]

const baseForm = {
  date: new Date().toISOString().slice(0, 10),
  category: "Travel",
  description: "",
  amount: "",
  paymentMode: "Cash",
}

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

export default function EmployeeExpenses() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(baseForm)
  const [editing, setEditing] = useState(null)
  const [showMobileForm, setShowMobileForm] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const load = async () => {
    const data = await getMyExpenses()
    setItems(data)
  }

  useEffect(() => {
    load()
  }, [])

  const openForm = (item = null) => {
  if (item) {
    setEditing(item)
    setForm({
      date: item.date,
      category: item.category,
      description: item.description || "",
      amount: item.amount,
      paymentMode: item.paymentMode || "Cash",
    })
    } else {
        setEditing(null)
        setForm(baseForm)
    }

    setShowMobileForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const submit = async () => {
    if (editing && !editing.canEdit) return

    if (editing) {
        await updateMyExpense(editing._id, form)
        setSuccessMessage("Expense Updated")
    } else {
        await addMyExpense(form)
        setSuccessMessage("Expense Submitted")
    }

    setShowSuccessPopup(true)

    setEditing(null)
    setForm(baseForm)
    setShowMobileForm(false)
    load()
    }

  const readOnlyMode = Boolean(editing && !editing.canEdit)

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <section
        className={`rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 ${
            showMobileForm || editing ? "block" : "hidden sm:block"
        }`}
        >
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">My Expenses</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Employee side se jo expense add karoge woh admin expense page me bhi automatic show hoga.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <input
            type="date"
            value={form.date}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="input"
          />
          <select
            value={form.category}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            className="input"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            value={form.description}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Description"
            className="input"
          />
          <input
            value={form.amount}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            placeholder="Amount"
            className="input"
          />
          <button
            onClick={submit}
            disabled={readOnlyMode}
            className="btn btn-green w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editing ? (readOnlyMode ? "View Only" : "Update Expense") : "Add Expense"}
          </button>
        </div>

        <select
          value={form.paymentMode}
          disabled={readOnlyMode}
          onChange={(event) => setForm({ ...form, paymentMode: event.target.value })}
          className="input mt-3 md:max-w-[220px]"
        >
          {paymentModes.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.date}</td>
                  <td>{item.category}</td>
                  <td>{item.description || "-"}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.paymentMode}</td>
                  <td>
                    <button
                      onClick={() => openForm(item)}
                      className="text-blue-500"
                    >
                      {item.canEdit ? "Edit" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {items.map((item) => (
            <div key={item._id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                    {formatCurrency(item.amount)}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {item.date} • {item.category}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
                  {item.paymentMode}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--text-primary)]">{item.description || "-"}</p>
              <button
                onClick={() => {
                  setEditing(item)
                  setForm({
                    date: item.date,
                    category: item.category,
                    description: item.description || "",
                    amount: item.amount,
                    paymentMode: item.paymentMode || "Cash",
                  })
                }}
                className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-500"
              >
                {item.canEdit ? "Edit expense" : "View expense"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <MobileActionFab
        actions={[
          {
            label: "New Expense",
            className: "bg-blue-600",
            onClick: () => openForm()
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
