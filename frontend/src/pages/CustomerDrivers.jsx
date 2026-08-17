import { useEffect, useState } from "react"
import { Truck } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import AddCustomerDriverModal from "../components/AddCustomerDriverModal"
import MobileActionFab from "../components/MobileActionFab"
import { deleteCustomerDriver, getCustomerDrivers } from "../services/customerDriverApi"

const getCurrentMonth = () => new Date().toISOString().slice(0, 7)
const getEntryDate = (driver = {}) => String(driver.createdAt || driver.updatedAt || "").slice(0, 10)

const getRouteParts = (driver = {}) => {
  if (driver.from || driver.to) {
    return {
      from: driver.from || "-",
      to: driver.to || "-",
    }
  }

  const [from = "", to = ""] = String(driver.route || "").split(" to ")
  return {
    from: from || "-",
    to: to || "-",
  }
}

export default function CustomerDrivers() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")
  const [deleteMonthOpen, setDeleteMonthOpen] = useState(false)
  const [deleteMonthValue, setDeleteMonthValue] = useState(getCurrentMonth())
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [format, setFormat] = useState("pdf")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [openCard, setOpenCard] = useState(null)
  const [toast, setToast] = useState("")

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    const res = await getCustomerDrivers()
    setData(res)
  }

  const handleDelete = async (id) => {
    await deleteCustomerDriver(id)
    loadDrivers()
  }

  const filtered = data.filter((driver) => {
    const matchesSearch = Object.values(driver).join(" ").toLowerCase().includes(search.toLowerCase())
    const matchesDate = !dateFilter || getEntryDate(driver) === dateFilter
    const matchesMonth = !monthFilter || String(driver.createdAt || driver.updatedAt || "").slice(0, 7) === monthFilter
    return matchesSearch && matchesDate && matchesMonth
  })

  const totalDrivers = filtered.length

  const getFilteredByDate = () =>
    filtered.filter((driver) => {
      const createdAt = new Date(driver.createdAt)
      return (
        (!fromDate || createdAt >= new Date(fromDate)) &&
        (!toDate || createdAt <= new Date(toDate))
      )
    })

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    setToast("Copied")
    setTimeout(() => setToast(""), 2000)
  }

  const generatePDF = (filteredData) => {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text("Aastha Enterprises", 14, 18)
    doc.setFontSize(12)
    doc.text("Customer Drivers Report", 14, 26)
    doc.setFontSize(10)
    doc.text(`From: ${fromDate || "All"}  To: ${toDate || "All"}`, 14, 36)
    doc.text(`Total Records: ${filteredData.length}`, 14, 43)

    autoTable(doc, {
      startY: 50,
      head: [["Name", "Number", "Gadi", "Transport", "From", "To", "Carrier", "Remark"]],
      body: filteredData.map((item) => {
        const route = getRouteParts(item)

        return [
          item.name,
          item.number,
          item.gadiNumber,
          item.transportName,
          route.from,
          route.to,
          item.carrierId,
          item.remark,
        ]
      }),
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    })

    doc.save("CustomerDrivers_Report.pdf")
  }

  const generateExcel = (filteredData) => {
    const formatted = filteredData.map((item, index) => ({
      ID: index + 1,
      Name: item.name,
      Number: item.number,
      Gadi: item.gadiNumber,
      Transport: item.transportName,
      From: getRouteParts(item).from,
      To: getRouteParts(item).to,
      Carrier: item.carrierId,
      Remark: item.remark,
    }))

    const ws = XLSX.utils.json_to_sheet(formatted)
    ws["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Drivers Report")
    XLSX.writeFile(wb, "CustomerDrivers_Report.xlsx")
  }

  const handleGenerate = () => {
    const filteredData = getFilteredByDate()

    if (format === "pdf") {
      generatePDF(filteredData)
    } else {
      generateExcel(filteredData)
    }

    setReportOpen(false)
  }

  const deleteSelectedMonth = async () => {
    const targets = data.filter((driver) => String(driver.createdAt || driver.updatedAt || "").slice(0, 7) === deleteMonthValue)

    if (!targets.length) {
      setToast("No customer drivers found for selected month.")
      setTimeout(() => setToast(""), 2200)
      return
    }

    await Promise.all(targets.map((driver) => deleteCustomerDriver(driver._id)))
    setDeleteMonthOpen(false)
    await loadDrivers()
    setToast(`${targets.length} customer drivers deleted.`)
    setTimeout(() => setToast(""), 2200)
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 text-[color:var(--text-primary)] sm:p-6">
      <div className="mb-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-5 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Truck size={22} />
            </div>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-[var(--text-strong)]">Customer Driver Details</h1>
            <span className="hidden rounded-full bg-orange-100 px-3 py-0.5 text-xs font-semibold text-orange-700 sm:inline-flex">
              {totalDrivers} {totalDrivers === 1 ? "driver" : "drivers"}
            </span>
          </div>
          <div className="h-1 w-16 shrink-0 rounded-full bg-orange-200"></div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          placeholder="Search name, number, vehicle, route, carrier"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full lg:max-w-[420px]"
        />

        <div className="hidden gap-3 lg:ml-auto lg:flex">
          <button
            className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm"
            onClick={() => {
              setEditData(null)
              setModalOpen(true)
            }}
          >
            + Add Driver
          </button>
          <button onClick={() => setReportOpen(true)} className="rounded-2xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-sm">
            Generate Report
          </button>
          <button
            onClick={() => {
              setDeleteMonthValue(getCurrentMonth())
              setDeleteMonthOpen(true)
            }}
            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-semibold text-red-500 shadow-sm"
          >
            Delete Month
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="input w-full" />
        <input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className="input w-full" />
        <button type="button" onClick={() => { setDateFilter(""); setMonthFilter(""); setSearch("") }} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)]">
          Clear Filters
        </button>
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 sm:grid-cols-2 lg:hidden">
        <button className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm" onClick={() => { setEditData(null); setModalOpen(true) }}>
          + Add Driver
        </button>
        <button onClick={() => setReportOpen(true)} className="rounded-2xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-sm">
          Generate Report
        </button>
        <button onClick={() => { setDeleteMonthValue(getCurrentMonth()); setDeleteMonthOpen(true) }} className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-semibold text-red-500 shadow-sm sm:col-span-2">
          Delete Month
        </button>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="table min-w-[1080px] text-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Number</th>
              <th>Gadi Number</th>
              <th>Transport Name</th>
              <th>From</th>
              <th>To</th>
              <th>Carrier ID</th>
              <th>Remark</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item, index) => (
              <tr key={item._id} className="transition">
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.number}</td>
                <td>{item.gadiNumber}</td>
                <td>{item.transportName}</td>
                <td>{getRouteParts(item).from}</td>
                <td>{getRouteParts(item).to}</td>
                <td>{item.carrierId}</td>
                <td>{item.remark}</td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="text-blue-400"
                      onClick={() => {
                        setEditData(item)
                        setModalOpen(true)
                      }}
                    >
                      Edit
                    </button>

                    <button onClick={() => handleDelete(item._id)} className="text-red-500">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {filtered.map((item) => {
          const isOpen = openCard === item._id

          return (
            <div
              key={item._id}
              onClick={() => setOpenCard(isOpen ? null : item._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">{item.name}</p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{item.number}</p>
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    copyText(item.number)
                  }}
                  className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-xs text-[color:var(--text-primary)]"
                >
                  Copy
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <InfoPill label="Gadi" value={item.gadiNumber} />
                <InfoPill label="Transport" value={item.transportName} />
                <InfoPill label="From" value={getRouteParts(item).from} />
                <InfoPill label="To" value={getRouteParts(item).to} />
                <InfoPill label="Carrier" value={item.carrierId} />
              </div>

              <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-48 mt-4" : "max-h-0"}`}>
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                    Remark
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--text-primary)]">{item.remark || "-"}</p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditData(item)
                        setModalOpen(true)
                      }}
                      className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                    >
                      Edit
                    </button>

                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDelete(item._id)
                      }}
                      className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {deleteMonthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-primary)]">
            <h2 className="mb-3 text-lg font-semibold text-[color:var(--text-strong)]">Delete Month</h2>
            <p className="mb-4 text-sm text-[color:var(--text-secondary)]">Select a month to delete customer driver records created in that month.</p>
            <input type="month" value={deleteMonthValue} onChange={(event) => setDeleteMonthValue(event.target.value)} className="input w-full" />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDeleteMonthOpen(false)}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
              >
                Cancel
              </button>
              <button onClick={deleteSelectedMonth} className="rounded-xl bg-red-600 px-4 py-2 text-white">
                Delete Month
              </button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-primary)]">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">
              Generate Report
            </h2>

            <p className="mb-3 text-sm text-[color:var(--text-secondary)]">
              Select date range & format
            </p>

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

              <select
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                className="input"
              >
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
      )}

      {toast && (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <MobileActionFab
        actions={[
          {
            label: "Add Driver",
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
            onClick: () => {
              setDeleteMonthValue(getCurrentMonth())
              setDeleteMonthOpen(true)
            },
          },
        ]}
      />

      <AddCustomerDriverModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditData(null)
        }}
        onSave={loadDrivers}
        editData={editData}
      />
    </div>
  )
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[color:var(--text-strong)]">{value || "-"}</p>
    </div>
  )
}

