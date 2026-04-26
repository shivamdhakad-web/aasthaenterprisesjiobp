const express = require("express")

const { getSalarySummary } = require("../controllers/salaryController")

const router = express.Router()

router.get("/summary", getSalarySummary)
router.get("/summary/:employeeId", getSalarySummary)

module.exports = router
