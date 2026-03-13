const express = require("express")

const { todayRevenue }
= require("../controllers/revenueController")

const router = express.Router()

router.get("/today",todayRevenue)

module.exports = router