const express = require("express")

const {
 updateTank,
 getTankLevels
} = require("../controllers/tankController")

const router = express.Router()

router.get("/levels",getTankLevels)

router.post("/update",updateTank)

module.exports = router