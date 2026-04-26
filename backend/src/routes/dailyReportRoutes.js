const router = require("express").Router()
const { getDailyReports, updateDailyReport } = require("../controllers/dailyReportController")

router.get("/", getDailyReports)
router.put("/:id", updateDailyReport)

module.exports = router
