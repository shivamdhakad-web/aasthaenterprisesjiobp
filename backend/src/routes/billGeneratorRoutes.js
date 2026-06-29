const express = require("express")
const router = express.Router()

const { addBill, deleteBill, getBills, updateBill } = require("../controllers/billGeneratorController")

router.get("/", getBills)
router.post("/", addBill)
router.put("/:id", updateBill)
router.delete("/:id", deleteBill)

module.exports = router
