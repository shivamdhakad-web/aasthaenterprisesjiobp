const PetrolSale = require("../models/PetrolSale")
const DieselSale = require("../models/DieselSale")

exports.getFuelRevenueChart = async (req,res)=>{

try{

// petrol aggregation

const petrol = await PetrolSale.aggregate([

{
$addFields:{
dateObj:{ $toDate:"$date" }
}
},

{
$group:{
_id:{ $dateToString:{ format:"%Y-%m-%d", date:"$dateObj" }},
petrol:{ $sum:"$totalAmount" }
}
}

])

// diesel aggregation

const diesel = await DieselSale.aggregate([

{
$addFields:{
dateObj:{ $toDate:"$date" }
}
},

{
$group:{
_id:{ $dateToString:{ format:"%Y-%m-%d", date:"$dateObj" }},
diesel:{ $sum:"$totalAmount" }
}
}

])

// merge petrol + diesel

const map = {}

petrol.forEach(p=>{
map[p._id] = { date:p._id, petrol:p.petrol, diesel:0 }
})

diesel.forEach(d=>{

if(!map[d._id]){

map[d._id] = { date:d._id, petrol:0, diesel:d.diesel }

}else{

map[d._id].diesel = d.diesel

}

})

const result = Object.values(map).sort((a,b)=>a.date.localeCompare(b.date))

res.json(result)

}catch(err){

res.status(500).json({error:err.message})

}

}