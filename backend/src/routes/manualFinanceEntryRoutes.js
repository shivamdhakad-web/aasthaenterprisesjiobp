const express = require("express")
const { getEntries, addEntry, addEntries, deleteMonth, updateEntry, deleteEntry } = require("../controllers/manualFinanceEntryController")

const router = express.Router()

router.get("/", getEntries)
router.post("/bulk", addEntries)
router.delete("/month/:year/:month", deleteMonth)
router.post("/", addEntry)
router.put("/:id", updateEntry)
router.delete("/:id", deleteEntry)

module.exports = router
