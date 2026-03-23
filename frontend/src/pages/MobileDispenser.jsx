import { useEffect,useState } from "react"

import {

getEntries,
deleteEntry,
getSettings

} from "../services/mobileDispenserApi"
import AddDispenserModal from "../components/AddDispenserModal"
import { addEntry } from "../services/mobileDispenserApi"
import DispenserSettingsModal from "../components/DispenserSettingsModal"
import { updateSettings } from "../services/mobileDispenserApi"

export default function MobileDispenser(){

const [modalOpen,setModalOpen] = useState(false)
const [settingsModal,setSettingsModal] = useState(false)

const [entries,setEntries] = useState([])
const [settings,setSettings] = useState(null)
const [search,setSearch] = useState("")
const [dateFilter,setDateFilter] = useState("")
const [openCard,setOpenCard] = useState(null)

const saveSettings = async(data)=>{

await updateSettings(data)

setSettingsModal(false)

fetchSettings()

}

const saveEntry = async(data)=>{

await addEntry(data)

setModalOpen(false)

fetchEntries()

}

const fetchEntries = async()=>{

const data = await getEntries()

setEntries(data)

}



const fetchSettings = async()=>{

const data = await getSettings()

setSettings(data)

}



useEffect(()=>{

fetchEntries()
fetchSettings()

},[])

// FILTER

const filteredEntries = entries.filter(e=>{

const date = new Date(e.date).toISOString().slice(0,10)

return(

(!search || String(e.saleLiter).includes(search)) &&
(!dateFilter || date === dateFilter)

)

})

// SUMMARY

let totalStock = 0
let totalSale = 0
let totalKM = 0
let totalDiesel = 0
let totalProfit = 0

let todaySale = 0
let weekSale = 0
let monthSale = 0

const today = new Date()
const todayStr = today.toISOString().slice(0,10)

filteredEntries.forEach(e=>{

const sale = (e.endNozzle || 0) - (e.startNozzle || 0)

totalSale += sale
totalStock += Number(e.stockAdd || 0)

totalKM += e.totalKM || 0
totalDiesel += e.dieselCost || 0
totalProfit += e.finalProfit || 0

const d = new Date(e.date)

if(e.date === todayStr){

todaySale += sale

}

const diffDays = (today - d)/(1000*60*60*24)

if(diffDays <= 7){

weekSale += sale

}

if(

d.getMonth() === today.getMonth() &&
d.getFullYear() === today.getFullYear()

){

monthSale += sale

}

})


const currentStock = totalStock - totalSale



return(

<div className="p-6 text-gray-300">

<h1 className="text-3xl mb-6 font-bold ">

Mobile Dispenser

</h1>


{/* TODAY WEEK MONTH */}

<div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">

<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded text-lg">

<p className="text-gray-300 font-bold">Today Sale</p>

<p className="text-lg text-white font-bold">

{Math.round(todaySale)} L

</p>

</div>

<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

<p className="text-gray-300 font-bold">Week Sale</p>

<p className="text-lg text-white font-bold">

{Math.round(weekSale)} L

</p>

</div>

<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

<p className="text-gray-300 font-bold">Month Sale</p>

<p className="text-lg text-white font-bold">

{Math.round(monthSale)} L

</p>

</div>

<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

<p className="text-gray-300 font-bold">Total Sale</p>

<p className="text-lg text-white font-bold">

{Math.round(totalSale)} L

</p>

</div>

</div>

{/* SUMMARY */}

<div className="grid sm:grid-cols-3 gap-4 mt-6 grid-cols-2">




<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded font-bold">

Total KM

<p>{Math.round(totalKM)}</p>

</div>



<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded font-bold">

Diesel Cost

<p>₹{Math.round(totalDiesel)}</p>

</div>



<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded font-bold col-span-2 sm:col-span-1 flex justify-between items-center">

<p className="text-gray-400">
Final Profit
</p>

<p className="text-green-400 text-lg font-bold">
₹{Math.round(totalProfit)}
</p>

</div>


</div>

<button
className="bg-yellow-500 px-4 py-2 rounded mb-4 mt-5"
onClick={()=>setSettingsModal(true)}
>

⚙ Update Stock

</button>

{/* TOP CARDS */}

<div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">

<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded font-bold">

<p className="text-gray-300 ">Total Stock</p>

<p className="text-lg">

{totalStock} L

</p>

</div>



<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded font-bold">

<p className="text-gray-300">Current Stock</p>

<p className="text-lg">
{Math.round(currentStock)} L
</p>

</div>



<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded font-bold">

<p className="text-gray-300">Margin / Liter</p>

<p className="text-lg">

₹{settings?.margin || 0}

</p>

</div>



<div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded font-bold">

<p className="text-gray-300">Diesel / KM</p>

<p className="text-lg">

₹{settings?.dieselPerKM || 0}

</p>

</div>


</div>

{/* FILTER */}

<div className="flex gap-3 mb-4">

<input
placeholder="Search Liter..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="bg-[#111827] px-3 py-2 rounded-lg w-31 sm:w-52 text-sm outline-none border border-[#1F2937] focus:border-blue-500"
/>

<input
type="date"
value={dateFilter}
onChange={(e)=>setDateFilter(e.target.value)}
className="bg-[#111827] p-2 rounded w-9 sm:w-52 text-white [&::-webkit-calendar-picker-indicator]:invert"
/>

</div>

{/* ADD BUTTON */}

<button
className="bg-blue-500 px-4 py-2 rounded mb-4"
onClick={()=>setModalOpen(true)}
>

+ Add Entry

</button>



{/* TABLE */}

<div className= "hidden sm:block bg-[#0B0F17] border border-[#1F2937] rounded">


<table className="w-full text-sm">


<thead>

<tr className="text-gray-400 border-b border-[#1F2937]">

<th className="p-3 text-left">Date</th>
<th className="p-3 text-left">Stock Add</th>
<th className="p-3 text-left">Start Nozzle</th>
<th className="p-3 text-left">End Nozzle</th>
<th className="p-3 text-left">Sale Liter</th>
<th className="p-3 text-left">Start KM</th>
<th className="p-3 text-left">End KM</th>
<th className="p-3 text-left">Total KM</th>
<th className="p-3 text-left">Profit</th>
<th className="p-3 text-left">Diesel Cost</th>
<th className="p-3 text-left">Final Profit</th>
<th className="p-3 text-left">Action</th>

</tr>

</thead>



<tbody>


{filteredEntries.map(e=>(
<tr

key={e._id}

className="border-t border-[#1F2937] hover:bg-[#111827]"

>

<td className="p-3">

{new Date(e.date).toLocaleDateString()}

</td>

<td className="p-3">{e.stockAdd}</td>


<td className="p-3">{e.startNozzle}</td>

<td className="p-3">{e.endNozzle}</td>

<td className="p-3">
{Number(e.saleLiter).toFixed(2)}
</td>

<td className="p-3">{e.startKM}</td>

<td className="p-3">{e.endKM}</td>

<td className="p-3">{e.totalKM}</td>

<td className={`p-3 font-semibold ${e.profit < 0 ? "text-red-600" : "text-green-600"}`}>
  {e.profit > 0 ? "+" : ""}₹{Math.round(e.profit)}
</td>

<td className="p-3">₹{Math.round(e.dieselCost)}</td>

<td className={`p-3 font-semibold ${e.finalProfit < 0 ? "text-red-500" : "text-green-400"}`}>
  {e.finalProfit > 0 ? "+" : ""}₹{Math.round(e.finalProfit)}
</td>

<td className="p-3">

<button

className="text-red-400"

onClick={()=>{

deleteEntry(e._id)

fetchEntries()

}}

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

{filteredEntries.map((e,i)=>{

const kmTotal = (e.endKM || 0) - (e.startKM || 0)

return(

<div
key={e._id}
onClick={()=>setOpenCard(openCard === i ? null : i)}
className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded-xl cursor-pointer transition hover:scale-[1.01]"
>

{/* TOP */}
<div className="flex justify-between items-start">

<div>
<p className="text-xl font-bold text-white">
{Number(e.saleLiter).toFixed(2)} L
</p>

<p className="text-gray-400 text-sm">
{new Date(e.date).toLocaleDateString()}
</p>

<p className="text-sm mt-2">
Nozzle: {e.startNozzle} → {e.endNozzle}
</p>

<p className="text-sm">
KM: {e.startKM} → {e.endKM} 
<span className="text-gray-400 ml-2">
({kmTotal} KM)
</span>
</p>
</div>

{/* RIGHT SIDE */}
<div className="flex flex-col items-end gap-2 text-xs">

{/* PROFIT */}
<div className={`px-3 py-1 rounded-full 
${e.profit < 0 
  ? "bg-red-500/20 text-red-400" 
  : "bg-green-500/20 text-green-400"}`}>

Profit ₹{Math.round(e.profit)}

</div>

{/* DIESEL */}
<div className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
Diesel ₹{Math.round(e.dieselCost)}
</div>

{/* FINAL (🔥 Highlight) */}
<div className={`px-4 py-1 rounded-full font-semibold 
${e.finalProfit < 0 
  ? "bg-red-600/20 text-red-400" 
  : "bg-green-600/20 text-green-400"}`}>

Final ₹{Math.round(e.finalProfit)}

</div>

</div>

</div>

{/* 🔥 DELETE BUTTON (TOGGLE) */}
{openCard === i && (

<button
onClick={(ev)=>{
ev.stopPropagation()
deleteEntry(e._id)
fetchEntries()
}}
className="mt-4 w-full bg-red-500/20 text-red-400 py-2 rounded-lg"
>
Delete
</button>

)}

</div>

)

})}

</div>


<AddDispenserModal
open={modalOpen}
onClose={()=>setModalOpen(false)}
onSave={saveEntry}
/>

<DispenserSettingsModal
open={settingsModal}
onClose={()=>setSettingsModal(false)}
onSave={saveSettings}
data={settings}
/>

</div>




)



}