const express = require("express")
const router = express.Router()

const {
getLedger,
addFuel,
addPayment,
deleteLedger
} = require("../controllers/ledgerController")

router.get("/:customerId",getLedger)

router.post("/fuel",addFuel)

router.post("/payment",addPayment)

router.delete("/:id",deleteLedger)

module.exports = router