const Product = require("../models/LubricantProduct")
const Sale = require("../models/LubricantSale")

const toNumber = (value)=> Number(value || 0)
const getBusinessType = (req)=> req.baseUrl.includes("/campa") ? "campa" : "lubricant"
const getBusinessFilter = (req)=> getBusinessType(req) === "campa"
 ? {businessType:"campa"}
 : {$or:[{businessType:"lubricant"},{businessType:{$exists:false}}]}

const buildSalePayload = (body, product, existing = {})=>{
 const price = toNumber(body.price)
 const quantity = toNumber(body.quantity)
 const total = toNumber(body.total || price * quantity)
 const unitProfit = Number((price - toNumber(product?.costPrice)).toFixed(2))
 const totalProfit = Number((unitProfit * quantity).toFixed(2))

 return {
  ...body,
  price,
  quantity,
  total,
  unitProfit,
  totalProfit,
  createdByRole:body.createdByRole || existing.createdByRole || "Admin",
  createdByEmployeeId:body.createdByEmployeeId || existing.createdByEmployeeId,
  createdByName:body.createdByName || body.soldBy || existing.createdByName || "",
  lastEditedAt:body.lastEditedAt || existing.lastEditedAt || null,
  lastEditedBy:body.lastEditedBy || existing.lastEditedBy || "",
  lastEditedByRole:body.lastEditedByRole || existing.lastEditedByRole || "",
 }
}

const updateProductStockMeta = (product, quantity, body)=>{
 const addedQuantity = toNumber(quantity)
 product.stock = toNumber(product.stock) + addedQuantity
 product.lastStockAddedAt = body.lastStockAddedAt || new Date()
 product.lastStockAddedBy = body.lastStockAddedBy || ""
 product.lastStockAddedByRole = body.lastStockAddedByRole || ""
 product.stockHistory.push({
  quantity:addedQuantity,
  addedAt:product.lastStockAddedAt,
  addedBy:product.lastStockAddedBy,
  addedByRole:product.lastStockAddedByRole,
 })
}

/* GET PRODUCTS */
exports.getProducts = async(req,res)=>{
 const data = await Product.find(getBusinessFilter(req)).sort({createdAt:-1,name:1})
 res.json(data)
}

/* ADD PRODUCT */
exports.addProduct = async(req,res)=>{
 const product = new Product({
  ...req.body,
  businessType:getBusinessType(req),
  price:toNumber(req.body.price),
  costPrice:toNumber(req.body.costPrice),
  stock:toNumber(req.body.stock),
 })

 if(toNumber(req.body.stock) > 0){
  updateProductStockMeta(product, req.body.stock, {
   lastStockAddedAt:req.body.lastStockAddedAt || new Date(),
   lastStockAddedBy:req.body.createdByName || req.body.lastStockAddedBy || "",
   lastStockAddedByRole:req.body.createdByRole || req.body.lastStockAddedByRole || "",
  })
  product.stock = toNumber(req.body.stock)
 }

 await product.save()
 res.json(product)
}

/* UPDATE PRODUCT */
exports.updateProduct = async(req,res)=>{
 const existing = await Product.findOne({_id:req.params.id,...getBusinessFilter(req)})

 if(!existing){
  return res.status(404).json({message:"Product not found"})
 }

 const previousStock = toNumber(existing.stock)
 const nextStock = toNumber(req.body.stock)

 existing.name = req.body.name
 existing.price = toNumber(req.body.price)
 existing.costPrice = toNumber(req.body.costPrice)
 existing.stock = nextStock
 existing.addedDate = req.body.addedDate || existing.addedDate
 existing.lastEditedAt = req.body.lastEditedAt || existing.lastEditedAt || new Date()
 existing.lastEditedBy = req.body.lastEditedBy || existing.lastEditedBy || ""
 existing.lastEditedByRole = req.body.lastEditedByRole || existing.lastEditedByRole || ""

 if(req.body.lastStockAddedAt && nextStock > previousStock){
  existing.lastStockAddedAt = req.body.lastStockAddedAt
  existing.lastStockAddedBy = req.body.lastStockAddedBy || existing.lastStockAddedBy || ""
  existing.lastStockAddedByRole = req.body.lastStockAddedByRole || existing.lastStockAddedByRole || ""
  existing.stockHistory.push({
   quantity:Math.max(0, nextStock - previousStock),
   addedAt:existing.lastStockAddedAt,
   addedBy:existing.lastStockAddedBy,
   addedByRole:existing.lastStockAddedByRole,
  })
 }

 await existing.save()

 res.json(existing)
}

