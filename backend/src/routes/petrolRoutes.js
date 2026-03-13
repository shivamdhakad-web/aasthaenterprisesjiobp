const express = require("express")

const {
 addPetrolSale,
 getPetrolSales,
 updatePetrolSale,
 deletePetrolSale,
 todayPetrolStats
} = require("../controllers/petrolController")

const router = express.Router()

router.post("/add",addPetrolSale)

router.get("/all",getPetrolSales)

router.put("/update/:id",updatePetrolSale)

router.delete("/delete/:id",deletePetrolSale)

router.get("/stats/today",todayPetrolStats)

module.exports = router