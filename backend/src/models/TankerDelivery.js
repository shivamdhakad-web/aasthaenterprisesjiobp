const mongoose = require("mongoose")

const tankerSchema = new mongoose.Schema({

supplier:{
type:String,
required:true
},

fuel:{
type:String,
required:true
},

quantity:{
type:Number,
required:true
},

density:{
type:Number
},

date:{
type:String
},

invoice:{
type:String
}

})

module.exports = mongoose.model("TankerDelivery",tankerSchema)