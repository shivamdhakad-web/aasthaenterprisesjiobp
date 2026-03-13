const express = require("express")
const cors = require("cors")
const petrolRoutes = require("./routes/petrolRoutes")
const dieselRoutes = require("./routes/dieselRoutes")
const revenueRoutes = require("./routes/revenueRoutes")
// const tankRoutes = require("./routes/tankRoutes")
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

const app = express()

app.use(cors())
app.use(express.json())
app.use("/api/petrol",petrolRoutes)
app.use("/api/diesel",dieselRoutes)
app.use("/api/revenue",revenueRoutes)
// app.use("/api/tank",tankRoutes)

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

module.exports = app