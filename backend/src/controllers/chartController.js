const PetrolSale = require("../models/PetrolSale")
const DieselSale = require("../models/DieselSale")

exports.todaySalesTrend = async (req,res)=>{

 try{

  const today = new Date().toISOString().split("T")[0]

  const petrol = await PetrolSale.find({date:today})
  const diesel = await DieselSale.find({date:today})

  const petrolTotal = petrol.reduce((sum,i)=>sum+i.liters,0)
  const dieselTotal = diesel.reduce((sum,i)=>sum+i.liters,0)

  const data = [
   {time:"6AM", petrol:petrolTotal*0.05, diesel:dieselTotal*0.05},
   {time:"8AM", petrol:petrolTotal*0.12, diesel:dieselTotal*0.14},
   {time:"10AM", petrol:petrolTotal*0.10, diesel:dieselTotal*0.11},
   {time:"12PM", petrol:petrolTotal*0.18, diesel:dieselTotal*0.16},
   {time:"2PM", petrol:petrolTotal*0.15, diesel:dieselTotal*0.14},
   {time:"4PM", petrol:petrolTotal*0.20, diesel:dieselTotal*0.22},
   {time:"6PM", petrol:petrolTotal*0.18, diesel:dieselTotal*0.18},
   {time:"8PM", petrol:petrolTotal*0.10, diesel:dieselTotal*0.09},
   {time:"10PM", petrol:petrolTotal*0.07, diesel:dieselTotal*0.06}
  ]

  res.json(data)

 }catch(err){

  res.status(500).json({message:err.message})

 }

}




exports.fuelMix = async(req,res)=>{

 try{

  const petrol = await PetrolSale.aggregate([
   {$group:{_id:null,total:{$sum:"$liters"}}}
  ])

  const diesel = await DieselSale.aggregate([
   {$group:{_id:null,total:{$sum:"$liters"}}}
  ])

  const petrolTotal = petrol[0]?.total || 0
  const dieselTotal = diesel[0]?.total || 0

  const premium = Math.round((petrolTotal+dieselTotal)*0.15)

  res.json([
   {name:"Petrol",value:petrolTotal},
   {name:"Diesel",value:dieselTotal},
   {name:"Premium",value:premium}
  ])

 }catch(err){

  res.status(500).json({message:err.message})

 }

}