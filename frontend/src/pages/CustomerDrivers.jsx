import { useEffect, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import AddCustomerDriverModal from "../components/AddCustomerDriverModal"
import MobileActionFab from "../components/MobileActionFab"
import { deleteCustomerDriver, getCustomerDrivers } from "../services/customerDriverApi"

export default function CustomerDrivers() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [format, setFormat] = useState("pdf")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [openCard, setOpenCard] = useState(null)
  const [copied, setCopied] = useState(false)

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

  const filtered = data.filter((driver) =>
    Object.values(driver).join(" ").toLowerCase().includes(search.toLowerCase()),
  )

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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      head: [["Name", "Number", "Gadi", "Transport", "Route", "Carrier", "Remark"]],
      body: filteredData.map((item) => [
        item.name,
        item.number,
        item.gadiNumber,
        item.transportName,
        item.route,
        item.carrierId,
        item.remark,
      ]),
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
      Route: item.route,
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

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 text-[color:var(--text-primary)] sm:p-6">
      <h1 className="mb-4 text-xl font-bold text-[color:var(--text-strong)]">
        Customer Driver Details
      </h1>

      <div className="mb-5 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)]">
        <p className="text-sm text-[color:var(--text-secondary)]">Total Customer Drivers</p>
        <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
          {totalDrivers}
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:w-72"
        />

        <button
          className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
          onClick={() => {
            setEditData(null)
            setModalOpen(true)
          }}
        >
          + Add Driver
        </button>

        <button
          onClick={() => setReportOpen(true)}
          className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          Generate Report
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
              <th>Route</th>
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
                <td>{item.route}</td>
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
                <InfoPill label="Route" value={item.route} />
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

      {copied && (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
          Copied
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
