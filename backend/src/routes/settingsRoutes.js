const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")

const {
  getSettings,
  updateSettings,
  changeDashboardPassword,
} = require("../controllers/settingsController")

router.get("/", getSettings)
router.put("/", authenticateToken, updateSettings)
router.post("/passwords/change", authenticateToken, changeDashboardPassword)

module.exports = router