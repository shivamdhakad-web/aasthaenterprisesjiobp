//setting
const User = require("../models/User")

exports.getUsers = async(req,res)=>{

const data = await User.find()

res.json(data)

}

exports.addUser = async(req,res)=>{

const user = new User(req.body)

await user.save()

res.json(user)

}

exports.updateUser = async(req,res)=>{

const data = await User.findByIdAndUpdate(
req.params.id,
req.body,
{new:true}
)

res.json(data)

}

exports.deleteUser = async(req,res)=>{

await User.findByIdAndDelete(req.params.id)

res.json({message:"deleted"})

}