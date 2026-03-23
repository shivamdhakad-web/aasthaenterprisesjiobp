import { useEffect,useState } from "react"

import {

getEntries,
deleteEntry,
deleteMonth

} from "../services/cardSwipeApi"
import AddCardSwipeModal from "../components/AddCardSwipeModal"


export default function CardSwipe(){

const [entries,setEntries] = useState([])

const [month,setMonth] = useState("")
const [startDate,setStartDate] = useState("")
const [endDate,setEndDate] = useState("")
const [machine,setMachine] = useState("")
const [paymentMethod,setPaymentMethod] = useState("")
const [modalOpen,setModalOpen] = useState(false)
const [editData,setEditData] = useState(null)
const [openCard,setOpenCard] = useState(null)
const [showFilter,setShowFilter] = useState(false)

const fetchEntries = async()=>{

const data = await getEntries({

month,
startDate,
endDate,
machine,
paymentMethod

})

setEntries(data)

}



useEffect(()=>{

fetchEntries()

},[])

const handleSearch = async()=>{

const params = {}

if(month) params.month = month

if(startDate) params.startDate = startDate

if(endDate) params.endDate = endDate

if(machine) params.machine = machine

if(paymentMethod) params.paymentMethod = paymentMethod

const data = await getEntries(params)

setEntries(data)

}



// DELETE ENTRY

const removeEntry = async(id)=>{

await deleteEntry(id)

fetchEntries()

}



// DELETE MONTH

const removeMonth = async()=>{

if(!month) return alert("Select month")

const [year,mon] = month.split("-")

await deleteMonth(year,mon)

fetchEntries()

}



// SUMMARY

let totalAmount = 0
let totalCharges = 0
let cashTotal = 0
let onlineTotal = 0
let selfTotal = 0
let dsmTotal = 0


entries.forEach(e=>{

totalAmount += e.amount || 0
totalCharges += e.charges || 0

if(e.paymentMethod==="Cash") cashTotal += e.amount

if(e.paymentMethod==="Online") onlineTotal += e.amount

if(e.machine==="Self") selfTotal += e.amount

if(e.machine==="DSM") dsmTotal += e.amount

})


const netAmount = totalAmount - totalCharges



return(

<div className="p-6 text-gray-300">

<h1 className="text-2xl mb-6 font-bold">

Card Swipe Register

</h1>





{/* FILTERS */}

<div className="hidden sm:flex items-end gap-3 mb-6 overflow-x-auto">


<input
type="datetime-local"
value={startDate}
onChange={(e)=>setStartDate(e.target.value)}
className="input text-white [&::-webkit-calendar-picker-indicator]:invert"
/>


<input
type="datetime-local"
value={endDate}
onChange={(e)=>setEndDate(e.target.value)}
className="input text-white [&::-webkit-calendar-picker-indicator]:invert"
/>


<select
value={machine}
onChange={(e)=>setMachine(e.target.value)}
className="input"
>

<option value="">Both Machine</option>
<option value="Self">Self</option>
<option value="DSM">DSM</option>

</select>


<select
value={paymentMethod}
onChange={(e)=>setPaymentMethod(e.target.value)}
className="input"
>

<option value="">Both Payment</option>
<option value="Cash">Cash</option>
<option value="Online">Online</option>

</select>


<button
className="bg-green-500 px-4 py-2 rounded"
onClick={handleSearch}
>

Search

</button>

<button
className="bg-gray-600 px-4 py-2 rounded"
onClick={()=>{

setMonth("")
setStartDate("")
setEndDate("")
setMachine("")
setPaymentMethod("")

fetchEntries()

}}
>

Clear

</button>

<input
type="month"
value={month}
onChange={(e)=>setMonth(e.target.value)}
className="input"
/>

<button
className="bg-red-500 px-4 py-1 rounded "
onClick={removeMonth}
>
Delete Month
</button>

</div>


<div className="sm:hidden flex flex-col gap-3 mb-6 ">

<button
onClick={()=>setShowFilter(!showFilter)}
className="bg-[#1A1F2E] px-3 py-2 rounded text-sm"
>
Filters
</button>

{showFilter && (

<div className="flex flex-col gap-3 bg-[#0B0F17] p-3 rounded">

<input
type="datetime-local"
value={startDate}
onChange={(e)=>setStartDate(e.target.value)}
className="input text-white"
/>

<input
type="datetime-local"
value={endDate}
onChange={(e)=>setEndDate(e.target.value)}
className="input text-white"
/>

<select
value={machine}
onChange={(e)=>setMachine(e.target.value)}
className="input"
>
<option value="">Both Machine</option>
<option value="Self">Self</option>
<option value="DSM">DSM</option>
</select>

<select
value={paymentMethod}
onChange={(e)=>setPaymentMethod(e.target.value)}
className="input"
>
<option value="">Both Payment</option>
<option value="Cash">Cash</option>
<option value="Online">Online</option>
</select>

<button
className="bg-green-500 px-4 py-2 rounded"
onClick={handleSearch}
>
Apply
</button>

</div>

)}

</div>






{/* SUMMARY CARDS */}

<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-bold">

<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

<p className="text-gray-400">Total Swipe</p>

<p className="text-lg">

₹{totalAmount}

</p>

</div>


<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

<p className="text-gray-400">Total Charges</p>

<p className="text-lg">

₹{totalCharges}

</p>

</div>


<div className="col-span-2 bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

<p className="text-gray-400">Transactions:  {entries.length}</p>

<p className="text-lg">



</p>

</div>

</div>

<div className="mt-[-15px] mb-2 h-[1px] bg-gradient-to-r from-transparent via-[#20273a] to-transparent"></div>


{/* EXTRA SUMMARY */}

<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-bold">

<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

Cash : ₹{cashTotal}

</div>


<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

Online : ₹{onlineTotal}

</div>


<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

Self : ₹{selfTotal}

</div>


<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

DSM : ₹{dsmTotal}

</div>

</div>

<div className="flex justify-end mb-2">

<button
className="bg-blue-500 px-4 py-2 rounded"
onClick={()=>setModalOpen(true)}
>
+ Add Entry
</button>

</div>

{/* TABLE */}

<div className="hidden sm:block bg-[#0B0F17] border border-[#1F2937] rounded">

<table className="w-full">

<thead className="border-b border-[#1F2937] text-gray-400">

<tr>

<th className="p-3 text-left">Date</th>
<th className="p-3 text-left">Time</th>
<th className="p-3 text-left">Amount</th>
<th className="p-3 text-left">Charges</th>
<th className="p-3 text-left">Machine</th>
<th className="p-3 text-left">Payment</th>
<th className="p-3 text-left">Remark</th>
<th className="p-3 text-left">Action</th>

</tr>

</thead>


<tbody>

{entries.map(e=>(

<tr key={e._id} className="border-t border-[#1F2937]">

<td className="p-3">

{new Date(e.date).toLocaleDateString()}

</td>


<td className="p-3">

{e.time}

</td>


<td className="p-3">

₹{e.amount}

</td>


<td className="p-3 text-green-500">

₹{e.charges}

</td>


<td className="p-3">

{e.machine}

</td>


<td className="p-3">

{e.paymentMethod}

</td>


<td className="p-3">

{e.remark}

</td>


<td className="p-3 flex gap-3">

<button
className="text-blue-400"
onClick={()=>{

setEditData(e)
setModalOpen(true)

}}
>
Edit
</button>

<button
className="text-red-400"
onClick={()=>removeEntry(e._id)}
>
Delete
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

<div className="sm:hidden space-y-4">

{entries.map(e=>{

const isOpen = openCard === e._id

return(

<div
key={e._id}
onClick={()=>setOpenCard(isOpen ? null : e._id)}
className="bg-[#0B0F17] border border-[#1F2937] rounded-xl p-4 active:scale-[0.98] transition"
>

{/* TOP */}
<div className="flex justify-between items-center">

<div>
<p className="text-white font-semibold text-lg">
₹{e.amount}
</p>

<p className="text-xs text-gray-400">
{new Date(e.date).toLocaleDateString()} • {e.time}
</p>
</div>

<p className={`text-xs px-3 py-1 rounded-full 
${e.paymentMethod==="Cash"
? "bg-green-500/10 text-green-400"
: "bg-blue-500/10 text-blue-400"
}`}>
{e.paymentMethod}
</p>

</div>

{/* BASIC */}
<div className="mt-2 text-sm text-gray-300">

<p>Machine: {e.machine}</p>

<p className="text-red-400">
Charges: ₹{e.charges}
</p>

</div>

{/* EXPAND */}
{isOpen && (

<div className="mt-3 border-t border-[#1F2937] pt-3 space-y-2">

<p className="text-sm text-gray-400">
Remark: {e.remark || "-"}
</p>

<div className="flex gap-2">

<button
onClick={(ev)=>{
ev.stopPropagation()
setEditData(e)
setModalOpen(true)
}}
className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded"
>
Edit
</button>

<button
onClick={(ev)=>{
ev.stopPropagation()
removeEntry(e._id)
}}
className="flex-1 bg-red-500/20 text-red-400 py-2 rounded"
>
Delete
</button>

</div>

</div>

)}

</div>

)

})}

</div>

<AddCardSwipeModal
open={modalOpen}
onClose={()=>{
setModalOpen(false)
setEditData(null)
}}
onSave={()=>{
fetchEntries()
setModalOpen(false)
setEditData(null)
}}
editData={editData}
/>

</div>

)

}