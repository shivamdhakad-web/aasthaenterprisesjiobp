const TankerDelivery = require("../models/TankerDelivery")

exports.getDeliveries = async(req,res)=>{

const data = await TankerDelivery.find().sort({date:-1})

res.json(data)

}

exports.addDelivery = async(req,res)=>{

const delivery = new TankerDelivery(req.body)

await delivery.save()

res.json(delivery)

}

exports.updateDelivery = async(req,res)=>{

const updated = await TankerDelivery.findByIdAndUpdate(
req.params.id,
req.body,
{new:true}
)

res.json(updated)

}

exports.deleteDelivery = async(req,res)=>{

await TankerDelivery.findByIdAndDelete(req.params.id)

res.json({message:"Deleted"})

}