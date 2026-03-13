const Expense = require("../models/Expense")

exports.getExpenses = async(req,res)=>{

try{

const data = await Expense.find().sort({createdAt:-1})

res.json(data)

}catch(err){

res.status(500).json({error:err.message})

}

}





exports.addExpense = async(req,res)=>{

try{

const expense = new Expense(req.body)

await expense.save()

res.json(expense)

}catch(err){

res.status(500).json({error:err.message})

}

}



exports.deleteExpense = async(req,res)=>{

try{

await Expense.findByIdAndDelete(req.params.id)

res.json({message:"Deleted"})

}catch(err){

res.status(500).json({error:err.message})

}

}


exports.updateExpense = async(req,res)=>{

try{

const updated = await Expense.findByIdAndUpdate(
req.params.id,
req.body,
{new:true}
)

res.json(updated)

}catch(err){

res.status(500).json({error:err.message})

}

}