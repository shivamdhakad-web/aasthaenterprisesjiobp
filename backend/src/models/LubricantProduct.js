const mongoose = require("mongoose")

const schema = new mongoose.Schema({

 name:String,

 price:Number,

 costPrice:{
  type:Number,
  default:0
 },

 stock:{
  type:Number,
  default:0
 },

 addedDate:{
  type:String,
  default:""
 },

 createdByName:{
  type:String,
  default:""
 },

 createdByRole:{
  type:String,
  default:""
 },

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
 },

 lastStockAddedAt:{
  type:Date,
  default:null
 },

 lastStockAddedBy:{
  type:String,
  default:""
 },

 lastStockAddedByRole:{
  type:String,
  default:""
 },

 stockHistory:[{
  quantity:{
   type:Number,
   default:0
  },
  addedAt:{
   type:Date,
   default:Date.now
  },
  addedBy:{
   type:String,
   default:""
  },
  addedByRole:{
   type:String,
   default:""
  }
 }]

},{timestamps:true})

module.exports = mongoose.model(
 "LubricantProduct",
 schema
)
