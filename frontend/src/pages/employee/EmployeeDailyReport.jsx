import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import DailyReportEditor from "../../components/daily-report/DailyReportEditor"
import {
  addMyDailyReport,
  getMyDailyReports,
  updateMyDailyReport,
} from "../../services/dailyReportApi"
import {
  createDailyReportForm,
  exportDailyReportPdf,
  formatDailyReportDate,
  hydrateDailyReport,
  toDailyReportPayload,
} from "../../lib/dailyReport"

export default function EmployeeDailyReport() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [form, setForm] = useState(createDailyReportForm(user?.name || ""))
  const [editing, setEditing] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const load = async () => {
    const data = await getMyDailyReports()
    setReports(data)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setForm((current) => ({
      ...current,
      employeeName: user?.name || "",
    }))
  }, [user?.name])

  useEffect(() => {
    if (!feedback) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setFeedback(null)
    }, 2600)

    return () => window.clearTimeout(timer)
  }, [feedback])

  const handleSubmit = async () => {
    try {
      const payload = toDailyReportPayload(form, user?.name)

      if (editing) {
        await updateMyDailyReport(editing._id, payload)
      } else {
        await addMyDailyReport(payload)
      }

      setFeedback({
        tone: "success",
        title: editing ? "Daily sheet update ho gayi" : "Daily sheet submit ho gayi",
        message: "Report save ho kar admin aur manager view me ready hai.",
      })
      setEditing(null)
      setForm(createDailyReportForm(user?.name || ""))
      load()
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Submit nahi ho paya",
        message: error?.response?.data?.message || "Please dobara try karo.",
      })
    }
  }

  const openReport = (report) => {
    if (editing?._id === report._id) {
      setEditing(null)
      setForm(createDailyReportForm(user?.name || ""))
      return
    }

    setEditing(report)
    setForm(hydrateDailyReport(report))
  }

  const readOnly = Boolean(editing && !editing.canEdit)

  return (
    <div className="space-y-4 px-3 pb-6 pt-4 sm:space-y-6 sm:p-6">
      {feedback ? <FloatingNotice feedback={feedback} onClose={() => setFeedback(null)} /> : null}

      <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">My Daily Sheet</h1>
            <p className="mt-2 text-sm text-gray-400">
              Daily forecourt report mobile-friendly form me fill karo. Entry 2 din tak editable
              rahegi, uske baad sirf view mode me khulegi.
            </p>
          </div>

          <button
            onClick={() => {
              setEditing(null)
              setForm(createDailyReportForm(user?.name || ""))
            }}
            className="rounded-xl border border-[#1F2937] bg-[#04060B] px-4 py-3 text-sm text-gray-200"
          >
            New Daily Sheet
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${isHistoryOpen ? "xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-6" : ""}`}>
        <section className={`rounded-2xl border border-[#1F2937] bg-[#0B0F17] ${isHistoryOpen ? "p-4 sm:p-5" : "p-0"} ${isHistoryOpen ? "order-2 xl:order-1" : "order-2"}`}>
          <button
            type="button"
            onClick={() => setIsHistoryOpen((current) => !current)}
            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5 sm:py-4 ${isHistoryOpen ? "border-b border-[#1F2937]" : ""}`}
          >
            <div>
              <h2 className="text-lg font-semibold text-white">Submitted Sheets</h2>
              <p className="mt-1 text-xs text-gray-500">
                {reports.length ? `${reports.length} saved sheet available` : "No sheet saved yet"}
              </p>
            </div>
            <ChevronDown
              size={18}
              className={`shrink-0 text-gray-400 transition-transform ${isHistoryOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isHistoryOpen ? (
            <div className="pt-4 space-y-3">
              {reports.length ? (
                reports.map((report) => (
                  <button
                    key={report._id}
                    onClick={() => openReport(report)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      editing?._id === report._id
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-[#1F2937] bg-[#04060B] hover:border-green-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {formatDailyReportDate(report.reportDate)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{report.shift || "No shift"}</p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${
                          report.canEdit
                            ? "border-green-500/30 bg-green-500/10 text-green-300"
                            : "border-blue-500/30 bg-blue-500/10 text-blue-200"
                        }`}
                      >
                        {report.canEdit ? "Edit" : "View"}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">No daily sheets submitted yet.</p>
              )}
            </div>
          ) : null}
        </section>

        <div className={`min-w-0 ${isHistoryOpen ? "order-2 xl:order-1" : "order-2"}`}>
          <DailyReportEditor
            form={form}
            setForm={setForm}
            employeeName={user?.name || "Employee"}
            readOnly={readOnly}
            submitLabel={
              editing ? (readOnly ? "View Only" : "Update Daily Sheet") : "Submit Daily Sheet"
            }
            onSubmit={readOnly ? undefined : handleSubmit}
            onExportPdf={() => exportDailyReportPdf(form, user?.name || "Employee")}
          />
        </div>
      </div>
    </div>
  )
}

function FloatingNotice({ feedback, onClose }) {
  const isSuccess = feedback.tone === "success"

  return (
    <div className="fixed right-3 top-3 z-[70] w-[calc(100%-24px)] max-w-sm rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-4 shadow-2xl sm:right-6 sm:top-6">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 h-3 w-3 rounded-full ${isSuccess ? "bg-green-400" : "bg-red-400"}`}
        />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${isSuccess ? "text-green-300" : "text-red-300"}`}>
            {feedback.title}
          </p>
          <p className="mt-1 text-sm text-gray-300">{feedback.message}</p>
        </div>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-white">
          Close
        </button>
      </div>
    </div>
  )
}
