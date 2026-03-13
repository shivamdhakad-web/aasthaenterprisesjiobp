const mongoose = require("mongoose")

const schema = new mongoose.Schema({

 name:String,

 price:Number,

 stock:{
  type:Number,
  default:0
 }

})

module.exports = mongoose.model(
 "LubricantProduct",
 schema
)