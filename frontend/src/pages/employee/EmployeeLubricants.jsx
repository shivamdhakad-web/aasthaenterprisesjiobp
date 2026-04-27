import { useEffect, useState } from "react"
import MobileActionFab from "../../components/MobileActionFab"
import {
  addMyLubricant,
  getEmployeeProducts,
  getMyLubricants,
  updateMyLubricant,
} from "../../services/employeeSelfApi"

const baseForm = {
  date: new Date().toISOString().slice(0, 10),
  product: "",
  price: "",
  quantity: "",
}

export default function EmployeeLubricants() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [form, setForm] = useState(baseForm)
  const [editing, setEditing] = useState(null)
  const [showMobileForm, setShowMobileForm] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const openForm = (sale = null) => {
  if (sale) {
    setEditing(sale)
    setForm({
      date: sale.date,
      product: sale.product,
      price: sale.price,
      quantity: sale.quantity,
    })
  } else {
    setEditing(null)
    setForm(baseForm)
  }

  setShowMobileForm(true)
  window.scrollTo({ top: 0, behavior: "smooth" })
}

  const load = async () => {
    const [productData, salesData] = await Promise.all([getEmployeeProducts(), getMyLubricants()])

    setProducts(productData)
    setSales(salesData)
  }

  useEffect(() => {
    load()
  }, [])

  const handleProduct = (value) => {
    const product = products.find((item) => item.name === value)
    setForm({
      ...form,
      product: value,
      price: product?.price || "",
    })
  }

  const submit = async () => {
    if (editing && !editing.canEdit) return

    if (editing) {
      await updateMyLubricant(editing._id, form)
      setSuccessMessage("Sale Updated")
    } else {
      await addMyLubricant(form)
      setSuccessMessage("Sale Submitted")
    }

    setShowSuccessPopup(true)

    setForm(baseForm)
    setEditing(null)
    setShowMobileForm(false)
    load()
  }

  const readOnlyMode = Boolean(editing && !editing.canEdit)

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div
  className={`rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 sm:p-5 ${
    showMobileForm || editing ? "block" : "hidden sm:block"
  }`}
>
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">My Lubricant Sales</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Yahan sirf apni sales add ya edit kar sakte ho. Product master aur stock admin side se
          control hota hai.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <input
            type="date"
            value={form.date}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="input"
          />
          <select
            value={form.product}
            disabled={readOnlyMode}
            onChange={(event) => handleProduct(event.target.value)}
            className="input"
          >
            <option value="">Select product</option>
            {products.map((item) => (
              <option key={item._id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            value={form.price}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
            placeholder="Price"
            className="input"
          />
          <input
            value={form.quantity}
            disabled={readOnlyMode}
            onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            placeholder="Quantity"
            className="input"
          />
          <button
            onClick={submit}
            disabled={readOnlyMode}
            className="btn btn-green w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editing ? (readOnlyMode ? "View Only" : "Update Sale") : "Add Sale"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.date}</td>
                  <td>{sale.product}</td>
                  <td>{sale.quantity}</td>
                  <td>Rs. {sale.price}</td>
                  <td>Rs. {sale.total}</td>
                  <td>
                    <button
                      onClick={() => openForm(sale)}
                      className="text-blue-500"
                    >
                      {sale.canEdit ? "Edit" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {sales.map((sale) => (
            <div
              key={sale._id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
            >
              <p className="text-sm text-[color:var(--text-secondary)]">{sale.date}</p>
              <p className="mt-2 text-lg font-medium text-[color:var(--text-strong)]">
                {sale.product}
              </p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                Qty {sale.quantity} • Rs. {sale.total}
              </p>
              <button
                onClick={() => {
                  setEditing(sale)
                  setForm({
                    date: sale.date,
                    product: sale.product,
                    price: sale.price,
                    quantity: sale.quantity,
                  })
                }}
                className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-500"
              >
                {sale.canEdit ? "Edit sale" : "View sale"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <MobileActionFab
        actions={[
          {
            label: "New Sale",
            className: "bg-green-600",
            onClick: () => openForm()
          },
        ]}
      />

      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm text-center shadow-xl">
            <h2 className="text-xl font-semibold text-green-600">
              {successMessage}
            </h2>

            <button
              onClick={() => setShowSuccessPopup(false)}
              className="mt-5 w-full bg-green-600 text-white py-2 rounded-xl"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
