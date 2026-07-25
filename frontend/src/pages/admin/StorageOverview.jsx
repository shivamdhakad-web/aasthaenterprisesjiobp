import { useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw, HardDrive, Database, Cpu, Activity } from "lucide-react"
import { getStorageOverview } from "../../services/storageApi"

const formatBytes = (bytes = 0) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  return `${bytes} B`
}

export default function StorageOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const response = await getStorageOverview()
      setData(response)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 15000)

    return () => window.clearInterval(interval)
  }, [])

  const collectionUsageMax = useMemo(
    () => Math.max(...(data?.collections || []).map((item) => item.storageBytes), 1),
    [data],
  )
  const runtimeMemory = data?.runtimeMemory

  // Show full-screen spinning circle loader when data is loading for the first time
  if (loading && !data) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center space-y-4 p-6 font-sans animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <Loader2 size={26} className="absolute text-emerald-600 dark:text-emerald-400 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-black text-[color:var(--text-strong)] tracking-tight">Loading Storage & Memory Metrics...</h2>
          <p className="mt-1 text-xs font-medium text-[color:var(--text-secondary)]">Fetching real-time backend process memory & database usage</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto overflow-x-hidden space-y-6 p-4 sm:p-6 lg:p-5 font-sans animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[color:var(--text-strong)] flex items-center gap-2.5">
            <HardDrive className="text-emerald-600 dark:text-emerald-400" size={28} />
            System Storage & RAM Dashboard
          </h1>
          <p className="mt-1 text-xs font-semibold text-[color:var(--text-secondary)]">
            Real-time server RAM process usage, MongoDB collection sizes, and storage limits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true)
            load()
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2.5 text-xs font-bold text-[color:var(--text-strong)] shadow-sm transition-all duration-300 hover:scale-105 hover:bg-[var(--bg-hover)]"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-emerald-600" : ""} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Render Backend RAM Section */}
      <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[color:var(--text-strong)]">Render Backend RAM Memory</h2>
              <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">Real-time backend process RAM usage against 512 MB Render limit</p>
            </div>
          </div>
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
            {runtimeMemory?.usedPercentage || 0}% Used
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-full bg-[var(--bg-soft)] h-3.5 border border-[var(--border-color)] p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 transition-all duration-1000"
            style={{ width: `${Math.min(runtimeMemory?.usedPercentage || 0, 100)}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[color:var(--text-secondary)]">
          <span>Used: <strong className="text-[color:var(--text-strong)]">{formatBytes(runtimeMemory?.usedBytes)}</strong></span>
          <span><strong className="text-purple-600 dark:text-purple-400">{runtimeMemory?.usedPercentage || 0}%</strong> of 512 MB</span>
          <span>Free: <strong className="text-[color:var(--text-strong)]">{formatBytes(runtimeMemory?.remainingBytes)}</strong></span>
        </div>

        <p className="mt-3 text-[11px] text-[color:var(--text-muted)] font-medium">
          Source: {runtimeMemory?.provider || "Node Process"} • Auto sync every 15s • Last sync{" "}
          {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("en-IN") : "-"}
        </p>
      </section>

      {/* RAM Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StorageCard label="RAM Capacity" value={formatBytes(runtimeMemory?.capacityBytes)} tone="blue" />
        <StorageCard label="RAM Used (RSS)" value={formatBytes(runtimeMemory?.rssBytes)} tone="violet" />
        <StorageCard label="Heap Used" value={formatBytes(runtimeMemory?.heapUsedBytes)} tone="cyan" />
        <StorageCard label="Heap Total" value={formatBytes(runtimeMemory?.heapTotalBytes)} tone="amber" />
      </div>

      {/* MongoDB Storage Section */}
      <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[color:var(--text-strong)]">MongoDB Database Storage</h2>
              <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">Database capacity & collection breakdown against 512 MB storage quota</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {data?.usedPercentage || 0}% Used
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-full bg-[var(--bg-soft)] h-3.5 border border-[var(--border-color)] p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 transition-all duration-1000"
            style={{ width: `${Math.min(data?.usedPercentage || 0, 100)}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[color:var(--text-secondary)]">
          <span>Used: <strong className="text-[color:var(--text-strong)]">{data ? formatBytes(data.usedBytes) : "0 B"}</strong></span>
          <span><strong className="text-emerald-600 dark:text-emerald-400">{data?.usedPercentage || 0}%</strong> of 512 MB</span>
          <span>Free: <strong className="text-[color:var(--text-strong)]">{data ? formatBytes(data.remainingBytes) : "0 B"}</strong></span>
        </div>
      </section>

      {/* Storage Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StorageCard label="Total Capacity" value={formatBytes(data?.capacityBytes)} tone="emerald" />
        <StorageCard label="Storage Used" value={formatBytes(data?.usedBytes)} tone="rose" />
        <StorageCard label="Data Size" value={formatBytes(data?.dataBytes)} tone="blue" />
        <StorageCard label="Index Size" value={formatBytes(data?.indexBytes)} tone="violet" />
      </div>

      {/* Collections & Cleanup Details */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-extrabold text-[color:var(--text-strong)] mb-4 border-b border-[var(--border-color)] pb-3">Collection Usage Breakdown</h2>
          <div className="space-y-3.5">
            {(data?.collections || []).map((item) => (
              <div key={item.name} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3.5 transition-all hover:border-emerald-500/30">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold">
                  <span className="text-[color:var(--text-strong)]">{item.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatBytes(item.storageBytes)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{
                      width: `${Math.max((item.storageBytes / collectionUsageMax) * 100, item.storageBytes ? 8 : 0)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-[color:var(--text-muted)] font-semibold">
                  {item.documents} documents • Avg doc size: {formatBytes(item.avgDocumentBytes)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-extrabold text-[color:var(--text-strong)] mb-4 border-b border-[var(--border-color)] pb-3">Storage Cleanup Impact Preview</h2>
          <div className="space-y-3">
            {(data?.cleanupPreview || []).map((item) => (
              <div key={item.name} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 transition-all hover:border-blue-500/30">
                <p className="text-sm font-black text-[color:var(--text-strong)]">{item.name}</p>
                <p className="mt-1 text-xs text-[color:var(--text-secondary)] font-medium">
                  Approx <strong className="text-emerald-600 dark:text-emerald-400">{formatBytes(item.removableBytes)}</strong> freed upon deletion
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--text-muted)]">
                  After delete: {formatBytes(item.remainingAfterDeleteBytes)} free • {item.usedAfterDeletePercentage}% used
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function StorageCard({ label, value, tone = "blue" }) {
  const tones = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    violet: "text-violet-600 dark:text-violet-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  }

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <p className="text-[11px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-xl font-black ${tones[tone] || tones.blue}`}>{value}</p>
    </div>
  )
}
