const express = require("express")

const { summarizeReport } = require("../controllers/aiController")

const router = express.Router()

router.post("/report-summary", summarizeReport)

module.exports = router
