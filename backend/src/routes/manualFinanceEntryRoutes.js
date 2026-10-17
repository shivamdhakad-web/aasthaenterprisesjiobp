const express = require("express")
const { getEntries, addEntry, updateEntry, deleteEntry } = require("../controllers/manualFinanceEntryController")

const router = express.Router()

router.get("/", getEntries)
router.post("/", addEntry)
router.put("/:id", updateEntry)
router.delete("/:id", deleteEntry)

module.exports = router
