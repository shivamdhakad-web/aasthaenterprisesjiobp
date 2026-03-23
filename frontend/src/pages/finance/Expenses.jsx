import {useState,useEffect} from "react"

import {
getExpenses,
addExpense,
deleteExpense,
updateExpense
} from "../../services/expenseApi"

export default function Expenses(){

const [data,setData] = useState([])
const [open,setOpen] = useState(false)
const [editId,setEditId] = useState(null)

const [search,setSearch] = useState("")
const [category,setCategory] = useState("")
const [dateFilter,setDateFilter] = useState("")
const [openCard,setOpenCard] = useState(null)

const [form,setForm] = useState({

date:"",
category:"Electricity",
description:"",
amount:"",
paymentMode:"Cash",
addedBy:"Admin"

})



const load = async()=>{

const res = await getExpenses()
setData(res)

}

useEffect(()=>{

load()

},[])



const saveExpense = async()=>{

if(editId){

await updateExpense(editId,form)

}else{

await addExpense(form)

}

setEditId(null)

setOpen(false)

load()

}



const remove = async(id)=>{

await deleteExpense(id)

load()

}

// FILTERED DATA

const filteredData = data.filter(e => 
 (!search || e.description.toLowerCase().includes(search.toLowerCase())) &&
 (!category || e.category === category) &&
 (!dateFilter || e.date === dateFilter)
)

// SUMMARY CALCULATION

const today = new Date()
const currentMonth = today.getMonth()
const currentYear = today.getFullYear()

let todayTotal = 0
let weekTotal = 0
let monthTotal = 0
let grandTotal = 0

filteredData.forEach(e => {

 const d = new Date(e.date)

 grandTotal += Number(e.amount || 0)

 if(d.toDateString() === today.toDateString()){
  todayTotal += Number(e.amount)
 }

 const diffDays = (today - d) / (1000*60*60*24)

 if(diffDays <= 7){
  weekTotal += Number(e.amount)
 }

 if(
  d.getMonth() === currentMonth &&
  d.getFullYear() === currentYear
 ){
  monthTotal += Number(e.amount)
 }

})


return(

<div className="p-6">


<div className="flex justify-between mb-6">

<h1 className="text-white text-2xl font-semibold">
Expenses
</h1>

<button
onClick={()=>setOpen(true)}
className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
>
+ Add Expense
</button>

</div>


<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4">
<p className="text-gray-400 text-sm font-bold">Today</p>
<p className="text-white text-xl font-semibold">₹{todayTotal}</p>
</div>

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4">
<p className="text-gray-400 text-sm font-bold">Week</p>
<p className="text-white text-xl font-semibold">₹{weekTotal}</p>
</div>

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4">
<p className="text-gray-400 text-sm font-bold">Month</p>
<p className="text-white text-xl font-semibold">₹{monthTotal}</p>
</div>

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4">
<p className="text-gray-400 text-sm font-bold">Total</p>
<p className="text-white text-xl font-semibold">₹{grandTotal}</p>
</div>

</div>

{/* FILTERS */}


<div className="flex flex-col sm:flex-row gap-3 mb-4">
<input
placeholder="Search..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="bg-[#111827] border border-[#1F2937] px-4 py-2 rounded text-gray-300"
/>

<select
value={category}
onChange={(e)=>setCategory(e.target.value)}
className="bg-[#111827] border border-[#1F2937] px-4 py-2 rounded text-gray-300"
>

<option value="">All Category</option>
<option>Electricity</option>
<option>Maintenance</option>
<option>Salary</option>
<option>Cleaning</option>
<option>Misc</option>

</select>

<input
type="date"
value={dateFilter}
onChange={(e)=>setDateFilter(e.target.value)}
className="bg-[#111827] border border-[#1F2937] px-4 py-2 rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
/>

</div>

<div className=" hidden sm:block bg-[#0B0F17] border border-[#1A1F2E] rounded">

<table className="w-full text-gray-300">

<thead className="border-b border-[#1F2937]">

<tr>

<th className="p-3 text-left">Date</th>
<th className="p-3 text-left">Category</th>
<th className="p-3 text-left">Description</th>
<th className="p-3 text-left">Amount</th>
<th className="p-3 text-left">Mode</th>
<th className="p-3 text-left">Added By</th>
<th className="p-3 text-left">Action</th>

</tr>

</thead>

<tbody>

{filteredData
.filter(e => 
(!search || e.description.toLowerCase().includes(search.toLowerCase())) &&
(!category || e.category === category) &&
(!dateFilter || e.date === dateFilter)
)
.map((e)=>(

<tr key={e._id} className="border-b border-[#1F2937]">

<td className="p-3">{e.date}</td>
<td className="p-3">{e.category}</td>
<td className="p-3">{e.description}</td>
<td className="p-3 text-red-400">₹{e.amount}</td>
<td className="p-3">{e.paymentMode}</td>
<td className="p-3">{e.addedBy}</td>

<td className="p-3">

<button
onClick={()=>remove(e._id)}
className="text-red-400"
>
Delete
</button>

<button
onClick={()=>{

setForm({
date:e.date,
category:e.category,
description:e.description,
amount:e.amount,
paymentMode:e.paymentMode,
addedBy:e.addedBy
})

setEditId(e._id)

setOpen(true)

}}
className="text-blue-400 ml-3"
>
Edit
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

<div className="grid grid-cols-1 gap-4 sm:hidden">

{filteredData.map((e)=>{

const isOpen = openCard === e._id

return(

<div
key={e._id}
onClick={()=>setOpenCard(isOpen ? null : e._id)}
className="p-4 rounded-2xl border border-[#1A1F2E] bg-[#0B0F17] shadow-lg active:scale-95 transition-all duration-300"
>

{/* HEADER */}
<div className="flex justify-between items-center">

<div>
<p className="text-white font-semibold">
{e.category}
</p>

<p className="text-gray-400 text-xs">
{e.date}
</p>
</div>

<p className="text-red-400 font-semibold">
₹{e.amount}
</p>

</div>


{/* DESCRIPTION */}
<p className="text-gray-300 text-sm mt-2">
{e.description}
</p>


{/* EXPAND */}
<div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 mt-3" : "max-h-0"}`}>

<div className="border-t border-[#1F2937] pt-3 space-y-2">

<p className="text-sm">
<span className="text-gray-400">💳 Mode:</span>{" "}
<span className="text-white">{e.paymentMode}</span>
</p>

<p className="text-sm">
<span className="text-gray-400">👤 Added By:</span>{" "}
<span className="text-white">{e.addedBy}</span>
</p>

{/* ACTIONS */}
<div className="flex gap-3 mt-3">

<button
onClick={(ev)=>{
ev.stopPropagation()

setForm({
date:e.date,
category:e.category,
description:e.description,
amount:e.amount,
paymentMode:e.paymentMode,
addedBy:e.addedBy
})

setEditId(e._id)
setOpen(true)

}}
className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 py-2 rounded-lg text-sm active:scale-95 transition"
>
✏️ Edit
</button>

<button
onClick={(ev)=>{
ev.stopPropagation()
remove(e._id)
}}
className="flex-1 bg-red-500/10 text-red-400 border border-red-500/30 py-2 rounded-lg text-sm active:scale-95 transition"
>
🗑 Delete
</button>

</div>

</div>

</div>

</div>

)

})}

</div>

{open &&(

<div className="fixed inset-0 flex items-center justify-center bg-black/60">

<div className="bg-[#0B0F17] border border-[#1A1F2E] p-6 rounded w-[350px]">

<h2 className="text-white mb-4">
Add Expense
</h2>


<input
type="date"
value={form.date}
onChange={(e)=>setForm({...form,date:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827] text-white [&::-webkit-calendar-picker-indicator]:invert"
/>



<select
value={form.category}
onChange={(e)=>setForm({...form,category:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827]"
>

<option>Electricity</option>
<option>Maintenance</option>
<option>Salary</option>
<option>Cleaning</option>
<option>Misc</option>

</select>



<input
placeholder="Description"
value={form.description}
onChange={(e)=>setForm({...form,description:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827]"
/>



<input
placeholder="Amount"
value={form.amount}
onChange={(e)=>setForm({...form,amount:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827]"
/>



<select
value={form.paymentMode}
onChange={(e)=>setForm({...form,paymentMode:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827]"
>

<option>Cash</option>
<option>UPI</option>
<option>Bank</option>

</select>



<input
placeholder="Added By"
value={form.addedBy}
onChange={(e)=>setForm({...form,addedBy:e.target.value})}
className="w-full mb-4 p-2 bg-[#111827]"
/>



<div className="flex justify-end gap-3">

<button
onClick={()=>setOpen(false)}
className="bg-gray-700 px-4 py-2"
>
Cancel
</button>

<button
onClick={saveExpense}
className="bg-red-600 px-4 py-2"
>
Save
</button>

</div>

</div>

</div>

)}


</div>

)

}