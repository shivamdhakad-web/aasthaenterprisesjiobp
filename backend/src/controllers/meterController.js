const MeterReading = require("../models/MeterReading")

// GET

exports.getMeterReadings = async(req,res)=>{

try{

const data = await MeterReading.find().sort({_id:-1})

res.json(data)

}catch(err){

res.status(500).json({error:err.message})

}

}


// ADD

exports.addMeterReading = async(req,res)=>{

try{

const {nozzle,shift,opening,closing,date} = req.body

const fuelSold = closing - opening

const data = new MeterReading({

nozzle,
shift,
opening,
closing,
fuelSold,
date

})

await data.save()

res.json(data)

}catch(err){

res.status(500).json({error:err.message})

}

}


// DELETE

exports.deleteMeterReading = async(req,res)=>{

try{

await MeterReading.findByIdAndDelete(req.params.id)

res.json({message:"deleted"})

}catch(err){

res.status(500).json({error:err.message})

}

}


// UPDATE

exports.updateMeterReading = async(req,res)=>{

try{

const {opening,closing,nozzle,shift,date} = req.body

const fuelSold = closing - opening

await MeterReading.findByIdAndUpdate(

req.params.id,

{
nozzle,
shift,
opening,
closing,
fuelSold,
date
}

)

res.json({message:"updated"})

}catch(err){

res.status(500).json({error:err.message})

}

}