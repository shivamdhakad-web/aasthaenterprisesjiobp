import { useEffect, useState } from "react"

import AddDispenserModal from "../components/AddDispenserModal"
import MobileActionFab from "../components/MobileActionFab"
import DispenserSettingsModal from "../components/DispenserSettingsModal"
import {
  addEntry,
  deleteEntry,
  getEntries,
  getSettings,
  updateSettings,
} from "../services/mobileDispenserApi"

const formatDate = (value) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleDateString()
}

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

export default function MobileDispenser() {
  const [modalOpen, setModalOpen] = useState(false)
  const [settingsModal, setSettingsModal] = useState(false)
  const [entries, setEntries] = useState([])
  const [settings, setSettings] = useState(null)
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [openCard, setOpenCard] = useState(null)

  useEffect(() => {
    fetchEntries()
    fetchSettings()
  }, [])

  const fetchEntries = async () => {
    const data = await getEntries()
    setEntries(data)
  }

  const fetchSettings = async () => {
    const data = await getSettings()
    setSettings(data)
  }

  const saveSettings = async (data) => {
    await updateSettings(data)
    setSettingsModal(false)
    fetchSettings()
  }

  const saveEntry = async (data) => {
    await addEntry(data)
    setModalOpen(false)
    fetchEntries()
  }

  const getSaleLiter = (entry) =>
    Number(entry.saleLiter ?? Number(entry.endNozzle || 0) - Number(entry.startNozzle || 0))

  const getTotalKM = (entry) =>
    Number(entry.totalKM ?? Number(entry.endKM || 0) - Number(entry.startKM || 0))

  const getProfit = (entry) => {
    if (entry.profit !== undefined) {
      return Number(entry.profit || 0)
    }

    return getSaleLiter(entry) * Number(settings?.margin || 0)
  }

  const getDieselCost = (entry) => {
    if (entry.dieselCost !== undefined) {
      return Number(entry.dieselCost || 0)
    }

    return getTotalKM(entry) * Number(settings?.dieselPerKM || 0)
  }

  const getFinalProfit = (entry) => {
    if (entry.finalProfit !== undefined) {
      return Number(entry.finalProfit || 0)
    }

    return getProfit(entry) - getDieselCost(entry)
  }

  const filteredEntries = entries.filter((entry) => {
    const target = [
      entry.saleLiter,
      entry.stockAdd,
      entry.startNozzle,
      entry.endNozzle,
      entry.startKM,
      entry.endKM,
      entry.date,
    ]
      .join(" ")
      .toLowerCase()

    const entryDate = new Date(entry.date).toISOString().slice(0, 10)

    return target.includes(search.toLowerCase()) && (!dateFilter || entryDate === dateFilter)
  })

  let totalStock = 0
  let totalSale = 0
  let totalKM = 0
  let totalDiesel = 0
  let totalProfit = 0
  let todaySale = 0
  let weekSale = 0
  let monthSale = 0

  const today = new Date()
  const todayString = today.toISOString().slice(0, 10)

  filteredEntries.forEach((entry) => {
    const sale = getSaleLiter(entry)
    const entryDate = new Date(entry.date)

    totalSale += sale
    totalStock += Number(entry.stockAdd || 0)
    totalKM += getTotalKM(entry)
    totalDiesel += getDieselCost(entry)
    totalProfit += getFinalProfit(entry)

    if (entry.date === todayString) {
      todaySale += sale
    }

    const diffDays = (today - entryDate) / (1000 * 60 * 60 * 24)
    if (diffDays <= 7) {
      weekSale += sale
    }

    if (entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear()) {
      monthSale += sale
    }
  })

  const currentStock = totalStock - totalSale

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 sm:p-6 text-[color:var(--text-primary)]">
      <h1 className="mb-4 text-3xl font-bold text-[color:var(--text-strong)]">Mobile Dispenser</h1>

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Today Sale</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {Math.round(todaySale)} L
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Week Sale</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {Math.round(weekSale)} L
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Month Sale</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {Math.round(monthSale)} L
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total Sale</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {Math.round(totalSale)} L
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total Stock</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">{totalStock} L</p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Current Stock</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {Math.round(currentStock)} L
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total KM</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {Math.round(totalKM)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Final Profit</p>
          <p className={`mt-3 text-2xl font-semibold ${totalProfit < 0 ? "text-red-500" : "text-green-500"}`}>
            {formatCurrency(Math.round(totalProfit))}
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Diesel Cost</p>
          <p className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(Math.round(totalDiesel))}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Margin Per Liter</p>
          <p className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(settings?.margin || 0)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search liter, nozzle, KM"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[420px]"
        />

        <button
          className="hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)] shadow-sm sm:inline-flex"
          onClick={() => setSettingsModal(true)}
        >
          Update Stock
        </button>

        <button
          className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
          onClick={() => setModalOpen(true)}
        >
          + Add Entry
        </button>
      </div>

      <div className="mb-3 sm:hidden">
        <button
          onClick={() => setShowFilter((current) => !current)}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)]"
        >
          {showFilter ? "Hide Filters" : "Filters"}
        </button>
      </div>

      <div className={`mb-4 gap-3 sm:grid sm:grid-cols-[minmax(0,220px)_auto] ${showFilter ? "grid" : "hidden sm:grid"}`}>
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="input"
        />

        <button
          onClick={() => setDateFilter("")}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)] sm:justify-self-start"
        >
          Clear Filters
        </button>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="table min-w-[1180px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Stock Add</th>
              <th>Start Nozzle</th>
              <th>End Nozzle</th>
              <th>Sale Liter</th>
              <th>Start KM</th>
              <th>End KM</th>
              <th>Total KM</th>
              <th>Profit</th>
              <th>Diesel Cost</th>
              <th>Final Profit</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredEntries.map((entry) => {
              const sale = getSaleLiter(entry)
              const profit = getProfit(entry)
              const dieselCost = getDieselCost(entry)
              const finalProfit = getFinalProfit(entry)

              return (
                <tr key={entry._id}>
                  <td>{formatDate(entry.date)}</td>
                  <td>{entry.stockAdd}</td>
                  <td>{entry.startNozzle}</td>
                  <td>{entry.endNozzle}</td>
                  <td>{sale.toFixed(2)}</td>
                  <td>{entry.startKM}</td>
                  <td>{entry.endKM}</td>
                  <td>{getTotalKM(entry)}</td>
                  <td className={profit < 0 ? "text-red-500" : "text-green-500"}>{formatCurrency(Math.round(profit))}</td>
                  <td>{formatCurrency(Math.round(dieselCost))}</td>
                  <td className={finalProfit < 0 ? "text-red-500" : "text-green-500"}>
                    {formatCurrency(Math.round(finalProfit))}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        className="text-red-500"
                        onClick={() => {
                          deleteEntry(entry._id)
                          fetchEntries()
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 sm:hidden">
        {filteredEntries.map((entry) => {
          const isOpen = openCard === entry._id
          const sale = getSaleLiter(entry)
          const profit = getProfit(entry)
          const finalProfit = getFinalProfit(entry)

          return (
            <div
              key={entry._id}
              onClick={() => setOpenCard(isOpen ? null : entry._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">
                    {formatDate(entry.date)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">
                    {sale.toFixed(2)} L
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    KM {entry.startKM} to {entry.endKM}
                  </p>
                </div>

                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${finalProfit < 0 ? "border border-red-500/20 bg-red-500/10 text-red-500" : "border border-green-500/20 bg-green-500/10 text-green-500"}`}>
                  {formatCurrency(Math.round(finalProfit))}
                </div>
              </div>

              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="card">
                      <p className="text-xs text-[color:var(--text-secondary)]">Nozzle</p>
                      <p className="mt-2 font-semibold text-[color:var(--text-strong)]">
                        {entry.startNozzle} to {entry.endNozzle}
                      </p>
                    </div>

                    <div className="card">
                      <p className="text-xs text-[color:var(--text-secondary)]">Stock Add</p>
                      <p className="mt-2 font-semibold text-[color:var(--text-strong)]">{entry.stockAdd}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="card">
                      <p className="text-xs text-[color:var(--text-secondary)]">Profit</p>
                      <p className={`mt-2 font-semibold ${profit < 0 ? "text-red-500" : "text-green-500"}`}>
                        {formatCurrency(Math.round(profit))}
                      </p>
                    </div>

                    <div className="card">
                      <p className="text-xs text-[color:var(--text-secondary)]">Diesel Cost</p>
                      <p className="mt-2 font-semibold text-[color:var(--text-strong)]">
                        {formatCurrency(Math.round(getDieselCost(entry)))}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteEntry(entry._id)
                      fetchEntries()
                    }}
                    className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <AddDispenserModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={saveEntry} />

      <DispenserSettingsModal
        open={settingsModal}
        onClose={() => setSettingsModal(false)}
        onSave={saveSettings}
        data={settings}
      />

      <MobileActionFab
        actions={[
          {
            label: "Add Entry",
            className: "bg-blue-600",
            onClick: () => setModalOpen(true),
          },
          {
            label: "Update Stock",
            className: "bg-slate-700",
            onClick: () => setSettingsModal(true),
          },
        ]}
      />
    </div>
  )
}
