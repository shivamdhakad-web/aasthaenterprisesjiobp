const mongoose = require("mongoose")

const schema = new mongoose.Schema({

 date:String,

 product:String,

 price:Number,

 quantity:Number,

 total:Number,

 unitProfit:{
  type:Number,
  default:0
 },

 totalProfit:{
  type:Number,
  default:0
 },

 soldBy:String,

 createdByRole:{
  type:String,
  default:"Admin"
 },

 createdByEmployeeId:String,

 createdByName:String

,

 lastEditedAt:{
  type:Date,
  default:null
 },

 lastEditedBy:{
  type:String,
  default:""
 },

 lastEditedByRole:{
  type:String,
  default:""
 }

},{timestamps:true})

module.exports = mongoose.model(
 "LubricantSale",
 schema
)
