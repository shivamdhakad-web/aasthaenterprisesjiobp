const express = require("express")

const router = express.Router()

const {

getEntries,
addEntry,
updateEntry,
deleteEntry,
deleteMonth

} = require("../controllers/cardSwipeController")



// GET ALL ENTRIES (WITH FILTERS)
router.get("/",getEntries)


// ADD ENTRY
router.post("/",addEntry)


// UPDATE ENTRY
router.put("/:id",updateEntry)


// DELETE ENTRY
router.delete("/:id",deleteEntry)


// DELETE MONTH DATA
router.delete("/month/:year/:month",deleteMonth)



module.exports = router