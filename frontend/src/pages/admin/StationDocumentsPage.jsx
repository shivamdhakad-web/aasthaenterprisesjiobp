import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  CalendarDays,
  Check,
  Cloud,
  FileText,
  Files,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import {
  deleteStationDocument,
  getStationDocuments,
  getStationDocumentUsage,
  saveStationDocument,
  uploadStationFile,
} from "../../services/stationDocumentApi"

const categories = ["All categories", "Licence", "Invoice", "Equipment", "Safety", "Delivery", "Station", "Other"]
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const maxFileBytes = 10 * 1024 * 1024
const storageCapBytes = 25 * 1024 * 1024 * 1024

const bytesLabel = (value = 0) => {
  const bytes = Number(value) || 0
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

const dateLabel = (value) => value
  ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  : ""

const documentKind = (file) => file.type === "application/pdf" ? "PDF" : "IMAGE"

const expiryDays = (date) => Math.ceil((new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)

function Metric({ label, value, detail, icon: Icon, tone = "emerald" }) {
  const toneMap = {
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-700",
    blue: "border-blue-200 bg-blue-50/70 text-blue-700",
    violet: "border-violet-200 bg-violet-50/70 text-violet-700",
  }
  return (
    <article className={`min-w-0 rounded-xl border p-3.5 ${toneMap[tone]}`}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.12em]">
        <span className="truncate">{label}</span><Icon size={16} className="shrink-0" />
      </div>
      <p className="mt-2 text-xl font-extrabold text-[color:var(--text-strong)]">{value}</p>
      <p className="mt-1 truncate text-[11px] text-[color:var(--text-secondary)]">{detail}</p>
    </article>
  )
}

function UsageBar({ label, value, percent, tone = "emerald", detail }) {
  const width = Math.max(0, Math.min(Number(percent) || 0, 100))
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-[color:var(--text-secondary)]">{label}</span>
        <strong className="text-[color:var(--text-strong)]">{value}</strong>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
        <div className={`h-full rounded-full ${tone === "blue" ? "bg-blue-500" : "bg-emerald-500"}`} style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1.5 text-[10px] text-[color:var(--text-muted)]">{detail}</p>
    </div>
  )
}

function FilePreview({ document, onClose }) {
  if (!document) return null
  const isPdf = document.format === "pdf" || document.resourceType === "raw"
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6" onMouseDown={onClose}>
      <section className="flex h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3">
          <div className="min-w-0"><h2 className="truncate text-sm font-bold text-[color:var(--text-strong)]">{document.title}</h2><p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">{document.fileName} · {bytesLabel(document.bytes)}</p></div>
          <button type="button" onClick={onClose} aria-label="Close preview" className="rounded-lg p-2 text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)]"><X size={18} /></button>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-100 p-2 dark:bg-slate-950">
          {isPdf
            ? <iframe title={document.title} src={document.secureUrl} className="h-full w-full rounded-md bg-white" />
            : <img src={document.secureUrl} alt={document.title} className="max-h-full max-w-full object-contain" />}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-color)] px-4 py-2.5 text-xs text-[color:var(--text-secondary)]">
          <span>{document.category} · Uploaded {dateLabel(document.createdAt)}</span>
          <a href={document.secureUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">Open original</a>
        </footer>
      </section>
    </div>
  )
}

