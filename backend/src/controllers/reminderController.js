const Reminder = require("../models/Reminder")

// GET reminders

exports.getReminders = async(req,res)=>{

try{

const data = await Reminder.find().sort({createdAt:-1})

res.json(data)

}catch(err){

res.status(500).json({error:err.message})

}

}


// ADD reminder

exports.addReminder = async(req,res)=>{

try{

const reminder = new Reminder(req.body)

await reminder.save()

res.json(reminder)

}catch(err){

res.status(500).json({error:err.message})

}

}


// DELETE reminder

exports.deleteReminder = async(req,res)=>{

try{

await Reminder.findByIdAndDelete(req.params.id)

res.json({message:"deleted"})

}catch(err){

res.status(500).json({error:err.message})

}

}


// COMPLETE reminder

exports.completeReminder = async(req,res)=>{

try{

await Reminder.findByIdAndUpdate(
req.params.id,
{completed:true}
)

res.json({message:"completed"})

}catch(err){

res.status(500).json({error:err.message})

}

}