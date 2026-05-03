const express = require("express")
const {
  createEntry,
  deleteEntry,
  getEntries,
  getPresets,
} = require("../controllers/densityCalculatorController")

const router = express.Router()

router.get("/", getEntries)
router.get("/presets", getPresets)
router.post("/", createEntry)
router.delete("/:id", deleteEntry)

module.exports = router