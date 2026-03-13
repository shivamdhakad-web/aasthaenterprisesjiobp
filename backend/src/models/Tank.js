const mongoose = require("mongoose")

const tankSchema = new mongoose.Schema({

 fuelType:{
  type:String,
  required:true
 },

 capacity:{
  type:Number,
  required:true
 },

 currentStock:{
  type:Number,
  required:true
 }

},{timestamps:true})

module.exports = mongoose.model("Tank",tankSchema)