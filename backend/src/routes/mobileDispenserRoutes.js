const express = require("express")

const {

getEntries,
addEntry,
updateEntry,
deleteEntry,

getSettings,
updateSettings,

deleteMonth

} = require("../controllers/mobileDispenserController")

const router = express.Router()



// SETTINGS
router.get("/settings",getSettings)

router.put("/settings",updateSettings)



// ENTRIES
router.get("/",getEntries)

router.post("/",addEntry)

router.put("/:id",updateEntry)

router.delete("/:id",deleteEntry)



// DELETE MONTH
router.delete("/month/:year/:month",deleteMonth)



module.exports = router