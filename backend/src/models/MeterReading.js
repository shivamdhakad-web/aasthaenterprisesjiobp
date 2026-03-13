const mongoose = require("mongoose")

const meterReadingSchema = new mongoose.Schema({

nozzle:{
type:String,
required:true
},

shift:{
type:String,
required:true
},

opening:{
type:Number,
required:true
},

closing:{
type:Number,
required:true
},

fuelSold:{
type:Number
},

date:{
type:String
}

})

module.exports = mongoose.model("MeterReading",meterReadingSchema)