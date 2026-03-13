const express = require("express")

const {

 addDieselSale,
 getDieselSales,
 updateDieselSale,
 deleteDieselSale,
 todayDieselStats

} = require("../controllers/dieselController")

const router = express.Router()

router.post("/add",addDieselSale)

router.get("/all",getDieselSales)

router.put("/update/:id",updateDieselSale)

router.delete("/delete/:id",deleteDieselSale)

router.get("/stats/today",todayDieselStats)

module.exports = router