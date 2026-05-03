import {
  CalendarDays,
  Droplets,
  History,
  Ruler,
  Thermometer,
  Trash2,
  UserRound,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import {
  deleteDensityCalculatorEntry,
  getDensityCalculatorEntries,
  getDensityCalculatorPresets,
  saveDensityCalculatorEntry,
} from "../../services/densityCalculatorApi"

const DEFAULT_PRESETS = [
  { key: "10K", label: "10K", capacityLitres: 10000, maxReadingCm: 250 },
  { key: "15K", label: "15K", capacityLitres: 15000, maxReadingCm: 275 },
  { key: "20K", label: "20K", capacityLitres: 20000, maxReadingCm: 300 },
  { key: "30K", label: "30K", capacityLitres: 30000, maxReadingCm: 330 },
]

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const hasNumericValue = (value) =>
  value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value))

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const formatDensity = (value) => `${value === 0 ? 0 : Number(value).toFixed(1)} kg/m3`

const formatVolume = (value) =>
  `${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: value === 0 ? 0 : 1,
    minimumFractionDigits: value === 0 ? 0 : 1,
  })} Litres`

const calculateDensity = (hydrometer, temperature) => {
  if (!hasNumericValue(hydrometer) || !hasNumericValue(temperature)) {
    return 0
  }

  const safeHydrometer = clamp(Number(hydrometer), 660, 960)
  const safeTemperature = clamp(Number(temperature), -10, 55)
  const delta = safeTemperature - 15
  const temperatureFactor = 0.949 - 0.0005 * delta

  return Number((safeHydrometer + delta * temperatureFactor).toFixed(1))
}

const calculateVolume = (preset, readingCm) => {
  if (!hasNumericValue(readingCm)) {
    return 0
  }

  const safeReading = clamp(Number(readingCm), 0, preset?.maxReadingCm || 300)
  const litres = (safeReading / (preset?.maxReadingCm || 300)) * (preset?.capacityLitres || 20000)
  return Number(litres.toFixed(1))
}

const modeFilters = [
  { key: "all", label: "All History" },
  { key: "density", label: "Density" },
  { key: "volume", label: "Volume" },
]

