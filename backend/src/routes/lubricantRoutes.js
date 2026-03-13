const express = require("express")
const router = express.Router()

const {

 getProducts,
 addProduct,
 updateProduct,
 deleteProduct,

 getSales,
 addSale,
 updateSale,
 deleteSale,

 deleteMonth

} = require("../controllers/lubricantController")



/* PRODUCTS */

router.get("/products",getProducts)

router.post("/products",addProduct)

router.put("/products/:id",updateProduct)

router.delete("/products/:id",deleteProduct)



/* SALES */

router.get("/",getSales)

router.post("/",addSale)

router.put("/:id",updateSale)

router.delete("/:id",deleteSale)



/* DELETE MONTH */

router.post("/delete-month",deleteMonth)



module.exports = router