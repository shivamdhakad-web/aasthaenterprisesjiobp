const Attendance = require("../models/EmployeeAttendance")
const Employee = require("../models/Employee")

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

const getOutstandingAdvance = async(employeeId, excludeId)=>{
const query = {employeeId}
if (excludeId) query._id = {$ne:excludeId}
const entries = await Attendance.find(query).select("advanceCash advancePetrol advanceRepayment")
return entries.reduce((total, entry)=> total + Number(entry.advanceCash || 0) + Number(entry.advancePetrol || 0) - Number(entry.advanceRepayment || 0), 0)
}

const validateAdvanceRepayment = async({employeeId, advanceCash, advancePetrol, advanceRepayment, excludeId})=>{
if (![advanceCash, advancePetrol, advanceRepayment].every(Number.isFinite) || advanceCash < 0 || advancePetrol < 0 || advanceRepayment < 0){
return {valid:false, available:0}
}
const available = Math.max(0, await getOutstandingAdvance(employeeId, excludeId)) + advanceCash + advancePetrol
return {valid:advanceRepayment <= available, available}
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
const employee = await Employee.findById(employeeId)
if(!employee){
return res.status(404).json({message:"Employee not found"})
}
if(String(employee.status || "Active").toLowerCase() === "not active"){
return res.status(400).json({message:"Attendance and bonus entries can only be added for active employees."})
}

const status = req.body.status || "present"
const advanceCash = Number(req.body.advanceCash || 0)
const advancePetrol = Number(req.body.advancePetrol || 0)
const advanceRepayment = Number(req.body.advanceRepayment || 0)
const repaymentCheck = await validateAdvanceRepayment({employeeId, advanceCash, advancePetrol, advanceRepayment})
if (!repaymentCheck.valid){
return res.status(400).json({message:`Advance repayment cannot exceed the outstanding advance of Rs. ${Math.max(0, repaymentCheck.available).toLocaleString("en-IN")}.`})
}

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

advanceCash,

advancePetrol,

advanceRepayment,

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
const advanceCash = Number(req.body.advanceCash || 0)
const advancePetrol = Number(req.body.advancePetrol || 0)
const advanceRepayment = Number(req.body.advanceRepayment || 0)
const repaymentCheck = await validateAdvanceRepayment({employeeId:existing.employeeId, advanceCash, advancePetrol, advanceRepayment, excludeId:id})
if (!repaymentCheck.valid){
return res.status(400).json({message:`Advance repayment cannot exceed the outstanding advance of Rs. ${Math.max(0, repaymentCheck.available).toLocaleString("en-IN")}.`})
}

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
advanceCash,
advancePetrol,
advanceRepayment,
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
