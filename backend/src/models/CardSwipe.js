const mongoose = require("mongoose")

const cardSwipeSchema = new mongoose.Schema({

date:{
type:Date,
required:true
},

time:{
type:String,
default:""
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
required:true
},

paymentMethod:{
type:String,
required:true
},

remark:{
type:String
}

,

lastEditedAt:{
type:Date,
default:null
}

,

lastEditedBy:{
type:String,
default:""
}

,

lastEditedByRole:{
type:String,
default:""
}

},{timestamps:true})

module.exports = mongoose.model("CardSwipe",cardSwipeSchema)
