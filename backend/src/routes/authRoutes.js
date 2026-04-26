const express = require("express")

const { login, me, getEmployeeChoices } = require("../controllers/authController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

router.post("/login", login)
router.get("/employees", getEmployeeChoices)
router.get("/me", authenticateToken, me)

module.exports = router