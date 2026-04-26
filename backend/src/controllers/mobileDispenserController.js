const Entry = require("../models/MobileDispenser")
const Settings = require("../models/MobileDispenserSettings")

const buildEntryMetrics = (settings, payload) => {
const stockAdd = Number(payload.stockAdd || 0)
const startNozzle = Number(payload.startNozzle || 0)
const endNozzle = Number(payload.endNozzle || 0)

const startKM = Number(payload.startKM || 0)
const endKM = Number(payload.endKM || 0)

const saleLiter = endNozzle - startNozzle
const totalKM = endKM - startKM
const profit = saleLiter * Number(settings.margin || 0)
const dieselCost = totalKM * Number(settings.dieselPerKM || 0)
const finalProfit = profit - dieselCost

return {
date:payload.date,
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
}
}



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

const entryPayload = buildEntryMetrics(settings, req.body)

const entry = new Entry(entryPayload)

await entry.save()


// update stock
if(settings){

settings.currentStock =
Number(settings.currentStock || 0) + Number(entryPayload.stockAdd || 0) - Number(entryPayload.saleLiter || 0)

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
const existing = await Entry.findById(req.params.id)

if(!existing){
return res.status(404).json({error:"Entry not found"})
}

const entryPayload = buildEntryMetrics(settings, req.body)


const data = await Entry.findByIdAndUpdate(

req.params.id,

entryPayload,

{new:true}

)

if(settings){
settings.currentStock =
Number(settings.currentStock || 0) - Number(existing.stockAdd || 0) + Number(existing.saleLiter || 0) + Number(entryPayload.stockAdd || 0) - Number(entryPayload.saleLiter || 0)

await settings.save()
}

res.json(data)

}catch(err){
res.status(500).json({error:err.message})
}
}



// DELETE ENTRY
exports.deleteEntry = async(req,res)=>{
try{

const existing = await Entry.findById(req.params.id)

await Entry.findByIdAndDelete(req.params.id)

if(existing){
const settings = await Settings.findOne()

if(settings){
settings.currentStock =
Number(settings.currentStock || 0) - Number(existing.stockAdd || 0) + Number(existing.saleLiter || 0)
await settings.save()
}
}

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

const entries = await Entry.find({

date:{
$gte:start,
$lt:end
}

})

await Entry.deleteMany({

date:{
$gte:start,
$lt:end
}

})

const settings = await Settings.findOne()

if(settings){
for(const entry of entries){
settings.currentStock =
Number(settings.currentStock || 0) - Number(entry.stockAdd || 0) + Number(entry.saleLiter || 0)
}

await settings.save()
}

res.json({success:true})

}catch(err){
res.status(500).json({error:err.message})
}
}
