const express = require("express")

const router = express.Router()

const {

getMeterReadings,
addMeterReading,
deleteMeterReading,
updateMeterReading

} = require("../controllers/meterController")

router.get("/meter",getMeterReadings)

router.post("/meter",addMeterReading)

router.delete("/meter/:id",deleteMeterReading)

router.put("/meter/:id",updateMeterReading)

module.exports = router