const mongoose = require("mongoose")

const attendanceSchema = new mongoose.Schema({

employeeId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Employee",
required:true
},

date:{type:Date,required:true},

status:{
type:String,
enum:["present","absent","double"],
default:"present"
},

shortage:{type:Number,default:0},

advanceCash:{type:Number,default:0},

advancePetrol:{type:Number,default:0},

remark:{type:String}

},{timestamps:true})

module.exports = mongoose.model("EmployeeAttendance",attendanceSchema)