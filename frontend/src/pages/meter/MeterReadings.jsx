import { useEffect, useState } from "react"

import {
getMeterReadings,
deleteMeterReading,
addMeterReading,
updateMeterReading
} from "../../services/meterApi"

import MeterModal from "../../components/meter/MeterModal"

export default function MeterReadings(){

const [data,setData] = useState([])
const [open,setOpen] = useState(false)
const [edit,setEdit] = useState(null)

useEffect(()=>{
load()
},[])

const load = async()=>{
const res = await getMeterReadings()
setData(res)
}

const save = async(form)=>{

if(edit){
await updateMeterReading(edit._id,form)
}else{
await addMeterReading(form)
}

setOpen(false)
setEdit(null)
load()

}

const remove = async(id)=>{
await deleteMeterReading(id)
load()
}

return(

<div className="p-6">

{/* HEADER */}

<div className="flex justify-between items-center mb-6">

<h1 className="text-white text-2xl font-semibold">
Meter Readings
</h1>

<button
onClick={()=>setOpen(true)}
className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-white font-medium"
>
+ Add
</button>

</div>


{/* TABLE BOX */}

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl overflow-hidden">

<table className="w-full text-sm text-gray-300">

<thead className="text-gray-400 border-b border-[#1F2937]">

<tr>

<th className="px-6 py-4 text-left">ID</th>
<th className="px-6 py-4 text-left">Nozzle</th>
<th className="px-6 py-4 text-left">Shift</th>
<th className="px-6 py-4 text-left">Opening</th>
<th className="px-6 py-4 text-left">Closing</th>
<th className="px-6 py-4 text-left">Fuel Sold (L)</th>
<th className="px-6 py-4 text-left">Date</th>
<th className="px-6 py-4 text-left">Action</th>

</tr>

</thead>

<tbody>

{data.map((r,i)=>(

<tr
key={r._id}
className="border-b border-[#1F2937] hover:bg-[#111827]"
>

<td className="px-6 py-4 font-medium">
MR{i+1}
</td>

<td className="px-6 py-4">
{r.nozzle}
</td>

<td className="px-6 py-4">
{r.shift}
</td>

<td className="px-6 py-4">
{r.opening}
</td>

<td className="px-6 py-4">
{r.closing}
</td>

<td className="px-6 py-4 text-green-400 font-medium">
{Number(r.fuelSold).toFixed(1)} L
</td>

<td className="px-6 py-4">
{r.date}
</td>

<td className="px-6 py-4 flex gap-4">

<button
onClick={()=>{setEdit(r);setOpen(true)}}
className="text-blue-400 hover:text-blue-300"
>
Edit
</button>

<button
onClick={()=>remove(r._id)}
className="text-red-400 hover:text-red-300"
>
Delete
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>


{/* MODAL */}

{open &&

<MeterModal
close={()=>{setOpen(false);setEdit(null)}}
save={save}
data={edit}
/>

}

</div>

)

}