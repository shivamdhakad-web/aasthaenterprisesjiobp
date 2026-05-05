const Employee = require("../models/Employee")
const Settings = require("../models/Settings")
const { SESSION_DURATION_MS, signAuthToken } = require("../middleware/auth")

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123"
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || "456"
const EMPLOYEE_PASSWORD = process.env.EMPLOYEE_PASSWORD || "789"
const MASTER_UNLOCK_PASSWORD = process.env.DASHBOARD_MASTER_PASSWORD || "jiobp"

const defaultSettings = {
  companyName: "",
  stationName: "",
  gstNumber: "",
  address: "",
  contacts: [],
  loginPasswords: {
    admin: ADMIN_PASSWORD,
    manager: MANAGER_PASSWORD,
    employee: EMPLOYEE_PASSWORD,
  },
  passwordSecurity: {
    masterUnlockPassword: MASTER_UNLOCK_PASSWORD,
    authVersion: 1,
    lastPasswordChangedAt: null,
  },
}

const sanitizeTokenUser = (user) => {
  const { iat, exp, authVersion, ...safeUser } = user || {}
  return safeUser
}

const formatEmployeeUser = (employee) => ({
  role: "Employee",
  name: employee.name,
  employeeId: employee._id.toString(),
})

const getOrCreateSettings = async () => {
  const existingSettings = await Settings.findOne()

  if (existingSettings) {
    return existingSettings
  }

  return Settings.create(defaultSettings)
}

const createAuthResponse = (user, authVersion) => ({
  token: signAuthToken({ ...user, authVersion }),
  user,
  expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
})

exports.getEmployeeChoices = async (_req, res) => {
  try {
    const employees = await Employee.find({ status: "Active" })
      .sort({ name: 1 })
      .select("_id name role shift phone")

    res.json(employees)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { password, employeeId, employeePassword } = req.body
    const settings = await getOrCreateSettings()
    const authVersion = settings?.passwordSecurity?.authVersion ?? 1
    const adminPassword = settings?.loginPasswords?.admin || ADMIN_PASSWORD
    const managerPassword = settings?.loginPasswords?.manager || MANAGER_PASSWORD
    const employeePasswordMaster = settings?.loginPasswords?.employee || EMPLOYEE_PASSWORD

    if (password === adminPassword) {
      return res.json(
        createAuthResponse(
          {
            role: "Admin",
            name: "Admin",
          },
          authVersion,
        ),
      )
    }

    if (password === managerPassword) {
      return res.json(
        createAuthResponse(
          {
            role: "Manager",
            name: "Manager",
          },
          authVersion,
        ),
      )
    }

    if (password === employeePasswordMaster) {
      if (!employeeId) {
        const employees = await Employee.find({ status: "Active" })
          .sort({ name: 1 })
          .select("_id name role shift phone")

        return res.json({
          requiresEmployeeSelection: true,
          employees,
        })
      }

      const employee = await Employee.findOne({
        _id: employeeId,
        status: "Active",
      })

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" })
      }

      if (!employee.loginPassword) {
        return res.status(400).json({ message: "Employee password is not set yet" })
      }

      if ((employeePassword || "").trim() !== String(employee.loginPassword || "").trim()) {
        return res.status(401).json({ message: "Employee personal password is incorrect" })
      }

      return res.json(createAuthResponse(formatEmployeeUser(employee), authVersion))
    }

    return res.status(401).json({ message: "Wrong password" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.me = async (req, res) => {
  try {
    const safeUser = sanitizeTokenUser(req.user)

    if (safeUser.role !== "Employee") {
      return res.json({ user: safeUser })
    }

    const employee = await Employee.findById(safeUser.employeeId).select(
      "_id name role shift phone status salary",
    )

    if (!employee || employee.status !== "Active") {
      return res.status(404).json({ message: "Employee not found" })
    }

    res.json({
      user: {
        ...safeUser,
        employee,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}