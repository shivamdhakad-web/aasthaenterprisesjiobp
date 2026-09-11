import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  Calendar,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CreditCard,
  Droplet,
  Droplets,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Fuel,
  Home,
  Layers,
  LayoutGrid,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Package,
  Percent,
  PieChart,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

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

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")

const formatMobileDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}`
}

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

const getLubricantMeta = (productName = "") => {
  const name = String(productName).toLowerCase()
  if (name.includes("4t") || name.includes("bike") || name.includes("moto") || name.includes("scooter")) {
    return {
      icon: Flame,
      bgColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      tagColor: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",
      badge: "2W / 4T",
    }
  }
  if (name.includes("15w") || name.includes("20w") || name.includes("pride") || name.includes("diesel") || name.includes("truck") || name.includes("engine")) {
    return {
      icon: Droplets,
      bgColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      tagColor: "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300",
      badge: "Heavy Duty",
    }
  }
  if (name.includes("coolant") || name.includes("water") || name.includes("radiator")) {
    return {
      icon: Droplet,
      bgColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      tagColor: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300",
      badge: "Coolant",
    }
  }
  if (name.includes("gear") || name.includes("trans") || name.includes("axle") || name.includes("differential")) {
    return {
      icon: Wrench,
      bgColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      tagColor: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300",
      badge: "Gear Oil",
    }
  }
  if (name.includes("grease") || name.includes("chassis") || name.includes("bearing")) {
    return {
      icon: Layers,
      bgColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      tagColor: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300",
      badge: "Grease",
    }
  }
  if (name.includes("def") || name.includes("adblue") || name.includes("urea")) {
    return {
      icon: Package,
      bgColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      tagColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
      badge: "DEF",
    }
  }
  return {
    icon: Droplets,
    bgColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    tagColor: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",
    badge: "Lubricant",
  }
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
  const navigate = useNavigate()
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

  // Mobile-specific state
  const [mobileActiveTab, setMobileActiveTab] = useState("sales") // "sales" | "stock" | "profit"
  const [mobileTimeframe, setMobileTimeframe] = useState("month") // "today" | "week" | "month" | "all"
  const [showMobileTimeDropdown, setShowMobileTimeDropdown] = useState(false)
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false)
  const [mobileActionItem, setMobileActionItem] = useState(null)
  const [mobileDetailItem, setMobileDetailItem] = useState(null)
  const [expandedStockCardId, setExpandedStockCardId] = useState(null)

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

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const term = search.toLowerCase()
    return products.filter((p) => p.name?.toLowerCase().includes(term))
  }, [products, search])

  const summary = useMemo(() => {
    const today = new Date()
    const todayString = today.toISOString().slice(0, 10)
    let todaySales = 0
    let weekSales = 0
    let monthSales = 0
    let totalSales = 0
    let todayProfit = 0
    let weekProfit = 0
    let monthProfit = 0
    let totalProfit = 0
    let totalQuantity = 0
    let todayQuantity = 0
    let monthQuantity = 0

    filtered.forEach((entry) => {
      const saleTotal = Number(entry.total || 0)
      const profitTotal = Number(entry.totalProfit || 0)
      const qty = Number(entry.quantity || 0)
      const entryDate = new Date(entry.date)

      totalSales += saleTotal
      totalProfit += profitTotal
      totalQuantity += qty

      if (entry.date === todayString) {
        todaySales += saleTotal
        todayProfit += profitTotal
        todayQuantity += qty
      }

      const diffDays = (today - entryDate) / (1000 * 60 * 60 * 24)
      if (diffDays >= 0 && diffDays <= 7) {
        weekSales += saleTotal
        weekProfit += profitTotal
      }

      if (String(entry.date || "").slice(0, 7) === (monthFilter || getCurrentMonth())) {
        monthSales += saleTotal
        monthProfit += profitTotal
        monthQuantity += qty
      }
    })

    return {
      todaySales,
      weekSales,
      monthSales,
      totalSales,
      todayProfit,
      weekProfit,
      monthProfit,
      totalProfit,
      totalQuantity,
      todayQuantity,
      monthQuantity,
    }
  }, [filtered, monthFilter])

  const mobileHeroAmount = useMemo(() => {
    switch (mobileTimeframe) {
      case "today":
        return {
          label: "Today",
          value: formatCurrency(summary.todaySales),
          profit: formatCurrency(summary.todayProfit),
          qty: summary.todayQuantity,
        }
      case "week":
        return {
          label: "This Week",
          value: formatCurrency(summary.weekSales),
          profit: formatCurrency(summary.weekProfit),
          qty: null,
        }
      case "all":
        return {
          label: "All Time",
          value: formatCurrency(summary.totalSales),
          profit: formatCurrency(summary.totalProfit),
          qty: summary.totalQuantity,
        }
      case "month":
      default:
        return {
          label: "This Month",
          value: formatCurrency(summary.monthSales),
          profit: formatCurrency(summary.monthProfit),
          qty: summary.monthQuantity,
        }
    }
  }, [mobileTimeframe, summary])

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
      headStyles: { fillColor: [180, 83, 9], textColor: 255 },
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
    <div className="w-full max-w-[100vw] overflow-x-hidden p-3 text-[color:var(--text-primary)] sm:p-6 pb-28 lg:pb-6">
      {notice.text ? <InlineNotice notice={notice} /> : null}

      {/* =========================================================================
          MOBILE VIEW (ONLY FOR PHONE: lg:hidden)
      ========================================================================= */}
      <div className="lg:hidden space-y-3">
        {/* 1. Mobile Header Card */}
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Droplets size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-[color:var(--text-strong)] leading-tight">
                Lubricants
              </h1>
              <p className="text-[11px] font-medium text-[color:var(--text-secondary)]">Oil sales & inventory</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManagerUse("addSale") ? (
              <button
                type="button"
                onClick={openEntryModePrompt}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 active:scale-95 transition-all"
                title="Add Sale"
              >
                <Plus size={19} strokeWidth={2.5} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => navigate(user?.role === "Admin" ? "/admin/notifications" : "/notifications")}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[color:var(--text-secondary)] hover:bg-[var(--bg-soft)] transition-colors"
              title="Notifications"
            >
              <Bell size={19} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-[var(--bg-panel)]" />
            </button>
          </div>
        </div>

        {/* 2. Premium Amber/Golden Hero Gradient Card with Liquid Wave */}
        <div className="relative z-30 overflow-visible rounded-[26px] bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#d97706] p-5 text-white shadow-xl shadow-amber-900/15">
          {/* Clipped background wave vector */}
          <div className="absolute inset-0 overflow-hidden rounded-[26px] pointer-events-none">
            <svg
              viewBox="0 0 280 80"
              className="absolute bottom-0 right-0 w-3/5 h-20 text-amber-300 opacity-80"
            >
              <defs>
                <linearGradient id="mobileLubeHeroGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,60 Q70,75 140,38 T280,28"
                fill="none"
                stroke="#fcd34d"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="190" cy="32" r="4" fill="#ffffff" />
              <path
                d="M0,60 Q70,75 140,38 T280,28 L280,80 L0,80 Z"
                fill="url(#mobileLubeHeroGrad)"
              />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Top row: Title and Dashboard button */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-amber-100/90 tracking-wide flex items-center gap-1.5">
                <Flame size={14} className="text-amber-300" />
                Total Lubricant Sales
              </span>
              {!isManager ? (
                <button
                  type="button"
                  onClick={() => navigate("/admin/lubricant-dashboard")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 border border-white/20 text-white shadow-sm active:scale-95 transition-all"
                  title="Lubricant Dashboard"
                >
                  <TrendingUp size={18} />
                </button>
              ) : null}
            </div>

            {/* Large Bold Amount */}
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm mb-3">
              {mobileHeroAmount.value}
            </div>

            {/* Middle metrics row: Profit tag & Timeframe dropdown */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative inline-block z-40">
                <button
                  type="button"
                  onClick={() => setShowMobileTimeDropdown((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-black/25 px-3 py-1.5 text-xs font-bold text-amber-100 backdrop-blur-md active:scale-95 transition-all"
                >
                  <span>{mobileHeroAmount.label}</span>
                  <ChevronDown size={13} className={`transition-transform ${showMobileTimeDropdown ? "rotate-180" : ""}`} />
                </button>

                {showMobileTimeDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-[70]"
                      onClick={() => setShowMobileTimeDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-36 rounded-2xl border border-amber-500/40 bg-[#5c2807] p-1.5 shadow-2xl backdrop-blur-xl z-[80] text-xs font-bold text-white">
                      {[
                        { key: "today", label: "Today" },
                        { key: "week", label: "This Week" },
                        { key: "month", label: "This Month" },
                        { key: "all", label: "All Time" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setMobileTimeframe(item.key)
                            setShowMobileTimeDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                            mobileTimeframe === item.key ? "bg-amber-500 text-white" : "hover:bg-white/10"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Profit Pill Badge */}
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-400/40 px-3 py-1 text-xs font-extrabold text-emerald-300 backdrop-blur-md">
                <ArrowUpRight size={13} />
                <span>{mobileHeroAmount.profit} Profit</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Interactive Mobile Segmented Control (Tabs) */}
        <div className="flex items-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMobileActiveTab("sales")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              mobileActiveTab === "sales"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            }`}
          >
            <Droplets size={14} />
            <span>Sales ({filtered.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileActiveTab("stock")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              mobileActiveTab === "stock"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            }`}
          >
            <Package size={14} />
            <span>Stock ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileActiveTab("profit")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              mobileActiveTab === "profit"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            }`}
          >
            <BarChart3 size={14} />
            <span>Profits</span>
          </button>
        </div>

        {/* 5. Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)] pointer-events-none" />
            <input
              placeholder={
                mobileActiveTab === "sales"
                  ? "Search product or seller..."
                  : mobileActiveTab === "stock"
                  ? "Search product inventory..."
                  : "Search profit data..."
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] py-2 pl-10 pr-3 text-xs font-medium text-[color:var(--text-primary)] shadow-sm outline-none placeholder:text-[color:var(--text-secondary)] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
            />
          </div>

          {mobileActiveTab === "sales" ? (
            <button
              type="button"
              onClick={() => setShowMobileFilterModal(true)}
              className={`inline-flex h-11 items-center gap-1.5 rounded-2xl border px-3.5 text-xs font-bold shadow-sm active:scale-95 transition-all ${
                productFilter || fromDateFilter || toDateFilter
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-amber-200 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
              }`}
            >
              <Filter size={15} />
              <span>Filter</span>
            </button>
          ) : mobileActiveTab === "stock" && canManagerUse("addProduct") ? (
            <button
              type="button"
              onClick={openCreateProductModal}
              className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-blue-600 px-3.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
            >
              <Plus size={15} />
              <span>Add</span>
            </button>
          ) : null}
        </div>

        {/* 6. TAB 1: SALES LIST */}
        {mobileActiveTab === "sales" ? (
          <div className="space-y-2.5 mb-24">
            {filtered.length === 0 ? (
              <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-8 text-center shadow-sm">
                <Droplets size={32} className="mx-auto text-amber-400/60 mb-2" />
                <p className="text-sm font-bold text-[color:var(--text-secondary)]">No lubricant sales found.</p>
              </div>
            ) : (
              filtered.map((entry) => {
                const meta = getLubricantMeta(entry.product)
                const Icon = meta.icon

                return (
                  <div
                    key={entry._id}
                    onClick={() => setMobileDetailItem(entry)}
                    className="group relative flex items-center justify-between gap-2.5 rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 shadow-sm active:scale-[0.985] transition-all cursor-pointer"
                  >
                    {/* Left: Oil Icon & Sale Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${meta.bgColor}`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-sm font-extrabold text-[color:var(--text-strong)] leading-tight">
                            {entry.product || "Lubricant"}
                          </h3>
                        </div>
                        <p className="truncate text-[11px] font-semibold text-[color:var(--text-secondary)] mt-0.5">
                          {formatMobileDate(entry.date)} • <span className="text-amber-600 dark:text-amber-400 font-bold">{entry.quantity} Qty</span> • {entry.soldBy || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount, Profit Pill & 3-dots */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-[color:var(--text-strong)] tracking-tight leading-tight">
                          {formatCurrency(entry.total)}
                        </p>
                        <span className="mt-0.5 inline-block rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(entry.totalProfit)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMobileActionItem(entry)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
                      >
                        <MoreVertical size={17} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : null}

        {/* 7. TAB 2: PRODUCT STOCK LIST */}
        {mobileActiveTab === "stock" ? (
          <div className="space-y-3 mb-24">
            {filteredProducts.length === 0 ? (
              <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-8 text-center shadow-sm">
                <Package size={32} className="mx-auto text-amber-400/60 mb-2" />
                <p className="text-sm font-bold text-[color:var(--text-secondary)]">No products found.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const stock = Number(product.stock || 0)
                const isExpanded = expandedStockCardId === product._id
                const stockTone =
                  stock > 10
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : stock > 0
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20"

                return (
                  <div
                    key={product._id}
                    onClick={() => setExpandedStockCardId((prev) => (prev === product._id ? null : product._id))}
                    className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <p className="text-base font-extrabold text-[color:var(--text-strong)] leading-tight truncate">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                          Sell: <span className="font-bold text-[color:var(--text-strong)]">{formatCurrency(product.price)}</span> | Cost: <span className="font-bold text-[color:var(--text-strong)]">{formatCurrency(product.costPrice)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${stockTone}`}>
                          Stock: {stock}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-[color:var(--text-secondary)] transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-amber-600" : ""
                          }`}
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2.5">
                        <span className="text-[10px] text-[color:var(--text-secondary)] block">Unit Profit Margin</span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          {formatCurrency(Number(product.price || 0) - Number(product.costPrice || 0))}
                        </span>
                      </div>
                      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2.5">
                        <span className="text-[10px] text-[color:var(--text-secondary)] block">Last Stock Added</span>
                        <span className="font-bold text-[color:var(--text-strong)] truncate block">
                          {product.lastStockAddedAt ? formatMobileDate(product.lastStockAddedAt) : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons - only show when card is clicked */}
                    {isExpanded && (
                      <div className="mt-3 flex items-center gap-2 pt-3 border-t border-[var(--border-color)] animate-in fade-in duration-200">
                        {canManagerUse("addStock") ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openAddStockModal(product)
                            }}
                            className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 active:scale-95"
                          >
                            + Add Stock
                          </button>
                        ) : null}

                        {canManagerUse("editProduct") ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditProductModal(product)
                            }}
                            className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 active:scale-95"
                          >
                            Edit
                          </button>
                        ) : null}

                        {canManagerUse("deleteProduct") ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              askDeleteProduct(product)
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        ) : null}

        {/* 8. TAB 3: PROFIT OVERVIEW LIST */}
        {mobileActiveTab === "profit" ? (
          <div className="space-y-3 mb-24">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Product-wise profit calculation based on selling price vs cost price.
            </div>

            {profitRows.map((row) => (
              <div
                key={row._id}
                className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-extrabold text-[color:var(--text-strong)] leading-tight truncate">
                      {row.name}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                      Selling {formatCurrency(row.price)} | Cost {formatCurrency(row.costPrice)}
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 shrink-0">
                    {formatCurrency(row.totalProfit)}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2.5">
                    <span className="text-[10px] text-[color:var(--text-secondary)] block">Unit Profit</span>
                    <span className="font-bold text-[color:var(--text-strong)] text-sm">{formatCurrency(row.unitProfit)}</span>
                  </div>
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-2.5">
                    <span className="text-[10px] text-[color:var(--text-secondary)] block">Total Units Sold</span>
                    <span className="font-extrabold text-amber-600 text-sm">{row.soldQty} Qty</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* 9. Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 mx-3 mb-2 flex h-[68px] items-center justify-around rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)]/95 backdrop-blur-xl px-2 shadow-2xl transition-colors duration-300">
          <button
            type="button"
            onClick={() => {
              setMobileActiveTab("sales")
              setProductFilter("")
              setSearch("")
            }}
            className={`flex min-w-[54px] flex-col items-center gap-1 transition-colors ${
              mobileActiveTab === "sales" ? "text-amber-600 dark:text-amber-400 font-extrabold" : "text-[color:var(--text-secondary)]"
            }`}
          >
            <Droplets size={19} />
            <span className="text-[10px]">Sales</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileActiveTab("stock")}
            className={`flex min-w-[54px] flex-col items-center gap-1 transition-colors ${
              mobileActiveTab === "stock" ? "text-amber-600 dark:text-amber-400 font-extrabold" : "text-[color:var(--text-secondary)]"
            }`}
          >
            <Package size={19} />
            <span className="text-[10px]">Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileActiveTab("profit")}
            className={`flex min-w-[54px] flex-col items-center gap-1 transition-colors ${
              mobileActiveTab === "profit" ? "text-amber-600 dark:text-amber-400 font-extrabold" : "text-[color:var(--text-secondary)]"
            }`}
          >
            <BarChart3 size={19} />
            <span className="text-[10px]">Profits</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (canManagerUse("generateReport")) {
                openReportModal()
              }
            }}
            className="flex min-w-[54px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"
          >
            <FileText size={19} />
            <span className="text-[10px]">Report</span>
          </button>

          {!isManager ? (
            <button
              type="button"
              onClick={() => navigate("/admin/lubricant-dashboard")}
              className="flex min-w-[54px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"
            >
              <LayoutGrid size={19} />
              <span className="text-[10px]">Overview</span>
            </button>
          ) : null}
        </nav>
      </div>

      {/* =========================================================================
          DESKTOP VIEW (PRESERVED 100% FOR LARGE SCREENS: hidden lg:block)
      ========================================================================= */}
      <div className="hidden lg:block">
        <div className="mb-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-5 py-3 shadow-sm">
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
            {!isManager ? (
              <button
                type="button"
                onClick={() => navigate("/admin/lubricant-dashboard")}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 font-medium text-amber-700 shadow-sm"
              >
                <ChartNoAxesCombined size={18} />
                Lubricant Dashboard
              </button>
            ) : null}
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
                  <div key={`${index}`} className="flex items-start gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-[color:var(--text-primary)]">{line}</p>
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        <div className="mb-6 block">
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
            <div className="mt-4 overflow-x-auto">
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
            <div className="mt-4 overflow-x-auto">
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
          ) : null}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[color:var(--text-strong)]">Sales Register</h2>

          <div className="max-h-[620px] overflow-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_16px_32px_rgba(16,24,20,0.05)]">
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
        </section>
      </div>

      {/* =========================================================================
          MOBILE MODALS & BOTTOM SHEETS
      ========================================================================= */}
      {/* Mobile Filter Sheet Modal */}
      {showMobileFilterModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 lg:hidden">
          <div className="w-full max-w-lg rounded-t-[28px] sm:rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-amber-500" />
                <h3 className="text-base font-bold text-[color:var(--text-strong)]">Filter Lubricant Sales</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                className="rounded-xl p-1.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">Product</label>
                <select
                  value={productFilter}
                  onChange={(event) => setProductFilter(event.target.value)}
                  className="input w-full"
                >
                  <option value="">All Products</option>
                  {products.map((item) => (
                    <option key={item._id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={fromDateFilter}
                    onChange={(event) => setFromDateFilter(event.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={toDateFilter}
                    onChange={(event) => setToDateFilter(event.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">Month Filter</label>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setProductFilter("")
                  setFromDateFilter("")
                  setToDateFilter("")
                  setMonthFilter(getCurrentMonth())
                  setShowMobileFilterModal(false)
                }}
                className="flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] py-3 text-sm font-semibold text-[color:var(--text-primary)]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                className="flex-1 rounded-2xl bg-amber-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-600/30"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Item Action Sheet Modal */}
      {mobileActionItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 lg:hidden">
          <div className="w-full max-w-lg rounded-t-[28px] sm:rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[color:var(--text-strong)]">
                  {mobileActionItem.product}
                </h3>
                <p className="text-xs font-bold text-amber-600 mt-0.5">
                  {formatCurrency(mobileActionItem.total)} • {formatMobileDate(mobileActionItem.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileActionItem(null)}
                className="rounded-xl p-1.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileDetailItem(mobileActionItem)
                  setMobileActionItem(null)
                }}
                className="w-full flex items-center gap-3 rounded-2xl p-3 text-left font-bold text-[color:var(--text-strong)] hover:bg-[var(--bg-soft)] transition-colors"
              >
                <Eye size={18} className="text-amber-500" />
                <span>View Full Details</span>
              </button>

              {canManagerUse("editSale") && (
                <button
                  type="button"
                  onClick={() => {
                    openSaleModal(mobileActionItem)
                    setMobileActionItem(null)
                  }}
                  className="w-full flex items-center gap-3 rounded-2xl p-3 text-left font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                >
                  <Edit2 size={18} />
                  <span>Edit Sale</span>
                </button>
              )}

              {canManagerUse("deleteSale") && (
                <button
                  type="button"
                  onClick={() => {
                    askDeleteSale(mobileActionItem)
                    setMobileActionItem(null)
                  }}
                  className="w-full flex items-center gap-3 rounded-2xl p-3 text-left font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 size={18} />
                  <span>Delete Sale</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Detail View Modal */}
      {mobileDetailItem && (
        <ModalShell title="Sale Details" onClose={() => setMobileDetailItem(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-[color:var(--text-secondary)]">Product</span>
              <span className="font-bold text-[color:var(--text-strong)]">{mobileDetailItem.product}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-[color:var(--text-secondary)]">Total Amount</span>
              <span className="font-black text-amber-600 text-base">{formatCurrency(mobileDetailItem.total)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-[color:var(--text-secondary)]">Total Profit</span>
              <span className="font-extrabold text-emerald-600 text-base">+{formatCurrency(mobileDetailItem.totalProfit)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-[color:var(--text-secondary)]">Selling Price</span>
              <span className="font-bold text-[color:var(--text-strong)]">{formatCurrency(mobileDetailItem.price)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-[color:var(--text-secondary)]">Quantity</span>
              <span className="font-bold text-amber-600">{mobileDetailItem.quantity} Units</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-[color:var(--text-secondary)]">Date</span>
              <span className="font-bold text-[color:var(--text-strong)]">{formatDate(mobileDetailItem.date)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-[color:var(--text-secondary)]">Sold By</span>
              <span className="font-bold text-[color:var(--text-strong)]">{mobileDetailItem.soldBy || "-"}</span>
            </div>
            <div className="text-xs text-[color:var(--text-secondary)] pt-1">
              {mobileDetailItem.lastEditedAt ? (
                <div>
                  Last Edited: {formatDateTime(mobileDetailItem.lastEditedAt)} by {mobileDetailItem.lastEditedBy || "-"}
                </div>
              ) : (
                <div>Not edited yet</div>
              )}
            </div>

            <div className="mt-4 flex gap-2 pt-2">
              {canManagerUse("editSale") && (
                <button
                  type="button"
                  onClick={() => {
                    const item = mobileDetailItem
                    setMobileDetailItem(null)
                    openSaleModal(item)
                  }}
                  className="flex-1 rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white"
                >
                  Edit
                </button>
              )}
              {canManagerUse("deleteSale") && (
                <button
                  type="button"
                  onClick={() => {
                    const item = mobileDetailItem
                    setMobileDetailItem(null)
                    askDeleteSale(item)
                  }}
                  className="flex-1 rounded-2xl bg-red-600 py-2.5 text-xs font-bold text-white"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </ModalShell>
      )}

      {/* =========================================================================
          DESKTOP & MODAL SYSTEM
      ========================================================================= */}
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
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 dark:bg-emerald-950/60 dark:border-emerald-800/60 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              Estimated Profit
              <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalProfit)}</p>
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
                    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 dark:bg-emerald-950/60 p-3 text-emerald-700 dark:text-emerald-300">
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

      {/* Mobile Floating Action Button (+ FAB) for Add Sale */}
      {canManagerUse("addSale") ? (
        <button
          type="button"
          onClick={openEntryModePrompt}
          className="lg:hidden fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-900/30 active:scale-95 transition-all"
          title="Add Lubricant Sale"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  )
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    blue: { panel: "border-blue-200/70 bg-blue-50/80 dark:bg-blue-950/40 dark:border-blue-800/40", value: "text-blue-600 dark:text-blue-400" },
    amber: { panel: "border-amber-200/70 bg-amber-50/80 dark:bg-amber-950/40 dark:border-amber-800/40", value: "text-amber-600 dark:text-amber-400" },
    violet: { panel: "border-violet-200/70 bg-violet-50/80 dark:bg-violet-950/40 dark:border-violet-800/40", value: "text-violet-600 dark:text-violet-400" },
    indigo: { panel: "border-indigo-200/70 bg-indigo-50/80 dark:bg-indigo-950/40 dark:border-indigo-800/40", value: "text-indigo-600 dark:text-indigo-400" },
    emerald: { panel: "border-emerald-200/70 bg-emerald-50/80 dark:bg-emerald-950/40 dark:border-emerald-800/40", value: "text-emerald-600 dark:text-emerald-400" },
    green: { panel: "border-green-200/70 bg-green-50/80 dark:bg-green-950/40 dark:border-green-800/40", value: "text-green-600 dark:text-green-400" },
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
          ? "border-red-200 bg-red-50 text-red-600 dark:bg-red-950/50 dark:border-red-800/50 dark:text-red-400"
          : "border-green-200 bg-green-50 text-green-700 dark:bg-green-950/50 dark:border-green-800/50 dark:text-green-400"
      }`}
    >
      {notice.text}
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 shadow-2xl">
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
              className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 px-4 py-2 text-amber-600 dark:text-amber-400"
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
