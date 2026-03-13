const mongoose = require("mongoose")

const settingsSchema = new mongoose.Schema({

openingStock:{
type:Number,
default:0
},

currentStock:{
type:Number,
default:0
},

margin:{
type:Number,
default:0
},

dieselPerKM:{
type:Number,
default:0
}

},{timestamps:true})

module.exports =
mongoose.model("MobileDispenserSettings",settingsSchema)