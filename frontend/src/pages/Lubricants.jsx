import { Plus, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../components/MobileActionFab"
import { useAuth } from "../contexts/AuthContext"
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

const getToday = () => new Date().toISOString().slice(0, 10)
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`

const formatDateTime = (value) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const buildOptionList = (defaults, values = []) =>
  [...new Set([...defaults, ...values.filter(Boolean).map((item) => String(item).trim())])]

const defaultSaleForm = (user) => ({
  date: getToday(),
  product: "",
  price: "",
  quantity: "",
  soldBy: user?.name || "Admin",
})

const defaultBulkSaleRow = (user) => ({
  date: getToday(),
  product: "",
  price: "",
  quantity: "",
  soldBy: user?.name || "Admin",
})

const defaultProductForm = () => ({
  name: "",
  price: "",
  costPrice: "",
  stock: "",
  addedDate: getToday(),
})

export default function Lubricants() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())
  const [open, setOpen] = useState(false)
  const [productModal, setProductModal] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [monthDeleteOpen, setMonthDeleteOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [savingSale, setSavingSale] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmState, setConfirmState] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [productStockOpen, setProductStockOpen] = useState(true)
  const [productMode, setProductMode] = useState("create")
  const [activeProduct, setActiveProduct] = useState(null)
  const [openCard, setOpenCard] = useState(null)
  const [openProductCard, setOpenProductCard] = useState(null)
  const [optionBuilder, setOptionBuilder] = useState({ field: "", value: "" })
  const [entryModePrompt, setEntryModePrompt] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkRows, setBulkRows] = useState([defaultBulkSaleRow(user)])
  const [reportForm, setReportForm] = useState({
    fromDate: "",
    toDate: "",
    reportProduct: "",
    format: "pdf",
  })
  const [monthDeleteForm, setMonthDeleteForm] = useState({
    month: "",
    year: String(new Date().getFullYear()),
  })
  const [form, setForm] = useState(defaultSaleForm(user))
  const [productForm, setProductForm] = useState(defaultProductForm())

  useEffect(() => {
    loadSales()
    loadProducts()
  }, [])

  useEffect(() => {
    if (!notice.text) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setNotice({ type: "", text: "" })
    }, 2600)

    return () => window.clearTimeout(timeout)
  }, [notice])

  const loadSales = async () => {
    const res = await getLubricants()
    setData(Array.isArray(res) ? res : [])
  }

  const loadProducts = async () => {
    const res = await getProducts()
    setProducts(Array.isArray(res) ? res : [])
  }

  const soldByOptions = useMemo(
    () => buildOptionList(["Admin", "Manager", user?.name || "Admin"], data.map((item) => item.soldBy)),
    [data, user?.name],
  )

  const filtered = useMemo(
    () =>
      data.filter((entry) => {
        const target = [entry.product, entry.date, entry.soldBy, entry.price, entry.total]
          .join(" ")
          .toLowerCase()

        return (
          target.includes(search.toLowerCase()) &&
          (!productFilter || entry.product === productFilter) &&
          (!dateFilter || entry.date === dateFilter) &&
          (!monthFilter || String(entry.date || "").slice(0, 7) === monthFilter)
        )
      }),
    [data, dateFilter, monthFilter, productFilter, search],
  )

  const summary = useMemo(() => {
    const today = new Date()
    const todayString = today.toISOString().slice(0, 10)
    let todaySales = 0
    let weekSales = 0
    let monthSales = 0
    let totalSales = 0
    let monthProfit = 0
    let totalProfit = 0

    filtered.forEach((entry) => {
      const saleTotal = Number(entry.total || 0)
      const profitTotal = Number(entry.totalProfit || 0)
      const entryDate = new Date(entry.date)

      totalSales += saleTotal
      totalProfit += profitTotal

      if (entry.date === todayString) {
        todaySales += saleTotal
      }

      const diffDays = (today - entryDate) / (1000 * 60 * 60 * 24)
      if (diffDays <= 7) {
        weekSales += saleTotal
      }

      if (String(entry.date || "").slice(0, 7) === (monthFilter || getCurrentMonth())) {
        monthSales += saleTotal
        monthProfit += profitTotal
      }
    })

    return {
      todaySales,
      weekSales,
      monthSales,
      totalSales,
      monthProfit,
      totalProfit,
    }
  }, [filtered, monthFilter])

  const profitRows = useMemo(
    () =>
      products.map((product) => {
        const productSales = data.filter((entry) => entry.product === product.name)
        const soldQty = productSales.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0)
        const totalProfit = productSales.reduce((sum, entry) => sum + Number(entry.totalProfit || 0), 0)
        const unitProfit = Number((Number(product.price || 0) - Number(product.costPrice || 0)).toFixed(2))

        return {
          ...product,
          soldQty,
          unitProfit,
          totalProfit,
        }
      }),
    [data, products],
  )

  const saleTotal = Number(form.price || 0) * Number(form.quantity || 0)
  const activeProductMeta = products.find((item) => item.name === form.product)
  const unitProfit = Number((Number(form.price || 0) - Number(activeProductMeta?.costPrice || 0)).toFixed(2))
  const totalProfit = Number((unitProfit * Number(form.quantity || 0)).toFixed(2))

  const getReportData = () =>
    filtered.filter((entry) => {
      const entryDate = new Date(entry.date)

      return (
        (!reportForm.fromDate || entryDate >= new Date(reportForm.fromDate)) &&
        (!reportForm.toDate || entryDate <= new Date(reportForm.toDate)) &&
        (!reportForm.reportProduct || entry.product === reportForm.reportProduct)
      )
    })

  const changeProduct = (name) => {
    const product = products.find((item) => item.name === name)

    setForm((current) => ({
      ...current,
      product: name,
      price: product?.price || "",
    }))
  }

  const resetSaleForm = () => {
    setForm(defaultSaleForm(user))
    setEdit(null)
    setOptionBuilder({ field: "", value: "" })
  }

  const resetProductForm = () => {
    setProductForm(defaultProductForm())
    setProductMode("create")
    setActiveProduct(null)
  }

  const openSaleModal = (entry = null) => {
    if (entry) {
      setEdit(entry)
      setForm({
        date: entry.date || getToday(),
        product: entry.product || "",
        price: String(entry.price ?? ""),
        quantity: String(entry.quantity ?? ""),
        soldBy: entry.soldBy || user?.name || "Admin",
      })
    } else {
      resetSaleForm()
    }

    setOpen(true)
  }

  const openEntryModePrompt = () => {
    setEntryModePrompt(true)
  }

  const openBulkSaleModal = () => {
    setBulkRows([defaultBulkSaleRow(user)])
    setBulkOpen(true)
  }

  const closeBulkSaleModal = () => {
    setBulkOpen(false)
    setBulkRows([defaultBulkSaleRow(user)])
  }

  const updateBulkRow = (index, key, value) => {
    setBulkRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    )
  }

  const syncBulkProduct = (index, productName) => {
    const product = products.find((item) => item.name === productName)

    setBulkRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              product: productName,
              price: product?.price || "",
            }
          : row,
      ),
    )
  }

  const addBulkRow = () => {
    setBulkRows((current) => [...current, defaultBulkSaleRow(user)])
  }

  const removeBulkRow = (index) => {
    setBulkRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)))
  }

  const saveBulkSales = async () => {
    const invalid = bulkRows.some((row) => !row.date || !row.product || !row.price || !row.quantity || !row.soldBy)

    if (invalid) {
      setNotice({ type: "error", text: "Please complete every sale row before saving." })
      return
    }

    setBulkSaving(true)

    try {
      for (const row of bulkRows) {
        const product = products.find((item) => item.name === row.product)
        const price = Number(row.price || 0)
        const quantity = Number(row.quantity || 0)
        const rowUnitProfit = Number((price - Number(product?.costPrice || 0)).toFixed(2))

        await addLubricant({
          date: row.date,
          product: row.product,
          price,
          quantity,
          total: Number((price * quantity).toFixed(2)),
          unitProfit: rowUnitProfit,
          totalProfit: Number((rowUnitProfit * quantity).toFixed(2)),
          soldBy: row.soldBy,
          createdByName: row.soldBy,
          createdByRole: user?.role || "Admin",
        })
      }

      closeBulkSaleModal()
      await Promise.all([loadSales(), loadProducts()])
      setNotice({ type: "success", text: "Multiple sale entries saved successfully." })
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save multiple sale entries.",
      })
    } finally {
      setBulkSaving(false)
    }
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
      costPrice: String(product.costPrice ?? ""),
      stock: String(product.stock ?? ""),
      addedDate: product.addedDate || getToday(),
    })
    setProductModal(true)
  }

  const openAddStockModal = (product) => {
    setActiveProduct(product)
    setProductMode("stock")
    setProductForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      costPrice: String(product.costPrice ?? ""),
      stock: "",
      addedDate: getToday(),
    })
    setProductModal(true)
  }

  const closeSaleModal = () => {
    setOpen(false)
    resetSaleForm()
  }

  const closeProductModal = () => {
    setProductModal(false)
    resetProductForm()
  }

  const saveSale = async () => {
    if (!form.date || !form.product || !form.quantity || !form.price || !form.soldBy) {
      setNotice({ type: "error", text: "Please complete all sale fields." })
      return
    }

    setSavingSale(true)

    try {
      const payload = {
        ...form,
        price: Number(form.price || 0),
        quantity: Number(form.quantity || 0),
        total: saleTotal,
        soldBy: form.soldBy,
        createdByName: form.soldBy,
        createdByRole: user?.role || "Admin",
      }

      if (edit) {
        await updateLubricant(edit._id, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: "Sale updated successfully." })
      } else {
        await addLubricant(payload)
        setNotice({ type: "success", text: "Sale saved successfully." })
      }

      closeSaleModal()
      await Promise.all([loadSales(), loadProducts()])
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save this sale.",
      })
    } finally {
      setSavingSale(false)
    }
  }

  const saveProduct = async () => {
    setSavingProduct(true)

    try {
      if (productMode === "create") {
        if (!productForm.name || !productForm.price || !productForm.costPrice) {
          setNotice({ type: "error", text: "Please enter all product details." })
          setSavingProduct(false)
          return
        }

        await addProduct({
          name: productForm.name,
          price: Number(productForm.price || 0),
          costPrice: Number(productForm.costPrice || 0),
          stock: Number(productForm.stock || 0),
          addedDate: productForm.addedDate || getToday(),
          createdByName: user?.name || "Admin",
          createdByRole: user?.role || "Admin",
          lastStockAddedAt: new Date().toISOString(),
          lastStockAddedBy: user?.name || "Admin",
          lastStockAddedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: "Product created successfully." })
      }

      if (productMode === "edit") {
        await updateProduct(activeProduct._id, {
          name: productForm.name,
          price: Number(productForm.price || 0),
          costPrice: Number(productForm.costPrice || 0),
          stock: Number(productForm.stock || 0),
          addedDate: productForm.addedDate || activeProduct.addedDate || getToday(),
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: "Product updated successfully." })
      }

      if (productMode === "stock") {
        if (!productForm.stock || Number(productForm.stock) <= 0) {
          setNotice({ type: "error", text: "Enter a stock quantity greater than zero." })
          setSavingProduct(false)
          return
        }

        await updateProduct(activeProduct._id, {
          name: activeProduct.name,
          price: Number(activeProduct.price || 0),
          costPrice: Number(activeProduct.costPrice || 0),
          stock: Number(activeProduct.stock || 0) + Number(productForm.stock || 0),
          addedDate: activeProduct.addedDate || getToday(),
          lastEditedAt: activeProduct.lastEditedAt,
          lastEditedBy: activeProduct.lastEditedBy,
          lastEditedByRole: activeProduct.lastEditedByRole,
          lastStockAddedAt: new Date().toISOString(),
          lastStockAddedBy: user?.name || "Admin",
          lastStockAddedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: "Stock added successfully." })
      }

      closeProductModal()
      await loadProducts()
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save product changes.",
      })
    } finally {
      setSavingProduct(false)
    }
  }

  const askDeleteSale = (entry) => {
    setConfirmState({
      title: "Delete Sale Entry",
      description: `Delete the sale entry for ${entry.product} on ${entry.date}?`,
      actionLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        await deleteLubricant(entry._id)
        await Promise.all([loadSales(), loadProducts()])
        setNotice({ type: "success", text: "Sale deleted successfully." })
      },
    })
  }

  const askDeleteProduct = (product) => {
    setConfirmState({
      title: "Delete Product",
      description: `Delete the product ${product.name}?`,
      actionLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        await deleteProduct(product._id)
        await loadProducts()
        setNotice({ type: "success", text: "Product deleted successfully." })
      },
    })
  }

  const confirmDeleteMonth = async () => {
    if (!monthDeleteForm.month || !monthDeleteForm.year) {
      setNotice({ type: "error", text: "Please select the month and year first." })
      return
    }

    await deleteMonth({ month: monthDeleteForm.month, year: monthDeleteForm.year })
    setMonthDeleteOpen(false)
    await Promise.all([loadSales(), loadProducts()])
    setNotice({ type: "success", text: "Month records deleted successfully." })
  }

  const addSoldByOption = () => {
    const value = optionBuilder.value.trim()

    if (!value) {
      setNotice({ type: "error", text: "Please enter a seller name first." })
      return
    }

    setForm((current) => ({ ...current, soldBy: value }))
    setOptionBuilder({ field: "", value: "" })
    setNotice({ type: "success", text: "Seller option added to the form." })
  }

  const reportData = getReportData()

  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Lubricant Sales Report", 14, 16)
    doc.setFontSize(10)
    doc.text(`From: ${reportForm.fromDate || "All"} To: ${reportForm.toDate || "All"}`, 14, 24)
    doc.text(`Product: ${reportForm.reportProduct || "All Products"}`, 14, 30)

    autoTable(doc, {
      startY: 38,
      head: [["Date", "Product", "Qty", "Price", "Total", "Unit Profit", "Total Profit", "Sold By"]],
      body: reportData.map((entry) => [
        entry.date,
        entry.product,
        entry.quantity,
        formatCurrency(entry.price),
        formatCurrency(entry.total),
        formatCurrency(entry.unitProfit),
        formatCurrency(entry.totalProfit),
        entry.soldBy,
      ]),
      headStyles: { fillColor: [147, 51, 234], textColor: 255 },
    })

    doc.save("lubricant-report.pdf")
  }

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      reportData.map((entry) => ({
        Date: entry.date,
        Product: entry.product,
        Quantity: entry.quantity,
        Price: entry.price,
        Total: entry.total,
        Unit_Profit: entry.unitProfit,
        Total_Profit: entry.totalProfit,
        Sold_By: entry.soldBy,
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lubricants")
    XLSX.writeFile(workbook, "lubricant-report.xlsx")
  }

  const handleGenerate = () => {
    if (!reportData.length) {
      setNotice({ type: "error", text: "No report data found for the selected filters." })
      return
    }

    if (reportForm.format === "pdf") {
      generatePDF()
    } else {
      generateExcel()
    }

    setReportOpen(false)
    setNotice({ type: "success", text: "Report downloaded successfully." })
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 text-[color:var(--text-primary)] sm:p-6">
      <div className="mb-5 rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Lubricant Sales</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Track product sales, profits, stock updates, and report downloads in one place.
        </p>
      </div>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-6">
        <SummaryCard label="Today Sales" value={formatCurrency(summary.todaySales)} tone="blue" />
        <SummaryCard label="Week Sales" value={formatCurrency(summary.weekSales)} tone="amber" />
        <SummaryCard label="Month Sales" value={formatCurrency(summary.monthSales)} tone="violet" />
        <SummaryCard label="Total Sales" value={formatCurrency(summary.totalSales)} tone="indigo" />
        <SummaryCard label="Month Profit" value={formatCurrency(summary.monthProfit)} tone="emerald" />
        <SummaryCard label="Total Profit" value={formatCurrency(summary.totalProfit)} tone="green" />
      </div>

      <div className="mb-4 flex flex-col gap-3 xl:flex-row">
        <input
          placeholder="Search product or seller"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input w-full xl:max-w-[420px]"
        />

        <button
          onClick={openCreateProductModal}
          className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm xl:inline-flex"
        >
          + Add Product
        </button>

        <button
          onClick={() => setMonthDeleteOpen(true)}
          className="hidden rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 font-medium text-amber-700 shadow-sm xl:inline-flex"
        >
          Delete Month
        </button>

        <button
          onClick={() => setReportOpen(true)}
          className="hidden rounded-2xl bg-purple-600 px-5 py-3 font-medium text-white shadow-sm xl:inline-flex"
        >
          Generate Report
        </button>

        <button
          onClick={openEntryModePrompt}
          className="hidden rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm xl:inline-flex"
        >
          + Add Sale
        </button>
      </div>

      <div className="mb-4 xl:hidden">
        <button
          onClick={() => setShowFilter((current) => !current)}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)]"
        >
          {showFilter ? "Hide Filters" : "Filters"}
        </button>
      </div>

      <div className={`mb-6 ${showFilter ? "block" : "hidden xl:block"}`}>
        <div className="grid gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 xl:grid-cols-[minmax(0,220px)_minmax(0,220px)_minmax(0,220px)_auto]">
          <select
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
            className="input"
          >
            <option value="">All Products</option>
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

          <input
            type="month"
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="input"
          />

          <button
            onClick={() => {
              setProductFilter("")
              setDateFilter("")
            }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)] xl:justify-self-start"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <section className="mb-6 rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">Profit Overview</h2>

        <div className="hidden overflow-x-auto xl:block">
          <table className="table min-w-[1100px]">
            <thead>
              <tr>
                <th>Product</th>
                <th>Selling Price</th>
                <th>Cost Price</th>
                <th>Unit Profit</th>
                <th>Units Sold</th>
                <th>Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {profitRows.map((row) => (
                <tr key={row._id}>
                  <td>{row.name}</td>
                  <td>{formatCurrency(row.price)}</td>
                  <td>{formatCurrency(row.costPrice)}</td>
                  <td className="font-semibold text-emerald-500">{formatCurrency(row.unitProfit)}</td>
                  <td>{row.soldQty}</td>
                  <td className="font-semibold text-emerald-500">{formatCurrency(row.totalProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 xl:hidden">
          {profitRows.map((row) => (
            <div key={row._id} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">{row.name}</p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    Selling {formatCurrency(row.price)} | Cost {formatCurrency(row.costPrice)}
                  </p>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-500">
                  {formatCurrency(row.totalProfit)}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3">
                  <p className="text-[color:var(--text-secondary)]">Unit Profit</p>
                  <p className="mt-1 font-semibold text-[color:var(--text-strong)]">{formatCurrency(row.unitProfit)}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3">
                  <p className="text-[color:var(--text-secondary)]">Units Sold</p>
                  <p className="mt-1 font-semibold text-[color:var(--text-strong)]">{row.soldQty}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] sm:p-6">
        <button
          type="button"
          onClick={() => setProductStockOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Product Stock</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              Add stock, edit product details, and review the latest stock update information.
            </p>
          </div>

          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-sm font-medium text-[color:var(--text-primary)]">
            {productStockOpen ? "Hide" : "Show"}
          </span>
        </button>

        {productStockOpen ? (
          <>
            <div className="mt-4 hidden overflow-x-auto xl:block">
              <table className="table min-w-[1220px]">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Selling Price</th>
                    <th>Cost Price</th>
                    <th>Stock</th>
                    <th>Last Stock Added</th>
                    <th>Added By</th>
                    <th>Last Edited</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{formatCurrency(product.costPrice)}</td>
                      <td className="font-semibold text-emerald-500">{product.stock}</td>
                      <td>{product.lastStockAddedAt ? formatDateTime(product.lastStockAddedAt) : "-"}</td>
                      <td>{product.lastStockAddedBy || "-"}</td>
                      <td>{product.lastEditedAt ? `${formatDateTime(product.lastEditedAt)} - ${product.lastEditedBy || "-"}` : "-"}</td>
                      <td>
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openAddStockModal(product)} className="text-green-500">
                            Add Stock
                          </button>
                          <button onClick={() => openEditProductModal(product)} className="text-blue-500">
                            Edit
                          </button>
                          <button onClick={() => askDeleteProduct(product)} className="text-red-500">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-4 xl:hidden">
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
                        Selling {formatCurrency(product.price)} | Cost {formatCurrency(product.costPrice)}
                      </p>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-500">
                      Stock: {product.stock}
                    </div>
                  </div>

                  {openProductCard === product._id ? (
                    <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                      <InfoLine label="Last Stock Added" value={product.lastStockAddedAt ? formatDateTime(product.lastStockAddedAt) : "-"} />
                      <InfoLine label="Added By" value={product.lastStockAddedBy || "-"} />
                      <InfoLine label="Last Edited" value={product.lastEditedAt ? `${formatDateTime(product.lastEditedAt)} - ${product.lastEditedBy || "-"}` : "-"} />
                      <div className="grid gap-2">
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
                            askDeleteProduct(product)
                          }}
                          className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                        >
                          Delete
                        </button>
                      </div>
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

        <div className="hidden max-h-[620px] overflow-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_16px_32px_rgba(16,24,20,0.05)] xl:block">
          <table className="table min-w-[1180px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Unit Profit</th>
                <th>Total Profit</th>
                <th>Sold By</th>
                <th>Audit</th>
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
                  <td className="font-semibold text-rose-500">{formatCurrency(entry.total)}</td>
                  <td className="font-semibold text-emerald-500">{formatCurrency(entry.unitProfit)}</td>
                  <td className="font-semibold text-emerald-500">{formatCurrency(entry.totalProfit)}</td>
                  <td>{entry.soldBy}</td>
                  <td className="text-left text-xs leading-6 text-[color:var(--text-secondary)]">
                    {entry.lastEditedAt ? (
                      <>
                        <div>Edited: {formatDateTime(entry.lastEditedAt)}</div>
                        <div>
                          By: {entry.lastEditedBy || "-"} {entry.lastEditedByRole ? `(${entry.lastEditedByRole})` : ""}
                        </div>
                      </>
                    ) : (
                      <span>Not edited yet</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openSaleModal(entry)} className="text-blue-500">
                        Edit
                      </button>
                      <button onClick={() => askDeleteSale(entry)} className="text-red-500">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="max-h-[640px] space-y-4 overflow-auto xl:hidden">
          {filtered.map((entry) => {
            const isOpen = openCard === entry._id

            return (
              <div
                key={entry._id}
                onClick={() => setOpenCard(isOpen ? null : entry._id)}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] transition active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[color:var(--text-strong)]">{entry.product}</p>
                    <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{entry.date}</p>
                  </div>

                  <div className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-500">
                    {formatCurrency(entry.total)}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                    <p className="text-[color:var(--text-secondary)]">Quantity</p>
                    <p className="mt-1 font-semibold text-[color:var(--text-strong)]">{entry.quantity}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                    <p className="text-[color:var(--text-secondary)]">Profit</p>
                    <p className="mt-1 font-semibold text-emerald-500">{formatCurrency(entry.totalProfit)}</p>
                  </div>
                </div>

                {isOpen ? (
                  <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                    <InfoLine label="Sold By" value={entry.soldBy} />
                    <InfoLine label="Unit Profit" value={formatCurrency(entry.unitProfit)} />
                    <InfoLine label="Last Edited" value={entry.lastEditedAt ? formatDateTime(entry.lastEditedAt) : "Not edited yet"} />
                    <InfoLine label="Edited By" value={entry.lastEditedBy ? `${entry.lastEditedBy} (${entry.lastEditedByRole || "-"})` : "-"} />
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
                          askDeleteSale(entry)
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
        <ModalShell title={edit ? "Edit Lubricant Sale" : "Add Lubricant Sale"} onClose={closeSaleModal}>
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
              placeholder="Selling Price"
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

            <InlineOptionSelect
              label="Sold By"
              value={form.soldBy}
              options={soldByOptions}
              onChange={(value) => setForm({ ...form, soldBy: value })}
              optionBuilder={optionBuilder}
              setOptionBuilder={setOptionBuilder}
              field="soldBy"
              onAdd={addSoldByOption}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 text-sm text-[color:var(--text-secondary)]">
              Total Sales
              <p className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">{formatCurrency(saleTotal)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-700">
              Estimated Profit
              <p className="mt-2 text-lg font-semibold text-emerald-600">{formatCurrency(totalProfit)}</p>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={closeSaleModal}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              onClick={saveSale}
              disabled={savingSale}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSale ? "Saving..." : "Save"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {bulkOpen ? (
        <ModalShell title="Add Multiple Lubricant Sales" onClose={closeBulkSaleModal}>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {bulkRows.map((row, index) => {
              const product = products.find((item) => item.name === row.product)
              const rowUnitProfit = Number((Number(row.price || 0) - Number(product?.costPrice || 0)).toFixed(2))
              const rowTotal = Number(row.price || 0) * Number(row.quantity || 0)
              const rowProfit = Number((rowUnitProfit * Number(row.quantity || 0)).toFixed(2))

              return (
                <div
                  key={`bulk-sale-${index}`}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-semibold text-[color:var(--text-strong)]">Entry {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeBulkRow(index)}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm text-red-500"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-3">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(event) => updateBulkRow(index, "date", event.target.value)}
                      className="input"
                    />

                    <select value={row.product} onChange={(event) => syncBulkProduct(index, event.target.value)} className="input">
                      <option value="">Select Product</option>
                      {products.map((item) => (
                        <option key={item._id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>

                    <input
                      placeholder="Selling Price"
                      value={row.price}
                      onChange={(event) => updateBulkRow(index, "price", event.target.value)}
                      className="input"
                    />

                    <input
                      placeholder="Quantity"
                      value={row.quantity}
                      onChange={(event) => updateBulkRow(index, "quantity", event.target.value)}
                      className="input"
                    />

                    <select
                      value={row.soldBy}
                      onChange={(event) => updateBulkRow(index, "soldBy", event.target.value)}
                      className="input"
                    >
                      {soldByOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3">
                      <p className="text-[color:var(--text-secondary)]">Total</p>
                      <p className="mt-1 font-semibold text-[color:var(--text-strong)]">{formatCurrency(rowTotal)}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 p-3 text-emerald-700">
                      <p>Profit</p>
                      <p className="mt-1 font-semibold">{formatCurrency(rowProfit)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={addBulkRow}
            className="mt-4 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 font-medium text-[color:var(--text-primary)]"
          >
            + Add Another Row
          </button>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeBulkSaleModal}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveBulkSales}
              disabled={bulkSaving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkSaving ? "Saving..." : "Save Entries"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {productModal ? (
        <ModalShell
          title={productMode === "stock" ? "Add Product Stock" : productMode === "edit" ? "Edit Product" : "Add Product"}
          onClose={closeProductModal}
        >
          <div className="grid gap-3">
            {productMode === "stock" ? (
              <>
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 text-sm text-[color:var(--text-secondary)]">
                  <div>
                    Product: <span className="font-semibold text-[color:var(--text-strong)]">{activeProduct?.name}</span>
                  </div>
                  <div className="mt-2">
                    Current Stock: <span className="font-semibold text-emerald-500">{activeProduct?.stock ?? 0}</span>
                  </div>
                  <div className="mt-2">
                    Last Added: <span className="font-semibold text-[color:var(--text-strong)]">{activeProduct?.lastStockAddedAt ? formatDateTime(activeProduct.lastStockAddedAt) : "-"}</span>
                  </div>
                </div>

                <input
                  type="date"
                  value={productForm.addedDate}
                  onChange={(event) => setProductForm({ ...productForm, addedDate: event.target.value })}
                  className="input"
                />

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
                  type="date"
                  value={productForm.addedDate}
                  onChange={(event) => setProductForm({ ...productForm, addedDate: event.target.value })}
                  className="input"
                />
                <input
                  placeholder="Selling Price"
                  value={productForm.price}
                  onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                  className="input"
                />
                <input
                  placeholder="Cost Price"
                  value={productForm.costPrice}
                  onChange={(event) => setProductForm({ ...productForm, costPrice: event.target.value })}
                  className="input"
                />
                <input
                  placeholder={productMode === "edit" ? "Current Stock" : "Opening Stock"}
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
            <button
              onClick={saveProduct}
              disabled={savingProduct}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProduct ? "Saving..." : "Save"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {reportOpen ? (
        <ModalShell title="Generate Report" onClose={() => setReportOpen(false)}>
          <div className="grid gap-3">
            <input
              type="date"
              value={reportForm.fromDate}
              onChange={(event) => setReportForm((current) => ({ ...current, fromDate: event.target.value }))}
              className="input"
            />
            <input
              type="date"
              value={reportForm.toDate}
              onChange={(event) => setReportForm((current) => ({ ...current, toDate: event.target.value }))}
              className="input"
            />
            <select
              value={reportForm.reportProduct}
              onChange={(event) => setReportForm((current) => ({ ...current, reportProduct: event.target.value }))}
              className="input"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product._id} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
            <select
              value={reportForm.format}
              onChange={(event) => setReportForm((current) => ({ ...current, format: event.target.value }))}
              className="input"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          <div className="mt-5 flex justify-end gap-3">
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
        </ModalShell>
      ) : null}

      {monthDeleteOpen ? (
        <ModalShell title="Delete Month Records" onClose={() => setMonthDeleteOpen(false)}>
          <div className="grid gap-3">
            <input
              placeholder="Month (example 06)"
              value={monthDeleteForm.month}
              onChange={(event) => setMonthDeleteForm((current) => ({ ...current, month: event.target.value }))}
              className="input"
            />
            <input
              placeholder="Year"
              value={monthDeleteForm.year}
              onChange={(event) => setMonthDeleteForm((current) => ({ ...current, year: event.target.value }))}
              className="input"
            />
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => setMonthDeleteOpen(false)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
            >
              Cancel
            </button>
            <button onClick={confirmDeleteMonth} className="rounded-xl bg-amber-600 px-4 py-2 text-white">
              Delete
            </button>
          </div>
        </ModalShell>
      ) : null}

      {confirmState ? (
        <ConfirmDialog
          title={confirmState.title}
          description={confirmState.description}
          actionLabel={confirmState.actionLabel}
          variant={confirmState.variant}
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            try {
              await confirmState.onConfirm?.()
            } catch (error) {
              setNotice({
                type: "error",
                text: error?.response?.data?.message || "Unable to complete this action.",
              })
            } finally {
              setConfirmState(null)
            }
          }}
        />
      ) : null}

      {entryModePrompt ? (
        <ConfirmDialog
          title="Add Lubricant Sale"
          description="Choose whether you want to save one sale entry or add multiple sale entries together."
          actionLabel="Single Entry"
          secondaryLabel="Multiple Entry"
          variant="primary"
          onCancel={() => setEntryModePrompt(false)}
          onConfirm={() => {
            setEntryModePrompt(false)
            openSaleModal()
          }}
          onSecondaryAction={() => {
            setEntryModePrompt(false)
            openBulkSaleModal()
          }}
        />
      ) : null}

      <MobileActionFab
        actions={[
          {
            label: "Add Sale",
            className: "bg-red-600",
            onClick: openEntryModePrompt,
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
            onClick: () => setMonthDeleteOpen(true),
          },
        ]}
      />
    </div>
  )
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    blue: { panel: "border-blue-200/70 bg-blue-50/80", value: "text-blue-600" },
    amber: { panel: "border-amber-200/70 bg-amber-50/80", value: "text-amber-600" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80", value: "text-violet-600" },
    indigo: { panel: "border-indigo-200/70 bg-indigo-50/80", value: "text-indigo-600" },
    emerald: { panel: "border-emerald-200/70 bg-emerald-50/80", value: "text-emerald-600" },
    green: { panel: "border-green-200/70 bg-green-50/80", value: "text-green-600" },
  }
  const current = tones[tone] || tones.blue

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] ${current.panel}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">{label}</p>
      <p className={`mt-3 text-2xl font-extrabold ${current.value}`}>{value}</p>
    </div>
  )
}

function InlineNotice({ notice }) {
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
        notice.type === "error"
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {notice.text}
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2 text-[color:var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ConfirmDialog({
  title,
  description,
  actionLabel,
  variant,
  secondaryLabel = "",
  onCancel,
  onConfirm,
  onSecondaryAction,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.22)]">
        <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-[color:var(--text-primary)]"
          >
            Cancel
          </button>
          {secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-600"
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-white ${variant === "danger" ? "bg-red-600" : "bg-blue-600"}`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function InlineOptionSelect({
  label,
  value,
  options,
  onChange,
  field,
  optionBuilder,
  setOptionBuilder,
  onAdd,
}) {
  const isActive = optionBuilder.field === field

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="input flex-1">
          {options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() =>
            setOptionBuilder((current) => ({
              field: current.field === field ? "" : field,
              value: current.field === field ? "" : "",
            }))
          }
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-primary)]"
          title={`Add ${label}`}
        >
          <Plus size={18} />
        </button>
      </div>

      {isActive ? (
        <div className="flex gap-2">
          <input
            placeholder={`New ${label}`}
            value={optionBuilder.value}
            onChange={(event) => setOptionBuilder({ field, value: event.target.value })}
            className="input flex-1"
          />
          <button type="button" onClick={onAdd} className="rounded-xl bg-blue-600 px-4 py-2 text-white">
            Add
          </button>
        </div>
      ) : null}
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <p className="text-sm text-[color:var(--text-secondary)]">
      {label}: <span className="font-medium text-[color:var(--text-strong)]">{value}</span>
    </p>
  )
}


