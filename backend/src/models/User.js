const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({

name:String,

email:String,

number:String,

role:{
type:String,
enum:["Admin","Manager","Operator"],
default:"Operator"
},

status:{
type:String,
default:"Active"
}

})

module.exports = mongoose.model("User",UserSchema)