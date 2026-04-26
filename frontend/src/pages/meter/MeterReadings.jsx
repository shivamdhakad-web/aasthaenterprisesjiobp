import { useEffect, useState } from "react"

import MobileActionFab from "../../components/MobileActionFab"
import MeterModal from "../../components/meter/MeterModal"
import {
  addMeterReading,
  deleteMeterReading,
  getMeterReadings,
  updateMeterReading,
} from "../../services/meterApi"

const formatDate = (value) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleDateString()
}

export default function MeterReadings() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [openCard, setOpenCard] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const res = await getMeterReadings()
    setData(res)
  }

  const save = async (form) => {
    if (edit) {
      await updateMeterReading(edit._id, form)
    } else {
      await addMeterReading(form)
    }

    setOpen(false)
    setEdit(null)
    load()
  }

  const remove = async (id) => {
    await deleteMeterReading(id)
    load()
  }

  const filteredData = data.filter((row) => {
    const target = [row.nozzle, row.shift, row.date].join(" ").toLowerCase()
    return target.includes(search.toLowerCase())
  })

  const totalFuelSold = filteredData.reduce((sum, row) => {
    const sold = Number(row.fuelSold ?? Number(row.closing || 0) - Number(row.opening || 0))
    return sum + (Number.isNaN(sold) ? 0 : sold)
  }, 0)

  const shiftCount = new Set(filteredData.map((row) => row.shift)).size

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 sm:p-6 text-[color:var(--text-primary)]">
      <h1 className="mb-4 text-3xl font-bold text-[color:var(--text-strong)]">Meter Readings</h1>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total Readings</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {filteredData.length}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Fuel Sold</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {totalFuelSold.toFixed(1)} L
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Shifts Covered</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">{shiftCount}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search nozzle, shift, date"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[420px]"
        />

        <button
          onClick={() => {
            setEdit(null)
            setOpen(true)
          }}
          className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          + Add Reading
        </button>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="table min-w-[920px]">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nozzle</th>
              <th>Shift</th>
              <th>Opening</th>
              <th>Closing</th>
              <th>Fuel Sold</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((row, index) => {
              const sold = Number(row.fuelSold ?? Number(row.closing || 0) - Number(row.opening || 0))

              return (
                <tr key={row._id}>
                  <td>MR{index + 1}</td>
                  <td>{row.nozzle}</td>
                  <td>{row.shift}</td>
                  <td>{row.opening}</td>
                  <td>{row.closing}</td>
                  <td className="text-green-500">{sold.toFixed(1)} L</td>
                  <td>{formatDate(row.date)}</td>
                  <td>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setEdit(row)
                          setOpen(true)
                        }}
                        className="text-blue-500"
                      >
                        Edit
                      </button>

                      <button onClick={() => remove(row._id)} className="text-red-500">
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
        {filteredData.map((row) => {
          const isOpen = openCard === row._id
          const sold = Number(row.fuelSold ?? Number(row.closing || 0) - Number(row.opening || 0))

          return (
            <div
              key={row._id}
              onClick={() => setOpenCard(isOpen ? null : row._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">
                    {row.shift}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">
                    {row.nozzle}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {formatDate(row.date)}
                  </p>
                </div>

                <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-500">
                  {sold.toFixed(1)} L
                </div>
              </div>

              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="card">
                      <p className="text-xs text-[color:var(--text-secondary)]">Opening</p>
                      <p className="mt-2 font-semibold text-[color:var(--text-strong)]">{row.opening}</p>
                    </div>

                    <div className="card">
                      <p className="text-xs text-[color:var(--text-secondary)]">Closing</p>
                      <p className="mt-2 font-semibold text-[color:var(--text-strong)]">{row.closing}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setEdit(row)
                        setOpen(true)
                      }}
                      className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                    >
                      Edit
                    </button>

                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        remove(row._id)
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

      {open ? <MeterModal close={() => {
        setOpen(false)
        setEdit(null)
      }} save={save} data={edit} /> : null}

      <MobileActionFab
        actions={[
          {
            label: "Add Reading",
            className: "bg-blue-600",
            onClick: () => {
              setEdit(null)
              setOpen(true)
            },
          },
        ]}
      />
    </div>
  )
}
