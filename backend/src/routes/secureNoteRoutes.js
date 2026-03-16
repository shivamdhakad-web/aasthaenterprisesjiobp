const router = require("express").Router()

const {
getNotes,
addNote,
updateNote,
deleteNote
} = require("../controllers/secureNoteController")

router.get("/",getNotes)

router.post("/",addNote)

router.put("/:id",updateNote)

router.delete("/:id",deleteNote)

module.exports = router