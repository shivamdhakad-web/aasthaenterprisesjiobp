import { Plus, Sparkles, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../components/MobileActionFab"
import { useAuth } from "../contexts/AuthContext"
import useManagerDashboardSettings from "../hooks/useManagerDashboardSettings"
import { getAiReportSummary } from "../services/aiApi"
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

const defaultBulkSaleDefaults = () => ({
  date: getToday(),
  dateApplied: false,
})

const buildBulkSaleRow = (user, defaults = defaultBulkSaleDefaults()) => ({
  ...defaultBulkSaleRow(user),
  date: defaults.date || getToday(),
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
  const isManager = user?.role === "Manager"
  const { canUse, canShowCard } = useManagerDashboardSettings("lubricants", isManager)
  const [data, setData] = useState([])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [fromDateFilter, setFromDateFilter] = useState("")
  const [toDateFilter, setToDateFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())
  const [open, setOpen] = useState(false)
  const [productModal, setProductModal] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [monthDeleteOpen, setMonthDeleteOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [savingSale, setSavingSale] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [aiSummary, setAiSummary] = useState("")
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [confirmState, setConfirmState] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [profitOverviewOpen, setProfitOverviewOpen] = useState(false)
  const [productStockOpen, setProductStockOpen] = useState(false)
  const [productMode, setProductMode] = useState("create")
  const [activeProduct, setActiveProduct] = useState(null)
  const [openCard, setOpenCard] = useState(null)
  const [openProductCard, setOpenProductCard] = useState(null)
  const [optionBuilder, setOptionBuilder] = useState({ field: "", value: "" })
  const [entryModePrompt, setEntryModePrompt] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkDefaults, setBulkDefaults] = useState(defaultBulkSaleDefaults())
  const [bulkRows, setBulkRows] = useState([buildBulkSaleRow(user)])
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

  const canManagerUse = (buttonKey) => !isManager || canUse(buttonKey)
  const canManagerShowCard = (cardKey) => !isManager || canShowCard(cardKey)
  const showNoAccess = (message) => setNotice({ type: "error", text: message })

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
    () => {
      const hasDateRange = Boolean(fromDateFilter || toDateFilter)

      return data.filter((entry) => {
        const target = [entry.product, entry.date, entry.soldBy, entry.price, entry.total]
          .join(" ")
          .toLowerCase()

        return (
          target.includes(search.toLowerCase()) &&
          (!productFilter || entry.product === productFilter) &&
          (!fromDateFilter || String(entry.date || "") >= fromDateFilter) &&
          (!toDateFilter || String(entry.date || "") <= toDateFilter) &&
          (hasDateRange || !monthFilter || String(entry.date || "").slice(0, 7) === monthFilter)
        )
      })
    },
    [data, fromDateFilter, monthFilter, productFilter, search, toDateFilter],
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

  const summaryCards = [
    { key: "todaySales", label: "Today Sales", value: formatCurrency(summary.todaySales), tone: "blue" },
    { key: "weekSales", label: "Week Sales", value: formatCurrency(summary.weekSales), tone: "amber" },
    { key: "monthSales", label: "Month Sales", value: formatCurrency(summary.monthSales), tone: "violet" },
    { key: "totalSales", label: "Total Sales", value: formatCurrency(summary.totalSales), tone: "indigo" },
    { key: "monthProfit", label: "Month Profit", value: formatCurrency(summary.monthProfit), tone: "emerald" },
    { key: "totalProfit", label: "Total Profit", value: formatCurrency(summary.totalProfit), tone: "green" },
  ]
  const visibleSummaryCards = summaryCards.filter((card) => canManagerShowCard(card.key))

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
    data.filter((entry) => {
      const entryDate = String(entry.date || "")
      return (
        (!reportForm.fromDate || entryDate >= reportForm.fromDate) &&
        (!reportForm.toDate || entryDate <= reportForm.toDate) &&
        (!reportForm.reportProduct || entry.product === reportForm.reportProduct)
      )
    })

  const buildLubricantAiPayload = () => {
    const productTotals = filtered.reduce((totals, entry) => {
      const product = entry.product || "Unspecified Product"
      totals[product] = (totals[product] || 0) + Number(entry.total || 0)
      return totals
    }, {})

    return {
      reportType: "Lubricant Sales",
      filters: {
        fromDate: fromDateFilter || "All",
        toDate: toDateFilter || "All",
        category: productFilter || "All Products",
        month: monthFilter || "All",
      },
      totals: {
        records: filtered.length,
        totalAmount: filtered.reduce((sum, entry) => sum + Number(entry.total || 0), 0),
        totalProfit: filtered.reduce((sum, entry) => sum + Number(entry.totalProfit || 0), 0),
        categoryTotals: productTotals,
      },
      rows: filtered.map((entry) => ({
        date: entry.date,
        category: entry.product || "Unspecified Product",
        description: `Quantity: ${Number(entry.quantity || 0)} | Sold By: ${entry.soldBy || "-"}`,
        amount: Number(entry.total || 0),
        profit: Number(entry.totalProfit || 0),
        price: Number(entry.price || 0),
        quantity: Number(entry.quantity || 0),
        soldBy: entry.soldBy || "",
      })),
    }
  }

  const generateAiSummary = async () => {
    if (!filtered.length) {
      setNotice({ type: "error", text: "No lubricant sales data found for AI summary." })
      return
    }

    setAiSummaryLoading(true)
    try {
      const result = await getAiReportSummary(buildLubricantAiPayload())
      setAiSummary(result.summary || "")
      setNotice({ type: "success", text: "AI summary generated successfully." })
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to generate AI summary right now.",
      })
    } finally {
      setAiSummaryLoading(false)
    }
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
    if (entry && !canManagerUse("editSale")) {
      showNoAccess("You do not have access to edit lubricant sales.")
      return
    }
    if (!entry && !canManagerUse("addSale")) {
      showNoAccess("You do not have access to add lubricant sales.")
      return
    }

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
    if (!canManagerUse("addSale")) {
      showNoAccess("You do not have access to add lubricant sales.")
      return
    }

    setEntryModePrompt(true)
  }

  const openBulkSaleModal = () => {
    if (!canManagerUse("addSale")) {
      showNoAccess("You do not have access to add lubricant sales.")
      return
    }

    const defaults = defaultBulkSaleDefaults()
    setBulkDefaults(defaults)
    setBulkRows([buildBulkSaleRow(user, defaults)])
    setBulkOpen(true)
  }

  const closeBulkSaleModal = () => {
    const defaults = defaultBulkSaleDefaults()
    setBulkOpen(false)
    setBulkDefaults(defaults)
    setBulkRows([buildBulkSaleRow(user, defaults)])
  }

  const updateBulkRow = (index, key, value) => {
    setBulkRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    )
  }

  const updateBulkDefaultDate = (value) => {
    setBulkDefaults((current) => {
      const next = { ...current, date: value, dateApplied: true }

      setBulkRows((rows) =>
        current.dateApplied ? rows : rows.map((row) => ({ ...row, date: value })),
      )

      return next
    })
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
    setBulkRows((current) => [...current, buildBulkSaleRow(user, bulkDefaults)])
  }

  const removeBulkRow = (index) => {
    setBulkRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)))
  }

  const saveBulkSales = async () => {
    if (!canManagerUse("addSale")) {
      showNoAccess("You do not have access to add lubricant sales.")
      return
    }

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
    if (!canManagerUse("addProduct")) {
      showNoAccess("You do not have access to add lubricant products.")
      return
    }

    resetProductForm()
    setProductMode("create")
    setProductModal(true)
  }

  const openEditProductModal = (product) => {
    if (!canManagerUse("editProduct")) {
      showNoAccess("You do not have access to edit lubricant products.")
      return
    }

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
    if (!canManagerUse("addStock")) {
      showNoAccess("You do not have access to add lubricant stock.")
      return
    }

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
    if (edit && !canManagerUse("editSale")) {
      showNoAccess("You do not have access to edit lubricant sales.")
      return
    }
    if (!edit && !canManagerUse("addSale")) {
      showNoAccess("You do not have access to add lubricant sales.")
      return
    }

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
    if (productMode === "create" && !canManagerUse("addProduct")) {
      showNoAccess("You do not have access to add lubricant products.")
      return
    }
    if (productMode === "edit" && !canManagerUse("editProduct")) {
      showNoAccess("You do not have access to edit lubricant products.")
      return
    }
    if (productMode === "stock" && !canManagerUse("addStock")) {
      showNoAccess("You do not have access to add lubricant stock.")
      return
    }

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
    if (!canManagerUse("deleteSale")) {
      showNoAccess("You do not have access to delete lubricant sales.")
      return
    }

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
    if (!canManagerUse("deleteProduct")) {
      showNoAccess("You do not have access to delete lubricant products.")
      return
    }

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
    if (!canManagerUse("deleteMonth")) {
      showNoAccess("You do not have access to delete month records.")
      return
    }

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
    if (!canManagerUse("generateReport")) {
      showNoAccess("You do not have access to generate lubricant reports.")
      return
    }

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

  const openReportModal = () => {
    if (!canManagerUse("generateReport")) {
      showNoAccess("You do not have access to generate lubricant reports.")
      return
    }

    setReportForm((current) => ({
      ...current,
      fromDate: fromDateFilter || current.fromDate,
      toDate: toDateFilter || current.toDate,
      reportProduct: productFilter || current.reportProduct,
    }))
    setReportOpen(true)
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 text-[color:var(--text-primary)] sm:p-6">

    <div className="mb-5 rounded-2xl border border-[var(--border-color)] bg-white px-5 py-3 shadow-sm">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 3h6v5l2 2v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8l2-2V3z"
          />
        </svg>
      </div>

      <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-strong)]">
        Lubricant Sales
      </h1>
      <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </span>
    </div>

    <div className="h-1 w-16 rounded-full bg-amber-200"></div>
  </div>
