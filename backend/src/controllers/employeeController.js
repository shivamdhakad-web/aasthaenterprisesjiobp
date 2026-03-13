const Employee = require("../models/Employee")

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

const emp = new Employee(req.body)

await emp.save()

res.json({success:true,data:emp})

}catch(err){
res.status(500).json({error:err.message})
}
}

exports.updateEmployee = async(req,res)=>{
try{

const {id}=req.params

const emp = await Employee.findByIdAndUpdate(id,req.body,{new:true})

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