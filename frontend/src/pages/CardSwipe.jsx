import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../components/MobileActionFab"
import AddCardSwipeModal from "../components/AddCardSwipeModal"
import { useAuth } from "../contexts/AuthContext"
import useManagerDashboardSettings from "../hooks/useManagerDashboardSettings"
import { addEntry, deleteEntry, deleteMonth, getEntries } from "../services/cardSwipeApi"

const getToday = () => new Date().toISOString().slice(0, 10)
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)
const getTodayDateTimeStart = () => `${getToday()}T00:00`
const getTodayDateTimeEnd = () => `${getToday()}T23:59`

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")

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

const defaultBulkRow = () => ({
  date: getToday(),
  time: "",
  amount: "",
  charges: "0",
  paymentMethod: "Cash",
  txnDetails: "",
  machine: "Self",
  remark: "C.C.",
})

export default function CardSwipe() {
  const { user } = useAuth()
  const isManager = user?.role === "Manager"
  const { canUse } = useManagerDashboardSettings("cardSwipe", isManager)
  const canManagerUse = (buttonKey) => !isManager || canUse(buttonKey)
  const [entries, setEntries] = useState([])
  const [search, setSearch] = useState("")
  const [month, setMonth] = useState(getCurrentMonth())
  const [startDate, setStartDate] = useState(getTodayDateTimeStart())
  const [endDate, setEndDate] = useState(getTodayDateTimeEnd())
  const [machine, setMachine] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [openCard, setOpenCard] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDateTime, setFromDateTime] = useState("")
  const [toDateTime, setToDateTime] = useState("")
  const [reportMachine, setReportMachine] = useState("")
  const [reportPayment, setReportPayment] = useState("")
  const [format, setFormat] = useState("pdf")
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmState, setConfirmState] = useState(null)
  const [entryModePrompt, setEntryModePrompt] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkRows, setBulkRows] = useState([defaultBulkRow()])

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    if (!notice.text) {
      return undefined
    }

    const timeout = window.setTimeout(() => setNotice({ type: "", text: "" }), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const fetchEntries = async () => {
    const data = await getEntries()
    setEntries(Array.isArray(data) ? data : [])
  }

  const machineOptions = useMemo(
    () => buildOptionList(["Self", "DSM"], entries.map((entry) => entry.machine)),
    [entries],
  )

  const paymentMethodOptions = useMemo(
    () => buildOptionList(["Online", "Cash"], entries.map((entry) => entry.paymentMethod)),
    [entries],
  )

  const getSummary = (data) => {
    let totalAmount = 0
    let totalCharges = 0
    let cash = 0
    let online = 0
    let self = 0
    let dsm = 0
    let selfCharges = 0
    let dsmCharges = 0
    let cashProfit = 0
    let onlineProfit = 0

    data.forEach((entry) => {
      const amount = Number(entry.amount || 0)
      const charges = Number(entry.charges || 0)

      totalAmount += amount
      totalCharges += charges

      if (entry.paymentMethod === "Cash") {
        cash += amount
        cashProfit += charges
      }

      if (entry.paymentMethod === "Online") {
        online += amount
        onlineProfit += charges
      }

      if (entry.machine === "Self") {
        self += amount
        selfCharges += charges
      }

      if (entry.machine === "DSM") {
        dsm += amount
        dsmCharges += charges
      }
    })

    return {
      totalAmount,
      totalCharges,
      net: totalAmount - totalCharges,
      cash,
      online,
      self,
      dsm,
      selfCharges,
      dsmCharges,
      cashProfit,
      onlineProfit,
      count: data.length,
    }
  }

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const target = [
          entry.machine,
          entry.paymentMethod,
          entry.remark,
          entry.txnDetails,
          entry.amount,
          entry.charges,
          entry.time,
          entry.date,
        ]
          .join(" ")
          .toLowerCase()

        const entryDate = entry.date ? new Date(entry.date) : null
        const entryMonth = entryDate ? entryDate.toISOString().slice(0, 7) : ""
        const from = startDate ? new Date(startDate) : null
        const to = endDate ? new Date(endDate) : null

        return (
          target.includes(search.toLowerCase()) &&
          (!month || entryMonth === month) &&
          (!machine || entry.machine === machine) &&
          (!paymentMethod || entry.paymentMethod === paymentMethod) &&
          (!from || entryDate >= from) &&
          (!to || entryDate <= to)
        )
      }),
    [endDate, entries, machine, month, paymentMethod, search, startDate],
  )

  const summary = getSummary(filteredEntries)

  const monthProfit = useMemo(() => {
    const activeMonth = month || getCurrentMonth()

    return entries.reduce((total, entry) => {
      const entryMonth = entry.date ? String(entry.date).slice(0, 7) : ""
      return entryMonth === activeMonth ? total + Number(entry.charges || 0) : total
    }, 0)
  }, [entries, month])

  const getReportData = () =>
    filteredEntries.filter((entry) => {
      const entryDate = new Date(entry.date)

      if (entry.time) {
        const [hours, minutes] = entry.time.split(":")
        entryDate.setHours(Number(hours || 0))
        entryDate.setMinutes(Number(minutes || 0))
      }

      const from = fromDateTime ? new Date(fromDateTime) : null
      const to = toDateTime ? new Date(toDateTime) : null

      if (to) {
        to.setSeconds(59)
      }

      return (
        (!from || entryDate >= from) &&
        (!to || entryDate <= to) &&
        (!reportMachine || entry.machine === reportMachine) &&
        (!reportPayment || entry.paymentMethod === reportPayment)
      )
    })

  const generatePDF = (data) => {
    const reportSummary = getSummary(data)
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("Card Swipe Report", 14, 15)
    doc.setFontSize(10)
    doc.text(`From: ${fromDateTime || "All"}`, 14, 22)
    doc.text(`To: ${toDateTime || "All"}`, 14, 28)
    doc.text(`Machine: ${reportMachine || "All"}`, 120, 22)
    doc.text(`Payment: ${reportPayment || "All"}`, 120, 28)
    doc.text(`Total Swipe: ${formatCurrency(reportSummary.totalAmount)}`, 14, 40)
    doc.text(`Total Charges: ${formatCurrency(reportSummary.totalCharges)}`, 14, 46)
    doc.text(`Cash Profit: ${formatCurrency(reportSummary.cashProfit)}`, 120, 40)
    doc.text(`Online Profit: ${formatCurrency(reportSummary.onlineProfit)}`, 120, 46)
    doc.text(`Transactions: ${reportSummary.count}`, 14, 52)

    autoTable(doc, {
      startY: 60,
      head: [["Date", "Time", "Amount", "Charges", "Machine", "Payment", "Remark"]],
      body: data.map((entry) => [
        formatDate(entry.date),
        entry.time || "-",
        formatCurrency(entry.amount),
        formatCurrency(entry.charges),
        entry.machine,
        entry.paymentMethod,
        entry.remark || "-",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    })

    doc.save("CardSwipe_Report.pdf")
  }

  const generateExcel = (data) => {
    const reportSummary = getSummary(data)
    const formatted = data.map((entry, index) => ({
      ID: index + 1,
      Date: formatDate(entry.date),
      Time: entry.time || "",
      Amount: entry.amount,
      Charges: entry.charges,
      Machine: entry.machine,
      Payment: entry.paymentMethod,
      Remark: entry.remark,
      Edited_At: entry.lastEditedAt ? formatDateTime(entry.lastEditedAt) : "",
      Edited_By: entry.lastEditedBy || "",
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(formatted), "Data")
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([reportSummary]), "Summary")
    XLSX.writeFile(workbook, "CardSwipe_Report.xlsx")
  }

  const handleGenerate = () => {
    if (!canManagerUse("generateReport")) {
      setNotice({ type: "error", text: "You do not have access to generate reports." })
      return
    }

    const reportData = getReportData()

    if (!reportData.length) {
      setNotice({ type: "error", text: "No report data found for the selected filters." })
      return
    }

    if (format === "pdf") {
      generatePDF(reportData)
    } else {
      generateExcel(reportData)
    }

    setReportOpen(false)
    setNotice({ type: "success", text: "Report downloaded successfully." })
  }

  const openCreateModal = () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add card swipe entries." })
      return
    }

    setEditData(null)
    setModalOpen(true)
  }

  const openEntryModePrompt = () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add card swipe entries." })
      return
    }

    setEntryModePrompt(true)
  }

  const openBulkModal = () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add card swipe entries." })
      return
    }

    setBulkRows([defaultBulkRow()])
    setBulkOpen(true)
  }

  const closeBulkModal = () => {
    setBulkOpen(false)
    setBulkRows([defaultBulkRow()])
  }

  const updateBulkRow = (index, key, value) => {
    setBulkRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    )
  }

  const addBulkRow = () => {
    setBulkRows((current) => [...current, defaultBulkRow()])
  }

  const removeBulkRow = (index) => {
    setBulkRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)))
  }

  const saveBulkEntries = async () => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", text: "You do not have access to add card swipe entries." })
      return
    }

    const invalid = bulkRows.some((row) => !row.date || !row.amount || !row.machine || !row.paymentMethod)

    if (invalid) {
      setNotice({ type: "error", text: "Please complete every card swipe row before saving." })
      return
    }

    setBulkSaving(true)

    try {
      for (const row of bulkRows) {
        await addEntry({
          ...row,
          time: row.time || "",
          amount: Number(row.amount || 0),
          charges: Number(row.charges || 0),
        })
      }

      closeBulkModal()
      await fetchEntries()
      setNotice({ type: "success", text: "Multiple card swipe entries saved successfully." })
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save multiple card swipe entries.",
      })
    } finally {
      setBulkSaving(false)
    }
  }

  const askDeleteEntry = (entry) => {
    if (!canManagerUse("deleteEntry")) {
      setNotice({ type: "error", text: "You do not have access to delete card swipe entries." })
      return
    }

    setConfirmState({
      title: "Delete Card Swipe Entry",
      description: `Delete this ${formatCurrency(entry.amount)} card swipe entry from ${formatDate(entry.date)}?`,
      actionLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        await deleteEntry(entry._id)
        await fetchEntries()
        setNotice({ type: "success", text: "Card swipe entry deleted successfully." })
      },
    })
  }

  const askDeleteMonth = () => {
    if (!canManagerUse("deleteMonth")) {
      setNotice({ type: "error", text: "You do not have access to delete month records." })
      return
    }

    if (!month) {
      setNotice({ type: "error", text: "Please select a month first." })
      return
    }

    const [year, selectedMonth] = month.split("-")

    setConfirmState({
      title: "Delete Month Records",
      description: `Delete all card swipe entries for ${selectedMonth}/${year}?`,
      actionLabel: "Delete Month",
      variant: "danger",
      onConfirm: async () => {
        await deleteMonth(year, selectedMonth)
        await fetchEntries()
        setNotice({ type: "success", text: "Month records deleted successfully." })
      },
    })
  }

  const clearFilters = () => {
    setSearch("")
    setMonth(getCurrentMonth())
    setStartDate(getTodayDateTimeStart())
    setEndDate(getTodayDateTimeEnd())
    setMachine("")
    setPaymentMethod("")
  }

  const filterContent = (
    <>
      <input
        type="datetime-local"
        value={startDate}
        onChange={(event) => setStartDate(event.target.value)}
        className="input"
      />
      <input
        type="datetime-local"
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
        className="input"
      />
      <select value={machine} onChange={(event) => setMachine(event.target.value)} className="input">
        <option value="">Both Machine</option>
        {machineOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="input">
        <option value="">Both Payment</option>
        {paymentMethodOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input" />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]"
          onClick={clearFilters}
        >
          Clear
        </button>
        <button type="button" className="btn btn-red" onClick={askDeleteMonth}>
          Delete Month
        </button>
      </div>
    </>
  )

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 text-[color:var(--text-primary)] sm:p-6">
      <h1 className="mb-4 text-3xl font-bold text-[color:var(--text-strong)]">Card Swipe Register</h1>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <SummaryCard label="Total Swipe" value={formatCurrency(summary.totalAmount)} tone="blue" />
        <SummaryCard label="Total Charges" value={formatCurrency(summary.totalCharges)} tone="amber" />
        <SummaryCard label="Month Profit" value={formatCurrency(monthProfit)} tone="emerald" />
        {/* <SummaryCard label="Cash" value={formatCurrency(summary.cash)} tone="emerald" /> */}
        <SummaryCard label="Cash Profit" value={formatCurrency(summary.cashProfit)} tone="green" />
        {/* <SummaryCard label="Online" value={formatCurrency(summary.online)} tone="indigo" /> */}
        <SummaryCard label="Online Profit" value={formatCurrency(summary.onlineProfit)} tone="violet" />
        <SummaryCard label="Self Total" value={formatCurrency(summary.self)} tone="sky" />
        <SummaryCard label="Self Charges" value={formatCurrency(summary.selfCharges)} tone="cyan" />
        <SummaryCard label="DSM Total" value={formatCurrency(summary.dsm)} tone="orange" />
        <SummaryCard label="DSM Charges" value={formatCurrency(summary.dsmCharges)} tone="rose" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search swipe, machine, remark"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[420px]"
        />
        {canManagerUse("generateReport") ? (
          <button
            onClick={() => setReportOpen(true)}
            className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
          >
            Generate Report
          </button>
        ) : null}
        {canManagerUse("addEntry") ? (
          <button
            className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
            onClick={openEntryModePrompt}
          >
            + Add Entry
          </button>
        ) : null}
      </div>

      <div className="hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 sm:block">
        <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">{filterContent}</div>
      </div>

      <div className="mb-4 sm:hidden">
        <button
          onClick={() => setShowFilter((current) => !current)}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)]"
        >
          {showFilter ? "Hide Filters" : "Filters"}
        </button>
        {showFilter ? (
          <div className="mt-3 grid gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4">
            {filterContent}
          </div>
        ) : null}
      </div>

      <div className="mt-4 hidden max-h-[620px] overflow-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] sm:block">
        <table className="table min-w-[1260px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Amount</th>
              <th>Charges</th>
              <th>Machine</th>
              <th>Payment</th>
              <th>Remark</th>
              <th>Audit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry._id}>
                <td>{formatDate(entry.date)}</td>
                <td>{entry.time || "-"}</td>
                <td>{formatCurrency(entry.amount)}</td>
                <td className="font-semibold text-emerald-500">{formatCurrency(entry.charges)}</td>
                <td>{entry.machine}</td>
                <td>{entry.paymentMethod}</td>
                <td>{entry.remark || "-"}</td>
                <td className="text-left text-xs leading-6 text-[color:var(--text-secondary)]">
                  {entry.lastEditedAt ? (
                    <>
                      <div>Edited: {formatDateTime(entry.lastEditedAt)}</div>
                      <div>
                        By: {entry.lastEditedBy || "-"} {entry.lastEditedByRole ? `(${entry.lastEditedByRole})` : ""}
                      </div>
                    </>
                  ) : (
                    <span>Not edited yet</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="text-blue-500"
                      onClick={() => {
                        setEditData(entry)
                        setModalOpen(true)
                      }}
                    >
                      Edit
                    </button>
                    <button className="text-red-500" onClick={() => askDeleteEntry(entry)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="max-h-[640px] space-y-4 overflow-auto sm:hidden">
        {filteredEntries.map((entry) => {
          const isOpen = openCard === entry._id

          return (
            <div
              key={entry._id}
              onClick={() => setOpenCard(isOpen ? null : entry._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] transition active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">{formatCurrency(entry.amount)}</p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {formatDate(entry.date)} {entry.time || ""}
                  </p>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    entry.paymentMethod === "Cash"
                      ? "border border-green-500/20 bg-green-500/10 text-green-500"
                      : "border border-blue-500/20 bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {entry.paymentMethod}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <InfoBox label="Machine" value={entry.machine} />
                <InfoBox label="Charges" value={formatCurrency(entry.charges)} />
              </div>

              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                  <InfoLine label="Remark" value={entry.remark || "-"} />
                  <InfoLine label="Last Edited" value={entry.lastEditedAt ? formatDateTime(entry.lastEditedAt) : "Not edited yet"} />
                  <InfoLine label="Edited By" value={entry.lastEditedBy ? `${entry.lastEditedBy} (${entry.lastEditedByRole || "-"})` : "-"} />
                  <div className="flex gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditData(entry)
                        setModalOpen(true)
                      }}
                      className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        askDeleteEntry(entry)
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

      {reportOpen ? (
        <ModalShell title="Generate Report" onClose={() => setReportOpen(false)}>
          <div className="flex flex-col gap-3">
            <input
              type="datetime-local"
              value={fromDateTime}
              onChange={(event) => setFromDateTime(event.target.value)}
              className="input"
            />
            <input
              type="datetime-local"
              value={toDateTime}
              onChange={(event) => setToDateTime(event.target.value)}
              className="input"
            />
            <select value={reportMachine} onChange={(event) => setReportMachine(event.target.value)} className="input">
              <option value="">All Machine</option>
              {machineOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select value={reportPayment} onChange={(event) => setReportPayment(event.target.value)} className="input">
              <option value="">All Payment</option>
              {paymentMethodOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select value={format} onChange={(event) => setFormat(event.target.value)} className="input">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setReportOpen(false)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button onClick={handleGenerate} className="rounded-xl bg-green-600 px-4 py-2 text-white">
              Download
            </button>
          </div>
        </ModalShell>
      ) : null}

      {bulkOpen ? (
        <ModalShell title="Add Multiple Card Swipe Entries" onClose={closeBulkModal}>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {bulkRows.map((row, index) => (
              <div key={`card-bulk-${index}`} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-[color:var(--text-strong)]">Entry {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeBulkRow(index)}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3">
                  <input type="date" value={row.date} onChange={(event) => updateBulkRow(index, "date", event.target.value)} className="input" />
                  <input type="time" value={row.time} onChange={(event) => updateBulkRow(index, "time", event.target.value)} className="input" />
                  <input placeholder="Amount" value={row.amount} onChange={(event) => updateBulkRow(index, "amount", event.target.value)} className="input" />
                  <input placeholder="Charges" value={row.charges} onChange={(event) => updateBulkRow(index, "charges", event.target.value)} className="input" />
                  <select value={row.paymentMethod} onChange={(event) => updateBulkRow(index, "paymentMethod", event.target.value)} className="input">
                    {paymentMethodOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input placeholder="Transaction Details" value={row.txnDetails} onChange={(event) => updateBulkRow(index, "txnDetails", event.target.value)} className="input" />
                  <select value={row.machine} onChange={(event) => updateBulkRow(index, "machine", event.target.value)} className="input">
                    {machineOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input placeholder="Remark" value={row.remark} onChange={(event) => updateBulkRow(index, "remark", event.target.value)} className="input" />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addBulkRow}
            className="mt-4 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 font-medium text-[color:var(--text-primary)]"
          >
            + Add Another Row
          </button>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeBulkModal}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveBulkEntries}
              disabled={bulkSaving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkSaving ? "Saving..." : "Save Entries"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      <AddCardSwipeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditData(null)
        }}
        onSave={async () => {
          await fetchEntries()
          setModalOpen(false)
          setEditData(null)
          setNotice({ type: "success", text: editData ? "Card swipe entry updated successfully." : "Card swipe entry saved successfully." })
        }}
        editData={editData}
        machineOptions={machineOptions}
        paymentMethodOptions={paymentMethodOptions}
        currentUser={user}
      />

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
          title="Add Card Swipe Entry"
          description="Choose whether you want to save one entry or add multiple card swipe entries together."
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
          {
            label: "Add Entry",
            className: "bg-blue-600",
            onClick: openEntryModePrompt,
          },
          {
            label: "Generate Report",
            className: "bg-purple-600",
            onClick: () => setReportOpen(true),
          },
          {
            label: "Delete Month",
            className: "bg-red-600",
            onClick: askDeleteMonth,
          },
        ]}
      />
    </div>
  )
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    blue: { panel: "border-blue-200/70 bg-blue-50/80", value: "text-blue-600" },
    amber: { panel: "border-amber-200/70 bg-amber-50/80", value: "text-amber-600" },
    emerald: { panel: "border-emerald-200/70 bg-emerald-50/80", value: "text-emerald-600" },
    green: { panel: "border-green-200/70 bg-green-50/80", value: "text-green-600" },
    indigo: { panel: "border-indigo-200/70 bg-indigo-50/80", value: "text-indigo-600" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80", value: "text-violet-600" },
    sky: { panel: "border-sky-200/70 bg-sky-50/80", value: "text-sky-600" },
    cyan: { panel: "border-cyan-200/70 bg-cyan-50/80", value: "text-cyan-600" },
    orange: { panel: "border-orange-200/70 bg-orange-50/80", value: "text-orange-600" },
    rose: { panel: "border-rose-200/70 bg-rose-50/80", value: "text-rose-600" },
  }
  const current = tones[tone] || tones.blue

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] ${current.panel}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">{label}</p>
      <p className={`mt-3 text-2xl font-extrabold ${current.value}`}>{value}</p>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
      <p className="text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-1 font-semibold text-[color:var(--text-strong)]">{value}</p>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-[color:var(--text-secondary)]">{label}</span>
      <span className="text-right font-medium text-[color:var(--text-strong)]">{value}</span>
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
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-primary)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-[color:var(--text-primary)]"
          >
            Close
          </button>
        </div>
        {children}
      </div>
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



