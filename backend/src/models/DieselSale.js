const mongoose = require("mongoose")

const dieselSaleSchema = new mongoose.Schema({

  date:{
    type:String,
    required:true
  },

  liters:{
    type:Number,
    required:true
  },

  price:{
    type:Number,
    required:true
  },

  totalAmount:{
    type:Number
  },

  description:{
    type:String
  }

},{timestamps:true})

module.exports = mongoose.model("DieselSale",dieselSaleSchema)