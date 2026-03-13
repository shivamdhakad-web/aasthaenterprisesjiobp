const PetrolSale = require("../models/PetrolSale")
const DieselSale = require("../models/DieselSale")

exports.todayRevenue = async (req,res)=>{

 try{

  const today = new Date().toLocaleDateString("en-CA")

  const petrolToday = await PetrolSale.find({date:today})
  const dieselToday = await DieselSale.find({date:today})

  const petrolTotal = petrolToday.reduce(
   (sum,item)=>sum + item.totalAmount ,0
  )

  const dieselTotal = dieselToday.reduce(
   (sum,item)=>sum + item.totalAmount ,0
  )

  const todayRevenue = petrolTotal + dieselTotal


  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate()-1)

  const yesterday = yesterdayDate.toLocaleDateString("en-CA")

  const petrolYesterday =
  await PetrolSale.find({date:yesterday})

  const dieselYesterday =
  await DieselSale.find({date:yesterday})

  const petrolYTotal =
  petrolYesterday.reduce(
   (sum,item)=>sum + item.totalAmount ,0
  )

  const dieselYTotal =
  dieselYesterday.reduce(
   (sum,item)=>sum + item.totalAmount ,0
  )

  const yesterdayRevenue = petrolYTotal + dieselYTotal


  let percent = 0

  if(yesterdayRevenue>0){

   percent =
   ((todayRevenue - yesterdayRevenue)
   / yesterdayRevenue) * 100

  }


  res.json({

   revenue:todayRevenue,
   yesterdayRevenue,
   percent:percent.toFixed(1)

  })

 }catch(err){

  res.status(500).json({message:err.message})

 }

}