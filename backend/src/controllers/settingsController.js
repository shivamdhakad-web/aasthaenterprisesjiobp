const Settings = require("../models/Settings")

const DEFAULT_LOGIN_PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || "123",
  manager: process.env.MANAGER_PASSWORD || "456",
  employee: process.env.EMPLOYEE_PASSWORD || "789",
}

const MASTER_UNLOCK_PASSWORD = process.env.DASHBOARD_MASTER_PASSWORD || "jiobp"

const defaultSettings = {
  companyName: "",
  stationName: "",
  gstNumber: "",
  address: "",
  contacts: [],
  loginPasswords: DEFAULT_LOGIN_PASSWORDS,
  passwordSecurity: {
    masterUnlockPassword: MASTER_UNLOCK_PASSWORD,
    authVersion: 1,
    lastPasswordChangedAt: null,
  },
}

const sanitizeSettings = (settings) => ({
  companyName: settings?.companyName || "",
  stationName: settings?.stationName || "",
  gstNumber: settings?.gstNumber || "",
  address: settings?.address || "",
  contacts: Array.isArray(settings?.contacts) ? settings.contacts : [],
})

const getOrCreateSettings = async () => {
  const existingSettings = await Settings.findOne()

  if (existingSettings) {
    return existingSettings
  }

  return Settings.create(defaultSettings)
}

exports.getSettings = async (_req, res) => {
  try {
    const settings = await getOrCreateSettings()
    res.json(sanitizeSettings(settings))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings()

    settings.companyName = req.body?.companyName ?? settings.companyName ?? ""
    settings.stationName = req.body?.stationName ?? settings.stationName ?? ""
    settings.gstNumber = req.body?.gstNumber ?? settings.gstNumber ?? ""
    settings.address = req.body?.address ?? settings.address ?? ""

    if (Array.isArray(req.body?.contacts)) {
      settings.contacts = req.body.contacts
        .filter((contact) => contact?.name || contact?.phone)
        .map((contact) => ({
          name: String(contact.name || "").trim(),
          phone: String(contact.phone || "").trim(),
        }))
    }

    await settings.save()
    res.json(sanitizeSettings(settings))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.changeDashboardPassword = async (req, res) => {
  try {
    const { role, unlockPassword, currentPassword, newPassword } = req.body || {}
    const allowedRoles = ["admin", "manager", "employee"]

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Please choose a valid dashboard role" })
    }

    if (!String(unlockPassword || "").trim()) {
      return res.status(400).json({ message: "Master unlock password is required" })
    }

    if (!String(currentPassword || "").trim()) {
      return res.status(400).json({ message: "Current password is required" })
    }

    if (!String(newPassword || "").trim()) {
      return res.status(400).json({ message: "New password is required" })
    }

    if (String(newPassword).trim().length < 3) {
      return res.status(400).json({ message: "New password must be at least 3 characters" })
    }

    const settings = await getOrCreateSettings()
    const storedUnlockPassword = settings?.passwordSecurity?.masterUnlockPassword || MASTER_UNLOCK_PASSWORD
    const currentRolePassword = settings?.loginPasswords?.[role] || DEFAULT_LOGIN_PASSWORDS[role]

    if (String(unlockPassword).trim() !== String(storedUnlockPassword).trim()) {
      return res.status(400).json({ message: "Master unlock password is incorrect" })
    }

    if (String(currentPassword).trim() !== String(currentRolePassword).trim()) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    if (String(newPassword).trim() === String(currentRolePassword).trim()) {
      return res.status(400).json({ message: "New password must be different from current password" })
    }

    settings.loginPasswords[role] = String(newPassword).trim()
    settings.passwordSecurity.authVersion = (settings.passwordSecurity.authVersion || 1) + 1
    settings.passwordSecurity.lastPasswordChangedAt = new Date()

    await settings.save()

    res.json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} password updated successfully. All active sessions have been logged out.`,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}