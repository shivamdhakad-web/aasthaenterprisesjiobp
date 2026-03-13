const Entry = require("../models/MobileDispenser")
const Settings = require("../models/MobileDispenserSettings")



// GET SETTINGS
exports.getSettings = async(req,res)=>{
try{

let data = await Settings.findOne()

if(!data){

data = await Settings.create({})

}

res.json(data)

}catch(err){
res.status(500).json({error:err.message})
}
}



// UPDATE SETTINGS
exports.updateSettings = async(req,res)=>{
try{

let data = await Settings.findOne()

if(!data){

data = new Settings(req.body)

}else{

Object.assign(data,req.body)

}

await data.save()

res.json(data)

}catch(err){
res.status(500).json({error:err.message})
}
}



// GET ENTRIES
exports.getEntries = async(req,res)=>{
try{

const data = await Entry.find().sort({date:-1})

res.json(data)

}catch(err){
res.status(500).json({error:err.message})
}
}



// ADD ENTRY
exports.addEntry = async(req,res)=>{
try{

const settings = await Settings.findOne()

const margin = settings.margin
const dieselPerKM = settings.dieselPerKM

const stockAdd = req.body.stockAdd
const startNozzle = Number(req.body.startNozzle)
const endNozzle = Number(req.body.endNozzle)

const startKM = Number(req.body.startKM)
const endKM = Number(req.body.endKM)

const saleLiter = endNozzle - startNozzle

const totalKM = endKM - startKM

const profit = saleLiter * margin

const dieselCost = totalKM * dieselPerKM

const finalProfit = profit - dieselCost


const entry = new Entry({

date:req.body.date,
stockAdd,
startNozzle,
endNozzle,

saleLiter,

startKM,
endKM,

totalKM,

profit,
dieselCost,

finalProfit

})

await entry.save()


// update stock
if(settings){

settings.currentStock =
settings.currentStock - saleLiter

await settings.save()

}

res.json(entry)

}catch(err){
res.status(500).json({error:err.message})
}
}



// UPDATE ENTRY
exports.updateEntry = async(req,res)=>{
try{

const settings = await Settings.findOne()

const margin = settings.margin
const dieselPerKM = settings.dieselPerKM

const startNozzle = Number(req.body.startNozzle)
const endNozzle = Number(req.body.endNozzle)

const startKM = Number(req.body.startKM)
const endKM = Number(req.body.endKM)

const saleLiter = endNozzle - startNozzle

const totalKM = endKM - startKM

const profit = saleLiter * margin

const dieselCost = totalKM * dieselPerKM

const finalProfit = profit - dieselCost


const data = await Entry.findByIdAndUpdate(

req.params.id,

{

date:req.body.date,

startNozzle,
endNozzle,

saleLiter,

startKM,
endKM,

totalKM,

profit,
dieselCost,

finalProfit

},

{new:true}

)

res.json(data)

}catch(err){
res.status(500).json({error:err.message})
}
}



// DELETE ENTRY
exports.deleteEntry = async(req,res)=>{
try{

await Entry.findByIdAndDelete(req.params.id)

res.json({success:true})

}catch(err){
res.status(500).json({error:err.message})
}
}



// DELETE MONTH
exports.deleteMonth = async(req,res)=>{
try{

const {year,month}=req.params

const start = new Date(year,month-1,1)

const end = new Date(year,month,1)

await Entry.deleteMany({

date:{
$gte:start,
$lt:end
}

})

res.json({success:true})

}catch(err){
res.status(500).json({error:err.message})
}
}