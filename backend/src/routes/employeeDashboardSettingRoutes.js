const express = require("express")
const router = express.Router()

const {
  getEmployeeDashboardSettings,
  updateEmployeeDashboardSettings,
} = require("../controllers/employeeDashboardSettingController")

router.get("/", getEmployeeDashboardSettings)
router.put("/", updateEmployeeDashboardSettings)

module.exports = router
