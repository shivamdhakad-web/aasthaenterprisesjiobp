const mongoose = require("mongoose")

const secureNoteSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

username:String,

password:String,

website:String,

note:String,

color:{
type:String,
default:"yellow"
},

folder:String,

favorite:{
type:Boolean,
default:false
}

},{
timestamps:true
})

module.exports = mongoose.model("SecureNote",secureNoteSchema)