const express = require("express")

const {
  getOverview,
  getMyAttendance,
  addMyAttendance,
  updateMyAttendance,
  getProducts,
  getMyLubricantSales,
  addMyLubricantSale,
  updateMyLubricantSale,
} = require("../controllers/employeeSelfController")
const {
  getMyDailyReports,
  createMyDailyReport,
  updateMyDailyReport,
} = require("../controllers/dailyReportController")

const router = express.Router()

router.get("/overview", getOverview)
router.get("/attendance", getMyAttendance)
router.post("/attendance", addMyAttendance)
router.put("/attendance/:id", updateMyAttendance)
router.get("/lubricants/products", getProducts)
router.get("/lubricants", getMyLubricantSales)
router.post("/lubricants", addMyLubricantSale)
router.put("/lubricants/:id", updateMyLubricantSale)
router.get("/daily-reports", getMyDailyReports)
router.post("/daily-reports", createMyDailyReport)
router.put("/daily-reports/:id", updateMyDailyReport)

module.exports = router
