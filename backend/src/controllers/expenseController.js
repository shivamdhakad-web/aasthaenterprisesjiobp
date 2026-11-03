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

const expense = new Expense({
 ...req.body,
 amount:Number(req.body.amount || 0)
})

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

exports.deleteExpenseMonth = async(req,res)=>{
try{
const year = Number(req.params.year)
const month = Number(req.params.month)
if (!Number.isInteger(year) || year < 2000 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12){
return res.status(400).json({message:"A valid year and month are required."})
}
const monthKey = `${year}-${String(month).padStart(2,"0")}`
const nextMonth = new Date(Date.UTC(year,month,1)).toISOString().slice(0,10)
const result = await Expense.deleteMany({date:{$gte:`${monthKey}-01`,$lt:nextMonth}})
res.json({success:true,deletedCount:result.deletedCount})
}catch(err){
res.status(500).json({error:err.message})
}
}


exports.updateExpense = async(req,res)=>{

try{

const updated = await Expense.findByIdAndUpdate(
req.params.id,
{
 ...req.body,
 amount:Number(req.body.amount || 0),
 lastEditedAt:req.body.lastEditedAt || new Date(),
 lastEditedBy:req.body.lastEditedBy || "",
 lastEditedByRole:req.body.lastEditedByRole || ""
},
{new:true}
)

res.json(updated)

}catch(err){

res.status(500).json({error:err.message})

}

}
