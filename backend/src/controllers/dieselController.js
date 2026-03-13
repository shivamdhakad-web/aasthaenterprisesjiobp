const DieselSale = require("../models/DieselSale")

// ADD
exports.addDieselSale = async(req,res)=>{
 try{

  const {date,liters,price,description} = req.body

  const totalAmount = liters * price

  const sale = await DieselSale.create({
   date,
   liters,
   price,
   totalAmount,
   description
  })

  res.status(201).json(sale)

 }catch(err){
  res.status(500).json({message:err.message})
 }
}



// GET ALL
exports.getDieselSales = async(req,res)=>{
 try{

  const data = await DieselSale.find().sort({date:-1})

  res.json(data)

 }catch(err){
  res.status(500).json({message:err.message})
 }
}



// UPDATE
exports.updateDieselSale = async(req,res)=>{
 try{

  const {liters,price,description} = req.body

  const totalAmount = liters * price

  const sale = await DieselSale.findByIdAndUpdate(
   req.params.id,
   {liters,price,description,totalAmount},
   {new:true}
  )

  res.json(sale)

 }catch(err){
  res.status(500).json({message:err.message})
 }
}



// DELETE
exports.deleteDieselSale = async(req,res)=>{
 try{

  await DieselSale.findByIdAndDelete(req.params.id)

  res.json({message:"Deleted Successfully"})

 }catch(err){
  res.status(500).json({message:err.message})
 }
}



// STATS
exports.todayDieselStats = async(req,res)=>{
 try{

  const today = new Date().toISOString().split("T")[0]

  const todayData = await DieselSale.find({date:today})

  const todayTotal = todayData.reduce(
   (sum,item)=> sum + item.liters ,0
  )

  const yesterday = new Date()

  yesterday.setDate(yesterday.getDate()-1)

  const yesterdayDate =
  yesterday.toISOString().split("T")[0]

  const yesterdayData =
  await DieselSale.find({date:yesterdayDate})

  const yesterdayTotal = yesterdayData.reduce(
   (sum,item)=> sum + item.liters ,0
  )

  let percent = 0

  if(yesterdayTotal>0){

   percent =
   ((todayTotal-yesterdayTotal)/yesterdayTotal)*100

  }

  res.json({
   todayLiters:todayTotal,
   yesterdayLiters:yesterdayTotal,
   percent:percent.toFixed(1)
  })

 }catch(err){
  res.status(500).json({message:err.message})
 }
}