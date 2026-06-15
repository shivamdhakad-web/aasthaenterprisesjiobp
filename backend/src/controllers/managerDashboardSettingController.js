const ManagerDashboardSetting = require("../models/ManagerDashboardSetting")

const DEFAULT_MANAGER_DASHBOARD_PAGES = [
  { key: "dashboard", label: "Dashboard", path: "/manager", order: 1, buttons: [] },
  {
    key: "approvals",
    label: "Approval Status",
    path: "/manager/approvals",
    order: 2,
    buttons: [{ key: "viewApproval", label: "View Approval", enabled: true }],
  },
  { key: "notifications", label: "Notifications", path: "/manager/notifications", order: 3, buttons: [] },
  {
    key: "dailyReports",
    label: "Daily Reports",
    path: "/manager/daily-reports",
    order: 4,
    buttons: [
      { key: "exportPdf", label: "Export PDF", enabled: true },
      { key: "updateReport", label: "Update Report", enabled: true },
    ],
  },
  {
    key: "meterReadings",
    label: "Meter Readings",
    path: "/manager/meter-readings",
    order: 5,
    buttons: [
      { key: "addEntry", label: "Add Entry", enabled: true },
      { key: "editEntry", label: "Edit Entry", enabled: true },
      { key: "deleteEntry", label: "Delete Entry", enabled: true },
      { key: "generateReport", label: "Generate Report", enabled: true },
    ],
  },
  {
    key: "tankerDeliveries",
    label: "Tanker Deliveries",
    path: "/manager/tanker-deliveries",
    order: 6,
    buttons: [
      { key: "addDelivery", label: "Add Delivery", enabled: true },
      { key: "editDelivery", label: "Edit Delivery", enabled: true },
      { key: "deleteDelivery", label: "Delete Delivery", enabled: true },
      { key: "generateReport", label: "Generate Report", enabled: true },
    ],
  },
  {
    key: "employees",
    label: "Employees",
    path: "/manager/employees",
    order: 7,
    buttons: [
      { key: "addEntry", label: "Add Attendance Entry", enabled: true },
      { key: "addBonus", label: "Add Bonus", enabled: true },
      { key: "editEntry", label: "Edit Attendance", enabled: true },
      { key: "deleteEntry", label: "Delete Attendance", enabled: true },
      { key: "exportPdf", label: "Export PDF", enabled: true },
    ],
  },
  {
    key: "shifts",
    label: "Shift Schedule",
    path: "/manager/shifts",
    order: 8,
    buttons: [
      { key: "saveSchedule", label: "Save Schedule", enabled: true },
      { key: "deleteSchedule", label: "Delete Schedule", enabled: true },
    ],
  },
  {
    key: "tasks",
    label: "Task Assignments",
    path: "/manager/tasks",
    order: 9,
    buttons: [
      { key: "assignTask", label: "Assign Task", enabled: true },
      { key: "updateTask", label: "Update Task", enabled: true },
      { key: "deleteTask", label: "Delete Task", enabled: true },
    ],
  },
  {
    key: "creditCustomers",
    label: "Credit Customers",
    path: "/manager/credit-customers",
    order: 10,
    buttons: [
      { key: "addCustomer", label: "Add Customer", enabled: true },
      { key: "fuelEntry", label: "Fuel Entry", enabled: true },
      { key: "payment", label: "Payment", enabled: true },
      { key: "whatsappShare", label: "WhatsApp Share", enabled: true },
      { key: "printReport", label: "Print Report", enabled: true },
    ],
  },
  {
    key: "expenses",
    label: "Expenses",
    path: "/manager/expenses",
    order: 11,
    buttons: [
      { key: "addExpense", label: "Add Expense", enabled: true },
      { key: "editExpense", label: "Edit Expense", enabled: true },
      { key: "deleteExpense", label: "Delete Expense", enabled: true },
      { key: "generateReport", label: "Generate Report", enabled: true },
    ],
  },
  {
    key: "lubricants",
    label: "Lubricants",
    path: "/manager/lubricants",
    order: 12,
    buttons: [
      { key: "addSale", label: "Add Sale", enabled: true },
      { key: "addProduct", label: "Add Product", enabled: true },
      { key: "addStock", label: "Add Stock", enabled: true },
      { key: "editSale", label: "Edit Sale", enabled: true },
      { key: "deleteSale", label: "Delete Sale", enabled: true },
      { key: "generateReport", label: "Generate Report", enabled: true },
    ],
  },
  {
    key: "mobileDispenser",
    label: "Mobile Dispenser",
    path: "/manager/mobile-dispenser",
    order: 13,
    buttons: [
      { key: "addEntry", label: "Add Entry", enabled: true },
      { key: "editEntry", label: "Edit Entry", enabled: true },
      { key: "deleteEntry", label: "Delete Entry", enabled: true },
      { key: "generateReport", label: "Generate Report", enabled: true },
    ],
  },
  {
    key: "cardSwipe",
    label: "Card Swipe",
    path: "/manager/card-swipe",
    order: 14,
    buttons: [
      { key: "addEntry", label: "Add Entry", enabled: true },
      { key: "editEntry", label: "Edit Entry", enabled: true },
      { key: "deleteEntry", label: "Delete Entry", enabled: true },
      { key: "deleteMonth", label: "Delete Month", enabled: true },
      { key: "generateReport", label: "Generate Report", enabled: true },
    ],
  },
  {
    key: "smartCalculator",
    label: "Smart Calculator",
    path: "/manager/smart-calculator",
    order: 15,
    buttons: [
      { key: "saveEntry", label: "Save Entry", enabled: true },
      { key: "sendToAdmin", label: "Send To Admin", enabled: true },
    ],
  },
  {
    key: "densityCalculator",
    label: "Density Calculator",
    path: "/manager/density-calculator",
    order: 16,
    buttons: [
      { key: "saveDensity", label: "Save Density", enabled: true },
      { key: "viewHistory", label: "View History", enabled: true },
    ],
  },
  {
    key: "ttDrivers",
    label: "TT Drivers",
    path: "/manager/ttdrivers",
    order: 17,
    buttons: [
      { key: "addDriver", label: "Add Driver", enabled: true },
      { key: "editDriver", label: "Edit Driver", enabled: true },
      { key: "deleteDriver", label: "Delete Driver", enabled: true },
      { key: "generateReport", label: "Generate Report", enabled: true },
    ],
  },
  {
    key: "customerDrivers",
    label: "Customer Drivers",
    path: "/manager/customerdrivers",
    order: 18,
    buttons: [
      { key: "addDriver", label: "Add Driver", enabled: true },
      { key: "editDriver", label: "Edit Driver", enabled: true },
      { key: "deleteDriver", label: "Delete Driver", enabled: true },
      { key: "generateReport", label: "Generate Report", enabled: true },
    ],
  },
  {
    key: "secureNotes",
    label: "Secure Notes",
    path: "/manager/secure-notes",
    order: 19,
    buttons: [
      { key: "addNote", label: "Add Note", enabled: true },
      { key: "editNote", label: "Edit Note", enabled: true },
      { key: "deleteNote", label: "Delete Note", enabled: true },
    ],
  },
  {
    key: "reminder",
    label: "Reminder",
    path: "/manager/reminder",
    order: 20,
    buttons: [
      { key: "addReminder", label: "Add Reminder", enabled: true },
      { key: "editReminder", label: "Edit Reminder", enabled: true },
      { key: "deleteReminder", label: "Delete Reminder", enabled: true },
    ],
  },
  { key: "settings", label: "Settings", path: "/manager/settings", order: 21, buttons: [] },
]

