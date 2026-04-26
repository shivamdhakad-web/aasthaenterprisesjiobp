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

 const sale = new Sale({
  ...req.body,
  price:Number(req.body.price || 0),
  quantity:Number(quantity || 0),
  total:Number(req.body.total || Number(req.body.price || 0) * Number(quantity || 0)),
  createdByRole:req.body.createdByRole || "Admin",
  createdByEmployeeId:req.body.createdByEmployeeId,
  createdByName:req.body.createdByName || req.body.soldBy
 })

 await sale.save()

 res.json(sale)

}



/* UPDATE SALE */

exports.updateSale = async(req,res)=>{

 const existing = await Sale.findById(req.params.id)

 if(!existing){
  return res.status(404).json({message:"Sale not found"})
 }

 const oldProduct = await Product.findOne({name:existing.product})

 if(oldProduct){
  oldProduct.stock = Number(oldProduct.stock || 0) + Number(existing.quantity || 0)
  await oldProduct.save()
 }

 const nextProduct = await Product.findOne({name:req.body.product})

 if(!nextProduct){
  return res.status(404).json({message:"Product not found"})
 }

 if(Number(nextProduct.stock || 0) < Number(req.body.quantity || 0)){
  return res.status(400).json({message:"Not enough stock"})
 }

 nextProduct.stock = Number(nextProduct.stock || 0) - Number(req.body.quantity || 0)
 await nextProduct.save()

 const sale = await Sale.findByIdAndUpdate(
  req.params.id,
  {
   ...req.body,
   price:Number(req.body.price || 0),
   quantity:Number(req.body.quantity || 0),
   total:Number(req.body.total || Number(req.body.price || 0) * Number(req.body.quantity || 0)),
   createdByRole:req.body.createdByRole || existing.createdByRole || "Admin",
   createdByEmployeeId:req.body.createdByEmployeeId || existing.createdByEmployeeId,
   createdByName:req.body.createdByName || req.body.soldBy || existing.createdByName
  },
  {new:true}
 )

 res.json(sale)

}



/* DELETE SALE */

exports.deleteSale = async(req,res)=>{

 const existing = await Sale.findById(req.params.id)

 if(existing){
  const product = await Product.findOne({name:existing.product})

  if(product){
   product.stock = Number(product.stock || 0) + Number(existing.quantity || 0)
   await product.save()
  }
 }

 await Sale.findByIdAndDelete(req.params.id)

 res.json({message:"Deleted"})

}



/* DELETE MONTH SALES */

exports.deleteMonth = async(req,res)=>{

 const {month,year} = req.body

 const key = `${year}-${month}`

 const sales = await Sale.find({
  date:{$regex:key}
 })

 for(const sale of sales){
  const product = await Product.findOne({name:sale.product})

  if(product){
   product.stock = Number(product.stock || 0) + Number(sale.quantity || 0)
   await product.save()
  }
 }

 await Sale.deleteMany({

  date:{$regex:key}

 })

 res.json({message:"Month data deleted"})

}
