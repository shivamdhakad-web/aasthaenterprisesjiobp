const Employee = require("../models/Employee")

const normalizeEmployeePayload = (payload = {}) => ({
  ...payload,
  name: payload.name?.trim?.() || payload.name,
  phone: payload.phone?.trim?.() || payload.phone,
  role: payload.role?.trim?.() || payload.role,
  shift: payload.shift?.trim?.() || payload.shift,
  tshirt: payload.tshirt?.trim?.() || payload.tshirt,
  pant: payload.pant?.trim?.() || payload.pant,
  shoes: payload.shoes?.trim?.() || payload.shoes,
  loginPassword: payload.loginPassword?.trim?.() || payload.loginPassword,
  lastEditedBy: payload.lastEditedBy?.trim?.() || payload.lastEditedBy,
  lastEditedByRole: payload.lastEditedByRole?.trim?.() || payload.lastEditedByRole,
})

exports.getEmployees = async(req,res)=>{
try{

const employees = await Employee.find().sort({createdAt:-1})

res.json(employees)

}catch(err){
res.status(500).json({error:err.message})
}
}

exports.addEmployee = async(req,res)=>{
try{

const payload = normalizeEmployeePayload(req.body)

delete payload.lastEditedAt
delete payload.lastEditedBy
delete payload.lastEditedByRole

if(!payload.loginPassword){
return res.status(400).json({error:"Employee login password is required"})
}

const emp = new Employee(payload)

await emp.save()

res.json({success:true,data:emp})

}catch(err){
res.status(500).json({error:err.message})
}
}

exports.updateEmployee = async(req,res)=>{
try{

const {id}=req.params

const payload = normalizeEmployeePayload(req.body)

payload.lastEditedAt = payload.lastEditedAt || new Date()

const emp = await Employee.findByIdAndUpdate(id,payload,{new:true})

res.json(emp)

}catch(err){
res.status(500).json({error:err.message})
}
}

exports.deleteEmployee = async(req,res)=>{
try{

const {id}=req.params

await Employee.findByIdAndDelete(id)

res.json({success:true})

}catch(err){
res.status(500).json({error:err.message})
}
}
