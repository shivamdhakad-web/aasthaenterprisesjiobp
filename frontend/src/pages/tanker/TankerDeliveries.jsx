import { useEffect, useState } from "react"

import MobileActionFab from "../../components/MobileActionFab"
import DensityModal from "../../components/tanker/DensityModal"
import TankerModal from "../../components/tanker/TankerModal"
import {
  addDelivery,
  deleteDelivery,
  getDeliveries,
  updateDelivery,
} from "../../services/tankerApi"

const formatDate = (value) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleDateString()
}

export default function TankerDeliveries() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [fuelFilter, setFuelFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [densityOpen, setDensityOpen] = useState(false)
  const [openCard, setOpenCard] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const res = await getDeliveries()
    setData(res)
  }

  const save = async (form) => {
    if (edit) {
      await updateDelivery(edit._id, form)
    } else {
      await addDelivery(form)
    }

    setOpen(false)
    setEdit(null)
    load()
  }

  const remove = async (id) => {
    await deleteDelivery(id)
    load()
  }

  const filteredData = data.filter((delivery) => {
    const target = [
      delivery.supplier,
      delivery.fuel,
      delivery.invoice,
      delivery.date,
      delivery.quantity,
    ]
      .join(" ")
      .toLowerCase()

    const matchesSearch = target.includes(search.toLowerCase())
    const matchesFuel = !fuelFilter || delivery.fuel === fuelFilter
    const matchesDate = !dateFilter || delivery.date === dateFilter

    return matchesSearch && matchesFuel && matchesDate
  })

  const totalLiters = filteredData.reduce((sum, delivery) => sum + Number(delivery.quantity || 0), 0)
  const suppliers = new Set(filteredData.map((delivery) => delivery.supplier)).size

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 sm:p-6 text-[color:var(--text-primary)]">
      <h1 className="mb-1 text-3xl font-bold text-[color:var(--text-strong)]">Tanker Deliveries</h1>
      <p className="mb-5 text-sm text-[color:var(--text-secondary)]">
        Record and track every incoming delivery with clean desktop and mobile views.
      </p>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total Deliveries</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {filteredData.length}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total Quantity</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {totalLiters.toFixed(0)} L
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Suppliers</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">{suppliers}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search supplier, fuel, invoice"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[420px]"
        />

        <button
          onClick={() => setDensityOpen(true)}
          className="hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)] shadow-sm sm:inline-flex"
        >
          Density Calc
        </button>

        <button
          onClick={() => {
            setEdit(null)
            setOpen(true)
          }}
          className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          Record Delivery
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <select value={fuelFilter} onChange={(event) => setFuelFilter(event.target.value)} className="input">
          <option value="">All Fuel</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Premium">Premium</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="input"
        />

        <button
          onClick={() => {
            setFuelFilter("")
            setDateFilter("")
          }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)] sm:justify-self-start"
        >
          Clear Filters
        </button>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="table min-w-[980px]">
          <thead>
            <tr>
              <th>ID</th>
              <th>Supplier</th>
              <th>Fuel</th>
              <th>Quantity</th>
              <th>Density</th>
              <th>Date</th>
              <th>Invoice</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((delivery, index) => (
              <tr key={delivery._id}>
                <td>TD{index + 1}</td>
                <td>{delivery.supplier}</td>
                <td>{delivery.fuel}</td>
                <td>{delivery.quantity} L</td>
                <td>{delivery.density || "-"}</td>
                <td>{formatDate(delivery.date)}</td>
                <td>{delivery.invoice}</td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setEdit(delivery)
                        setOpen(true)
                      }}
                      className="text-blue-500"
                    >
                      Edit
                    </button>

                    <button onClick={() => remove(delivery._id)} className="text-red-500">
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
        {filteredData.map((delivery) => {
          const isOpen = openCard === delivery._id

          return (
            <div
              key={delivery._id}
              onClick={() => setOpenCard(isOpen ? null : delivery._id)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">
                    {delivery.fuel}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">
                    {delivery.supplier}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {formatDate(delivery.date)}
                  </p>
                </div>

                <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-500">
                  {delivery.quantity} L
                </div>
              </div>

              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="card">
                      <p className="text-xs text-[color:var(--text-secondary)]">Density</p>
                      <p className="mt-2 font-semibold text-[color:var(--text-strong)]">
                        {delivery.density || "-"}
                      </p>
                    </div>

                    <div className="card">
                      <p className="text-xs text-[color:var(--text-secondary)]">Invoice</p>
                      <p className="mt-2 font-semibold text-[color:var(--text-strong)]">
                        {delivery.invoice || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setEdit(delivery)
                        setOpen(true)
                      }}
                      className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                    >
                      Edit
                    </button>

                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        remove(delivery._id)
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

      {open ? (
        <TankerModal
          close={() => {
            setOpen(false)
            setEdit(null)
          }}
          save={save}
          data={edit}
        />
      ) : null}

      {densityOpen ? <DensityModal close={() => setDensityOpen(false)} /> : null}

      <MobileActionFab
        actions={[
          {
            label: "Record Delivery",
            className: "bg-blue-600",
            onClick: () => {
              setEdit(null)
              setOpen(true)
            },
          },
          {
            label: "Density Calc",
            className: "bg-slate-700",
            onClick: () => setDensityOpen(true),
          },
        ]}
      />
    </div>
  )
}
