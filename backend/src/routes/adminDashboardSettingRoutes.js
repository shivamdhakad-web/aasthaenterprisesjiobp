const express = require("express")
const router = express.Router()

const {
  getAdminDashboardSettings,
  updateAdminDashboardSettings,
} = require("../controllers/adminDashboardSettingController")

router.get("/", getAdminDashboardSettings)
router.put("/", updateAdminDashboardSettings)

module.exports = router
