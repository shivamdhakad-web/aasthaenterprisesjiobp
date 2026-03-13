const Tank = require("../models/Tank")



/* GET TANK LEVELS */

exports.getTank = async (req, res) => {

 try {

  const tanks = await Tank.find()

  const petrol = tanks.find(t => t.fuelType === "petrol")
  const diesel = tanks.find(t => t.fuelType === "diesel")

  if (!petrol || !diesel) {
   return res.status(404).json({
    message: "Tank data not found"
   })
  }

  const petrolPercent =
   ((petrol.currentStock / petrol.capacity) * 100).toFixed(0)

  const dieselPercent =
   ((diesel.currentStock / diesel.capacity) * 100).toFixed(0)

  const avg =
   Math.round((Number(petrolPercent) + Number(dieselPercent)) / 2)

  res.json({

   tankLevel: avg,

   petrol: petrolPercent,

   diesel: dieselPercent,

   tanks

  })

 } catch (err) {

  res.status(500).json({
   message: err.message
  })

 }

}



/* UPDATE TANK STOCK */

exports.updateTank = async (req, res) => {

 try {

  const { currentStock } = req.body

  const tank = await Tank.findById(req.params.id)

  if (!tank) {
   return res.status(404).json({
    message: "Tank not found"
   })
  }

  tank.currentStock = currentStock

  await tank.save()

  res.json(tank)

 } catch (err) {

  res.status(500).json({
   message: err.message
  })

 }

}