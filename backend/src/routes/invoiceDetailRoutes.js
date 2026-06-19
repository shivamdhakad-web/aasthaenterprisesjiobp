const express = require("express")
const router = express.Router()

const { addEntry, deleteEntry, getEntries, updateEntry } = require("../controllers/invoiceDetailController")

router.get("/", getEntries)
router.post("/", addEntry)
router.put("/:id", updateEntry)
router.delete("/:id", deleteEntry)

module.exports = router
