const CardSwipe = require("../models/CardSwipe")


// GET ENTRIES (FILTER SUPPORT)
exports.getEntries = async (req, res) => {
  try {

    const { startDate, endDate, machine, paymentMethod } = req.query;

    let filter = {};

    // DATE + TIME RANGE
    if (startDate || endDate) {

      const start = new Date(startDate);
      const end = new Date(endDate);

      filter.date = {
        $gte: new Date(start.setHours(0,0,0,0)),
        $lte: new Date(end.setHours(23,59,59,999))
      };
    }

    if (machine && machine !== "Both Machine") {
      filter.machine = machine;
    }

    if (paymentMethod && paymentMethod !== "Both Payment") {
      filter.paymentMethod = paymentMethod;
    }

    const data = await CardSwipe.find(filter).sort({ date: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADD ENTRY
exports.addEntry = async(req,res)=>{
try{

const entry = new CardSwipe({

date:req.body.date,
time:req.body.time,
amount:req.body.amount,
charges:req.body.charges,
txnDetails:req.body.txnDetails,
machine:req.body.machine,
paymentMethod:req.body.paymentMethod,
remark:req.body.remark

})

await entry.save()

res.json(entry)

}catch(err){

res.status(500).json({error:err.message})

}
}



// UPDATE ENTRY
exports.updateEntry = async(req,res)=>{
try{

const {id} = req.params

const updated = await CardSwipe.findByIdAndUpdate(
id,
req.body,
{new:true}
)

res.json(updated)

}catch(err){

res.status(500).json({error:err.message})

}
}



// DELETE ENTRY
exports.deleteEntry = async(req,res)=>{
try{

const {id} = req.params

await CardSwipe.findByIdAndDelete(id)

res.json({success:true})

}catch(err){

res.status(500).json({error:err.message})

}
}



// DELETE MONTH
exports.deleteMonth = async(req,res)=>{
try{

const {year,month} = req.params

const start = new Date(year,month-1,1)

const end = new Date(year,month,1)

await CardSwipe.deleteMany({

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