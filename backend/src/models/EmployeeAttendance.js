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
enum:["present","present_half","absent","double","half","bonus"],
default:"present"
},

shortage:{type:Number,default:0},

advanceCash:{type:Number,default:0},

advancePetrol:{type:Number,default:0},

bonusAmount:{type:Number,default:0},

remark:{type:String},

leaveRequestId:{
type:mongoose.Schema.Types.ObjectId,
ref:"EmployeeLeave"
},

createdByRole:{
type:String,
default:"Admin"
},

createdByEmployeeId:{
type:String
}

,

lastEditedAt:{type:Date,default:null}

,

lastEditedBy:{type:String,default:""}

,

lastEditedByRole:{type:String,default:""}

},{timestamps:true})

module.exports = mongoose.model("EmployeeAttendance",attendanceSchema)


