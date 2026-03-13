const express = require("express")

const router = express.Router()

const {
getReminders,
addReminder,
deleteReminder,
completeReminder
} = require("../controllers/reminderController")

router.get("/reminders",getReminders)

router.post("/reminders",addReminder)

router.delete("/reminders/:id",deleteReminder)

router.put("/reminders/:id",completeReminder)

module.exports = router