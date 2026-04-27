const express = require("express")

const { getStorageOverview } = require("../controllers/storageController")

const router = express.Router()

router.get("/", getStorageOverview)

module.exports = router
