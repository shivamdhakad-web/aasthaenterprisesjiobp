const Attendance = require("../models/EmployeeAttendance")

const getDateRange = (value) => {
const start = new Date(value)
if (Number.isNaN(start.getTime())) {
return null
}

start.setUTCHours(0,0,0,0)
const end = new Date(start)
end.setUTCDate(end.getUTCDate()+1)
return {start,end}
}

const findDuplicateAttendance = async({employeeId,date,excludeId})=>{
const range = getDateRange(date)
if (!employeeId || !range) {
return null
}

const query = {
employeeId,
status:{$ne:"bonus"},
date:{
$gte:range.start,
$lt:range.end
}
}

if (excludeId) {
query._id = {$ne:excludeId}
}

return Attendance.findOne(query)
}

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
const status = req.body.status || "present"

if(status !== "bonus"){
const duplicate = await findDuplicateAttendance({employeeId,date:req.body.date})
if(duplicate){
return res.status(409).json({message:"Attendance entry already exists for this employee on this date."})
}
}

const record = new Attendance({

employeeId,

date:req.body.date,

status,

shortage:Number(req.body.shortage || 0),

advanceCash:Number(req.body.advanceCash || 0),

advancePetrol:Number(req.body.advancePetrol || 0),

bonusAmount:Number(req.body.bonusAmount || 0),

remark:req.body.remark

,

createdByRole:req.body.createdByRole || "Admin"

,

createdByEmployeeId:req.body.createdByEmployeeId

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
const existing = await Attendance.findById(id)

if(!existing){
return res.status(404).json({message:"Attendance entry not found"})
}

const status = req.body.status || existing.status || "present"

if(status !== "bonus"){
const duplicate = await findDuplicateAttendance({
employeeId:existing.employeeId,
date:req.body.date,
excludeId:id
})

if(duplicate){
return res.status(409).json({message:"Attendance entry already exists for this employee on this date."})
}
}

const data = await Attendance.findByIdAndUpdate(

id,

{
date:req.body.date,
status,
shortage:Number(req.body.shortage || 0),
advanceCash:Number(req.body.advanceCash || 0),
advancePetrol:Number(req.body.advancePetrol || 0),
bonusAmount:Number(req.body.bonusAmount || 0),
remark:req.body.remark

,

lastEditedAt:req.body.lastEditedAt || new Date()

,

lastEditedBy:req.body.lastEditedBy || ""

,

lastEditedByRole:req.body.lastEditedByRole || ""
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
