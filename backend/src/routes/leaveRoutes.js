const express = require("express")

const { getLeaves, decideLeave } = require("../controllers/leaveController")

const router = express.Router()

router.get("/", getLeaves)
router.put("/:id/decision", decideLeave)

module.exports = router