export default function DensityCalculatorPage() {
  const { user } = useAuth()
  const [activeMode, setActiveMode] = useState("density")
  const [historyMode, setHistoryMode] = useState("all")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [entries, setEntries] = useState([])
  const [presets, setPresets] = useState(DEFAULT_PRESETS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [densityForm, setDensityForm] = useState({
    hydrometer: "",
    temperature: "",
  })
  const [volumeForm, setVolumeForm] = useState({
    tankKey: "20K",
    readingCm: "",
  })

  const loadEntries = async () => {
    setLoading(true)
    try {
      const params = historyMode === "all" ? {} : { mode: historyMode }
      const data = await getDensityCalculatorEntries(params)
      setEntries(Array.isArray(data) ? data : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const loadPresets = async () => {
    try {
      const data = await getDensityCalculatorPresets()
      if (Array.isArray(data) && data.length) {
        setPresets(data)
      }
    } catch {}
  }

  useEffect(() => {
    loadPresets()
  }, [])

  useEffect(() => {
    loadEntries()
  }, [historyMode])

  const activePreset = useMemo(
    () => presets.find((preset) => preset.key === volumeForm.tankKey) || presets[0] || DEFAULT_PRESETS[2],
    [presets, volumeForm.tankKey],
  )

  const densityValue = useMemo(
    () => calculateDensity(densityForm.hydrometer, densityForm.temperature),
    [densityForm.hydrometer, densityForm.temperature],
  )

  const volumeValue = useMemo(
    () => calculateVolume(activePreset, volumeForm.readingCm),
    [activePreset, volumeForm.readingCm],
  )

  const recentEntries = useMemo(() => entries.slice(0, 4), [entries])

  const canDelete = (entry) => {
    if (user?.role === "Admin") return true
    if (user?.role === "Manager")
      return entry.creatorRole === "Manager" && entry.creatorName === user?.name
    return entry.creatorRole === "Employee" && entry.creatorEmployeeId === user?.employeeId
  }

  const handleSave = async () => {
    if (activeMode === "density") {
      if (!hasNumericValue(densityForm.hydrometer) || !hasNumericValue(densityForm.temperature)) {
        window.alert("Hydrometer aur temperature dono fill karo")
        return
      }
    } else if (!hasNumericValue(volumeForm.readingCm)) {
      window.alert("Reading fill karo")
      return
    }

    setSaving(true)
    try {
      const payload =
        activeMode === "density"
          ? {
              mode: "density",
              hydrometer: densityForm.hydrometer,
              temperature: densityForm.temperature,
              recordedAt: new Date().toISOString(),
            }
          : {
              mode: "volume",
              tankKey: activePreset?.key || "20K",
              readingCm: volumeForm.readingCm,
              recordedAt: new Date().toISOString(),
            }

      await saveDensityCalculatorEntry(payload)

      if (activeMode === "density") {
        window.alert("Density save ho gayi")
        setDensityForm({ hydrometer: "", temperature: "" })
      } else {
        window.alert("Volume save ho gaya")
        setVolumeForm((current) => ({ ...current, readingCm: "" }))
      }

      await loadEntries()
      setHistoryOpen(true)
    } catch (error) {
      window.alert(error?.response?.data?.message || "Save nahi ho paya")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (entry) => {
    const confirmed = window.confirm("Is history entry ko delete karna hai?")
    if (!confirmed) return
    try {
      await deleteDensityCalculatorEntry(entry._id)
      await loadEntries()
    } catch (error) {
      window.alert(error?.response?.data?.message || "Delete nahi ho paya")
    }
  }

  return (
    <div className="w-full overflow-x-hidden px-1 py-2 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left side: Calculator Form */}
          <div className="flex-1 min-w-0">
            <section className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)]">
              <div className="h-3 bg-gradient-to-r from-[#06723a] via-[#7fb364] to-[#0b5cad]" />
              <div className="px-4 py-5 sm:px-7 sm:py-8">
                <div className="mx-auto max-w-full sm:max-w-3xl">
                  <div className="mt-0 flex justify-center">
                    <div className="inline-flex rounded-2xl bg-[var(--bg-soft)] p-1.5 shadow-[var(--shadow-soft)]">
                      {[
                        { key: "density", label: "Density" },
                        { key: "volume", label: "Volume" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveMode(tab.key)}
                          className={`rounded-xl px-5 py-2 text-sm font-medium transition ${
                            activeMode === tab.key
                              ? "bg-white text-[color:var(--text-strong)] shadow-[var(--shadow-soft)]"
                              : "text-[color:var(--text-secondary)]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-[26px] border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 sm:p-6">
                    {activeMode === "density" ? (
                      <div className="space-y-5">
                        <FieldGroup
                          icon={<Droplets size={18} />}
                          label="Hydrometer"
                          hint="Range (660 to 960)"
                          value={densityForm.hydrometer}
                          onChange={(value) => setDensityForm((current) => ({ ...current, hydrometer: value }))}
                          placeholder="Enter hydrometer value"
                        />
                        <FieldGroup
                          icon={<Thermometer size={18} />}
                          label="Temperature"
                          hint="Range (-10 to 55)"
                          value={densityForm.temperature}
                          onChange={(value) => setDensityForm((current) => ({ ...current, temperature: value }))}
                          placeholder="Enter temperature"
                        />
                        <ResultPanel
                          title="Your Density"
                          value={formatDensity(densityValue)}
                          caption="Observed values have been adjusted to the 15k reference."
                        />
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                          {presets.map((preset) => (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => setVolumeForm((current) => ({ ...current, tankKey: preset.key }))}
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                volumeForm.tankKey === preset.key
                                  ? "border-[#0b2b63] bg-[#198f5c] text-white"
                                  : "border-[var(--border-color)] bg-white text-[color:var(--text-primary)]"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <FieldGroup
                          icon={<Ruler size={18} />}
                          label="Reading (In cm)"
                          hint={`Range (0 to ${activePreset?.maxReadingCm || 300})`}
                          value={volumeForm.readingCm}
                          onChange={(value) => setVolumeForm((current) => ({ ...current, readingCm: value }))}
                          placeholder="Enter dip reading"
                        />
                        <ResultPanel
                          title="Your Volume"
                          value={formatVolume(volumeValue)}
                          caption={`Selected ${activePreset?.label || "20K"} tank ke basis par volume dikhaya ja raha hai.`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSave}
                      className="btn btn-green flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen(true)}
                      className="btn flex-1 border border-[var(--border-color)] bg-[var(--bg-panel)] text-[color:var(--text-primary)]"
                    >
                      <History size={18} />
                      View History
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right side: Recent History - hidden on mobile, visible on desktop */}
          <div className="hidden lg:block w-full lg:w-80 xl:w-96 shrink-0">
            <section className="rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-soft)] sm:p-5 sticky top-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">
                    Recent History
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-[color:var(--text-strong)] sm:text-xl">
                    Last 30 Days
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(true)}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-sm font-medium text-[color:var(--text-primary)]"
                >
                  Open
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {recentEntries.length ? (
                  recentEntries.map((entry) => (
                    <HistoryCard
                      key={entry._id}
                      entry={entry}
                      showDelete={canDelete(entry)}
                      onDelete={() => handleDelete(entry)}
                    />
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-7 text-center">
                    <p className="text-base font-semibold text-[color:var(--text-strong)]">No history yet</p>
                    <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                      As soon as you save, the density or volume history will appear here.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {historyOpen && (
        <HistoryModal
          loading={loading}
          entries={entries}
          historyMode={historyMode}
          setHistoryMode={setHistoryMode}
          canDelete={canDelete}
          onClose={() => setHistoryOpen(false)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] bg-gradient-to-br from-[#0b4da2] via-[#0f62a6] to-[#ff6b00] text-white shadow-[0_18px_50px_rgba(11,43,99,0.24)] sm:h-24 sm:w-24">
        <Droplets size={42} />
      </div>
      <div className="min-w-0">
        <p className="text-[2rem] font-black uppercase tracking-tight text-[#ff6b00] sm:text-[3.3rem]">
          PETRO<span className="text-[#0b4da2]">SMART</span>
        </p>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--text-strong)] sm:text-lg">
          Density Calculator
        </p>
      </div>
    </div>
  )
}

function FieldGroup({ icon, label, hint, value, onChange, placeholder }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
          {icon}
          {label}
        </span>
        <span className="text-[11px] text-[color:var(--text-muted)]">{hint}</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input mt-3 rounded-none border-0 border-b border-[var(--border-strong)] bg-transparent px-0 pb-3 pt-0 text-lg text-[color:var(--text-strong)] shadow-none focus:border-[#0b2b63] focus:shadow-none"
      />
    </label>
  )
}

function ResultPanel({ title, value, caption }) {
  return (
    <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-6 text-center sm:px-5">
      <p className="text-sm text-[color:var(--text-secondary)]">{title}</p>
      <p className="mt-2 text-[2rem] font-semibold text-[#f59e0b] sm:text-[2.4rem]">{value}</p>
      <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-[color:var(--text-secondary)] sm:text-sm">
        {caption}
      </p>
    </div>
  )
}

function HistoryCard({ entry, showDelete, onDelete }) {
  const isVolume = entry.mode === "volume"
  const title = isVolume ? formatVolume(entry.volumeValue) : formatDensity(entry.densityValue)
  const detail = isVolume
    ? `${entry.tankLabel || entry.tankKey} - Reading ${Number(entry.readingCm || 0).toFixed(1)} cm`
    : `${Number(entry.hydrometer || 0).toFixed(1)} kg/m3 > ${Number(entry.temperature || 0).toFixed(1)}`

  return (
    <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#2f9e58] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              {isVolume ? "Volume" : "Density"}
            </span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1 text-[11px] text-[color:var(--text-secondary)]">
              Saved by {entry.creatorRole}
            </span>
          </div>
          <p className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">{title}</p>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{detail}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} />
              {formatDateTime(entry.recordedAt || entry.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={14} />
              {entry.creatorName}
            </span>
          </div>
        </div>

        {showDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="self-start rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function HistoryModal({
  loading,
  entries,
  historyMode,
  setHistoryMode,
  canDelete,
  onClose,
  onDelete,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_32px_90px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-color)] px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">
              Density History
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[color:var(--text-strong)] sm:text-xl">
              Last 30 Days Entries
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-sm font-medium text-[color:var(--text-primary)]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <div className="mb-5 flex flex-wrap gap-3">
            {modeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setHistoryMode(filter.key)}
                className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                  historyMode === filter.key
                    ? "bg-[#21a24a] text-white"
                    : "border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-primary)]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-8 text-center text-sm text-[color:var(--text-secondary)]">
                Loading history...
              </div>
            ) : entries.length ? (
              entries.map((entry) => (
                <HistoryCard
                  key={entry._id}
                  entry={entry}
                  showDelete={canDelete(entry)}
                  onDelete={() => onDelete(entry)}
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-8 text-center">
                <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                  No history found
                </p>
                <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                  There are currently no entries available for this filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}