import { useEffect, useState } from "react"
import {
getCustomerDrivers,
deleteCustomerDriver
} from "../services/customerDriverApi"
import AddCustomerDriverModal from "../components/AddCustomerDriverModal"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

export default function CustomerDrivers(){

const [data,setData] = useState([])
const [search,setSearch] = useState("")
const [modalOpen,setModalOpen] = useState(false)
const [editData,setEditData] = useState(null)

useEffect(()=>{
loadDrivers()
},[])

const loadDrivers = async()=>{
const res = await getCustomerDrivers()
setData(res)
}

const handleDelete = async(id)=>{
await deleteCustomerDriver(id)
loadDrivers()
}

const filtered = data.filter(d=>
Object.values(d).join(" ").toLowerCase().includes(search.toLowerCase())
)

const exportPDF = ()=>{

const doc = new jsPDF()

autoTable(doc,{
head:[[
"Name",
"Number",
"Gadi Number",
"Transport",
"Route",
"Carrier ID",
"Remark"
]],

body:filtered.map(d=>[
d.name,
d.number,
d.gadiNumber,
d.transportName,
d.route,
d.carrierId,
d.remark
])

})

doc.save("CustomerDrivers.pdf")

}

const exportExcel = ()=>{

const ws = XLSX.utils.json_to_sheet(filtered)

const wb = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb,ws,"Drivers")

XLSX.writeFile(wb,"CustomerDrivers.xlsx")

}

return(

<div className="p-6">

<h1 className="text-xl font-bold mb-4">
Customer Driver Details
</h1>


<div className="flex gap-3 mb-4">

<input
placeholder="Search..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border p-2 w-60"
/>
<button
className="bg-blue-500 px-4 py-2 rounded text-white"
onClick={()=>{

setEditData(null)
setModalOpen(true)

}}
>
+ Add Driver
</button>

<button
onClick={exportPDF}
className="bg-red-600 text-white px-3 py-1"
>
PDF
</button>

<button
onClick={exportExcel}
className="bg-green-600 text-white px-3 py-1"
>
Excel
</button>

</div>


<table className="w-full text-sm text-gray-300">

<thead className="bg-[#0F172A] text-gray-400">

<tr>

<th className="px-6 py-3">ID</th>
<th className="px-6 py-3">Name</th>
<th className="px-6 py-3">Number</th>
<th className="px-6 py-3">Gadi Number</th>
<th className="px-6 py-3">Transport Name</th>
<th className="px-6 py-3">Route</th>
<th className="px-6 py-3">Carrier ID</th>
<th className="px-6 py-3">Remark</th>
<th className="px-6 py-3">Action</th>

</tr>

</thead>


<tbody>

{filtered.map((d,i)=>(

<tr
key={d._id}
className="border-b border-[#1E293B] hover:bg-[#0F172A]"
>

<td className="px-6 py-3">{i+1}</td>

<td className="px-6 py-3">{d.name}</td>

<td className="px-6 py-3">{d.number}</td>

<td className="px-6 py-3">{d.gadiNumber}</td>

<td className="px-6 py-3">{d.transportName}</td>

<td className="px-6 py-3">{d.route}</td>

<td className="px-6 py-3">{d.carrierId}</td>

<td className="px-6 py-3">{d.remark}</td>

<td className="px-6 py-3">

<button
className="text-blue-400"
onClick={()=>{

setEditData(d)
setModalOpen(true)

}}
>
Edit
</button>

<button
onClick={()=>handleDelete(d._id)}
className="text-red-500 ml-3"
>
Delete
</button>

</td>

</tr>

))}

</tbody>

</table>

<AddCustomerDriverModal
open={modalOpen}
onClose={()=>{

setModalOpen(false)
setEditData(null)

}}
onSave={loadDrivers}
editData={editData}
/>

</div>

)

}