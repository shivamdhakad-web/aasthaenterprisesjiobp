const AdminDashboardSetting = require("../models/AdminDashboardSetting")

const DEFAULT_ADMIN_DASHBOARD_PAGES = [
  { key: "dashboard", label: "Dashboard", path: "/admin", order: 1 },
  { key: "approvals", label: "Approvals", path: "/admin/approvals", order: 2 },
  { key: "notifications", label: "Notifications", path: "/admin/notifications", order: 3 },
  { key: "dailyReports", label: "Daily Reports", path: "/admin/daily-reports", order: 4 },
  { key: "meterReadings", label: "Meter Readings", path: "/admin/meter-readings", order: 5 },
  { key: "tankerDeliveries", label: "Tanker Deliveries", path: "/admin/tanker-deliveries", order: 6 },
  { key: "employees", label: "Employees", path: "/admin/employees", order: 7 },
  { key: "adminDashboardEditor", label: "Admin Edit Dashboard", path: "/admin/admin-dashboard-editor", order: 8 },
  { key: "employeeDashboardEditor", label: "Employee Edit Dashboard", path: "/admin/employee-dashboard-editor", order: 9 },
  { key: "managerDashboardEditor", label: "Manager Edit Dashboard", path: "/admin/manager-dashboard-editor", order: 10 },
  { key: "leaves", label: "Leave Management", path: "/admin/leaves", order: 11 },
  { key: "shifts", label: "Shift Schedule", path: "/admin/shifts", order: 12 },
  { key: "tasks", label: "Task Assignments", path: "/admin/tasks", order: 13 },
  { key: "creditCustomers", label: "Credit Customers", path: "/admin/credit-customers", order: 14 },
  { key: "expenses", label: "Expenses", path: "/admin/expenses", order: 15 },
  { key: "lubricants", label: "Lubricants", path: "/admin/lubricants", order: 16 },
  { key: "mobileDispenser", label: "Mobile Dispenser", path: "/admin/mobile-dispenser", order: 17 },
  { key: "cardSwipe", label: "Card Swipe", path: "/admin/card-swipe", order: 18 },
  { key: "dcd", label: "D.C.D", path: "/admin/dcd", order: 19 },
  { key: "mdu", label: "M.D.U", path: "/admin/mdu", order: 20 },
  { key: "invoiceDetails", label: "Invoice Details", path: "/admin/invoice-details", order: 21 },
  { key: "dailySales", label: "Daily Sales", path: "/admin/daily-sales", order: 22 },
  { key: "smartCalculator", label: "Smart Calculator", path: "/admin/smart-calculator", order: 23 },
  { key: "densityCalculator", label: "Density Calculator", path: "/admin/density-calculator", order: 24 },
  { key: "ttDrivers", label: "TT Drivers", path: "/admin/ttdrivers", order: 25 },
  { key: "customerDrivers", label: "Customer Drivers", path: "/admin/customerdrivers", order: 26 },
  { key: "secureNotes", label: "Secure Notes", path: "/admin/secure-notes", order: 27 },
  { key: "reminder", label: "Reminder", path: "/admin/reminder", order: 28 },
  { key: "storage", label: "Storage", path: "/admin/storage", order: 29 },
  { key: "billGenerator", label: "Bill Generator", path: "/admin/bill-generator", order: 30 },
  { key: "settings", label: "Settings", path: "/admin/settings", order: 31 },
]

const cloneDefaultPages = () => DEFAULT_ADMIN_DASHBOARD_PAGES.map((page) => ({ ...page }))

const mergePagesWithDefaults = (savedPages = []) => {
  const savedByKey = new Map(savedPages.map((page) => [page.key, page]))

  return cloneDefaultPages()
    .map((defaultPage) => {
      const savedPage = savedByKey.get(defaultPage.key) || {}

      return {
        key: defaultPage.key,
        label: String(savedPage.label || defaultPage.label).trim() || defaultPage.label,
        path: defaultPage.path,
        order: Number.isFinite(Number(savedPage.order)) ? Number(savedPage.order) : defaultPage.order,
      }
    })
    .sort((a, b) => a.order - b.order)
}

const sanitizeIncomingPages = (pages = []) => {
  const incomingByKey = new Map(Array.isArray(pages) ? pages.map((page) => [page.key, page]) : [])

  return cloneDefaultPages().map((defaultPage) => {
    const incoming = incomingByKey.get(defaultPage.key) || {}

    return {
      key: defaultPage.key,
      label: String(incoming.label || defaultPage.label).trim() || defaultPage.label,
      path: defaultPage.path,
      order: Number.isFinite(Number(incoming.order)) ? Number(incoming.order) : defaultPage.order,
    }
  })
}

const getOrCreateSettings = async () => {
  const existing = await AdminDashboardSetting.findOne()

  if (existing) {
    existing.pages = mergePagesWithDefaults(existing.pages)
    await existing.save()
    return existing
  }

  return AdminDashboardSetting.create({ pages: cloneDefaultPages() })
}

exports.getAdminDashboardSettings = async (_req, res) => {
  try {
    const settings = await getOrCreateSettings()

    res.json({
      pages: mergePagesWithDefaults(settings.pages),
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
      updatedByRole: settings.updatedByRole,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateAdminDashboardSettings = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({ message: "Only admin can update admin dashboard settings" })
    }

    const settings = await getOrCreateSettings()
    settings.pages = sanitizeIncomingPages(req.body?.pages)
    settings.updatedBy = req.user?.name || "Admin"
    settings.updatedByRole = req.user?.role || "Admin"

    await settings.save()

    res.json({
      pages: mergePagesWithDefaults(settings.pages),
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
      updatedByRole: settings.updatedByRole,
      message: "Admin dashboard settings updated successfully.",
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.DEFAULT_ADMIN_DASHBOARD_PAGES = DEFAULT_ADMIN_DASHBOARD_PAGES
