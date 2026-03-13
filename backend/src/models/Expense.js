const mongoose = require("mongoose")

const ExpenseSchema = new mongoose.Schema({

date:{
type:String,
required:true
},

category:{
type:String,
required:true
},

description:{
type:String
},

amount:{
type:Number,
required:true
},

paymentMode:{
type:String,
default:"Cash"
},

addedBy:{
type:String
}

},{
timestamps:true
})

module.exports = mongoose.model("Expense",ExpenseSchema)