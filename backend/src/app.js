const express = require("express")
const cors = require("cors")
const { authenticateToken } = require("./middleware/auth")
const { authorizeApiAccess } = require("./middleware/accessControl")
const petrolRoutes = require("./routes/petrolRoutes")
const dieselRoutes = require("./routes/dieselRoutes")
const revenueRoutes = require("./routes/revenueRoutes")
const tankRoutes = require("./routes/tankRoutes")
const chartRoutes = require("./routes/chartRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")
const reminderRoutes = require("./routes/reminderRoutes")
const meterRoutes = require("./routes/meterRoutes")
const tankerRoutes = require("./routes/tankerRoutes")
const customerRoutes = require("./routes/customerRoutes");
const expenseRoutes = require("./routes/expenseRoutes")
const settingsRoutes = require("./routes/settingsRoutes")
const lubricantRoutes = require("./routes/lubricantRoutes")
const employeeRoutes = require("./routes/employeeRoutes")
const attendanceRoutes = require("./routes/employeeAttendanceRoutes")
const mobileDispenserRoutes = require("./routes/mobileDispenserRoutes")
const cardSwipeRoutes = require("./routes/cardSwipeRoutes")
const ttDriverRoutes = require("./routes/ttDriverRoutes")
const customerDriverRoutes = require("./routes/customerDriverRoutes")
const secureNoteRoutes = require("./routes/secureNoteRoutes")
const userRoutes = require("./routes/userRoutes")
const authRoutes = require("./routes/authRoutes")
const approvalRoutes = require("./routes/approvalRoutes")
const notificationRoutes = require("./routes/notificationRoutes")
const salaryRoutes = require("./routes/salaryRoutes")
const employeeSelfRoutes = require("./routes/employeeSelfRoutes")
const dailyReportRoutes = require("./routes/dailyReportRoutes")
const leaveRoutes = require("./routes/leaveRoutes")
const shiftRoutes = require("./routes/shiftRoutes")
const taskRoutes = require("./routes/taskRoutes")
const storageRoutes = require("./routes/storageRoutes")
const smartCalculatorRoutes = require("./routes/smartCalculatorRoutes")
const densityCalculatorRoutes = require("./routes/densityCalculatorRoutes")
const employeeDashboardSettingRoutes = require("./routes/employeeDashboardSettingRoutes")
const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api", authenticateToken, authorizeApiAccess)

app.use("/api/petrol",petrolRoutes)
app.use("/api/diesel",dieselRoutes)
app.use("/api/revenue",revenueRoutes)
app.use("/api/tank",tankRoutes)

app.use("/api/charts",chartRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api",reminderRoutes)

app.use("/api",meterRoutes)

app.use("/api/tanker-deliveries",tankerRoutes)


app.use("/api/customers",customerRoutes);


app.use("/api/expenses",expenseRoutes)

app.use("/api/settings", settingsRoutes)

app.use("/api/lubricants",lubricantRoutes)

app.use("/api/employees",employeeRoutes)
app.use("/api/attendance",attendanceRoutes)

app.use("/api/mobile-dispenser",mobileDispenserRoutes)

app.use("/api/card-swipe",cardSwipeRoutes)

app.use("/api/ttdrivers",ttDriverRoutes)

app.use("/api/customerdrivers",customerDriverRoutes)

app.use("/api/secure-notes",secureNoteRoutes)
app.use("/api/users",userRoutes)
app.use("/api/approvals",approvalRoutes)
app.use("/api/notifications",notificationRoutes)
app.use("/api/salary",salaryRoutes)
app.use("/api/employee",employeeSelfRoutes)
app.use("/api/daily-reports",dailyReportRoutes)
app.use("/api/leaves", leaveRoutes)
app.use("/api/shifts", shiftRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/storage", storageRoutes)
app.use("/api/smart-calculator", smartCalculatorRoutes)
app.use("/api/density-calculator", densityCalculatorRoutes)
app.use("/api/employee-dashboard-settings", employeeDashboardSettingRoutes)

module.exports = app
