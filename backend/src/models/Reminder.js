const mongoose = require("mongoose")

const reminderSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

description:{
type:String
},

dateTime:{
type:String,
required:true
},

completed:{
type:Boolean,
default:false
},

createdAt:{
type:Date,
default:Date.now
}

})

module.exports = mongoose.model("Reminder",reminderSchema)