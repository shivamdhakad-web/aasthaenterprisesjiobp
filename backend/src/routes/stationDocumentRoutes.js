const express = require("express")
const {
  createStationDocument,
  deleteStationDocument,
  getStationDocuments,
  getStationDocumentUsage,
} = require("../controllers/stationDocumentController")

const router = express.Router()

router.get("/", getStationDocuments)
router.get("/usage", getStationDocumentUsage)
router.post("/", createStationDocument)
router.delete("/:id", deleteStationDocument)

module.exports = router
