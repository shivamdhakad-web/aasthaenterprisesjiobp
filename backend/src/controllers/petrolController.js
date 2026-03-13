const PetrolSale = require("../models/PetrolSale")


// ADD SALE
exports.addPetrolSale = async(req,res)=>{
  try{

    const {date,liters,price,description} = req.body

    const totalAmount = liters * price

    const sale = await PetrolSale.create({
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



// GET ALL SALES
exports.getPetrolSales = async(req,res)=>{
  try{

    const data = await PetrolSale.find().sort({date:-1})

    res.json(data)

  }catch(err){
    res.status(500).json({message:err.message})
  }
}



// UPDATE SALE
exports.updatePetrolSale = async(req,res)=>{
  try{

    const {liters,price,description} = req.body

    const totalAmount = liters * price

    const sale = await PetrolSale.findByIdAndUpdate(
      req.params.id,
      {liters,price,description,totalAmount},
      {new:true}
    )

    res.json(sale)

  }catch(err){
    res.status(500).json({message:err.message})
  }
}



// DELETE SALE
exports.deletePetrolSale = async(req,res)=>{
  try{

    await PetrolSale.findByIdAndDelete(req.params.id)

    res.json({message:"Deleted Successfully"})

  }catch(err){
    res.status(500).json({message:err.message})
  }
}



// TODAY DASHBOARD STATS
exports.todayPetrolStats = async(req,res)=>{
  try{

    const today = new Date().toISOString().split("T")[0]

    const todayData = await PetrolSale.find({date:today})

    const todayTotal = todayData.reduce((sum,item)=> sum + item.liters ,0)


    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate()-1)

    const yesterdayDate = yesterday.toISOString().split("T")[0]

    const yesterdayData = await PetrolSale.find({date:yesterdayDate})

    const yesterdayTotal = yesterdayData.reduce((sum,item)=> sum + item.liters ,0)


    let percent = 0

    if(yesterdayTotal>0){
      percent = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
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