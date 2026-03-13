const mongoose = require("mongoose")

const mobileDispenserSchema = new mongoose.Schema({

date:{
type:Date,
required:true
},

stockAdd:{type:Number , default : 0},

startNozzle:{
type:Number,
required:true
},

endNozzle:{
type:Number,
required:true
},

saleLiter:{
type:Number,
default:0
},

startKM:{
type:Number,
required:true
},

endKM:{
type:Number,
required:true
},

totalKM:{
type:Number,
default:0
},

profit:{
type:Number,
default:0
},

dieselCost:{
type:Number,
default:0
},

finalProfit:{
type:Number,
default:0
}

},{timestamps:true})

module.exports =
mongoose.model("MobileDispenser",mobileDispenserSchema)