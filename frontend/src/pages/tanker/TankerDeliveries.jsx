import {useEffect,useState} from "react"

import {
getDeliveries,
addDelivery,
updateDelivery,
deleteDelivery
} from "../../services/tankerApi"

import TankerModal from "../../components/tanker/TankerModal"
import DensityModal from "../../components/tanker/DensityModal"

export default function TankerDeliveries(){

const [data,setData] = useState([])
const [open,setOpen] = useState(false)
const [edit,setEdit] = useState(null)
const [densityOpen,setDensityOpen] = useState(false)

useEffect(()=>{
load()
},[])

const load = async()=>{

const res = await getDeliveries()

setData(res)

}

const save = async(form)=>{

if(edit){

await updateDelivery(edit._id,form)

}else{

await addDelivery(form)

}

setOpen(false)
setEdit(null)

load()

}

const remove = async(id)=>{

await deleteDelivery(id)

load()

}

return(

<div className="p-6">

<div className="flex justify-between mb-6">

<div>

<h1 className="text-white text-xl">
Tanker Deliveries
</h1>

<p className="text-gray-400 text-sm">
Record and track fuel deliveries
</p>

</div>

<div className="flex gap-3">

<button
onClick={()=>setDensityOpen(true)}
className="bg-[#1F2937] px-4 py-2 rounded text-gray-300"
>
Density Calc
</button>

<button
onClick={()=>setOpen(true)}
className="bg-blue-600 px-4 py-2 rounded text-white"
>
Record Delivery
</button>

</div>

</div>

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl overflow-hidden">

<table className="w-full text-gray-300">

<thead className="text-gray-400 border-b border-[#1F2937]">

<tr>

<th className="px-6 py-4 text-left">ID</th>
<th className="px-6 py-4 text-left">Supplier</th>
<th className="px-6 py-4 text-left">Fuel</th>
<th className="px-6 py-4 text-left">Quantity (L)</th>
<th className="px-6 py-4 text-left">Density</th>
<th className="px-6 py-4 text-left">Date</th>
<th className="px-6 py-4 text-left">Invoice</th>
<th className="px-6 py-4 text-left">Action</th>

</tr>

</thead>

<tbody>

{data.map((d,i)=>(

<tr
key={d._id}
className="border-b border-[#1F2937] hover:bg-[#111827]"
>

<td className="px-6 py-4">
TD{i+1}
</td>

<td className="px-6 py-4">
{d.supplier}
</td>

<td className="px-6 py-4">
{d.fuel}
</td>

<td className="px-6 py-4">
{d.quantity} L
</td>

<td className="px-6 py-4">
{d.density}
</td>

<td className="px-6 py-4">
{d.date}
</td>

<td className="px-6 py-4">
{d.invoice}
</td>

<td className="px-6 py-4 flex gap-3">

<button
onClick={()=>{setEdit(d);setOpen(true)}}
className="text-blue-400"
>
Edit
</button>

<button
onClick={()=>remove(d._id)}
className="text-red-400"
>
Delete
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

{open &&

<TankerModal
close={()=>{setOpen(false);setEdit(null)}}
save={save}
data={edit}
/>

}

{densityOpen &&

<DensityModal
close={()=>setDensityOpen(false)}
/>

}

</div>

)

}