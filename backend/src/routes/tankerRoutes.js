const express = require("express")
const router = express.Router()

const {
getDeliveries,
addDelivery,
updateDelivery,
deleteDelivery
} = require("../controllers/tankerController")

router.get("/",getDeliveries)

router.post("/",addDelivery)

router.put("/:id",updateDelivery)

router.delete("/:id",deleteDelivery)

module.exports = router