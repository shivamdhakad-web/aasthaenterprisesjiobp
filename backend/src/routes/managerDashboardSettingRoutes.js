const express = require("express")
const router = express.Router()

const {
  getManagerDashboardSettings,
  updateManagerDashboardSettings,
} = require("../controllers/managerDashboardSettingController")

router.get("/", getManagerDashboardSettings)
router.put("/", updateManagerDashboardSettings)

module.exports = router
