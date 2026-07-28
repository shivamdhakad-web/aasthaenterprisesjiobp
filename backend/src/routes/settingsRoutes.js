const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")

const {
  getSettings,
  updateSettings,
  changeDashboardPassword,
  verifySecureNotesPassword,
  changeSecureNotesPassword,
} = require("../controllers/settingsController")

router.get("/", getSettings)
router.put("/", authenticateToken, updateSettings)
router.post("/passwords/change", authenticateToken, changeDashboardPassword)
router.post("/secure-notes/verify", authenticateToken, verifySecureNotesPassword)
router.post("/secure-notes/password/change", authenticateToken, changeSecureNotesPassword)

module.exports = router
