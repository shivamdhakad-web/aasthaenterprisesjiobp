import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../components/MobileActionFab"
import {
  addLubricant,
  addProduct,
  deleteLubricant,
  deleteMonth,
  deleteProduct,
  getLubricants,
  getProducts,
  updateLubricant,
  updateProduct,
} from "../services/lubricantApi"

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

const defaultSaleForm = {
  date: "",
  product: "",
  price: "",
  quantity: "",
  soldBy: "Admin",
}

const defaultProductForm = {
  name: "",
  price: "",
  stock: "",
}

export default function Lubricants() {
  const [data, setData] = useState([])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [open, setOpen] = useState(false)
  const [productModal, setProductModal] = useState(false)
  const [edit, setEdit] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reportProduct, setReportProduct] = useState("")
  const [format, setFormat] = useState("pdf")
  const [openCard, setOpenCard] = useState(null)
  const [openProductCard, setOpenProductCard] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [productStockOpen, setProductStockOpen] = useState(true)
  const [productMode, setProductMode] = useState("create")
  const [activeProduct, setActiveProduct] = useState(null)

  const [form, setForm] = useState(defaultSaleForm)
  const [productForm, setProductForm] = useState(defaultProductForm)

  useEffect(() => {
    loadSales()
    loadProducts()
  }, [])

  const loadSales = async () => {
    const res = await getLubricants()
    setData(res)
  }

  const loadProducts = async () => {
    const res = await getProducts()
    setProducts(res)
  }

  const changeProduct = (name) => {
    const product = products.find((item) => item.name === name)

    setForm((current) => ({
      ...current,
      product: name,
      price: product?.price || "",
    }))
  }

  const resetSaleForm = () => {
    setForm(defaultSaleForm)
    setEdit(null)
  }

  const resetProductForm = () => {
    setProductForm(defaultProductForm)
    setProductMode("create")
    setActiveProduct(null)
  }

  const openSaleModal = (entry = null) => {
    if (entry) {
      setEdit(entry)
      setForm({
        date: entry.date || "",
        product: entry.product || "",
        price: entry.price || "",
        quantity: entry.quantity || "",
        soldBy: entry.soldBy || "Admin",
      })
    } else {
      resetSaleForm()
    }

    setOpen(true)
  }

  const openCreateProductModal = () => {
    resetProductForm()
    setProductMode("create")
    setProductModal(true)
  }

  const openEditProductModal = (product) => {
    setActiveProduct(product)
    setProductMode("edit")
    setProductForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
    })
    setProductModal(true)
  }

  const openAddStockModal = (product) => {
    setActiveProduct(product)
    setProductMode("stock")
    setProductForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      stock: "",
    })
    setProductModal(true)
  }

  const closeProductModal = () => {
    setProductModal(false)
    resetProductForm()
  }

  const save = async () => {
    if (!form.date || !form.product || !form.quantity) {
      alert("Please fill all fields")
      return
    }

    const total = Number(form.price || 0) * Number(form.quantity || 0)
    const payload = {
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
      total,
    }

    if (edit) {
      await updateLubricant(edit._id, payload)
    } else {
      await addLubricant(payload)
    }

    setOpen(false)
    resetSaleForm()
    loadSales()
    loadProducts()
  }

  const remove = async (id) => {
    await deleteLubricant(id)
    loadSales()
    loadProducts()
  }

  const saveProduct = async () => {
    if (productMode === "create") {
      if (!productForm.name || !productForm.price) {
        alert("Enter product details")
        return
      }

      await addProduct({
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock || 0),
      })
    }

    if (productMode === "edit") {
      if (!activeProduct?._id || !productForm.name || !productForm.price) {
        alert("Enter product details")
        return
      }

      await updateProduct(activeProduct._id, {
        name: productForm.name,
        price: Number(productForm.price),
        stock: Number(productForm.stock || 0),
      })
    }

    if (productMode === "stock") {
      if (!activeProduct?._id) {
        alert("Product not found")
        return
      }

      if (!productForm.stock || Number(productForm.stock) <= 0) {
        alert("Enter stock quantity to add")
        return
      }

      await updateProduct(activeProduct._id, {
        name: activeProduct.name,
        price: Number(activeProduct.price || 0),
        stock: Number(activeProduct.stock || 0) + Number(productForm.stock || 0),
      })
    }

    closeProductModal()
    loadProducts()
  }

  const removeProduct = async (id) => {
    await deleteProduct(id)
    loadProducts()
  }

  const deleteMonthData = async () => {
    const month = prompt("Enter Month (example 03)")
    const year = prompt("Enter Year (example 2026)")

    if (!month || !year) {
      return
    }

    await deleteMonth({ month, year })
    loadSales()
  }

  const filtered = data.filter((entry) => {
    const target = [entry.product, entry.date, entry.soldBy, entry.price, entry.total]
      .join(" ")
      .toLowerCase()

    return (
      target.includes(search.toLowerCase()) &&
      (!productFilter || entry.product === productFilter) &&
      (!dateFilter || entry.date === dateFilter)
    )
  })

  const today = new Date()
  const todayString = today.toISOString().slice(0, 10)
  let todayTotal = 0
  let weekTotal = 0
  let monthTotal = 0
  let totalAll = 0

  filtered.forEach((entry) => {
    const entryTotal = Number(entry.total || 0)
    const entryDate = new Date(entry.date)

    totalAll += entryTotal

    if (entry.date === todayString) {
      todayTotal += entryTotal
    }

    const diffDays = (today - entryDate) / (1000 * 60 * 60 * 24)
    if (diffDays <= 7) {
      weekTotal += entryTotal
    }

    if (entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear()) {
      monthTotal += entryTotal
    }
  })

  const getReportData = () => {
    return filtered.filter((entry) => {
      const entryDate = new Date(entry.date)

      return (
        (!fromDate || entryDate >= new Date(fromDate)) &&
        (!toDate || entryDate <= new Date(toDate)) &&
        (!reportProduct || entry.product === reportProduct)
      )
    })
  }

  const generatePDF = (reportData) => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("Lubricant Sales Report", 14, 15)

    doc.setFontSize(10)
    doc.text(`From: ${fromDate || "All"} To: ${toDate || "All"}`, 14, 22)
    doc.text(`Product: ${reportProduct || "All"}`, 14, 28)
    doc.text(`Total Records: ${reportData.length}`, 14, 34)

    autoTable(doc, {
      startY: 40,
      head: [["Date", "Product", "Qty", "Price", "Total", "Sold By"]],
      body: reportData.map((entry) => [
        entry.date,
        entry.product,
        entry.quantity,
        formatCurrency(entry.price),
        formatCurrency(entry.total),
        entry.soldBy,
      ]),
    })

    doc.save("Lubricant_Report.pdf")
  }

  const generateExcel = (reportData) => {
    const formatted = reportData.map((entry, index) => ({
      ID: index + 1,
      Date: entry.date,
      Product: entry.product,
      Qty: entry.quantity,
      Price: entry.price,
      Total: entry.total,
      Sold_By: entry.soldBy,
    }))

    const ws = XLSX.utils.json_to_sheet(formatted)
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, "Report")
    XLSX.writeFile(wb, "Lubricant_Report.xlsx")
  }

  const handleGenerate = () => {
    const reportData = getReportData()

    if (!reportData.length) {
      alert("No data found")
      return
    }

    if (format === "pdf") {
      generatePDF(reportData)
    } else {
      generateExcel(reportData)
    }

    setReportOpen(false)
  }

  const total = Number(form.price || 0) * Number(form.quantity || 0) || 0

  const productModalTitle = useMemo(() => {
    if (productMode === "edit") {
      return "Edit Product"
    }

    if (productMode === "stock") {
      return "Add Stock"
    }

    return "Add Product"
  }, [productMode])

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 sm:p-6 text-[color:var(--text-primary)]">
      <h1 className="mb-4 text-3xl font-bold text-[color:var(--text-strong)]">Lubricant Sales</h1>

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Today</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(todayTotal)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Week</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(weekTotal)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Month</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(monthTotal)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-[color:var(--text-secondary)]">Total</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
            {formatCurrency(totalAll)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search product or seller"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full sm:max-w-[420px]"
        />

        <button
          onClick={openCreateProductModal}
          className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          + Add Product
        </button>

        <button
          onClick={deleteMonthData}
          className="hidden rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 font-medium text-amber-700 shadow-sm sm:inline-flex"
        >
          Delete Month
        </button>

        <button
          onClick={() => setReportOpen(true)}
          className="hidden rounded-2xl bg-purple-600 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          Generate Report
        </button>

        <button
          onClick={() => openSaleModal()}
          className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm sm:inline-flex"
        >
          + Add Sale
        </button>
      </div>

      <div className="mb-4 sm:hidden">
        <button
          onClick={() => setShowFilter((current) => !current)}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)]"
        >
          {showFilter ? "Hide Filters" : "Filters"}
        </button>
      </div>

      <div className={`mb-6 ${showFilter ? "block" : "hidden sm:block"}`}>
        <div className="grid gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 sm:grid-cols-[minmax(0,220px)_minmax(0,220px)_auto]">
          <select
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
            className="input"
          >
            <option value="">All Product</option>
            {products.map((product) => (
              <option key={product._id} value={product.name}>
                {product.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="input"
          />

          <button
            onClick={() => {
              setProductFilter("")
              setDateFilter("")
            }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)] sm:justify-self-start"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <section className="mb-6 rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] sm:p-6">
        <button
          type="button"
          onClick={() => setProductStockOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Product Stock</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              Add or edit stock of existing products from here.
            </p>
          </div>

          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-sm font-medium text-[color:var(--text-primary)]">
            {productStockOpen ? "Hide" : "Show"}
          </span>
        </button>

        {productStockOpen ? (
          <>
            <div className="mt-4 hidden overflow-x-auto sm:block">
              <table className="table min-w-[900px]">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td className="text-green-500">{product.stock}</td>
                      <td>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openAddStockModal(product)}
                            className="text-green-500"
                          >
                            Add Stock
                          </button>

                          <button
                            onClick={() => openEditProductModal(product)}
                            className="text-blue-500"
                          >
                            Edit
                          </button>

                          <button onClick={() => removeProduct(product._id)} className="text-red-500">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-4 sm:hidden">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() =>
                    setOpenProductCard((current) => (current === product._id ? null : product._id))
                  }
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[color:var(--text-strong)]">{product.name}</p>
                      <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                        {formatCurrency(product.price)}
                      </p>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        Number(product.stock) < 5
                          ? "border border-red-500/20 bg-red-500/10 text-red-500"
                          : "border border-green-500/20 bg-green-500/10 text-green-500"
                      }`}
                    >
                      Stock: {product.stock}
                    </div>
                  </div>

                  {openProductCard === product._id ? (
                    <div className="mt-4 grid gap-2 border-t border-[var(--border-color)] pt-3">
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          openAddStockModal(product)
                        }}
                        className="w-full rounded-xl border border-green-500/20 bg-green-500/10 py-2 text-sm text-green-500"
                      >
                        Add Stock
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          openEditProductModal(product)
                        }}
                        className="w-full rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                      >
                        Edit Product
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          removeProduct(product._id)
                        }}
                        className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[color:var(--text-strong)]">Sales Register</h2>

        <div className="hidden overflow-x-auto sm:block">
          <table className="table min-w-[940px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Sold By</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((entry) => (
                <tr key={entry._id}>
                  <td>{entry.date}</td>
                  <td>{entry.product}</td>
                  <td>{entry.quantity}</td>
                  <td>{formatCurrency(entry.price)}</td>
                  <td className="text-red-500">{formatCurrency(entry.total)}</td>
                  <td>{entry.soldBy}</td>
                  <td>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openSaleModal(entry)} className="text-blue-500">
                        Edit
                      </button>

                      <button onClick={() => remove(entry._id)} className="text-red-500">
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
          {filtered.map((entry) => {
            const isOpen = openCard === entry._id

            return (
              <div
                key={entry._id}
                onClick={() => setOpenCard(isOpen ? null : entry._id)}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[color:var(--text-strong)]">{entry.product}</p>
                    <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{entry.date}</p>
                  </div>

                  <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-500">
                    {formatCurrency(entry.total)}
                  </div>
                </div>

                <p className="mt-3 text-sm text-[color:var(--text-secondary)]">Qty: {entry.quantity}</p>

                {isOpen ? (
                  <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                    <p className="text-sm text-[color:var(--text-secondary)]">
                      Price: <span className="text-[color:var(--text-strong)]">{formatCurrency(entry.price)}</span>
                    </p>
                    <p className="text-sm text-[color:var(--text-secondary)]">
                      Sold by: <span className="text-[color:var(--text-strong)]">{entry.soldBy}</span>
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          openSaleModal(entry)
                        }}
                        className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                      >
                        Edit
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          remove(entry._id)
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
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">
              {edit ? "Edit Lubricant Sale" : "Add Lubricant Sale"}
            </h2>

            <div className="grid gap-3">
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                className="input"
              />

              <select value={form.product} onChange={(event) => changeProduct(event.target.value)} className="input">
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product.name}>
                    {product.name}
                  </option>
                ))}
              </select>

              <input
                placeholder="Price"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                className="input"
              />

              <input
                placeholder="Quantity"
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                className="input"
              />

              <select
                value={form.soldBy}
                onChange={(event) => setForm({ ...form, soldBy: event.target.value })}
                className="input"
              >
                <option>Admin</option>
                <option>Rohit</option>
                <option>Manager</option>
              </select>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 text-sm text-[color:var(--text-secondary)]">
              Total: <span className="font-semibold text-[color:var(--text-strong)]">{formatCurrency(total)}</span>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpen(false)
                  resetSaleForm()
                }}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
              >
                Cancel
              </button>

              <button onClick={save} className="rounded-xl bg-blue-600 px-4 py-2 text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {productModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">{productModalTitle}</h2>

            <div className="grid gap-3">
              {productMode === "stock" ? (
                <>
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 text-sm text-[color:var(--text-secondary)]">
                    Product: <span className="font-semibold text-[color:var(--text-strong)]">{activeProduct?.name}</span>
                    <br />
                    Current Stock: <span className="font-semibold text-green-500">{activeProduct?.stock ?? 0}</span>
                  </div>

                  <input
                    placeholder="Add Stock Quantity"
                    value={productForm.stock}
                    onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })}
                    className="input"
                  />
                </>
              ) : (
                <>
                  <input
                    placeholder="Product Name"
                    value={productForm.name}
                    onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                    className="input"
                  />

                  <input
                    placeholder="Price"
                    value={productForm.price}
                    onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                    className="input"
                  />

                  <input
                    placeholder={productMode === "edit" ? "Current Stock" : "Stock"}
                    value={productForm.stock}
                    onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })}
                    className="input"
                  />
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeProductModal}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
              >
                Cancel
              </button>

              <button onClick={saveProduct} className="rounded-xl bg-blue-600 px-4 py-2 text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-primary)]">
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">Generate Report</h2>

            <div className="flex flex-col gap-3">
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="input"
              />

              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="input"
              />

              <select
                value={reportProduct}
                onChange={(event) => setReportProduct(event.target.value)}
                className="input"
              >
                <option value="">All Products</option>
                {products.map((product) => (
                  <option key={product._id} value={product.name}>
                    {product.name}
                  </option>
                ))}
              </select>

              <select value={format} onChange={(event) => setFormat(event.target.value)} className="input">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setReportOpen(false)}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
              >
                Cancel
              </button>

              <button onClick={handleGenerate} className="rounded-xl bg-green-600 px-4 py-2 text-white">
                Download
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MobileActionFab
        actions={[
          {
            label: "Add Sale",
            className: "bg-red-600",
            onClick: () => openSaleModal(),
          },
          {
            label: "Add Product",
            className: "bg-blue-600",
            onClick: openCreateProductModal,
          },
          {
            label: "Generate Report",
            className: "bg-purple-600",
            onClick: () => setReportOpen(true),
          },
          {
            label: "Delete Month",
            className: "bg-amber-600",
            onClick: deleteMonthData,
          },
        ]}
      />
    </div>
  )
}
