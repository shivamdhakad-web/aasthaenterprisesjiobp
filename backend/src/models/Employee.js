const mongoose = require("mongoose")

const employeeSchema = new mongoose.Schema({

name:{type:String,required:true},

phone:{type:String},

role:{type:String},

shift:{type:String},

salary:{type:Number,default:0},

tshirt:{type:String},

pant:{type:String},

shoes:{type:String},

status:{type:String,default:"Active"}

},{timestamps:true})

module.exports = mongoose.model("Employee",employeeSchema)