const mongoose = require("mongoose")

const schema = new mongoose.Schema({

 date:String,

 product:String,

 price:Number,

 quantity:Number,

 total:Number,

 soldBy:String

})

module.exports = mongoose.model(
 "LubricantSale",
 schema
)