const cloneDefaultPages = () =>
  DEFAULT_MANAGER_DASHBOARD_PAGES.map((page) => ({
    ...page,
    buttons: page.buttons.map((button) => ({ ...button })),
  }))

const mergePagesWithDefaults = (savedPages = []) => {
  const savedByKey = new Map(savedPages.map((page) => [page.key, page]))

  return cloneDefaultPages()
    .map((defaultPage) => {
      const savedPage = savedByKey.get(defaultPage.key) || {}
      const savedButtons = new Map((savedPage.buttons || []).map((button) => [button.key, button]))

      return {
        key: defaultPage.key,
        label: savedPage.label || defaultPage.label,
        path: defaultPage.path,
        order: Number.isFinite(Number(savedPage.order)) ? Number(savedPage.order) : defaultPage.order,
        hidden: Boolean(savedPage.hidden),
        buttons: defaultPage.buttons.map((button) => {
          const savedButton = savedButtons.get(button.key)

          return {
            key: button.key,
            label: savedButton?.label || button.label,
            enabled: savedButton?.enabled !== false,
          }
        }),
      }
    })
    .sort((a, b) => a.order - b.order)
}

const sanitizeIncomingPages = (pages = []) => {
  const incomingByKey = new Map(Array.isArray(pages) ? pages.map((page) => [page.key, page]) : [])

  return cloneDefaultPages().map((defaultPage) => {
    const incoming = incomingByKey.get(defaultPage.key) || {}
    const incomingButtons = new Map((incoming.buttons || []).map((button) => [button.key, button]))

    return {
      key: defaultPage.key,
      label: String(incoming.label || defaultPage.label).trim() || defaultPage.label,
      path: defaultPage.path,
      order: Number.isFinite(Number(incoming.order)) ? Number(incoming.order) : defaultPage.order,
      hidden: Boolean(incoming.hidden),
      buttons: defaultPage.buttons.map((button) => {
        const incomingButton = incomingButtons.get(button.key) || {}

        return {
          key: button.key,
          label: button.label,
          enabled: incomingButton.enabled !== false,
        }
      }),
    }
  })
}

const getOrCreateSettings = async () => {
  const existing = await ManagerDashboardSetting.findOne()

  if (existing) {
    existing.pages = mergePagesWithDefaults(existing.pages)
    await existing.save()
    return existing
  }

  return ManagerDashboardSetting.create({ pages: cloneDefaultPages() })
}

exports.getManagerDashboardSettings = async (_req, res) => {
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

exports.updateManagerDashboardSettings = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({ message: "Only admin can update manager dashboard settings" })
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
      message: "Manager dashboard settings updated successfully.",
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.DEFAULT_MANAGER_DASHBOARD_PAGES = DEFAULT_MANAGER_DASHBOARD_PAGES
