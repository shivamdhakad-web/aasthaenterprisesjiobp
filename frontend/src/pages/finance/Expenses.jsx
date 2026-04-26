import { useEffect, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import MobileActionFab from "../../components/MobileActionFab"
import {
  addExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../../services/expenseApi"

const categories = ["Electricity", "Maintenance", "Salary", "Cleaning", "Misc"]
const paymentModes = ["Cash", "UPI", "Bank"]

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

const formatDate = (value) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleDateString()
}

export default function Expenses() {
  const [data, setData] = useState([])
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [openCard, setOpenCard] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const [form, setForm] = useState({
    date: "",
    category: "Electricity",
    description: "",
    amount: "",
    paymentMode: "Cash",
    addedBy: "Admin",
  })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const res = await getExpenses()
    setData(res)
  }

  const resetForm = () => {
    setForm({
      date: "",
      category: "Electricity",
      description: "",
      amount: "",
      paymentMode: "Cash",
      addedBy: "Admin",
    })
    setEditId(null)
  }

  const openCreateModal = () => {
    resetForm()
    setOpen(true)
  }

  const openEditModal = (expense) => {
    setForm({
      date: expense.date || "",
      category: expense.category || "Electricity",
      description: expense.description || "",
      amount: expense.amount || "",
      paymentMode: expense.paymentMode || "Cash",
      addedBy: expense.addedBy || "Admin",
    })
    setEditId(expense._id)
    setOpen(true)
  }

  const saveExpense = async () => {
    if (editId) {
      await updateExpense(editId, form)
    } else {
      await addExpense(form)
    }

    setOpen(false)
    resetForm()
    load()
  }

  const remove = async (id) => {
    await deleteExpense(id)
    load()
  }

  const filteredData = data.filter((expense) => {
    const target = [expense.description, expense.category, expense.paymentMode, expense.addedBy, expense.date]
      .join(" ")
      .toLowerCase()

    return (
      target.includes(search.toLowerCase()) &&
      (!category || expense.category === category) &&
      (!dateFilter || expense.date === dateFilter)
    )
  })

  const today = new Date()
  const todayString = today.toISOString().slice(0, 10)
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let todayTotal = 0
  let weekTotal = 0
  let monthTotal = 0
  let grandTotal = 0

  filteredData.forEach((expense) => {
    const amount = Number(expense.amount || 0)
    const expenseDate = new Date(expense.date)

    grandTotal += amount

    if (expense.date === todayString) {
      todayTotal += amount
    }

    const diffDays = (today - expenseDate) / (1000 * 60 * 60 * 24)
    if (diffDays <= 7) {
      weekTotal += amount
    }

    if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
      monthTotal += amount
    }
  })

  const generateExpensePDF = () => {
    const reportData = filteredData.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return (
        (!fromDate || expenseDate >= new Date(fromDate)) &&
        (!toDate || expenseDate <= new Date(toDate)) &&
        (!category || expense.category === category)
      )
    })

    const total = reportData.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const doc = new jsPDF()

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("Aastha Enterprises", 14, 18)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text("Expense Report", 14, 26)
    doc.setFontSize(10)
    doc.text(`From: ${fromDate || "All"}   To: ${toDate || "All"}`, 14, 36)
    doc.text(`Total Records: ${reportData.length}`, 14, 42)
    doc.setDrawColor(200)
    doc.line(14, 46, 196, 46)
    doc.setFont("helvetica", "bold")
    doc.text("Summary", 14, 54)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Expense: ${formatCurrency(total)}`, 14, 62)

    autoTable(doc, {
      startY: 70,
      head: [["Date", "Category", "Description", "Amount", "Mode", "Added By"]],
      body: reportData.map((expense) => [
        expense.date,
        expense.category,
        expense.description,
        formatCurrency(expense.amount),
        expense.paymentMode,
        expense.addedBy,
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    })

    doc.save("Expense_Report.pdf")
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 sm:p-6 text-[color:var(--text-primary)]">
      <h1 className="mb-4 text-3xl font-bold text-[color:var(--text-strong)]">Expenses</h1>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Today</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(todayTotal)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Week</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(weekTotal)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Month</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(monthTotal)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(grandTotal)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search expense"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[420px]"
        />

        <button
          onClick={openCreateModal}
          className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          + Add Expense
        </button>

        <button
          onClick={() => setReportOpen(true)}
          className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          Generate Report
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,220px)_auto]">
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="input">
          <option value="">All Category</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="input"
        />

        <button
          onClick={() => {
            setCategory("")
            setDateFilter("")
          }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)] sm:justify-self-start"
        >
          Clear Filters
        </button>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="table min-w-[980px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Added By</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((expense) => (
              <tr key={expense._id}>
                <td>{formatDate(expense.date)}</td>
                <td>{expense.category}</td>
                <td>{expense.description}</td>
                <td className="text-red-500">{formatCurrency(expense.amount)}</td>
                <td>{expense.paymentMode}</td>
                <td>{expense.addedBy}</td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => openEditModal(expense)} className="text-blue-500">
                      Edit
                    </button>

                    <button onClick={() => remove(expense._id)} className="text-red-500">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 sm:hidden">
        {filteredData.map((expense) => {
          const isOpen = openCard === expense._id

          return (
            <div
              key={expense._id}
              onClick={() => setOpenCard(isOpen ? null : expense._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">
                    {expense.category}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">
                    {formatCurrency(expense.amount)}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {formatDate(expense.date)}
                  </p>
                </div>

                <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-500">
                  {expense.paymentMode}
                </div>
              </div>

              <p className="mt-3 text-sm text-[color:var(--text-primary)]">{expense.description}</p>

              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Added by: <span className="text-[color:var(--text-strong)]">{expense.addedBy}</span>
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        openEditModal(expense)
                      }}
                      className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                    >
                      Edit
                    </button>

                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        remove(expense._id)
                      }}
                      className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">
              {editId ? "Edit Expense" : "Add Expense"}
            </h2>

            <div className="grid gap-3">
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                className="input"
              />

              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="input"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                placeholder="Description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="input"
              />

              <input
                placeholder="Amount"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                className="input"
              />

              <select
                value={form.paymentMode}
                onChange={(event) => setForm({ ...form, paymentMode: event.target.value })}
                className="input"
              >
                {paymentModes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                placeholder="Added By"
                value={form.addedBy}
                onChange={(event) => setForm({ ...form, addedBy: event.target.value })}
                className="input"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
              >
                Cancel
              </button>

              <button onClick={saveExpense} className="rounded-xl bg-blue-600 px-4 py-2 text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-primary)]">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">
              Generate Expense Report
            </h2>

            <div className="flex flex-col gap-3">
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
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setReportOpen(false)}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  generateExpensePDF()
                  setReportOpen(false)
                }}
                className="rounded-xl bg-green-600 px-4 py-2 text-white"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MobileActionFab
        actions={[
          {
            label: "Add Expense",
            className: "bg-blue-600",
            onClick: openCreateModal,
          },
          {
            label: "Generate Report",
            className: "bg-purple-600",
            onClick: () => setReportOpen(true),
          },
        ]}
      />
    </div>
  )
}
