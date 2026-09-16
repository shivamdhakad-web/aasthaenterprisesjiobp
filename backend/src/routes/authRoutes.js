const express = require("express")

const { login, logout, me, getEmployeeChoices } = require("../controllers/authController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

router.post("/login", login)
router.post("/logout", authenticateToken, logout)
router.get("/employees", getEmployeeChoices)
router.get("/me", authenticateToken, me)

module.exports = router
