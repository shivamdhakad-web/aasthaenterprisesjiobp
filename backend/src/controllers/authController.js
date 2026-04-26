const Employee = require("../models/Employee")
const Settings = require("../models/Settings")
const { signAuthToken } = require("../middleware/auth")

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123"
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || "456"
const EMPLOYEE_PASSWORD = process.env.EMPLOYEE_PASSWORD || "789"

const formatEmployeeUser = (employee) => ({
  role: "Employee",
  name: employee.name,
  employeeId: employee._id.toString(),
})

const createAuthResponse = (user) => ({
  token: signAuthToken(user),
  user,
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
    const settings = await Settings.findOne().select("loginPasswords")
    const adminPassword = settings?.loginPasswords?.admin || ADMIN_PASSWORD
    const managerPassword = settings?.loginPasswords?.manager || MANAGER_PASSWORD
    const employeePasswordMaster = settings?.loginPasswords?.employee || EMPLOYEE_PASSWORD

    if (password === adminPassword) {
      return res.json(
        createAuthResponse({
          role: "Admin",
          name: "Admin",
        }),
      )
    }

    if (password === managerPassword) {
      return res.json(
        createAuthResponse({
          role: "Manager",
          name: "Manager",
        }),
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

      return res.json(createAuthResponse(formatEmployeeUser(employee)))
    }

    return res.status(401).json({ message: "Wrong password" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.me = async (req, res) => {
  try {
    if (req.user.role !== "Employee") {
      return res.json({ user: req.user })
    }

    const employee = await Employee.findById(req.user.employeeId).select(
      "_id name role shift phone status salary",
    )

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    res.json({
      user: {
        ...req.user,
        employee,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
