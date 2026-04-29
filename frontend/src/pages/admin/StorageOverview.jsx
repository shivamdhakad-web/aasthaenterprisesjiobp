import { useEffect, useMemo, useState } from "react"
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

  useEffect(() => {
    const load = async () => {
      const response = await getStorageOverview()
      setData(response)
    }

    load()
  }, [])

  const collectionUsageMax = useMemo(
    () => Math.max(...(data?.collections || []).map((item) => item.storageBytes), 1),
    [data],
  )

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">MongoDB Storage</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Current database usage against the 512 MB cap, collection-wise storage, and cleanup impact can be seen here.
        </p>

        <div className="mt-5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
            style={{ width: `${Math.min(data?.usedPercentage || 0, 100)}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--text-secondary)]">
          <span>Used {data ? formatBytes(data.usedBytes) : "0 B"}</span>
          <span>{data?.usedPercentage || 0}% of 512 MB</span>
          <span>Free {data ? formatBytes(data.remainingBytes) : "0 B"}</span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StorageCard label="Capacity" value={formatBytes(data?.capacityBytes)} />
        <StorageCard label="Used" value={formatBytes(data?.usedBytes)} />
        <StorageCard label="Data Size" value={formatBytes(data?.dataBytes)} />
        <StorageCard label="Index Size" value={formatBytes(data?.indexBytes)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Collection Usage</h2>
          <div className="mt-4 space-y-3">
            {(data?.collections || []).map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-[color:var(--text-secondary)]">{item.name}</span>
                  <span className="font-medium text-[color:var(--text-strong)]">
                    {formatBytes(item.storageBytes)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${Math.max((item.storageBytes / collectionUsageMax) * 100, item.storageBytes ? 8 : 0)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-[color:var(--text-secondary)]">
                  {item.documents} docs • Avg {formatBytes(item.avgDocumentBytes)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Cleanup Preview</h2>
          <div className="mt-4 space-y-3">
            {(data?.cleanupPreview || []).map((item) => (
              <div key={item.name} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
                <p className="text-base font-semibold text-[color:var(--text-strong)]">{item.name}</p>
                <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                  Approx {formatBytes(item.removableBytes)} may be freed upon deletion
                </p>
                <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
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

function StorageCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">{value}</p>
    </div>
  )
}
