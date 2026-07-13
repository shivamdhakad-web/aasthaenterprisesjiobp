import { Download, FileSpreadsheet, FileText, Plus, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../../components/MobileActionFab"
import { useAuth } from "../../contexts/AuthContext"
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"
import {
  addExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../../services/expenseApi"

const defaultCategories = ["Other", "Electricity", "Maintenance", "Salary", "Cleaning", "Miscellaneous"]
const defaultPaymentModes = ["Cash", "UPI", "Bank"]
const defaultAddedByOptions = ["Admin", "Manager", "Account Team"]

const getToday = () => new Date().toISOString().slice(0, 10)
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

const formatDate = (value) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleDateString("en-IN")
}

const formatDateTime = (value) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const buildOptionList = (defaults, values = []) =>
  [...new Set([...defaults, ...values.filter(Boolean).map((item) => String(item).trim())])]

const defaultForm = (user) => ({
  date: getToday(),
  category: defaultCategories[0],
  description: "",
  amount: "",
  paymentMode: defaultPaymentModes[0],
  addedBy: user?.name || defaultAddedByOptions[0],
})

const defaultBulkExpenseRow = (user) => ({
  date: getToday(),
  category: defaultCategories[0],
  description: "",
  amount: "",
  paymentMode: defaultPaymentModes[0],
  addedBy: user?.name || defaultAddedByOptions[0],
})

export default function Expenses() {
  const { user } = useAuth()
  const isManager = user?.role === "Manager"
  const { canUse } = useManagerDashboardSettings("expenses", isManager)
  const canManagerUse = (buttonKey) => !isManager || canUse(buttonKey)
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [fromDateFilter, setFromDateFilter] = useState("")
  const [toDateFilter, setToDateFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())
  const [showFilter, setShowFilter] = useState(false)
  const [openCard, setOpenCard] = useState(null)
  const [open, setOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmState, setConfirmState] = useState(null)
  const [reportForm, setReportForm] = useState({
    fromDate: "",
    toDate: "",
    category: "",
    format: "pdf",
  })
  const [optionBuilder, setOptionBuilder] = useState({ field: "", value: "" })
  const [entryModePrompt, setEntryModePrompt] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkEntries, setBulkEntries] = useState([defaultBulkExpenseRow(user)])
  const [form, setForm] = useState(defaultForm(user))

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!notice.text) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setNotice({ type: "", text: "" })
    }, 2400)

    return () => window.clearTimeout(timeout)
  }, [notice])

  const load = async () => {
    const res = await getExpenses()
    setData(Array.isArray(res) ? res : [])
  }

  const categoryOptions = useMemo(
    () => buildOptionList(defaultCategories, data.map((item) => item.category)),
    [data],
  )

  const paymentModeOptions = useMemo(
    () => buildOptionList(defaultPaymentModes, data.map((item) => item.paymentMode)),
    [data],
  )

  const addedByOptions = useMemo(
    () => buildOptionList(defaultAddedByOptions, data.map((item) => item.addedBy)),
    [data],
  )

  const resetForm = () => {
    setForm(defaultForm(user))
    setEditId(null)
    setOptionBuilder({ field: "", value: "" })
  }

  const openCreateModal = () => {
    if (!canManagerUse("addExpense")) {
      setNotice({ type: "error", text: "You do not have access to add expenses." })
      return
    }

    resetForm()
    setOpen(true)
  }

  const openEntryModePrompt = () => {
    if (!canManagerUse("addExpense")) {
      setNotice({ type: "error", text: "You do not have access to add expenses." })
      return
    }

    setEntryModePrompt(true)
  }

  const openBulkModal = () => {
    if (!canManagerUse("addExpense")) {
      setNotice({ type: "error", text: "You do not have access to add expenses." })
      return
    }

    setBulkEntries([defaultBulkExpenseRow(user)])
    setBulkOpen(true)
  }

  const openEditModal = (expense) => {
    if (!canManagerUse("editExpense")) {
      setNotice({ type: "error", text: "You do not have access to edit expenses." })
      return
    }

    setForm({
      date: expense.date || getToday(),
      category: expense.category || categoryOptions[0] || defaultCategories[0],
      description: expense.description || "",
      amount: String(expense.amount ?? ""),
      paymentMode: expense.paymentMode || paymentModeOptions[0] || defaultPaymentModes[0],
      addedBy: expense.addedBy || addedByOptions[0] || user?.name || "Admin",
    })
    setEditId(expense._id)
    setOptionBuilder({ field: "", value: "" })
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    resetForm()
  }

  const saveExpense = async () => {
    if (!canManagerUse(editId ? "editExpense" : "addExpense")) {
      setNotice({ type: "error", text: "You do not have access to save this expense." })
      return
    }

    if (!form.date || !form.category || !form.amount || !form.paymentMode || !form.addedBy) {
      setNotice({ type: "error", text: "Please complete all expense fields." })
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...form,
        description: form.description?.trim() || "",
        amount: Number(form.amount || 0),
      }

      if (editId) {
        await updateExpense(editId, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: "Expense updated successfully." })
      } else {
        await addExpense(payload)
        setNotice({ type: "success", text: "Expense saved successfully." })
      }

      closeModal()
      await load()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save expense right now.",
      })
    } finally {
      setSaving(false)
    }
  }

  const askDelete = (expense) => {
    if (!canManagerUse("deleteExpense")) {
      setNotice({ type: "error", text: "You do not have access to delete expenses." })
      return
    }

    setConfirmState({
      title: "Delete Expense",
      description: `Delete the expense "${expense.description}"? This action cannot be undone.`,
      actionLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        await deleteExpense(expense._id)
        await load()
        setNotice({ type: "success", text: "Expense deleted successfully." })
      },
    })
  }

  const updateBulkEntry = (index, key, value) => {
    setBulkEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry,
      ),
    )
  }

  const addBulkEntryRow = () => {
    setBulkEntries((current) => [...current, defaultBulkExpenseRow(user)])
  }

  const removeBulkEntryRow = (index) => {
    setBulkEntries((current) => current.filter((_, entryIndex) => entryIndex !== index))
  }

  const saveBulkExpenses = async () => {
    if (!canManagerUse("addExpense")) {
      setNotice({ type: "error", text: "You do not have access to add expenses." })
      return
    }

    const validEntries = bulkEntries.filter(
      (entry) => entry.date && entry.category && entry.amount && entry.paymentMode && entry.addedBy,
    )

    if (!validEntries.length) {
      setNotice({ type: "error", text: "Please complete at least one expense row." })
      return
    }

    setBulkSaving(true)

    try {
      for (const entry of validEntries) {
        await addExpense({
          ...entry,
          description: entry.description?.trim() || "",
          amount: Number(entry.amount || 0),
        })
      }

      setBulkOpen(false)
      setBulkEntries([defaultBulkExpenseRow(user)])
      setNotice({
        type: "success",
        text: `${validEntries.length} expense entries saved successfully.`,
      })
      await load()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save multiple expense entries.",
      })
    } finally {
      setBulkSaving(false)
    }
  }

  const filteredData = useMemo(
    () =>
      data.filter((expense) => {
        const target = [
          expense.description,
          expense.category,
          expense.paymentMode,
          expense.addedBy,
          expense.date,
        ]
          .join(" ")
          .toLowerCase()

        return (
          target.includes(search.toLowerCase()) &&
          (!category || expense.category === category) &&
          (!fromDateFilter || String(expense.date || "") >= fromDateFilter) &&
          (!toDateFilter || String(expense.date || "") <= toDateFilter) &&
          (!monthFilter || String(expense.date || "").slice(0, 7) === monthFilter)
        )
      }),
    [category, data, fromDateFilter, monthFilter, search, toDateFilter],
  )

  const summary = useMemo(() => {
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

      if (String(expense.date || "").slice(0, 7) === (monthFilter || getCurrentMonth())) {
        monthTotal += amount
      }
    })

    return { todayTotal, weekTotal, monthTotal, grandTotal }
  }, [filteredData, monthFilter])

  const reportData = useMemo(
    () =>
      filteredData.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return (
          (!reportForm.fromDate || expenseDate >= new Date(reportForm.fromDate)) &&
          (!reportForm.toDate || expenseDate <= new Date(reportForm.toDate)) &&
          (!reportForm.category || expense.category === reportForm.category)
        )
      }),
    [filteredData, reportForm.category, reportForm.fromDate, reportForm.toDate],
  )

  const exportPdf = () => {
    const total = reportData.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const doc = new jsPDF()

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("Expense Report", 14, 18)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`From: ${reportForm.fromDate || "All"}  To: ${reportForm.toDate || "All"}`, 14, 28)
    doc.text(`Category: ${reportForm.category || "All Categories"}`, 14, 34)
    doc.text(`Total Amount: ${formatCurrency(total)}`, 14, 40)

    autoTable(doc, {
      startY: 48,
      head: [["Date", "Category", "Description", "Amount", "Payment Mode", "Added By"]],
      body: reportData.map((expense) => [
        expense.date,
        expense.category,
        expense.description,
        formatCurrency(expense.amount),
        expense.paymentMode,
        expense.addedBy,
      ]),
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3.6 },
    })

    doc.save("expense-report.pdf")
  }

  const exportExcel = () => {
    const workbookData = reportData.map((expense) => ({
      Date: expense.date,
      Category: expense.category,
      Description: expense.description,
      Amount: Number(expense.amount || 0),
      Payment_Mode: expense.paymentMode,
      Added_By: expense.addedBy,
      Edited_At: expense.lastEditedAt ? formatDateTime(expense.lastEditedAt) : "",
      Edited_By: expense.lastEditedBy || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(workbookData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses")
    XLSX.writeFile(workbook, "expense-report.xlsx")
  }

  const handleGenerateReport = () => {
    if (!canManagerUse("generateReport")) {
      setNotice({ type: "error", text: "You do not have access to generate reports." })
      return
    }

    if (!reportData.length) {
      setNotice({ type: "error", text: "No report data found for the selected filters." })
      return
    }

    if (reportForm.format === "pdf") {
      exportPdf()
    } else {
      exportExcel()
    }

    setReportOpen(false)
    setNotice({ type: "success", text: "Report downloaded successfully." })
  }

  const addInlineOption = (field) => {
    const value = optionBuilder.value.trim()

    if (!value) {
      setNotice({ type: "error", text: "Please enter an option name first." })
      return
    }

    setForm((current) => ({ ...current, [field]: value }))
    setOptionBuilder({ field: "", value: "" })
    setNotice({ type: "success", text: "Option added to the form." })
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 text-[color:var(--text-primary)] sm:p-6">
      <div className="mb-5 rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Expenses</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Track expense entries, reports, filters, and edit history in one place.
        </p>
      </div>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard label="Today Expense" value={formatCurrency(summary.todayTotal)} tone="rose" />
        <SummaryCard label="Week Expense" value={formatCurrency(summary.weekTotal)} tone="amber" />
        <SummaryCard label="Month Expense" value={formatCurrency(summary.monthTotal)} tone="blue" />
        <SummaryCard label="Total Expense" value={formatCurrency(summary.grandTotal)} tone="violet" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <input
          placeholder="Search expense"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full lg:max-w-[420px]"
        />

        {canManagerUse("addExpense") ? (
          <button
            onClick={openEntryModePrompt}
            className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm lg:inline-flex"
          >
            + Add Expense
          </button>
        ) : null}

        {canManagerUse("generateReport") ? (
          <button
            onClick={() => setReportOpen(true)}
            className="hidden rounded-2xl bg-purple-600 px-5 py-3 font-medium text-white shadow-sm lg:inline-flex"
          >
            Generate Report
          </button>
        ) : null}
      </div>

      <div className="mb-3 lg:hidden">
        <button
          onClick={() => setShowFilter((current) => !current)}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)]"
        >
          {showFilter ? "Hide Filters" : "Filters"}
        </button>
      </div>

      <div className={`mb-5 gap-3 lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,180px)_minmax(0,180px)_minmax(0,220px)_auto] ${showFilter ? "grid" : "hidden lg:grid"}`}>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="input">
          <option value="">All Categories</option>
          {categoryOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDateFilter}
          onChange={(event) => setFromDateFilter(event.target.value)}
          title="From date"
          className="input"
        />

        <input
          type="date"
          value={toDateFilter}
          onChange={(event) => setToDateFilter(event.target.value)}
          title="To date"
          className="input"
        />

        <input
          type="month"
          value={monthFilter}
          onChange={(event) => setMonthFilter(event.target.value)}
          className="input"
        />

        <button
          onClick={() => {
            setCategory("")
            setFromDateFilter("")
            setToDateFilter("")
          }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)] lg:justify-self-start"
        >
          Clear Filters
        </button>
      </div>

      <div className="hidden max-h-[620px] overflow-x-auto overflow-y-auto rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_16px_32px_rgba(16,24,20,0.05)] lg:block">
        <table className="table min-w-[1080px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Payment Mode</th>
              <th>Added By</th>
              <th>Audit</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((expense) => (
              <tr key={expense._id}>
                <td>{formatDate(expense.date)}</td>
                <td>{expense.category}</td>
                <td>{expense.description}</td>
                <td className="font-semibold text-rose-500">{formatCurrency(expense.amount)}</td>
                <td>{expense.paymentMode}</td>
                <td>{expense.addedBy}</td>
                <td className="text-left text-xs leading-6 text-[color:var(--text-secondary)]">
                  {expense.lastEditedAt ? (
                    <>
                      <div>Edited: {formatDateTime(expense.lastEditedAt)}</div>
                      <div>
                        By: {expense.lastEditedBy || "-"} {expense.lastEditedByRole ? `(${expense.lastEditedByRole})` : ""}
                      </div>
                    </>
                  ) : (
                    <span>Not edited yet</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    {canManagerUse("editExpense") ? (
                      <button onClick={() => openEditModal(expense)} className="text-blue-500">
                        Edit
                      </button>
                    ) : null}
                    {canManagerUse("deleteExpense") ? (
                      <button onClick={() => askDelete(expense)} className="text-red-500">
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

      <div className="max-h-[640px] space-y-4 overflow-y-auto pr-1 lg:hidden">
        {filteredData.map((expense) => {
          const isOpen = openCard === expense._id

          return (
            <div
              key={expense._id}
              onClick={() => setOpenCard(isOpen ? null : expense._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] transition active:scale-[0.98]"
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
                    Added by: <span className="font-medium text-[color:var(--text-strong)]">{expense.addedBy}</span>
                  </p>

                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Last edited:{" "}
                    <span className="font-medium text-[color:var(--text-strong)]">
                      {expense.lastEditedAt ? formatDateTime(expense.lastEditedAt) : "Not edited yet"}
                    </span>
                  </p>

                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Edited by:{" "}
                    <span className="font-medium text-[color:var(--text-strong)]">
                      {expense.lastEditedBy || "-"} {expense.lastEditedByRole ? `(${expense.lastEditedByRole})` : ""}
                    </span>
                  </p>

                  {canManagerUse("editExpense") || canManagerUse("deleteExpense") ? (
                    <div className="flex gap-2">
                      {canManagerUse("editExpense") ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            openEditModal(expense)
                          }}
                          className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                        >
                          Edit
                        </button>
                      ) : null}
                      {canManagerUse("deleteExpense") ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            askDelete(expense)
                          }}
                          className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {open ? (
        <ModalShell title={editId ? "Edit Expense" : "Add Expense"} onClose={closeModal}>
          <div className="grid gap-3">
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              className="input"
            />

            <InlineOptionSelect
              label="Category"
              value={form.category}
              options={categoryOptions}
              onChange={(value) => setForm({ ...form, category: value })}
              optionBuilder={optionBuilder}
              setOptionBuilder={setOptionBuilder}
              field="category"
              onAdd={() => addInlineOption("category")}
            />

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

            <InlineOptionSelect
              label="Payment Mode"
              value={form.paymentMode}
              options={paymentModeOptions}
              onChange={(value) => setForm({ ...form, paymentMode: value })}
              optionBuilder={optionBuilder}
              setOptionBuilder={setOptionBuilder}
              field="paymentMode"
              onAdd={() => addInlineOption("paymentMode")}
            />

            <InlineOptionSelect
              label="Added By"
              value={form.addedBy}
              options={addedByOptions}
              onChange={(value) => setForm({ ...form, addedBy: value })}
              optionBuilder={optionBuilder}
              setOptionBuilder={setOptionBuilder}
              field="addedBy"
              onAdd={() => addInlineOption("addedBy")}
            />
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>

            <button
              onClick={saveExpense}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {bulkOpen ? (
        <ModalShell title="Add Multiple Expenses" onClose={() => setBulkOpen(false)}>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {bulkEntries.map((entry, index) => (
              <div key={`${index}-${entry.date}`} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">
                    Entry {index + 1}
                  </h3>
                  {bulkEntries.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeBulkEntryRow(index)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-600"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(event) => updateBulkEntry(index, "date", event.target.value)}
                    className="input"
                  />
                  <select
                    value={entry.category}
                    onChange={(event) => updateBulkEntry(index, "category", event.target.value)}
                    className="input"
                  >
                    {categoryOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Description (optional)"
                    value={entry.description}
                    onChange={(event) => updateBulkEntry(index, "description", event.target.value)}
                    className="input"
                  />
                  <input
                    placeholder="Amount"
                    value={entry.amount}
                    onChange={(event) => updateBulkEntry(index, "amount", event.target.value)}
                    className="input"
                  />
                  <select
                    value={entry.paymentMode}
                    onChange={(event) => updateBulkEntry(index, "paymentMode", event.target.value)}
                    className="input"
                  >
                    {paymentModeOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <select
                    value={entry.addedBy}
                    onChange={(event) => updateBulkEntry(index, "addedBy", event.target.value)}
                    className="input"
                  >
                    {addedByOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addBulkEntryRow}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-600"
            >
              + Add Another Row
            </button>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => setBulkOpen(false)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>

            <button
              onClick={saveBulkExpenses}
              disabled={bulkSaving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkSaving ? "Saving..." : "Save All"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {reportOpen ? (
        <ModalShell title="Generate Expense Report" onClose={() => setReportOpen(false)}>
          <div className="grid gap-3">
            <input
              type="date"
              value={reportForm.fromDate}
              onChange={(event) => setReportForm((current) => ({ ...current, fromDate: event.target.value }))}
              className="input"
            />

            <input
              type="date"
              value={reportForm.toDate}
              onChange={(event) => setReportForm((current) => ({ ...current, toDate: event.target.value }))}
              className="input"
            />

            <select
              value={reportForm.category}
              onChange={(event) => setReportForm((current) => ({ ...current, category: event.target.value }))}
              className="input"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={reportForm.format}
              onChange={(event) => setReportForm((current) => ({ ...current, format: event.target.value }))}
              className="input"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => setReportOpen(false)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>

            <button onClick={handleGenerateReport} className="rounded-xl bg-green-600 px-4 py-2 text-white">
              Download
            </button>
          </div>
        </ModalShell>
      ) : null}

      {confirmState ? (
        <ConfirmDialog
          title={confirmState.title}
          description={confirmState.description}
          actionLabel={confirmState.actionLabel}
          variant={confirmState.variant}
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            try {
              await confirmState.onConfirm?.()
            } catch (error) {
              setNotice({
                type: "error",
                text: error?.response?.data?.message || "Unable to complete this action.",
              })
            } finally {
              setConfirmState(null)
            }
          }}
        />
      ) : null}

      {entryModePrompt ? (
        <ConfirmDialog
          title="Choose Expense Entry Mode"
          description="Select whether you want to add one expense or save multiple expense rows in one action."
          actionLabel="Single Entry"
          secondaryLabel="Multiple Entry"
          variant="primary"
          onCancel={() => setEntryModePrompt(false)}
          onConfirm={() => {
            setEntryModePrompt(false)
            openCreateModal()
          }}
          onSecondaryAction={() => {
            setEntryModePrompt(false)
            openBulkModal()
          }}
        />
      ) : null}

      <MobileActionFab
        actions={[
          canManagerUse("addExpense")
            ? {
                label: "Add Expense",
                className: "bg-blue-600",
                onClick: openEntryModePrompt,
              }
            : null,
          canManagerUse("generateReport")
            ? {
                label: "Generate Report",
                className: "bg-purple-600",
                onClick: () => setReportOpen(true),
              }
            : null,
        ].filter(Boolean)}
      />
    </div>
  )
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    rose: { panel: "border-rose-200/70 bg-rose-50/80", value: "text-rose-600" },
    amber: { panel: "border-amber-200/70 bg-amber-50/80", value: "text-amber-600" },
    blue: { panel: "border-blue-200/70 bg-blue-50/80", value: "text-blue-600" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80", value: "text-violet-600" },
  }
  const current = tones[tone] || tones.blue

  return (
    <div className={`rounded-3xl border p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] ${current.panel}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">{label}</p>
      <p className={`mt-3 text-2xl font-extrabold ${current.value}`}>{value}</p>
    </div>
  )
}

function InlineNotice({ notice }) {
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
        notice.type === "error"
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {notice.text}
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2 text-[color:var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function InlineOptionSelect({
  label,
  value,
  options,
  onChange,
  field,
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
              value: current.field === field ? "" : "",
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

function ConfirmDialog({
  title,
  description,
  actionLabel,
  variant,
  secondaryLabel = "",
  onCancel,
  onConfirm,
  onSecondaryAction,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.22)]">
        <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
          >
            Cancel
          </button>
          {secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-600"
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-white ${variant === "danger" ? "bg-red-600" : "bg-blue-600"}`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}



