const express = require("express")

const {
 updateTank,
 getTank
} = require("../controllers/tankController")

const router = express.Router()

router.get("/levels",getTank)

router.post("/update",updateTank)

module.exports = router
