const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({

    customerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Customer",
        required:true
    },

    type:{
        type:String,
        enum:["fuel","payment"],
        required:true
    },

    fuelType:String,

    liters:Number,

    rate:Number,

    amount:{
        type:Number,
        default:0
    },

    payment:{
        type:Number,
        default:0
    },

    balance:{
        type:Number,
        default:0
    },

    date:{
        type:Date,
        default:Date.now
    }

},{timestamps:true});

module.exports = mongoose.model("CustomerTransaction",transactionSchema);