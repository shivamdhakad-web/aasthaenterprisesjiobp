const mongoose = require("mongoose")

const FuelPriceHistorySchema = new mongoose.Schema({

date:String,

petrol:Number,

diesel:Number,

updatedBy:String

})

module.exports = mongoose.model(
"FuelPriceHistory",
FuelPriceHistorySchema
)