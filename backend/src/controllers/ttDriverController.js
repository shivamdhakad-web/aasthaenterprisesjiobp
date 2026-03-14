const TTDriver = require("../models/TTDriver")

exports.getDrivers = async(req,res)=>{
  try{

    const drivers = await TTDriver.find().sort({createdAt:-1})

    res.json(drivers)

  }catch(error){

    res.status(500).json({error:error.message})

  }
}



exports.addDriver = async(req,res)=>{
  try{

    const driver = new TTDriver(req.body)

    await driver.save()

    res.json(driver)

  }catch(error){

    res.status(500).json({error:error.message})

  }
}



exports.updateDriver = async(req,res)=>{
  try{

    const driver = await TTDriver.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
    )

    res.json(driver)

  }catch(error){

    res.status(500).json({error:error.message})

  }
}



exports.deleteDriver = async(req,res)=>{
  try{

    await TTDriver.findByIdAndDelete(req.params.id)

    res.json({message:"Deleted"})

  }catch(error){

    res.status(500).json({error:error.message})

  }
}