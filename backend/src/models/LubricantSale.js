const mongoose = require("mongoose")

const schema = new mongoose.Schema({

 date:String,

 product:String,

 price:Number,

 quantity:Number,

 total:Number,

 soldBy:String,

 createdByRole:{
  type:String,
  default:"Admin"
 },

 createdByEmployeeId:String,

 createdByName:String

},{timestamps:true})

module.exports = mongoose.model(
 "LubricantSale",
 schema
)
