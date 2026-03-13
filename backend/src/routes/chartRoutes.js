const express = require("express")
const { todaySalesTrend,fuelMix } = require("../controllers/chartController")

const router = express.Router()

router.get("/sales-trend",todaySalesTrend)
router.get("/fuel-mix",fuelMix)

module.exports = router