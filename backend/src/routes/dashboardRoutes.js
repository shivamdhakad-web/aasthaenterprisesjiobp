const express = require("express")
const router = express.Router()

const { getFuelRevenueChart } = require("../controllers/dashboardController")

router.get("/fuel-revenue-chart", getFuelRevenueChart)

module.exports = router