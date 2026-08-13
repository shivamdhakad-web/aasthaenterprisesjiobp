const express = require("express")

const { chat, getChatModels, importPhotoEntries, summarizeReport } = require("../controllers/aiController")

const router = express.Router()

router.post("/report-summary", summarizeReport)
router.get("/chat-models", getChatModels)
router.post("/chat", chat)
router.post("/photo-import", importPhotoEntries)

module.exports = router
