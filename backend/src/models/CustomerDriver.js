const mongoose = require("mongoose")

const CustomerDriverSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

number:{
type:String,
required:true
},

gadiNumber:{
type:String,
required:true
},

transportName:{
type:String
},

route:{
type:String
},

carrierId:{
type:String
},

remark:{
type:String
}

},{timestamps:true})


module.exports = mongoose.model("CustomerDriver",CustomerDriverSchema)