const mongoose = require("mongoose")

const TTDriverSchema = new mongoose.Schema({

  name:{
    type:String,
    required:true
  },

  number:{
    type:String,
    required:true
  },

  ttNumber:{
    type:String,
    required:true
  },

  transportName:{
    type:String
  },

  short:{
    type:String
  },

  remark:{
    type:String
  }

},{timestamps:true})

module.exports = mongoose.model("TTDriver",TTDriverSchema)