const express = require("express")
const {
  listLoginSessions,
  terminateLoginSession,
} = require("../controllers/loginSessionController")

const router = express.Router()

router.get("/", listLoginSessions)
router.patch("/:id/terminate", terminateLoginSession)

module.exports = router
