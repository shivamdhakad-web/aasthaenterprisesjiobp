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
},

employeeId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Employee"
},

employeeName:{
type:String
},

createdByRole:{
type:String,
enum:["Admin","Manager","Employee"],
default:"Admin"
},

expenseSource:{
type:String,
enum:["station","employee"],
default:"station"
}

},{
timestamps:true
})

module.exports = mongoose.model("Expense",ExpenseSchema)
