import { useEffect, useState } from "react"
import * as XLSX from "xlsx"

import MobileActionFab from "../components/MobileActionFab"
import {
  addCustomer,
  addFuel,
  addPayment,
  deleteCustomer,
  getCustomerLedger,
  getCustomers,
} from "../services/customerApi"

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

const formatBalanceLabel = (value) =>
  Number(value) < 0
    ? `Advance ${formatCurrency(Math.abs(value))}`
    : `Due ${formatCurrency(Math.abs(value))}`

const normalizeWhatsappNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "")

  if (!digits) {
    return ""
  }

  if (digits.length === 10) {
    return `91${digits}`
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`
  }

  return digits
}

const openWhatsappChat = (phone, message) => {
  const whatsappNumber = normalizeWhatsappNumber(phone)

  if (!whatsappNumber) {
    window.alert("Customer ka valid WhatsApp number available nahi hai")
    return
  }

  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  window.open(url, "_blank", "noopener,noreferrer")
}

export default function CreditCustomers() {
  const [customers, setCustomers] = useState([])
  const [ledger, setLedger] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [fuelModal, setFuelModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [search, setSearch] = useState("")
  const [openCard, setOpenCard] = useState(null)
  const [openLedgerCard, setOpenLedgerCard] = useState(null)

  const [fuel, setFuel] = useState({
    fuelType: "Petrol",
    liters: "",
    rate: "",
    date: "",
    sendWhatsapp: false,
  })

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  })

  const [payment, setPayment] = useState({
    payment: "",
    date: "",
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const data = await getCustomers()
    setCustomers(data)
  }

  const openLedger = async (customer) => {
    if (selectedCustomer?._id === customer._id) {
      setSelectedCustomer(null)
      setLedger([])
      return
    }

    setSelectedCustomer(customer)
    const data = await getCustomerLedger(customer._id)
    setLedger(data)
  }

  const refreshLedger = async () => {
    if (!selectedCustomer) {
      return
    }

    const data = await getCustomerLedger(selectedCustomer._id)
    setLedger(data)
    fetchCustomers()
  }

  const handleAddCustomer = async () => {
    await addCustomer(form)
    setShowModal(false)
    setForm({
      name: "",
      phone: "",
      address: "",
    })
    fetchCustomers()
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete customer?")
    if (!confirmDelete) {
      return
    }

    await deleteCustomer(id)

    if (selectedCustomer?._id === id) {
      setSelectedCustomer(null)
      setLedger([])
    }

    fetchCustomers()
  }

  const saveFuel = async () => {
    await addFuel(selectedCustomer._id, fuel)
    setFuelModal(false)
    setFuel({
      fuelType: "Petrol",
      liters: "",
      rate: "",
      date: "",
      sendWhatsapp: false,
    })
    refreshLedger()
  }

  const savePayment = async () => {
    await addPayment(selectedCustomer._id, payment)
    setPaymentModal(false)
    setPayment({
      payment: "",
      date: "",
    })
    refreshLedger()
  }

  const generateRowBill = (row) => {
    const amount = row.type === "fuel" ? row.amount : row.payment
    const message = [
      `Hello ${selectedCustomer?.name || "Customer"},`,
      "",
      "Jio-bp customer ledger update:",
      `Date: ${new Date(row.date).toLocaleDateString()}`,
      `Type: ${row.type === "fuel" ? "Fuel Entry" : "Payment Entry"}`,
      row.fuelType ? `Fuel: ${row.fuelType}` : null,
      row.liters ? `Liters: ${row.liters}` : null,
      row.rate ? `Rate: ${row.rate}` : null,
      `Amount: ${formatCurrency(amount)}`,
      `Balance: ${formatBalanceLabel(row.balance)}`,
      "",
      "Thank you."
    ]
      .filter(Boolean)
      .join("\n")

    openWhatsappChat(selectedCustomer?.phone, message)
  }

  const generateBill = () => {
    if (!selectedCustomer) {
      return
    }

    const pending = ledger.length ? ledger[ledger.length - 1].balance : 0
    const recentEntries = ledger.slice(-8).map((item, index) => {
      const amount = item.type === "fuel" ? item.amount : item.payment
      const typeLabel = item.type === "fuel"
        ? `${item.fuelType || "Fuel"}${item.liters ? ` (${item.liters} L)` : ""}`
        : "Payment"

      return `${index + 1}. ${new Date(item.date).toLocaleDateString()} - ${typeLabel} - ${formatCurrency(amount)} - ${formatBalanceLabel(item.balance)}`
    })

    const message = [
      `Hello ${selectedCustomer.name},`,
      "",
      "Jio-bp customer ledger summary:",
      `Customer: ${selectedCustomer.name}`,
      `Phone: ${selectedCustomer.phone || "-"}`,
      `Total Fuel: ${formatCurrency(totalFuel)}`,
      `Total Payment: ${formatCurrency(totalPayment)}`,
      `Pending Balance: ${formatBalanceLabel(pending)}`,
      "",
      recentEntries.length ? "Recent Entries:" : null,
      recentEntries.length ? recentEntries.join("\n") : null,
      "",
      "Thank you."
    ]
      .filter(Boolean)
      .join("\n")

    openWhatsappChat(selectedCustomer.phone, message)
  }

  const exportExcel = () => {
    const pending = ledger.length ? ledger[ledger.length - 1].balance : 0
    const data = ledger.map((item) => ({
      Date: item.date?.slice(0, 10),
      Type: item.type,
      Fuel: item.fuelType,
      Liters: item.liters,
      Rate: item.rate,
      Amount: item.amount,
      Payment: item.payment,
      Balance: item.balance,
    }))

    const ws = XLSX.utils.json_to_sheet(data, { origin: "A5" })
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        ["Customer Statement"],
        [`Customer Name: ${selectedCustomer.name}`],
        [`Pending Balance: ${formatCurrency(pending)}`],
        [],
      ],
      { origin: "A1" },
    )

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Statement")
    XLSX.writeFile(wb, `${selectedCustomer.name}-statement.xlsx`)
  }

  const printBill = () => {
    const win = window.open("", "", "width=420,height=680")

    if (!win) {
      return
    }

    win.document.write("<h2>Fuel Bill</h2>")
    ledger.forEach((item) => {
      win.document.write(
        `<p>${item.date?.slice(0, 10)} - ${item.fuelType || item.type} - ${formatCurrency(item.amount || item.payment)}</p>`,
      )
    })
    win.print()
  }

  const filteredCustomers = customers.filter((customer) =>
    [customer.name, customer.phone, customer.address].join(" ").toLowerCase().includes(search.toLowerCase()),
  )

  const totalFuel = ledger
    .filter((item) => item.type === "fuel")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalPayment = ledger
    .filter((item) => item.type === "payment")
    .reduce((sum, item) => sum + Number(item.payment || 0), 0)

  const pendingBalance = ledger.length ? ledger[ledger.length - 1].balance : selectedCustomer?.baki || 0

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 sm:p-6 text-[color:var(--text-primary)]">
      <h1 className="mb-4 text-3xl font-bold text-[color:var(--text-strong)]">Credit Customers</h1>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search customer"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[420px]"
        />

        <button
          onClick={() => setShowModal(true)}
          className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          + Add Customer
        </button>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="table min-w-[920px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Balance</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.map((customer) => (
              <tr
                key={customer._id}
                className="cursor-pointer"
                onClick={() => openLedger(customer)}
              >
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.address}</td>
                <td className={Number(customer.baki) < 0 ? "text-green-500" : "text-red-500"}>
                  {Number(customer.baki) < 0
                    ? `Advance ${formatCurrency(Math.abs(customer.baki))}`
                    : `Due ${formatCurrency(customer.baki)}`}
                </td>
                <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="text-red-500"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDelete(customer._id)
                      }}
                    >
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
        {filteredCustomers.map((customer) => {
          const isOpen = openCard === customer._id
          const isSelected = selectedCustomer?._id === customer._id

          return (
            <div
              key={customer._id}
              onClick={() => {
                setOpenCard(isOpen ? null : customer._id)
                openLedger(customer)
              }}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">{customer.name}</p>
                  <a
                    href={`tel:${customer.phone}`}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-1 inline-block text-sm font-medium text-blue-500"
                  >
                    {customer.phone}
                  </a>
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    Number(customer.baki) < 0
                      ? "border border-green-500/20 bg-green-500/10 text-green-500"
                      : "border border-red-500/20 bg-red-500/10 text-red-500"
                  }`}
                >
                  {Number(customer.baki) < 0 ? "Advance" : "Due"}
                </div>
              </div>

              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{customer.address || "-"}</p>

              {isOpen ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                  <div className="card">
                    <p className="text-xs text-[color:var(--text-secondary)]">Balance</p>
                    <p
                      className={`mt-2 text-lg font-semibold ${
                        Number(customer.baki) < 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {formatCurrency(Math.abs(customer.baki))}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDelete(customer._id)
                      }}
                      className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                    >
                      Delete
                    </button>

                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        openLedger(customer)
                      }}
                      className={`flex-1 rounded-xl py-2 text-sm ${
                        isSelected
                          ? "border border-blue-500/20 bg-blue-500/10 text-blue-500"
                          : "border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-primary)]"
                      }`}
                    >
                      {isSelected ? "Hide Ledger" : "View Ledger"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {selectedCustomer ? (
        <div className="mt-6 rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_16px_32px_rgba(16,24,20,0.05)]">
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">
                Customer Ledger : {selectedCustomer.name}
              </h2>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                Track all fuel and payment entries in one place.
              </p>
            </div>

            <div className="hidden flex-wrap gap-2 sm:flex">
              <button onClick={() => setFuelModal(true)} className="btn btn-green">
                + Fuel Entry
              </button>

              <button onClick={() => setPaymentModal(true)} className="rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm">
                + Payment
              </button>

              <button onClick={generateBill} className="rounded-2xl bg-[#25D366] px-5 py-3 font-medium text-white shadow-sm">
                WhatsApp Share
              </button>

              <button onClick={exportExcel} className="rounded-2xl bg-purple-600 px-5 py-3 font-medium text-white shadow-sm">
                Excel
              </button>

              <button onClick={printBill} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)]">
                Print
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div className="card">
              <p className="text-sm text-[color:var(--text-secondary)]">Total Fuel</p>
              <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
                {formatCurrency(totalFuel)}
              </p>
            </div>

            <div className="card">
              <p className="text-sm text-[color:var(--text-secondary)]">Total Payment</p>
              <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
                {formatCurrency(totalPayment)}
              </p>
            </div>

            <div className="card">
              <p className="text-sm text-[color:var(--text-secondary)]">Pending Balance</p>
              <p className={`mt-3 text-2xl font-semibold ${Number(pendingBalance) < 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(Math.abs(pendingBalance))}
              </p>
            </div>
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="table min-w-[1120px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Fuel</th>
                  <th>Liters</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Balance</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {ledger.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.type === "fuel" ? "Fuel" : "Payment"}</td>
                    <td>{item.fuelType || "-"}</td>
                    <td>{item.liters || "-"}</td>
                    <td>{item.rate || "-"}</td>
                    <td>{item.amount ? formatCurrency(item.amount) : "-"}</td>
                    <td className="text-green-500">{item.payment ? formatCurrency(item.payment) : "-"}</td>
                    <td className={Number(item.balance) < 0 ? "text-green-500" : "text-red-500"}>
                      {formatCurrency(Math.abs(item.balance))}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-3">
                        <button className="text-green-600" onClick={() => generateRowBill(item)}>
                          WhatsApp Share
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 sm:hidden">
            {ledger.map((item) => {
              const isOpen = openLedgerCard === item._id
              const value = item.amount || item.payment

              return (
                <div
                  key={item._id}
                  onClick={() => setOpenLedgerCard(isOpen ? null : item._id)}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 shadow-[0_10px_24px_rgba(16,24,20,0.06)] active:scale-[0.98] transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">
                        {item.type}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">
                        {formatCurrency(value)}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className={`rounded-full px-3 py-1 text-sm font-semibold ${Number(item.balance) < 0 ? "border border-green-500/20 bg-green-500/10 text-green-500" : "border border-red-500/20 bg-red-500/10 text-red-500"}`}>
                      {formatCurrency(Math.abs(item.balance))}
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="card">
                          <p className="text-xs text-[color:var(--text-secondary)]">Fuel</p>
                          <p className="mt-2 font-semibold text-[color:var(--text-strong)]">
                            {item.fuelType || "-"}
                          </p>
                        </div>

                        <div className="card">
                          <p className="text-xs text-[color:var(--text-secondary)]">Liters</p>
                          <p className="mt-2 font-semibold text-[color:var(--text-strong)]">
                            {item.liters || "-"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          generateRowBill(item)
                        }}
                        className="w-full rounded-xl border border-green-500/20 bg-green-500/10 py-2 text-sm text-green-600"
                      >
                        WhatsApp Share
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">Add Customer</h2>

            <div className="grid gap-3">
              <input
                placeholder="Customer Name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="input"
              />

              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="input"
              />

              <input
                placeholder="Address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                className="input"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button className="rounded-xl bg-blue-600 px-4 py-2 text-white" onClick={handleAddCustomer}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {fuelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">Add Fuel</h2>

            <div className="grid gap-3">
              <input
                placeholder="Fuel Type"
                value={fuel.fuelType}
                className="input"
                onChange={(event) => setFuel({ ...fuel, fuelType: event.target.value })}
              />

              <input
                placeholder="Liters"
                value={fuel.liters}
                className="input"
                onChange={(event) => setFuel({ ...fuel, liters: event.target.value })}
              />

              <input
                placeholder="Rate"
                value={fuel.rate}
                className="input"
                onChange={(event) => setFuel({ ...fuel, rate: event.target.value })}
              />

              <input
                type="date"
                value={fuel.date}
                className="input"
                onChange={(event) => setFuel({ ...fuel, date: event.target.value })}
              />

              <label className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={fuel.sendWhatsapp}
                  onChange={(event) => setFuel({ ...fuel, sendWhatsapp: event.target.checked })}
                />
                Send Bill on WhatsApp
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
                onClick={() => setFuelModal(false)}
              >
                Cancel
              </button>

              <button className="rounded-xl bg-blue-600 px-4 py-2 text-white" onClick={saveFuel}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {paymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">Add Payment</h2>

            <div className="grid gap-3">
              <input
                placeholder="Amount"
                value={payment.payment}
                className="input"
                onChange={(event) => setPayment({ ...payment, payment: event.target.value })}
              />

              <input
                type="date"
                value={payment.date}
                className="input"
                onChange={(event) => setPayment({ ...payment, date: event.target.value })}
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
                onClick={() => setPaymentModal(false)}
              >
                Cancel
              </button>

              <button className="rounded-xl bg-green-600 px-4 py-2 text-white" onClick={savePayment}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MobileActionFab
        actions={[
          {
            label: "Add Customer",
            className: "bg-blue-600",
            onClick: () => setShowModal(true),
          },
          selectedCustomer
            ? {
                label: "Fuel Entry",
                className: "bg-green-600",
                onClick: () => setFuelModal(true),
              }
            : null,
          selectedCustomer
            ? {
                label: "Payment",
                className: "bg-blue-500",
                onClick: () => setPaymentModal(true),
              }
            : null,
          selectedCustomer
            ? {
                label: "WhatsApp",
                className: "bg-[#25D366]",
                onClick: generateBill,
              }
            : null,
          selectedCustomer
            ? {
                label: "Excel",
                className: "bg-purple-600",
                onClick: exportExcel,
              }
            : null,
        ].filter(Boolean)}
      />
    </div>
  )
}
