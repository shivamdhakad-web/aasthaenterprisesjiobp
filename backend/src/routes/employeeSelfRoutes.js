const express = require("express")

const {
  getOverview,
  getMyInfo,
  getMyAttendance,
  addMyAttendance,
  updateMyAttendance,
  getMyLeaves,
  applyMyLeave,
  getMyShifts,
  getMyTasks,
  updateMyTaskStatus,
  getMyExpenses,
  addMyExpense,
  updateMyExpense,
  getMyPerformance,
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
router.get("/info", getMyInfo)
router.get("/attendance", getMyAttendance)
router.post("/attendance", addMyAttendance)
router.put("/attendance/:id", updateMyAttendance)
router.get("/leaves", getMyLeaves)
router.post("/leaves", applyMyLeave)
router.get("/shifts", getMyShifts)
router.get("/tasks", getMyTasks)
router.put("/tasks/:id", updateMyTaskStatus)
router.get("/expenses", getMyExpenses)
router.post("/expenses", addMyExpense)
router.put("/expenses/:id", updateMyExpense)
router.get("/performance", getMyPerformance)
router.get("/lubricants/products", getProducts)
router.get("/lubricants", getMyLubricantSales)
router.post("/lubricants", addMyLubricantSale)
router.put("/lubricants/:id", updateMyLubricantSale)
router.get("/daily-reports", getMyDailyReports)
router.post("/daily-reports", createMyDailyReport)
router.put("/daily-reports/:id", updateMyDailyReport)

module.exports = router
