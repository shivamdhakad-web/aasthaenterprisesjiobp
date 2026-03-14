const CustomerDriver = require("../models/CustomerDriver")

exports.getDrivers = async(req,res)=>{
try{

const data = await CustomerDriver.find().sort({createdAt:-1})

res.json(data)

}catch(err){

res.status(500).json({error:err.message})

}
}


exports.addDriver = async(req,res)=>{
try{

const driver = new CustomerDriver(req.body)

await driver.save()

res.json(driver)

}catch(err){

res.status(500).json({error:err.message})

}
}


exports.updateDriver = async(req,res)=>{
try{

const driver = await CustomerDriver.findByIdAndUpdate(
req.params.id,
req.body,
{new:true}
)

res.json(driver)

}catch(err){

res.status(500).json({error:err.message})

}
}


exports.deleteDriver = async(req,res)=>{
try{

await CustomerDriver.findByIdAndDelete(req.params.id)

res.json({message:"Deleted"})

}catch(err){

res.status(500).json({error:err.message})

}
}