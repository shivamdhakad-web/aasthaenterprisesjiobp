const Product = require("../models/LubricantProduct")
const Sale = require("../models/LubricantSale")



/* GET PRODUCTS */

exports.getProducts = async(req,res)=>{

 const data = await Product.find()

 res.json(data)

}



/* ADD PRODUCT */

exports.addProduct = async(req,res)=>{

 const product = new Product(req.body)

 await product.save()

 res.json(product)

}



/* UPDATE PRODUCT */

exports.updateProduct = async(req,res)=>{

 const product = await Product.findByIdAndUpdate(

  req.params.id,

  req.body,

  {new:true}

 )

 res.json(product)

}



/* DELETE PRODUCT */

exports.deleteProduct = async(req,res)=>{

 await Product.findByIdAndDelete(req.params.id)

 res.json({message:"Deleted"})

}



/* GET SALES */

exports.getSales = async(req,res)=>{

 const data = await Sale.find().sort({_id:-1})

 res.json(data)

}



/* ADD SALE + STOCK MINUS */

exports.addSale = async(req,res)=>{

 const {product,quantity} = req.body

 const p = await Product.findOne({name:product})

 if(!p){

  return res.status(400).json({message:"Product not found"})

 }

 if(p.stock < quantity){

  return res.status(400).json({message:"Not enough stock"})

 }

 p.stock -= quantity

 await p.save()

 const sale = new Sale(req.body)

 await sale.save()

 res.json(sale)

}



/* UPDATE SALE */

exports.updateSale = async(req,res)=>{

 const sale = await Sale.findByIdAndUpdate(
  req.params.id,
  req.body,
  {new:true}
 )

 res.json(sale)

}



/* DELETE SALE */

exports.deleteSale = async(req,res)=>{

 await Sale.findByIdAndDelete(req.params.id)

 res.json({message:"Deleted"})

}



/* DELETE MONTH SALES */

exports.deleteMonth = async(req,res)=>{

 const {month,year} = req.body

 const key = `${year}-${month}`

 await Sale.deleteMany({

  date:{$regex:key}

 })

 res.json({message:"Month data deleted"})

}