const express = require("express")

const {
  getShiftSchedules,
  createShiftSchedule,
  updateShiftSchedule,
  deleteShiftSchedule,
} = require("../controllers/shiftController")

const router = express.Router()

router.get("/", getShiftSchedules)
router.post("/", createShiftSchedule)
router.put("/:id", updateShiftSchedule)
router.delete("/:id", deleteShiftSchedule)

module.exports = router
