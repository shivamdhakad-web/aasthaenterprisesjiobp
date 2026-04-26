const express = require("express")

const {
  getNotifications,
  createNotification,
  markNotificationRead,
} = require("../controllers/notificationController")

const router = express.Router()

router.get("/", getNotifications)
router.post("/", createNotification)
router.put("/:id/read", markNotificationRead)

module.exports = router