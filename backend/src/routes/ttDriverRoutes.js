const express = require("express")
const router = express.Router()

const {
  getDrivers,
  addDriver,
  updateDriver,
  deleteDriver
} = require("../controllers/ttDriverController")


router.get("/",getDrivers)

router.post("/",addDriver)

router.put("/:id",updateDriver)

router.delete("/:id",deleteDriver)


module.exports = router