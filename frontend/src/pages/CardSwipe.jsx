import { useEffect, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../components/MobileActionFab"
import AddCardSwipeModal from "../components/AddCardSwipeModal"
import { deleteEntry, deleteMonth, getEntries } from "../services/cardSwipeApi"

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

const formatDateTime = (entry) => {
  const dateText = entry.date ? new Date(entry.date).toLocaleDateString() : "-"
  return `${dateText} ${entry.time || ""}`.trim()
}

export default function CardSwipe() {
  const [entries, setEntries] = useState([])
  const [search, setSearch] = useState("")
  const [month, setMonth] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
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

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    const data = await getEntries()
    setEntries(data)
  }

  const getSummary = (data) => {
    let totalAmount = 0
    let totalCharges = 0
    let cash = 0
    let online = 0
    let self = 0
    let dsm = 0

    data.forEach((entry) => {
      const amount = Number(entry.amount || 0)
      const charges = Number(entry.charges || 0)

      totalAmount += amount
      totalCharges += charges

      if (entry.paymentMethod === "Cash") cash += amount
      if (entry.paymentMethod === "Online") online += amount
      if (entry.machine === "Self") self += amount
      if (entry.machine === "DSM") dsm += amount
    })

    return {
      totalAmount,
      totalCharges,
      net: totalAmount - totalCharges,
      cash,
      online,
      self,
      dsm,
      count: data.length,
    }
  }

  const filteredEntries = entries.filter((entry) => {
    const target = [
      entry.machine,
      entry.paymentMethod,
      entry.remark,
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
  })

  const summary = getSummary(filteredEntries)

  const getReportData = () => {
    return filteredEntries.filter((entry) => {
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
  }

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
    doc.setFontSize(12)
    doc.text("Summary", 14, 40)
    doc.setFontSize(10)
    doc.text(`Total Swipe: ${formatCurrency(reportSummary.totalAmount)}`, 14, 48)
    doc.text(`Total Charges: ${formatCurrency(reportSummary.totalCharges)}`, 14, 54)
    doc.text(`Cash: ${formatCurrency(reportSummary.cash)}`, 120, 48)
    doc.text(`Online: ${formatCurrency(reportSummary.online)}`, 120, 54)
    doc.text(`Self: ${formatCurrency(reportSummary.self)}`, 120, 60)
    doc.text(`DSM: ${formatCurrency(reportSummary.dsm)}`, 120, 66)
    doc.text(`Transactions: ${reportSummary.count}`, 14, 68)

    autoTable(doc, {
      startY: 75,
      head: [["Date", "Time", "Amount", "Charges", "Machine", "Payment"]],
      body: data.map((entry) => [
        entry.date ? new Date(entry.date).toLocaleDateString() : "-",
        entry.time,
        formatCurrency(entry.amount),
        formatCurrency(entry.charges),
        entry.machine,
        entry.paymentMethod,
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
      Date: entry.date ? new Date(entry.date).toLocaleDateString() : "-",
      Time: entry.time,
      Amount: entry.amount,
      Charges: entry.charges,
      Machine: entry.machine,
      Payment: entry.paymentMethod,
      Remark: entry.remark,
    }))

    const ws = XLSX.utils.json_to_sheet(formatted)
    const summarySheet = XLSX.utils.json_to_sheet([reportSummary])
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, "Data")
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary")
    XLSX.writeFile(wb, "CardSwipe_Report.xlsx")
  }

  const handleGenerate = () => {
    const reportData = getReportData()

    if (!reportData.length) {
      alert("No data found")
      return
    }

    if (format === "pdf") {
      generatePDF(reportData)
    } else {
      generateExcel(reportData)
    }

    setReportOpen(false)
  }

  const removeEntry = async (id) => {
    await deleteEntry(id)
    fetchEntries()
  }

  const removeMonth = async () => {
    if (!month) {
      alert("Select month")
      return
    }

    const [year, selectedMonth] = month.split("-")
    await deleteMonth(year, selectedMonth)
    fetchEntries()
  }

  const clearFilters = () => {
    setSearch("")
    setMonth("")
    setStartDate("")
    setEndDate("")
    setMachine("")
    setPaymentMethod("")
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 sm:p-6 text-[color:var(--text-primary)]">
      <h1 className="mb-4 text-3xl font-bold text-[color:var(--text-strong)]">Card Swipe Register</h1>

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-3">
        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total Swipe</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(summary.totalAmount)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total Charges</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(summary.totalCharges)}
          </p>
        </div>

        <div className="card col-span-2 xl:col-span-1">
          <p className="text-sm text-[color:var(--text-secondary)]">Transactions</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {summary.count}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Cash</p>
          <p className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(summary.cash)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Online</p>
          <p className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(summary.online)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Self</p>
          <p className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(summary.self)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">DSM</p>
          <p className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(summary.dsm)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search swipe, machine, remark"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[420px]"
        />

        <button
          onClick={() => setReportOpen(true)}
          className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          Generate Report
        </button>

        <button
          className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
          onClick={() => {
            setEditData(null)
            setModalOpen(true)
          }}
        >
          + Add Entry
        </button>
      </div>

      <div className="hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 sm:block">
        <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
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
            <option value="Self">Self</option>
            <option value="DSM">DSM</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="input"
          >
            <option value="">Both Payment</option>
            <option value="Cash">Cash</option>
            <option value="Online">Online</option>
          </select>

          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input" />

          <div className="grid grid-cols-2 gap-3">
            <button
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]"
              onClick={clearFilters}
            >
              Clear
            </button>

            <button className="btn btn-red" onClick={removeMonth}>
              Delete Month
            </button>
          </div>
        </div>
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
              <option value="Self">Self</option>
              <option value="DSM">DSM</option>
            </select>

            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="input"
            >
              <option value="">Both Payment</option>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
            </select>

            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input" />

            <button
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto sm:block mt-4">
        <table className="table min-w-[1040px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Amount</th>
              <th>Charges</th>
              <th>Machine</th>
              <th>Payment</th>
              <th>Remark</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry._id}>
                <td>{entry.date ? new Date(entry.date).toLocaleDateString() : "-"}</td>
                <td>{entry.time}</td>
                <td>{formatCurrency(entry.amount)}</td>
                <td className="text-green-500">{formatCurrency(entry.charges)}</td>
                <td>{entry.machine}</td>
                <td>{entry.paymentMethod}</td>
                <td>{entry.remark || "-"}</td>
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

                    <button className="text-red-500" onClick={() => removeEntry(entry._id)}>
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
        {filteredEntries.map((entry) => {
          const isOpen = openCard === entry._id

          return (
            <div
              key={entry._id}
              onClick={() => setOpenCard(isOpen ? null : entry._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                    {formatCurrency(entry.amount)}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{formatDateTime(entry)}</p>
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

              <div className="mt-3 text-sm text-[color:var(--text-secondary)]">
                <p>Machine: {entry.machine}</p>
                <p>Charges: {formatCurrency(entry.charges)}</p>
              </div>

              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Remark: <span className="text-[color:var(--text-strong)]">{entry.remark || "-"}</span>
                  </p>

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
                        removeEntry(entry._id)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-primary)]">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">Generate Report</h2>

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

              <select
                value={reportMachine}
                onChange={(event) => setReportMachine(event.target.value)}
                className="input"
              >
                <option value="">All Machine</option>
                <option value="Self">Self</option>
                <option value="DSM">DSM</option>
              </select>

              <select
                value={reportPayment}
                onChange={(event) => setReportPayment(event.target.value)}
                className="input"
              >
                <option value="">All Payment</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
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
          </div>
        </div>
      ) : null}

      <AddCardSwipeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditData(null)
        }}
        onSave={() => {
          fetchEntries()
          setModalOpen(false)
          setEditData(null)
        }}
        editData={editData}
      />

      <MobileActionFab
        actions={[
          {
            label: "Add Entry",
            className: "bg-blue-600",
            onClick: () => {
              setEditData(null)
              setModalOpen(true)
            },
          },
          {
            label: "Generate Report",
            className: "bg-purple-600",
            onClick: () => setReportOpen(true),
          },
          {
            label: "Delete Month",
            className: "bg-red-600",
            onClick: removeMonth,
          },
        ]}
      />
    </div>
  )
}
