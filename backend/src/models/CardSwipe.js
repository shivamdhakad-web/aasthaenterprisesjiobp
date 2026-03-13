const mongoose = require("mongoose")

const cardSwipeSchema = new mongoose.Schema({

date:{
type:Date,
required:true
},

time:{
type:String,
required:true
},

amount:{
type:Number,
required:true
},

charges:{
type:Number,
default:0
},

txnDetails:{
type:String
},

machine:{
type:String,
enum:["Self","DSM"],
required:true
},

paymentMethod:{
type:String,
enum:["Cash","Online"],
required:true
},

remark:{
type:String
}

},{timestamps:true})

module.exports = mongoose.model("CardSwipe",cardSwipeSchema)