export default function StationDocumentsPage() {
  const inputRef = useRef(null)
  const [documents, setDocuments] = useState([])
  const [summary, setSummary] = useState({ totalFiles: 0, trackedBytes: 0 })
  const [cloudinary, setCloudinary] = useState(null)
  const [usage, setUsage] = useState(null)
  const [usageError, setUsageError] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All categories")
  const [kind, setKind] = useState("All file types")
  const [queuedFiles, setQueuedFiles] = useState([])
  const [uploadCategory, setUploadCategory] = useState("Other")
  const [uploadExpiry, setUploadExpiry] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, name: "" })
  const [notice, setNotice] = useState(null)
  const [preview, setPreview] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [dragging, setDragging] = useState(false)

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    try {
      const result = await getStationDocuments()
      setDocuments(result.documents || [])
      setSummary(result.summary || { totalFiles: 0, trackedBytes: 0 })
      setCloudinary(result.cloudinary || null)
      if (result.cloudinary?.usageReady) {
        try {
          const currentUsage = await getStationDocumentUsage()
          setUsage(currentUsage.usage || null)
          setUsageError("")
        } catch (error) {
          setUsage(null)
          setUsageError(error?.response?.data?.message || "Usage data is temporarily unavailable.")
        }
      } else {
        setUsage(null)
        setUsageError("Connect Cloudinary to load account usage.")
      }
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Could not load station documents." })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const visibleDocuments = useMemo(() => documents.filter((document) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [document.title, document.fileName, document.category, document.uploadedBy].some((value) => String(value || "").toLowerCase().includes(query))
    const matchesCategory = category === "All categories" || document.category === category
    const matchesKind = kind === "All file types" || (kind === "Documents" ? document.format === "pdf" : document.format !== "pdf")
    return matchesSearch && matchesCategory && matchesKind
  }), [documents, search, category, kind])

  const addFiles = (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    const invalid = files.find((file) => {
      const allowedSize = file.type === "application/pdf"
        ? Number(usage?.media_limits?.raw_max_size_bytes || maxFileBytes)
        : Number(usage?.media_limits?.image_max_size_bytes || maxFileBytes)
      return !allowedTypes.includes(file.type) || file.size > Math.min(allowedSize, maxFileBytes) || file.size < 1
    })
    if (invalid) {
      setNotice({ type: "error", text: `${invalid.name}: use PDF, JPG, PNG or WEBP up to 10 MB.` })
      return
    }
    setQueuedFiles((current) => [...current, ...files])
    setNotice(null)
  }

  const handleUpload = async () => {
    if (!queuedFiles.length || !cloudinary?.uploadReady) return
    setUploading(true)
    setUploadProgress({ current: 0, total: queuedFiles.length, name: "" })
    const uploadedDocuments = []
    let failed = null
    for (const [index, file] of queuedFiles.entries()) {
      setUploadProgress({ current: index, total: queuedFiles.length, name: file.name })
      try {
        const asset = await uploadStationFile({ file, cloudName: cloudinary.cloudName, uploadPreset: cloudinary.uploadPreset, category: uploadCategory })
        const saved = await saveStationDocument({
          title: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
          category: uploadCategory,
          fileName: file.name,
          format: asset.format || file.name.split(".").pop(),
          resourceType: asset.resourceType,
          bytes: asset.bytes,
          secureUrl: asset.secure_url,
          publicId: asset.public_id,
          expiresAt: uploadExpiry || null,
        })
        uploadedDocuments.push(saved)
      } catch (error) {
        failed = error?.response?.data?.message || error?.response?.data?.error?.message || error.message || "Upload failed."
        break
      }
    }
    setQueuedFiles([])
    setUploading(false)
    setUploadProgress({ current: 0, total: 0, name: "" })
    await refresh(true)
    setNotice(uploadedDocuments.length
      ? { type: failed ? "error" : "success", text: failed ? `${uploadedDocuments.length} file(s) uploaded. Next file failed: ${failed}` : `${uploadedDocuments.length} file(s) added to Station Documents.` }
      : { type: "error", text: failed || "Upload failed." })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteStationDocument(deleteTarget.id)
      setDeleteTarget(null)
      setNotice({ type: "success", text: "Document deleted from Cloudinary and the vault." })
      await refresh(true)
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Could not delete this document." })
    } finally {
      setDeleting(false)
    }
  }

  const credits = usage?.credits
  const storageUsageBytes = Number(usage?.storage?.usage || 0)
  const storagePercent = Number(usage?.storage?.used_percent ?? (storageUsageBytes / storageCapBytes) * 100)
  const creditUsage = Number(credits?.usage ?? usage?.credits_usage ?? 0)
  const creditLimit = Number(credits?.limit || 25)
  const creditPercent = Number(credits?.used_percent ?? (creditUsage / creditLimit) * 100)
  const mediaLimits = usage?.media_limits || {}
  const imageLimit = Number(mediaLimits.image_max_size_bytes || maxFileBytes)
  const rawLimit = Number(mediaLimits.raw_max_size_bytes || maxFileBytes)

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 overflow-x-hidden p-3.5 font-sans text-[color:var(--text-primary)] sm:p-5 lg:p-5">
      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><Files size={20} /></div>
            <div className="min-w-0"><h1 className="text-lg font-extrabold text-[color:var(--text-strong)] sm:text-xl">Station Documents</h1><p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Petrol pump records, certificates, invoices and images</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => refresh(true)} disabled={refreshing} aria-label="Refresh documents" title="Refresh" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-strong)] disabled:opacity-60"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></button>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={!cloudinary?.uploadReady} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Upload size={16} /> Upload files</button>
          </div>
        </div>
      </section>

      {notice ? (
        <div role="status" className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${notice.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {notice.type === "error" ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <Check size={17} className="mt-0.5 shrink-0" />}<span className="min-w-0 flex-1">{notice.text}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={16} /></button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
        <Metric label="Cloudinary storage" value={usage ? `${bytesLabel(storageUsageBytes)} / 25 GB` : "Not connected"} detail={usage ? `${Math.max(0, 100 - Math.min(storagePercent, 100)).toFixed(1)}% available · updated ${dateLabel(usage.last_updated) || "recently"}` : "Current stored asset size"} icon={Cloud} tone="emerald" />
        <Metric label="Shared 30-day credits" value={usage ? `${creditUsage.toFixed(2)} / ${creditLimit}` : "Not connected"} detail={usage ? `${Math.max(0, 100 - Math.min(creditPercent, 100)).toFixed(1)}% remaining · storage, delivery & processing` : "Storage + bandwidth + transformations"} icon={ShieldCheck} tone="blue" />
        <Metric label="Files in vault" value={loading ? "..." : summary.totalFiles} detail={bytesLabel(summary.trackedBytes)} icon={FileText} tone="violet" />
      </div>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,.8fr)]">
        <section className="min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-[color:var(--text-strong)]">All documents</h2><p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Browse, preview and organize station files.</p></div><span className="rounded-md bg-[var(--bg-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--text-secondary)]">{visibleDocuments.length} shown</span></div>

          <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = "" }} />
          <div
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}
            className={`rounded-lg border border-dashed p-3.5 transition ${dragging ? "border-emerald-500 bg-emerald-50" : "border-emerald-200 bg-emerald-50/40"}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><Upload size={18} /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[color:var(--text-strong)]">Upload documents or images</p><p className="mt-0.5 text-[11px] leading-4 text-[color:var(--text-secondary)]">PDF, JPG, PNG, WEBP · max {bytesLabel(Math.min(imageLimit, rawLimit))} per file</p></div>
              <button type="button" onClick={() => inputRef.current?.click()} disabled={!cloudinary?.uploadReady} className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">Choose files</button>
            </div>
            {queuedFiles.length ? (
              <div className="mt-3 border-t border-emerald-200 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-emerald-900">{queuedFiles.length} file(s) selected · {bytesLabel(queuedFiles.reduce((sum, file) => sum + file.size, 0))}</p><button type="button" onClick={() => setQueuedFiles([])} disabled={uploading} className="text-xs font-semibold text-rose-600">Clear selection</button></div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} disabled={uploading} aria-label="Upload category" className="h-9 min-w-0 rounded-md border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 text-xs text-[color:var(--text-strong)]"><option>Other</option>{categories.filter((item) => !["All categories", "Other"].includes(item)).map((item) => <option key={item}>{item}</option>)}</select>
                  <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 text-[11px] text-[color:var(--text-secondary)]"><CalendarDays size={14} /><span className="shrink-0">Expiry</span><input type="date" value={uploadExpiry} onChange={(event) => setUploadExpiry(event.target.value)} disabled={uploading} className="min-w-0 flex-1 bg-transparent text-xs text-[color:var(--text-strong)] outline-none" /></label>
                  <button type="button" onClick={handleUpload} disabled={uploading || !cloudinary?.uploadReady} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-60">{uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{uploading ? `Uploading ${uploadProgress.current + 1}/${uploadProgress.total}` : "Start upload"}</button>
                </div>
                {uploading ? <p className="mt-2 truncate text-[10px] text-[color:var(--text-secondary)]">{uploadProgress.name}</p> : null}
              </div>
            ) : null}
          </div>

          {!cloudinary?.uploadReady ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800"><AlertCircle size={15} className="mt-0.5 shrink-0" /><p><strong>Cloudinary is not connected.</strong> Add the Cloudinary cloud name, API key/secret and an unsigned upload preset to the backend environment to enable uploads, live usage and delete.</p></div>
          ) : null}

          <div className="my-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px_150px]">
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5"><Search size={15} className="shrink-0 text-[color:var(--text-muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files by name or tag" className="min-w-0 flex-1 bg-transparent text-xs text-[color:var(--text-strong)] outline-none placeholder:text-[color:var(--text-muted)]" /></label>
            <select value={kind} onChange={(event) => setKind(event.target.value)} className="h-9 min-w-0 rounded-md border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 text-xs text-[color:var(--text-strong)]">{["All file types", "Documents", "Images"].map((item) => <option key={item}>{item}</option>)}</select>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 min-w-0 rounded-md border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 text-xs text-[color:var(--text-strong)]">{categories.map((item) => <option key={item}>{item}</option>)}</select>
          </div>

          {loading ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-[color:var(--text-secondary)]"><Loader2 size={18} className="animate-spin text-emerald-600" />Loading station documents...</div> : visibleDocuments.length ? (
            <div className="grid min-w-0 grid-cols-2 gap-2.5 md:grid-cols-3">
              {visibleDocuments.map((document) => {
                const isPdf = document.format === "pdf" || document.resourceType === "raw"
                const days = document.expiresAt ? expiryDays(document.expiresAt) : null
                return (
                  <article key={document.id} className="group min-w-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] transition hover:border-emerald-300">
                    <button type="button" onClick={() => setPreview(document)} aria-label={`Preview ${document.title}`} className={`relative flex h-24 w-full items-center justify-center overflow-hidden sm:h-28 ${isPdf ? "bg-rose-50" : "bg-[var(--bg-soft)]"}`}>
                      <span className="absolute left-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--text-secondary)]">{document.category.toUpperCase()}</span>
                      {isPdf ? <span className="flex h-12 w-10 items-center justify-center rounded border border-rose-200 bg-white text-[10px] font-extrabold text-rose-600 shadow-sm">PDF</span> : <img src={document.secureUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      <span className="absolute inset-0 grid place-items-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/20 group-hover:opacity-100"><span className="rounded-full bg-slate-950/60 p-2"><ImageIcon size={16} /></span></span>
                    </button>
                    <div className="p-2.5">
                      <p title={document.title} className="truncate text-xs font-semibold text-[color:var(--text-strong)]">{document.title}</p>
                      <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-[color:var(--text-secondary)]"><span className="truncate">{dateLabel(document.createdAt)}</span><span className="shrink-0 font-medium">{bytesLabel(document.bytes)}</span></div>
                      <div className="mt-2 flex min-w-0 items-center justify-between gap-1 border-t border-[var(--border-color)] pt-2 text-[10px]">
                        <span className={`truncate ${days !== null && days <= 30 ? "font-semibold text-amber-700" : "text-[color:var(--text-secondary)]"}`}>{days === null ? `By ${document.uploadedBy || "Admin"}` : days < 0 ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`}</span>
                        <span className="flex shrink-0 items-center gap-0.5">
                          <button type="button" onClick={() => setPreview(document)} aria-label="Preview file" title="Preview" className="rounded p-1 text-blue-600 hover:bg-blue-50"><ImageIcon size={14} /></button>
                          <button type="button" onClick={() => setDeleteTarget(document)} disabled={!cloudinary?.usageReady} aria-label="Delete file" title="Delete" className="rounded p-1 text-rose-600 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={14} /></button>
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] px-4 text-center">
              <Files size={22} className="text-[color:var(--text-muted)]" /><p className="mt-2 text-sm font-semibold text-[color:var(--text-strong)]">{documents.length ? "No matching files" : "No station documents yet"}</p><p className="mt-1 text-xs text-[color:var(--text-secondary)]">{documents.length ? "Try a different search or category." : "Upload a licence, invoice, certificate or station image to get started."}</p>
            </div>
          )}
        </section>

        <aside className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4">
            <h2 className="text-sm font-bold text-[color:var(--text-strong)]">Free plan usage</h2><p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">{usage ? `${usage.plan || "Cloudinary"} · last updated ${dateLabel(usage.last_updated) || "recently"}` : "Live account usage"}</p>
            {usage ? <>
              <UsageBar label="Stored assets" value={`${bytesLabel(storageUsageBytes)} / 25 GB`} percent={storagePercent} detail="Current stored total · separate storage cap" />
              <UsageBar label="Shared credits" value={`${creditUsage.toFixed(2)} / ${creditLimit}`} percent={creditPercent} tone="blue" detail="Rolling 30-day usage across storage, image bandwidth and transformations" />
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs"><span className="text-[color:var(--text-secondary)]">Available credits</span><strong className="text-[color:var(--text-strong)]">{Math.max(0, creditLimit - creditUsage).toFixed(2)}</strong></div>
            </> : <div className="mt-3 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] p-3 text-xs text-[color:var(--text-secondary)]">{usageError}</div>}
            <div className="mt-3 rounded-lg bg-[var(--bg-soft)] p-3 text-[11px] leading-5 text-[color:var(--text-secondary)]"><strong className="text-[color:var(--text-strong)]">25 GB storage</strong> is a separate cap. The shared 25-credit allowance combines storage, delivered bandwidth and transformations. Bandwidth and transformation activity use a rolling 30-day window.</div>
          </section>

          <section className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4">
            <h2 className="text-sm font-bold text-[color:var(--text-strong)]">Upload limits</h2><p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Limits from the connected Cloudinary account</p>
            <ul className="mt-3 divide-y divide-[var(--border-color)] text-xs">
              <li className="flex justify-between gap-3 py-2"><span className="text-[color:var(--text-secondary)]">Image max size</span><strong className="text-[color:var(--text-strong)]">{bytesLabel(imageLimit)}</strong></li>
              <li className="flex justify-between gap-3 py-2"><span className="text-[color:var(--text-secondary)]">PDF / raw max size</span><strong className="text-[color:var(--text-strong)]">{bytesLabel(rawLimit)}</strong></li>
              <li className="flex justify-between gap-3 py-2"><span className="text-[color:var(--text-secondary)]">File formats</span><strong className="text-right text-[color:var(--text-strong)]">PDF, JPG, PNG, WEBP</strong></li>
              <li className="flex justify-between gap-3 py-2"><span className="text-[color:var(--text-secondary)]">Free storage cap</span><strong className="text-[color:var(--text-strong)]">25 GB</strong></li>
            </ul>
            {!usage ? <p className="mt-2 text-[10px] leading-4 text-[color:var(--text-muted)]">Showing the 10 MB free-plan fallback for images and raw documents until account limits are available.</p> : null}
          </section>

          <section className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4">
            <div className="flex items-center justify-between gap-2"><div><h2 className="text-sm font-bold text-[color:var(--text-strong)]">Expiry coming up</h2><p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Documents with an expiry date</p></div><CalendarDays size={17} className="text-amber-600" /></div>
            <div className="mt-2 divide-y divide-[var(--border-color)]">
              {documents.filter((item) => item.expiresAt).sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt)).slice(0, 4).map((document) => {
                const days = expiryDays(document.expiresAt)
                return <div key={document.id} className="flex items-center justify-between gap-3 py-2"><span className="min-w-0 truncate text-xs font-medium text-[color:var(--text-strong)]">{document.title}</span><span className={`shrink-0 text-[10px] font-semibold ${days < 0 ? "text-rose-600" : days <= 30 ? "text-amber-700" : "text-[color:var(--text-secondary)]"}`}>{days < 0 ? `Expired ${Math.abs(days)}d` : `${days}d`}</span></div>
              })}
              {!documents.some((item) => item.expiresAt) ? <p className="py-3 text-xs text-[color:var(--text-secondary)]">No expiry dates recorded.</p> : null}
            </div>
          </section>
        </aside>
      </div>

      {preview ? <FilePreview document={preview} onClose={() => setPreview(null)} /> : null}
      {deleteTarget ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={() => !deleting && setDeleteTarget(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-document-title" className="w-full max-w-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600"><Trash2 size={17} /></span><div className="min-w-0 flex-1"><h2 id="delete-document-title" className="text-sm font-bold text-[color:var(--text-strong)]">Delete document?</h2><p className="mt-1 break-words text-xs leading-5 text-[color:var(--text-secondary)]">“{deleteTarget.title}” will be removed from Cloudinary and the station vault.</p></div><button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} aria-label="Close" className="rounded p-1 text-[color:var(--text-muted)]"><X size={16} /></button></div>
            <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-md border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-[color:var(--text-secondary)]">Cancel</button><button type="button" onClick={confirmDelete} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}Delete file</button></div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
