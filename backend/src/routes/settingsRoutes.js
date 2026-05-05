const express = require("express")
const router = express.Router()

const {
  getSettings,
  updateSettings,
  changeDashboardPassword,
} = require("../controllers/settingsController")

router.get("/", getSettings)
router.put("/", updateSettings)
router.post("/passwords/change", changeDashboardPassword)

module.exports = router