/* DELETE PRODUCT */
exports.deleteProduct = async(req,res)=>{
 await Product.findOneAndDelete({_id:req.params.id,...getBusinessFilter(req)})
 res.json({message:"Deleted"})
}

/* GET SALES */
exports.getSales = async(req,res)=>{
 const data = await Sale.find(getBusinessFilter(req)).sort({_id:-1})
 res.json(data)
}

/* ADD SALE + STOCK MINUS */
exports.addSale = async(req,res)=>{
 const {product,quantity} = req.body
 const p = await Product.findOne({name:product,...getBusinessFilter(req)})

 if(!p){
  return res.status(400).json({message:"Product not found"})
 }

 if(toNumber(p.stock) < toNumber(quantity)){
  return res.status(400).json({message:"Not enough stock"})
 }

 p.stock = toNumber(p.stock) - toNumber(quantity)
 await p.save()

 const sale = new Sale({...buildSalePayload(req.body, p),businessType:getBusinessType(req)})
 await sale.save()

 res.json(sale)
}

/* UPDATE SALE */
exports.updateSale = async(req,res)=>{
 const existing = await Sale.findOne({_id:req.params.id,...getBusinessFilter(req)})

 if(!existing){
  return res.status(404).json({message:"Sale not found"})
 }

 const oldProduct = await Product.findOne({name:existing.product,...getBusinessFilter(req)})

 if(oldProduct){
  oldProduct.stock = toNumber(oldProduct.stock) + toNumber(existing.quantity)
  await oldProduct.save()
 }

 const nextProduct = await Product.findOne({name:req.body.product,...getBusinessFilter(req)})

 if(!nextProduct){
  return res.status(404).json({message:"Product not found"})
 }

 if(toNumber(nextProduct.stock) < toNumber(req.body.quantity)){
  return res.status(400).json({message:"Not enough stock"})
 }

 nextProduct.stock = toNumber(nextProduct.stock) - toNumber(req.body.quantity)
 await nextProduct.save()

 const sale = await Sale.findOneAndUpdate(
  {_id:req.params.id,...getBusinessFilter(req)},
  {...buildSalePayload(req.body, nextProduct, existing),businessType:getBusinessType(req)},
  {new:true}
 )

 res.json(sale)
}

/* DELETE SALE */
exports.deleteSale = async(req,res)=>{
 const existing = await Sale.findOne({_id:req.params.id,...getBusinessFilter(req)})

 if(existing){
  const product = await Product.findOne({name:existing.product,...getBusinessFilter(req)})

  if(product){
   product.stock = toNumber(product.stock) + toNumber(existing.quantity)
   await product.save()
  }
 }

 await Sale.findOneAndDelete({_id:req.params.id,...getBusinessFilter(req)})
 res.json({message:"Deleted"})
}

/* DELETE MONTH SALES */
exports.deleteMonth = async(req,res)=>{
 const {month,year} = req.body
 const key = `${year}-${month}`
 const sales = await Sale.find({
  ...getBusinessFilter(req),
  date:{$regex:key}
 })

 for(const sale of sales){
  const product = await Product.findOne({name:sale.product,...getBusinessFilter(req)})

  if(product){
   product.stock = toNumber(product.stock) + toNumber(sale.quantity)
   await product.save()
  }
 }

 await Sale.deleteMany({
  ...getBusinessFilter(req),
  date:{$regex:key}
 })

 res.json({message:"Month data deleted"})
}
