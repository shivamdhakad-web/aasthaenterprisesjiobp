const express = require("express")
const {
  createEntry,
  deleteEntry,
  getEntries,
} = require("../controllers/smartCalculatorController")

const router = express.Router()

router.get("/", getEntries)
router.post("/", createEntry)
router.delete("/:id", deleteEntry)

module.exports = router