</div>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      {visibleSummaryCards.length ? (
        <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-6">
          {visibleSummaryCards.map((card) => (
            <SummaryCard key={card.key} label={card.label} value={card.value} tone={card.tone} />
          ))}
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
  <input
    placeholder="Search product or seller"
    value={search}
    onChange={(event) => setSearch(event.target.value)}
    className="input w-full xl:max-w-[420px]"
  />

  <div className="hidden gap-3 xl:ml-auto xl:flex">
    {canManagerUse("addProduct") ? (
      <button
        onClick={openCreateProductModal}
        className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm"
      >
        + Add Product
      </button>
    ) : null}

    {canManagerUse("addSale") ? (
      <button
        onClick={openEntryModePrompt}
        className="rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm"
      >
        + Add Sale
      </button>
    ) : null}

    {canManagerUse("generateReport") ? (
      <button
        onClick={openReportModal}
        className="rounded-2xl bg-purple-600 px-5 py-3 font-medium text-white shadow-sm"
      >
        Generate Report
      </button>
    ) : null}

    <button
      onClick={generateAiSummary}
      disabled={aiSummaryLoading}
      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-medium text-gray-50 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Sparkles size={18} />
      {aiSummaryLoading ? "Generating..." : "AI Summary"}
    </button>

    {canManagerUse("deleteMonth") ? (
      <button
        onClick={() => setMonthDeleteOpen(true)}
        className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 font-medium text-amber-700 shadow-sm"
      >
        Delete Month
      </button>
    ) : null}


  </div>
</div>

      {aiSummary ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-emerald-200 bg-[var(--bg-panel)] shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-emerald-950">AI Summary</h2>
                <p className="text-xs text-emerald-700">Lubricant sales insights for the selected filters</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiSummary("")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-100"
              title="Close AI summary"
              aria-label="Close AI summary"
            >
              <X size={17} />
            </button>
          </div>

          <div className="grid gap-2 p-4">
            {aiSummary
              .split("\n")
              .map((line) => line.replace(/^[-*]\s*/, "").trim())
              .filter(Boolean)
              .map((line, index) => (
                <div key={`${line}-${index}`} className="flex items-start gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[color:var(--text-primary)]">{line}</p>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      <div className="mb-4 xl:hidden">
        <button
          onClick={() => setShowFilter((current) => !current)}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)]"
        >
          {showFilter ? "Hide Filters" : "Filters"}
        </button>
      </div>

      <div className={`mb-6 ${showFilter ? "block" : "hidden xl:block"}`}>
        <div className="grid gap-3 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 xl:grid-cols-[minmax(0,250px)_minmax(0,200px)_minmax(0,200px)_minmax(0,240px)_auto]">
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
            value={fromDateFilter}
            onChange={(event) => setFromDateFilter(event.target.value)}
            title="From date"
            className="input"
          />

          <input
            type="date"
            value={toDateFilter}
            onChange={(event) => setToDateFilter(event.target.value)}
            title="To date"
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
              setFromDateFilter("")
              setToDateFilter("")
            }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] font-medium text-[color:var(--text-primary)]"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <section className="mb-6 rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_32px_rgba(16,24,20,0.05)] sm:p-6">
        <button
          type="button"
          onClick={() => setProfitOverviewOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Profit Overview</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Review product-wise cost, selling price, and profit summary.</p>
          </div>
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-sm font-medium text-[color:var(--text-primary)]">
            {profitOverviewOpen ? "Hide" : "Show"}
          </span>
        </button>

        {profitOverviewOpen ? (
          <>

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
          </>
        ) : null}
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
                          {canManagerUse("addStock") ? (
                            <button onClick={() => openAddStockModal(product)} className="text-green-500">
                              Add Stock
                            </button>
                          ) : null}
                          {canManagerUse("editProduct") ? (
                            <button onClick={() => openEditProductModal(product)} className="text-blue-500">
                              Edit
                            </button>
                          ) : null}
                          {canManagerUse("deleteProduct") ? (
                            <button onClick={() => askDeleteProduct(product)} className="text-red-500">
                              Delete
                            </button>
                          ) : null}
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
                        {canManagerUse("addStock") ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              openAddStockModal(product)
                            }}
                            className="w-full rounded-xl border border-green-500/20 bg-green-500/10 py-2 text-sm text-green-500"
                          >
                            Add Stock
                          </button>
                        ) : null}
                        {canManagerUse("editProduct") ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              openEditProductModal(product)
                            }}
                            className="w-full rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                          >
                            Edit Product
                          </button>
                        ) : null}
                        {canManagerUse("deleteProduct") ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              askDeleteProduct(product)
                            }}
                            className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                          >
                            Delete
                          </button>
                        ) : null}
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
                      {canManagerUse("editSale") ? (
                        <button onClick={() => openSaleModal(entry)} className="text-blue-500">
                          Edit
                        </button>
                      ) : null}
                      {canManagerUse("deleteSale") ? (
                        <button onClick={() => askDeleteSale(entry)} className="text-red-500">
                          Delete
                        </button>
                      ) : null}
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
                      {canManagerUse("editSale") ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            openSaleModal(entry)
                          }}
                          className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                        >
                          Edit
                        </button>
                      ) : null}
                      {canManagerUse("deleteSale") ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            askDeleteSale(entry)
                          }}
                          className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                        >
                          Delete
                        </button>
                      ) : null}
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
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                Default Date
              </span>
              <input
                type="date"
                value={bulkDefaults.date}
                onChange={(event) => updateBulkDefaultDate(event.target.value)}
                className="input"
              />
            </label>
          </div>

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
          canManagerUse("addSale")
            ? {
                label: "Add Sale",
                className: "bg-red-600",
                onClick: openEntryModePrompt,
              }
            : null,
          canManagerUse("addProduct")
            ? {
                label: "Add Product",
                className: "bg-blue-600",
                onClick: openCreateProductModal,
              }
            : null,
          canManagerUse("generateReport")
            ? {
                label: "Generate Report",
                className: "bg-purple-600",
                onClick: openReportModal,
              }
            : null,
          {
            label: aiSummaryLoading ? "Generating AI..." : "AI Summary",
            className: "bg-emerald-600",
            onClick: generateAiSummary,
          },
          canManagerUse("deleteMonth")
            ? {
                label: "Delete Month",
                className: "bg-amber-600",
                onClick: () => setMonthDeleteOpen(true),
              }
            : null,
        ].filter(Boolean)}
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
      <p className="font-semibold tracking-[0.18em] text-[color:var(--text-secondary)] text-[13px]">{label}</p>
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
