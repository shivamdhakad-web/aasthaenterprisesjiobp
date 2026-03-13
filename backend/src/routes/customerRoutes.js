const express = require("express");

const {
addCustomer,
getCustomers,
updateCustomer,
deleteCustomer,
getCustomerLedger,
addFuelEntry,
addPayment
} = require("../controllers/customerController");

const router = express.Router();

router.post("/",addCustomer);

router.get("/",getCustomers);

router.put("/:id",updateCustomer);

router.delete("/:id",deleteCustomer);

router.get("/:id/ledger",getCustomerLedger);

router.post("/:id/fuel",addFuelEntry);

router.post("/:id/payment",addPayment);

module.exports = router;