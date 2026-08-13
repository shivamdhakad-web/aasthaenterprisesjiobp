const express = require("express")

const { chat, getChatModels, summarizeReport } = require("../controllers/aiController")

const router = express.Router()

router.post("/report-summary", summarizeReport)
router.get("/chat-models", getChatModels)
router.post("/chat", chat)

module.exports = router
