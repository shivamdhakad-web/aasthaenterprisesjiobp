const Attendance = require("../models/EmployeeAttendance")

// GET ATTENDANCE
exports.getAttendance = async(req,res)=>{
try{

const {employeeId}=req.params

const data = await Attendance
.find({employeeId})
.sort({date:1})

res.json(data)

}catch(err){
res.status(500).json({error:err.message})
}
}



// ADD ATTENDANCE
exports.addAttendance = async(req,res)=>{
try{

const {employeeId}=req.params

const record = new Attendance({

employeeId,

date:req.body.date,

status:req.body.status,

shortage:Number(req.body.shortage || 0),

advanceCash:Number(req.body.advanceCash || 0),

advancePetrol:Number(req.body.advancePetrol || 0),

remark:req.body.remark

})

await record.save()

res.json(record)

}catch(err){
res.status(500).json({error:err.message})
}
}



// UPDATE ATTENDANCE
exports.updateAttendance = async(req,res)=>{
try{

const {id}=req.params

const data = await Attendance.findByIdAndUpdate(

id,

{
date:req.body.date,
status:req.body.status,
shortage:Number(req.body.shortage || 0),
advanceCash:Number(req.body.advanceCash || 0),
advancePetrol:Number(req.body.advancePetrol || 0),
remark:req.body.remark
},

{new:true}

)

res.json(data)

}catch(err){
res.status(500).json({error:err.message})
}
}



// DELETE ATTENDANCE
exports.deleteAttendance = async(req,res)=>{
try{

const {id}=req.params

await Attendance.findByIdAndDelete(id)

res.json({success:true})

}catch(err){
res.status(500).json({error:err.message})
}
}



// DELETE MONTH ATTENDANCE
exports.deleteMonth = async(req,res)=>{
try{

const {employeeId,year,month}=req.params

const start = new Date(year,month-1,1)

const end = new Date(year,month,1)

await Attendance.deleteMany({

employeeId,

date:{
$gte:start,
$lt:end
}

})

res.json({success:true})

}catch(err){
res.status(500).json({error:err.message})
}
}