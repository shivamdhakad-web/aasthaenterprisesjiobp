const EmployeeDashboardSetting = require("../models/EmployeeDashboardSetting")

const DEFAULT_EMPLOYEE_DASHBOARD_PAGES = [
  { key: "overview", label: "Overview", path: "/employee", order: 1, buttons: [] },
  { key: "info", label: "My Info", path: "/employee/info", order: 2, buttons: [] },
  {
    key: "attendance",
    label: "My Attendance",
    path: "/employee/attendance",
    order: 3,
    buttons: [
      { key: "newEntry", label: "New Entry", enabled: true },
      { key: "editEntry", label: "Edit Entry", enabled: true },
    ],
  },
  {
    key: "leaves",
    label: "Leave Management",
    path: "/employee/leaves",
    order: 4,
    buttons: [{ key: "applyLeave", label: "Apply Leave", enabled: true }],
  },
  { key: "shifts", label: "Shift Schedule", path: "/employee/shifts", order: 5, buttons: [] },
  {
    key: "tasks",
    label: "My Tasks",
    path: "/employee/tasks",
    order: 6,
    buttons: [{ key: "updateStatus", label: "Update Task Status", enabled: true }],
  },
  {
    key: "expenses",
    label: "My Expenses",
    path: "/employee/expenses",
    order: 7,
    buttons: [
      { key: "newExpense", label: "New Expense", enabled: true },
      { key: "editExpense", label: "Edit Expense", enabled: true },
    ],
  },
  { key: "smartCalculator", label: "Smart Calculator", path: "/employee/smart-calculator", order: 8, buttons: [] },
  { key: "densityCalculator", label: "Density Calculator", path: "/employee/density-calculator", order: 9, buttons: [] },
  {
    key: "lubricants",
    label: "My Lubricants",
    path: "/employee/lubricants",
    order: 10,
    buttons: [
      { key: "newSale", label: "New Sale", enabled: true },
      { key: "editSale", label: "Edit Sale", enabled: true },
    ],
  },
  { key: "performance", label: "Performance", path: "/employee/performance", order: 11, buttons: [] },
  { key: "salary", label: "My Salary", path: "/employee/salary", order: 12, buttons: [] },
  {
    key: "dailyReport",
    label: "My Daily Sheet",
    path: "/employee/daily-report",
    order: 13,
    buttons: [
      { key: "newDailySheet", label: "New Daily Sheet", enabled: true },
      { key: "submitDailySheet", label: "Submit Daily Sheet", enabled: true },
    ],
  },
  { key: "notifications", label: "Notifications", path: "/employee/notifications", order: 14, buttons: [] },
]

const cloneDefaultPages = () =>
  DEFAULT_EMPLOYEE_DASHBOARD_PAGES.map((page) => ({
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
  const existing = await EmployeeDashboardSetting.findOne()

  if (existing) {
    existing.pages = mergePagesWithDefaults(existing.pages)
    await existing.save()
    return existing
  }

  return EmployeeDashboardSetting.create({ pages: cloneDefaultPages() })
}

exports.getEmployeeDashboardSettings = async (_req, res) => {
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

exports.updateEmployeeDashboardSettings = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({ message: "Only admin can update employee dashboard settings" })
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
      message: "Employee dashboard settings updated successfully.",
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.DEFAULT_EMPLOYEE_DASHBOARD_PAGES = DEFAULT_EMPLOYEE_DASHBOARD_PAGES
