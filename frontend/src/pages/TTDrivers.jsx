import { useEffect, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import MobileActionFab from "../components/MobileActionFab"
import AddTTDriverModal from "../components/AddTTDriverModal"
import { deleteDriver, getDrivers } from "../services/ttDriverApi"

export default function TTDrivers() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [format, setFormat] = useState("pdf")
  const [openCard, setOpenCard] = useState(null)

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    const res = await getDrivers()
    setData(res)
  }

  const handleDelete = async (id) => {
    await deleteDriver(id)
    loadDrivers()
  }

  const filtered = data.filter((driver) =>
    Object.values(driver).join(" ").toLowerCase().includes(search.toLowerCase()),
  )

  const totalDrivers = filtered.length
  const totalShort = filtered.reduce((sum, driver) => {
    const parsed = Number.parseFloat(String(driver.short || "0").replace(/[^0-9.-]/g, ""))
    return sum + (Number.isNaN(parsed) ? 0 : parsed)
  }, 0)

  const getFilteredByDate = () => {
    return filtered.filter((driver) => {
      const driverDate = new Date(driver.createdAt)

      return (
        (!fromDate || driverDate >= new Date(fromDate)) &&
        (!toDate || driverDate <= new Date(toDate))
      )
    })
  }

  const generatePDF = (filteredData) => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("T.T Drivers Report", 14, 15)

    doc.setFontSize(10)
    doc.text(`From: ${fromDate || "All"} To: ${toDate || "All"}`, 14, 22)
    doc.text(`Total Records: ${filteredData.length}`, 14, 30)

    autoTable(doc, {
      startY: 35,
      head: [["Name", "Number", "T.T Number", "Transport", "Short", "Remark"]],
      body: filteredData.map((driver) => [
        driver.name,
        driver.number,
        driver.ttNumber,
        driver.transportName,
        driver.short,
        driver.remark,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    })

    doc.save("TTDrivers_Report.pdf")
  }

  const generateExcel = (filteredData) => {
    const formatted = filteredData.map((driver, index) => ({
      ID: index + 1,
      Name: driver.name,
      Number: driver.number,
      TT_Number: driver.ttNumber,
      Transport: driver.transportName,
      Short: driver.short,
      Remark: driver.remark,
    }))

    const ws = XLSX.utils.json_to_sheet(formatted)
    ws["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 10 },
      { wch: 20 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "TT Drivers")
    XLSX.writeFile(wb, "TTDrivers_Report.xlsx")
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
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 sm:p-6 text-[color:var(--text-primary)]">
      <h1 className="mb-4 text-xl font-bold text-[color:var(--text-strong)]">T.T Driver Details</h1>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)]">
          <p className="text-sm text-[color:var(--text-secondary)]">Total Drivers</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {totalDrivers}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)]">
          <p className="text-sm text-[color:var(--text-secondary)]">Total Short</p>
          <p
            className={`mt-3 text-2xl font-semibold ${
              totalShort < 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {totalShort}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[420px]"
        />

        <button
          className="w-full rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:w-auto"
          onClick={() => {
            setEditData(null)
            setModalOpen(true)
          }}
        >
          + Add Driver
        </button>

        <button
          onClick={() => setReportOpen(true)}
          className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm sm:w-auto"
        >
          Generate Report
        </button>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="table min-w-[960px] text-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Number</th>
              <th>T.T Number</th>
              <th>Transport Name</th>
              <th>Short</th>
              <th>Remark</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((driver, index) => (
              <tr key={driver._id}>
                <td>{index + 1}</td>
                <td>{driver.name}</td>
                <td>{driver.number}</td>
                <td>{driver.ttNumber}</td>
                <td>{driver.transportName}</td>
                <td className={driver.short?.includes("-") ? "text-red-500" : "text-green-500"}>
                  {driver.short}
                </td>
                <td>{driver.remark}</td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="text-blue-500 hover:text-blue-400"
                      onClick={() => {
                        setEditData(driver)
                        setModalOpen(true)
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(driver._id)}
                      className="text-red-500 hover:text-red-400"
                    >
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
        {filtered.map((driver) => {
          const isOpen = openCard === driver._id

          return (
            <div
              key={driver._id}
              onClick={() => setOpenCard(isOpen ? null : driver._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[color:var(--text-secondary)]">Driver</p>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                    {driver.name}
                  </p>
                </div>

                <p
                  className={`text-sm font-bold ${
                    driver.short?.includes("-") ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {driver.short}
                </p>
              </div>

              <div className="mt-3 space-y-1 text-sm text-[color:var(--text-secondary)]">
                <p>{driver.number}</p>
                <p>{driver.ttNumber}</p>
              </div>

              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Transport:{" "}
                    <span className="text-[color:var(--text-strong)]">{driver.transportName}</span>
                  </p>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Remark: <span className="text-[color:var(--text-strong)]">{driver.remark || "-"}</span>
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditData(driver)
                        setModalOpen(true)
                      }}
                      className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                    >
                      Edit
                    </button>

                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDelete(driver._id)
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

      <AddTTDriverModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditData(null)
        }}
        onSave={loadDrivers}
        editData={editData}
      />

      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-primary)]">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">
              Generate Report
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
              <button onClick={() => setReportOpen(false)} className="rounded-xl bg-gray-500 px-4 py-2 text-white">
                Cancel
              </button>

              <button onClick={handleGenerate} className="rounded-xl bg-green-600 px-4 py-2 text-white">
                Download
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
    </div>
  )
}
