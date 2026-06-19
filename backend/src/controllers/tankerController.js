const TankerDelivery = require("../models/TankerDelivery")

const numberValue = (value) => Number(value || 0)

const buildDeliveryPayload = (payload = {}, audit = {}) => {
  const qty = numberValue(payload.qty ?? payload.quantity)
  const unloadedQty = numberValue(payload.unloadedQty)

  return {
    ...payload,
    date: payload.date,
    truckNo: payload.truckNo || "",
    transportName: payload.transportName || payload.supplier || "",
    driverName: payload.driverName || "",
    number: payload.number || "",
    product: payload.product || payload.fuel || "",
    qty,
    quantity: qty,
    initialStock: numberValue(payload.initialStock),
    initialTemp: numberValue(payload.initialTemp),
    finalStock: numberValue(payload.finalStock),
    finalTemp: numberValue(payload.finalTemp),
    fuelSales: numberValue(payload.fuelSales),
    unloadedQty,
    lossGain: qty - unloadedQty,
    supplier: payload.supplier || payload.transportName || "",
    fuel: payload.fuel || payload.product || "",
    invoice: payload.invoice || payload.truckNo || "",
    ...audit,
  }
}

exports.getDeliveries = async(req,res)=>{

const data = await TankerDelivery.find().sort({date:-1})

res.json(data)

}

exports.addDelivery = async(req,res)=>{

const delivery = new TankerDelivery(buildDeliveryPayload(req.body))

await delivery.save()

res.json(delivery)

}

exports.updateDelivery = async(req,res)=>{

const updated = await TankerDelivery.findByIdAndUpdate(
req.params.id,
buildDeliveryPayload(req.body, {
lastEditedAt: new Date(),
lastEditedBy: req.body.lastEditedBy || "Admin",
lastEditedByRole: req.body.lastEditedByRole || "Admin",
}),
{new:true}
)

res.json(updated)

}

exports.deleteDelivery = async(req,res)=>{

await TankerDelivery.findByIdAndDelete(req.params.id)

res.json({message:"Deleted"})

}
