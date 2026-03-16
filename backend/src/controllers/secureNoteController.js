const SecureNote = require("../models/SecureNote")

// GET NOTES

exports.getNotes = async(req,res)=>{

try{

const notes = await SecureNote.find().sort({createdAt:-1})

res.json(notes)

}catch(err){

res.status(500).json({error:err.message})

}

}


// ADD NOTE

exports.addNote = async(req,res)=>{

try{

const note = new SecureNote(req.body)

await note.save()

res.json(note)

}catch(err){

res.status(500).json({error:err.message})

}

}


// UPDATE NOTE

exports.updateNote = async(req,res)=>{

try{

const note = await SecureNote.findByIdAndUpdate(
req.params.id,
req.body,
{new:true}
)

res.json(note)

}catch(err){

res.status(500).json({error:err.message})

}

}


// DELETE NOTE

exports.deleteNote = async(req,res)=>{

try{

await SecureNote.findByIdAndDelete(req.params.id)

res.json({message:"Note Deleted"})

}catch(err){

res.status(500).json({error:err.message})

}

}