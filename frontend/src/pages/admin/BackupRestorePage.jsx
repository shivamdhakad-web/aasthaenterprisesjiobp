import { useEffect, useMemo, useState } from "react"
import {
  Archive,
  CalendarDays,
  DatabaseBackup,
  Download,
  Eye,
  FileArchive,
  FileJson,
  GitCompare,
  Lock,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
  Upload,
  X,
  Zap,
} from "lucide-react"
import {
  compareBackups,
  createBackup,
  deleteBackup,
  emergencyRestoreLatest,
  getBackupLogs,
  getBackupDownloadUrl,
  getBackups,
  getRestoreDiff,
  healthCheckBackup,
  previewStoredBackup,
  previewStoredBackupWithPassword,
  previewUploadedBackup,
  restoreBackup,
  toggleBackupLock,
} from "../../services/backupApi"
import { getStoredToken } from "../../lib/session"

const formatBytes = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${bytes} B`
}

const formatDateTime = (value) => {
  if (!value) return "-"
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const fileToContent = (file, format) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Unable to read backup file"))
    reader.onload = () => {
      if (format === "zip") {
        const result = String(reader.result || "")
        resolve(result.split(",")[1] || "")
      } else {
        resolve(String(reader.result || ""))
      }
    }
    if (format === "zip") reader.readAsDataURL(file)
    else reader.readAsText(file)
  })

const backupScopeOptions = [
  { value: "full", label: "Full Backup" },
  { value: "dashboard", label: "Dashboard" },
  { value: "approvals", label: "Approvals" },
  { value: "notifications", label: "Notifications" },
  { value: "dailyReports", label: "Daily Reports" },
  { value: "meterReadings", label: "Meter Readings" },
  { value: "tankerDeliveries", label: "Tanker Deliveries" },
  { value: "employees", label: "Employees" },
  { value: "employeeAttendanceDashboard", label: "Employee Attendance Dashboard" },
  { value: "leaves", label: "Leave Management" },
  { value: "shifts", label: "Shift Schedule" },
  { value: "tasks", label: "Task Assignments" },
  { value: "creditCustomers", label: "Credit Customers" },
  { value: "expenses", label: "Expenses" },
  { value: "lubricants", label: "Lubricants" },
  { value: "mobileDispenser", label: "Mobile Dispenser" },
  { value: "cardSwipe", label: "Card Swipe" },
  { value: "dcd", label: "D.C.D" },
  { value: "mdu", label: "M.D.U" },
  { value: "invoiceDetails", label: "Invoice Details" },
  { value: "dailySales", label: "Daily Sales" },
  { value: "financeDashboard", label: "Finance Dashboard" },
  { value: "smartCalculator", label: "Smart Calculator" },
  { value: "densityCalculator", label: "Density Calculator" },
  { value: "ttDrivers", label: "TT Drivers" },
  { value: "customerDrivers", label: "Customer Drivers" },
  { value: "secureNotes", label: "Secure Notes" },
  { value: "reminder", label: "Reminder" },
  { value: "storage", label: "Storage" },
  { value: "loginSessions", label: "Login Sessions" },
  { value: "backupRestore", label: "Backup & Restore" },
  { value: "billGenerator", label: "Bill Generator" },
  { value: "aiChat", label: "AI Chat" },
  { value: "settings", label: "Settings" },
]

function MetricCard({ label, value, icon: Icon, tone }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
          {label}
        </p>
        <Icon size={18} />
      </div>
      <p className="mt-3 text-2xl font-black text-[color:var(--text-strong)]">{value}</p>
    </div>
  )
}

function PreviewPanel({ preview }) {
  if (!preview) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] p-6 text-center text-sm font-bold text-[color:var(--text-secondary)]">
        Create or upload a backup to preview collections and sample data.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Scope</p>
          <p className="mt-1 text-sm font-black text-[color:var(--text-strong)]">{preview.metadata?.scope || "full"}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Collections</p>
          <p className="mt-1 text-sm font-black text-[color:var(--text-strong)]">{preview.totalCollections || 0}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Records</p>
          <p className="mt-1 text-sm font-black text-[color:var(--text-strong)]">{preview.totalRecords || 0}</p>
        </div>
      </div>
      {(preview.metadata?.dateRange?.from || preview.metadata?.dateRange?.to) ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-3 text-xs font-bold text-blue-700">
          Date range: {preview.metadata.dateRange.from ? formatDateTime(preview.metadata.dateRange.from) : "Start"} to{" "}
          {preview.metadata.dateRange.to ? formatDateTime(preview.metadata.dateRange.to) : "End"}
        </div>
      ) : null}

      <div className="max-h-[360px] overflow-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)]">
        {(preview.collections || []).map((collection) => (
          <div key={collection.name} className="border-b border-[var(--border-color)] p-4 last:border-b-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-[color:var(--text-strong)]">{collection.name}</p>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600">
                {collection.records} records
              </span>
            </div>
            <pre className="mt-3 max-h-32 overflow-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-100">
              {JSON.stringify(collection.sample?.[0] || {}, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BackupRestorePage() {
  const [backups, setBackups] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [format, setFormat] = useState("json")
  const [scope, setScope] = useState("full")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [note, setNote] = useState("")
  const [backupPassword, setBackupPassword] = useState("")
  const [uploadPassword, setUploadPassword] = useState("")
  const [previewPassword, setPreviewPassword] = useState("")
  const [preview, setPreview] = useState(null)
  const [uploadPayload, setUploadPayload] = useState(null)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [selectedCollections, setSelectedCollections] = useState([])
  const [restoreDiff, setRestoreDiff] = useState(null)
  const [logs, setLogs] = useState([])
  const [leftCompareId, setLeftCompareId] = useState("")
  const [rightCompareId, setRightCompareId] = useState("")
  const [comparison, setComparison] = useState([])
  const [masterPassword, setMasterPassword] = useState("")
  const [restoreMode, setRestoreMode] = useState("replace")
  const [message, setMessage] = useState("")

  const lastBackup = useMemo(() => backups[0], [backups])

  const loadBackups = async () => {
    try {
      const data = await getBackups()
      setBackups(data.backups || [])
      setSummary(data.summary || null)
      const logsData = await getBackupLogs()
      setLogs(logsData.logs || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBackups()
  }, [])

  const handleCreateBackup = async () => {
    setBusy("create")
    setMessage("")
    try {
      const data = await createBackup({ format, scope, fromDate, toDate, note, backupPassword })
      setPreview(data.preview)
      setSelectedCollections((data.preview?.collections || []).map((collection) => collection.name))
      setMessage(data.message || "Backup created successfully.")
      setBackupPassword("")
      await loadBackups()
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to create backup.")
    } finally {
      setBusy("")
    }
  }

  const handleDownload = async (backup) => {
    const token = getStoredToken()
    const response = await fetch(getBackupDownloadUrl(backup._id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = backup.fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleUploadPreview = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const nextFormat = file.name.toLowerCase().endsWith(".zip") ? "zip" : "json"
    setBusy("upload")
    setMessage("")
    try {
      const content = await fileToContent(file, nextFormat)
      const payload = { format: nextFormat, content, passwordProtected: Boolean(uploadPassword.trim()), backupPassword: uploadPassword }
      const data = await previewUploadedBackup(payload)
      setUploadPayload(payload)
      setPreview(data.preview)
      setSelectedCollections((data.preview?.collections || []).map((collection) => collection.name))
      setMessage("Uploaded backup preview is ready.")
    } catch (error) {
      setUploadPayload(null)
      setPreview(null)
      setMessage(error?.response?.data?.message || error.message || "Unable to preview backup.")
    } finally {
      setBusy("")
      event.target.value = ""
    }
  }

  const handleStoredPreview = async (backup) => {
    setBusy(`preview-${backup._id}`)
    try {
      const data = backup.passwordProtected
        ? await previewStoredBackupWithPassword(backup._id, previewPassword)
        : await previewStoredBackup(backup._id)
      setPreview(data.preview)
      setSelectedCollections((data.preview?.collections || []).map((collection) => collection.name))
      setUploadPayload(null)
    } finally {
      setBusy("")
    }
  }

  const openRestore = (backup = null) => {
    setRestoreTarget(
      backup
        ? { backupId: backup._id, label: backup.fileName, backupPassword: previewPassword }
        : { ...uploadPayload, label: "Uploaded backup" },
    )
    setMasterPassword("")
    setRestoreDiff(null)
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    setBusy("restore")
    setMessage("")
    try {
      const data = await restoreBackup({ ...restoreTarget, masterPassword, mode: restoreMode, collections: selectedCollections })
      setMessage(data.message || "Backup restored successfully.")
      setRestoreTarget(null)
      await loadBackups()
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to restore backup.")
    } finally {
      setBusy("")
    }
  }

  const handleDelete = async (backup) => {
    setBusy(`delete-${backup._id}`)
    try {
      await deleteBackup(backup._id)
      if (restoreTarget?.backupId === backup._id) setRestoreTarget(null)
      await loadBackups()
    } finally {
      setBusy("")
    }
  }

  const applyPreset = (preset) => {
    const today = new Date()
    const toIsoDate = (date) => date.toISOString().slice(0, 10)
    if (preset === "today") {
      setFromDate(toIsoDate(today))
      setToDate(toIsoDate(today))
    }
    if (preset === "month") {
      setFromDate(toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)))
      setToDate(toIsoDate(today))
    }
    if (preset === "lastMonth") {
      setFromDate(toIsoDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)))
      setToDate(toIsoDate(new Date(today.getFullYear(), today.getMonth(), 0)))
    }
    if (preset === "year") {
      const financialYearStart = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
      setFromDate(toIsoDate(new Date(financialYearStart, 3, 1)))
      setToDate(toIsoDate(today))
    }
  }

  const handleHealthCheck = async (backup = null) => {
    setBusy(backup ? `health-${backup._id}` : "health-upload")
    try {
      const payload = backup
        ? { backupId: backup._id, backupPassword: previewPassword }
        : uploadPayload
      const data = await healthCheckBackup(payload)
      setMessage(data.healthy ? "Backup health check passed." : data.message)
    } catch (error) {
      setMessage(error?.response?.data?.message || "Backup health check failed.")
    } finally {
      setBusy("")
    }
  }

  const handleCheckDiff = async () => {
    if (!restoreTarget) return
    setBusy("diff")
    try {
      const data = await getRestoreDiff(restoreTarget)
      setRestoreDiff(data.diff)
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to check restore impact.")
    } finally {
      setBusy("")
    }
  }

  const handleToggleLock = async (backup) => {
    setBusy(`lock-${backup._id}`)
    try {
      await toggleBackupLock(backup._id)
      await loadBackups()
    } finally {
      setBusy("")
    }
  }

  const handleCompare = async () => {
    if (!leftCompareId || !rightCompareId || leftCompareId === rightCompareId) {
      setMessage("Please choose two different backups to compare.")
      return
    }
    setBusy("compare")
    try {
      const data = await compareBackups({ leftBackupId: leftCompareId, rightBackupId: rightCompareId })
      setComparison(data.comparison || [])
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to compare backups.")
    } finally {
      setBusy("")
    }
  }

  const handleEmergencyRestore = async () => {
    setBusy("emergency")
    try {
      const data = await emergencyRestoreLatest({ masterPassword })
      setMessage(data.message || "Emergency restore completed.")
      await loadBackups()
    } catch (error) {
      setMessage(error?.response?.data?.message || "Emergency restore failed.")
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 overflow-x-hidden p-4 font-sans sm:p-6 lg:p-5">
      <section className="rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <DatabaseBackup size={24} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">
                Admin Safety
              </p>
              <h1 className="text-2xl font-black tracking-tight text-[color:var(--text-strong)]">
                Backup & Restore
              </h1>
              <p className="text-sm font-medium text-[color:var(--text-secondary)]">
                Create JSON or ZIP backups, preview data, and restore with master password protection.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadBackups}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] transition hover:bg-[var(--bg-hover)]"
          >
            <RefreshCw size={17} className={loading ? "animate-spin text-emerald-600" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Backups" value={summary?.totalBackups || 0} icon={Archive} tone="border-emerald-200 bg-emerald-50/80 text-emerald-600" />
        <MetricCard label="Last Backup" value={formatDateTime(summary?.lastBackupAt)} icon={DatabaseBackup} tone="border-blue-200 bg-blue-50/80 text-blue-600" />
        <MetricCard label="Last Size" value={formatBytes(summary?.lastBackupSize || 0)} icon={FileArchive} tone="border-violet-200 bg-violet-50/80 text-violet-600" />
        <MetricCard label="Restore Ready" value={summary?.restoreAvailable ? "Yes" : "No"} icon={ShieldAlert} tone="border-amber-200 bg-amber-50/80 text-amber-600" />
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <section className="space-y-4 rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
          <div>
            <h2 className="text-lg font-black text-[color:var(--text-strong)]">Create Backup</h2>
            <p className="text-xs font-medium text-[color:var(--text-secondary)]">Choose format and scope before generating a backup.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {["json", "zip"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFormat(item)}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black uppercase ${
                  format === item
                    ? "border-emerald-500 bg-emerald-500 text-gray-50"
                    : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-strong)]"
                }`}
              >
                {item === "json" ? <FileJson size={17} /> : <FileArchive size={17} />}
                {item}
              </button>
            ))}
          </div>

          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
          >
            {backupScopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            {[
              ["today", "Today"],
              ["month", "This Month"],
              ["lastMonth", "Last Month"],
              ["year", "Financial Year"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => applyPreset(value)}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-black text-[color:var(--text-strong)]"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                <CalendarDays size={13} />
                From Date
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                <CalendarDays size={13} />
                To Date
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              setFromDate("")
              setToDate("")
            }}
            className="text-left text-xs font-black text-emerald-600"
          >
            Clear date range
          </button>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Backup note, for example: Before salary update"
            className="w-full resize-none rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
          />

          <input
            type="password"
            value={backupPassword}
            onChange={(event) => setBackupPassword(event.target.value)}
            placeholder="Optional backup password"
            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
          />

          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={busy === "create"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-gray-50 shadow-lg shadow-emerald-600/20 disabled:opacity-60"
          >
            {busy === "create" ? <Loader2 size={18} className="animate-spin" /> : <DatabaseBackup size={18} />}
            Create Backup
          </button>

          <div className="border-t border-[var(--border-color)] pt-4">
            <h2 className="text-lg font-black text-[color:var(--text-strong)]">Upload & Preview</h2>
            <p className="text-xs font-medium text-[color:var(--text-secondary)]">Upload a .json or app-created .zip backup before restoring.</p>
            <input
              type="password"
              value={uploadPassword}
              onChange={(event) => setUploadPassword(event.target.value)}
              placeholder="Password if uploaded backup is protected"
              className="mt-3 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
            />
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 px-4 py-5 text-sm font-black text-emerald-700">
              {busy === "upload" ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Choose Backup File
              <input type="file" accept=".json,.zip,application/json,application/zip" onChange={handleUploadPreview} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => openRestore()}
              disabled={!uploadPayload}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={18} />
              Restore Uploaded Backup
            </button>
            <button
              type="button"
              onClick={() => handleHealthCheck()}
              disabled={!uploadPayload}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              Check Uploaded Backup
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[color:var(--text-strong)]">Backup Preview</h2>
              <p className="text-xs font-medium text-[color:var(--text-secondary)]">Review collections, record counts, and sample documents first.</p>
            </div>
            {lastBackup ? (
              <div className="flex flex-wrap justify-end gap-2">
                <input
                  type="password"
                  value={previewPassword}
                  onChange={(event) => setPreviewPassword(event.target.value)}
                  placeholder="Backup password"
                  className="w-40 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-bold outline-none"
                />
                <button type="button" onClick={() => handleStoredPreview(lastBackup)} className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs font-black">
                  Preview Latest
                </button>
              </div>
            ) : null}
          </div>
          <PreviewPanel preview={preview} />
        </section>
      </div>

      <section className="rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-black text-[color:var(--text-strong)]">Compare & Emergency Restore</h2>
            <p className="text-xs font-medium text-[color:var(--text-secondary)]">
              Compare two backups, or restore the latest backup quickly with master password.
            </p>
          </div>
          <div className="grid flex-1 gap-3 md:grid-cols-[1fr_1fr_180px_auto_auto]">
            <select value={leftCompareId} onChange={(event) => setLeftCompareId(event.target.value)} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold outline-none">
              <option value="">First backup</option>
              {backups.map((backup) => <option key={backup._id} value={backup._id}>{backup.fileName}</option>)}
            </select>
            <select value={rightCompareId} onChange={(event) => setRightCompareId(event.target.value)} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold outline-none">
              <option value="">Second backup</option>
              {backups.map((backup) => <option key={backup._id} value={backup._id}>{backup.fileName}</option>)}
            </select>
            <input
              type="password"
              value={masterPassword}
              onChange={(event) => setMasterPassword(event.target.value)}
              placeholder="Master password"
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold outline-none"
            />
            <button type="button" onClick={handleCompare} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white">
              <GitCompare size={17} />
              Compare
            </button>
            <button type="button" onClick={handleEmergencyRestore} disabled={!masterPassword.trim() || busy === "emergency"} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
              {busy === "emergency" ? <Loader2 size={17} className="animate-spin" /> : <Zap size={17} />}
              Emergency Restore
            </button>
          </div>
        </div>
        {comparison.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {comparison.map((item) => (
              <div key={item.name} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                <p className="text-xs font-black text-[color:var(--text-strong)]">{item.name}</p>
                <p className="mt-1 text-xs font-bold text-[color:var(--text-secondary)]">
                  {item.leftRecords} to {item.rightRecords} ({item.difference >= 0 ? "+" : ""}{item.difference})
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] p-5">
          <div>
            <h2 className="text-lg font-black text-[color:var(--text-strong)]">Backup History</h2>
            <p className="text-xs font-medium text-[color:var(--text-secondary)]">Download, preview, restore, or delete saved backups.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-[var(--bg-soft)] text-xs font-black uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">
              <tr>
                <th className="px-5 py-4">File</th>
                <th className="px-5 py-4">Format</th>
                <th className="px-5 py-4">Scope</th>
                <th className="px-5 py-4">Records</th>
                <th className="px-5 py-4">Size</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4">Note</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {backups.map((backup) => (
                <tr key={backup._id} className="transition hover:bg-[var(--bg-soft)]">
                  <td className="px-5 py-4">
                    <p className="font-black text-[color:var(--text-strong)]">{backup.fileName}</p>
                    <p className="text-xs font-bold text-[color:var(--text-secondary)]">By {backup.createdBy || "Admin"}</p>
                  </td>
                  <td className="px-5 py-4 font-bold uppercase text-[color:var(--text-secondary)]">{backup.format}</td>
                  <td className="px-5 py-4 font-bold text-[color:var(--text-secondary)]">{backup.scope}</td>
                  <td className="px-5 py-4 font-bold text-[color:var(--text-secondary)]">{backup.totalRecords}</td>
                  <td className="px-5 py-4 font-bold text-[color:var(--text-secondary)]">{formatBytes(backup.sizeBytes)}</td>
                  <td className="px-5 py-4 font-bold text-[color:var(--text-secondary)]">{formatDateTime(backup.createdAt)}</td>
                  <td className="max-w-56 px-5 py-4 text-xs font-bold text-[color:var(--text-secondary)]">
                    {backup.passwordProtected ? <span className="mr-2 text-amber-600">Protected</span> : null}
                    {backup.locked ? <span className="mr-2 text-emerald-600">Locked</span> : null}
                    {backup.note || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => handleToggleLock(backup)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title={backup.locked ? "Unlock" : "Lock"}>
                        {busy === `lock-${backup._id}` ? <Loader2 size={17} className="animate-spin" /> : backup.locked ? <Lock size={17} /> : <Unlock size={17} />}
                      </button>
                      <button type="button" onClick={() => handleHealthCheck(backup)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Health check">
                        {busy === `health-${backup._id}` ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
                      </button>
                      <button type="button" onClick={() => handleStoredPreview(backup)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title="Preview">
                        {busy === `preview-${backup._id}` ? <Loader2 size={17} className="animate-spin" /> : <Eye size={17} />}
                      </button>
                      <button type="button" onClick={() => handleDownload(backup)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Download">
                        <Download size={17} />
                      </button>
                      <button type="button" onClick={() => openRestore(backup)} className="rounded-lg p-2 text-violet-600 hover:bg-violet-50" title="Restore">
                        <RotateCcw size={17} />
                      </button>
                      <button type="button" onClick={() => handleDelete(backup)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete">
                        {busy === `delete-${backup._id}` ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!backups.length ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm font-bold text-[color:var(--text-secondary)]">
                    No backups created yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-black text-[color:var(--text-strong)]">Restore Logs</h2>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {logs.slice(0, 8).map((log) => (
            <div key={log._id} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-[color:var(--text-strong)]">{log.action}</p>
                <span className="text-[11px] font-bold text-[color:var(--text-muted)]">{formatDateTime(log.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs font-bold text-[color:var(--text-secondary)]">
                {log.message || "-"} {log.fileName ? `• ${log.fileName}` : ""}
              </p>
            </div>
          ))}
          {!logs.length ? (
            <p className="text-sm font-bold text-[color:var(--text-secondary)]">No restore logs yet.</p>
          ) : null}
        </div>
      </section>

      {restoreTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[color:var(--text-strong)]">Restore Backup</h2>
                <p className="mt-1 text-sm font-medium text-[color:var(--text-secondary)]">
                  {restoreTarget.label}
                </p>
              </div>
              <button type="button" onClick={() => setRestoreTarget(null)} className="rounded-full p-2 hover:bg-[var(--bg-soft)]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <select
                value={restoreMode}
                onChange={(event) => setRestoreMode(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
              >
                <option value="replace">Replace matching collections</option>
                <option value="merge">Merge with existing data</option>
              </select>
              <input
                type="password"
                value={masterPassword}
                onChange={(event) => setMasterPassword(event.target.value)}
                placeholder="Enter master password"
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-bold text-[color:var(--text-strong)] outline-none"
              />
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                    Select Collections
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedCollections((preview?.collections || []).map((collection) => collection.name))}
                    className="text-xs font-black text-emerald-600"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid max-h-36 gap-2 overflow-auto sm:grid-cols-2">
                  {(preview?.collections || []).map((collection) => (
                    <label key={collection.name} className="flex items-center gap-2 text-xs font-bold text-[color:var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(collection.name)}
                        onChange={(event) => {
                          setSelectedCollections((current) =>
                            event.target.checked
                              ? [...new Set([...current, collection.name])]
                              : current.filter((name) => name !== collection.name),
                          )
                        }}
                      />
                      {collection.name} ({collection.records})
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheckDiff}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700"
              >
                {busy === "diff" ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />}
                Check Restore Impact
              </button>
              {restoreDiff ? (
                <div className="max-h-32 overflow-auto rounded-2xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-xs font-black text-blue-700">
                    Current {restoreDiff.totalCurrent} records to Backup {restoreDiff.totalBackup} records
                  </p>
                  {restoreDiff.collections.map((item) => (
                    <p key={item.name} className="mt-1 text-[11px] font-bold text-blue-700">
                      {item.name}: {item.currentRecords} to {item.backupRecords}
                    </p>
                  ))}
                </div>
              ) : null}
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                Restore can overwrite business data. Preview the backup before restoring.
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setRestoreTarget(null)} className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={busy === "restore" || !masterPassword.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy === "restore" ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                Restore Now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
