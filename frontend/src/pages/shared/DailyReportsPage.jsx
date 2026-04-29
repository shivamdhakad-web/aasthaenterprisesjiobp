import { useEffect, useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import DailyReportEditor from "../../components/daily-report/DailyReportEditor"
import { getDailyReports, updateDailyReport } from "../../services/dailyReportApi"
import { getEmployeeChoices } from "../../services/authApi"
import {
  exportDailyReportPdf,
  formatDailyReportDate,
  hydrateDailyReport,
  toDailyReportPayload,
} from "../../lib/dailyReport"
import { ChevronDown } from "lucide-react"

export default function DailyReportsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "Admin"
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [form, setForm] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [isReportsOpen, setIsReportsOpen] = useState(false)

  const load = async (employeeId = selectedEmployeeId) => {
    const data = await getDailyReports(employeeId ? { employeeId } : {})
    setReports(data)

    if (selectedReport) {
      const fresh = data.find((item) => item._id === selectedReport._id)
      if (fresh) {
        setSelectedReport(fresh)
        setForm(hydrateDailyReport(fresh))
      }
    }
  }

  useEffect(() => {
    getEmployeeChoices().then(setEmployees).catch(() => setEmployees([]))
  }, [])

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!feedback) {
      return undefined
    }

    const timer = window.setTimeout(() => setFeedback(null), 2400)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const handleSelectReport = (report) => {
    if (selectedReport?._id === report._id) {
      setSelectedReport(null)
      setForm(null)
      return
    }

    setSelectedReport(report)
    setForm(hydrateDailyReport(report))
  }

  const handleSave = async () => {
    if (!selectedReport || !isAdmin) {
      return
    }

    await updateDailyReport(selectedReport._id, toDailyReportPayload(form, selectedReport.employeeName))
    await load()
    setFeedback({
      title: "Report update ho gayi",
      message: "Admin changes successfully save ho gaye.",
    })
  }

  return (
    <div className="space-y-4 px-3 pb-6 pt-4 sm:space-y-6 sm:p-6">
      {feedback ? <AdminNotice feedback={feedback} onClose={() => setFeedback(null)} /> : null}

      <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Employee Daily Reports</h1>
            <p className="mt-2 text-sm text-gray-400">
              Employee shift sheets are available here employee-wise. PDF exports are also available in a compact 2-page format.
            </p>
          </div>

          <div className="w-full max-w-[320px]">
            <select
              value={selectedEmployeeId}
              onChange={(event) => {
                const employeeId = event.target.value
                setSelectedEmployeeId(employeeId)
                setSelectedReport(null)
                setForm(null)
                load(employeeId)
              }}
              className="input"
            >
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${isReportsOpen ? "xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-6" : ""}`}>
          <section className={`
                rounded-2xl border border-[#1F2937] bg-[#0B0F17]
                ${isReportsOpen ? "p-4 sm:p-5 order-2 xl:order-1" : "p-0 order-1"}
              `}>
                <button
                  type="button"
                  onClick={() => setIsReportsOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left sm:px-5 sm:py-4 ${
                    isReportsOpen ? "border-b border-[#1F2937]" : ""
                  }`}
                >
                  <h2 className="text-lg font-semibold text-white">Available Reports</h2>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${
                      isReportsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isReportsOpen && (
                  <div className="pt-4 space-y-3 px-4 sm:px-0">
                    {reports.length ? (
                      reports.map((report) => (
                        <button
                          key={report._id}
                          onClick={() => handleSelectReport(report)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                            selectedReport?._id === report._id
                              ? "border-blue-500/40 bg-blue-500/10"
                              : "border-[#1F2937] bg-[#04060B] hover:border-blue-500/20"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {report.employeeName}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {formatDailyReportDate(report.reportDate)} - {report.shift || "No shift"}
                              </p>
                            </div>
                            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-300">
                              Rs. {Math.round(report.totals?.totalCollection || 0)}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No daily reports available yet.</p>
                    )}
                  </div>
                )}
          </section>

        {form && selectedReport ? (
          <div className={`min-w-0 ${isReportsOpen ? "order-1 xl:order-2" : "order-2"}`}>
            <DailyReportEditor
              form={form}
              setForm={setForm}
              employeeName={selectedReport.employeeName}
              readOnly={!isAdmin}
              submitLabel={isAdmin ? "Update Report" : undefined}
              onSubmit={isAdmin ? handleSave : undefined}
              onExportPdf={() => exportDailyReportPdf(form, selectedReport.employeeName)}
            />
          </div>
        ) : (
          <section className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5 sm:p-6">
            <p className="text-sm text-gray-400">Select an employee daily report to view details.</p>
          </section>
        )}
      </div>
    </div>
  )
}

function AdminNotice({ feedback, onClose }) {
  return (
    <div className="fixed right-3 top-3 z-[70] w-[calc(100%-24px)] max-w-sm rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-4 shadow-2xl sm:right-6 sm:top-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-3 w-3 rounded-full bg-green-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-green-300">{feedback.title}</p>
          <p className="mt-1 text-sm text-gray-300">{feedback.message}</p>
        </div>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-white">
          Close
        </button>
      </div>
    </div>
  )
}
