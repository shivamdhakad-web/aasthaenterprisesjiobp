const Settings = require("../models/Settings")
const FuelHistory = require("../models/FuelPriceHistory")

exports.getFuelPrices = async(req,res)=>{

const data = await Settings.findOne()

res.json(data?.fuelPrices)

}

exports.updateFuelPrices = async(req,res)=>{

const data = await Settings.findOneAndUpdate(
{},
{fuelPrices:req.body},
{new:true,upsert:true}
)

res.json(data)

}

exports.getFuelHistory = async(req,res)=>{

const data = await FuelHistory.find().sort({date:-1})

res.json(data)

}

exports.addFuelHistory = async(req,res)=>{

const history = new FuelHistory(req.body)

await history.save()

res.json(history)

}

exports.deleteFuelHistory = async(req,res)=>{

await FuelHistory.findByIdAndDelete(req.params.id)

res.json({message:"deleted"})

}