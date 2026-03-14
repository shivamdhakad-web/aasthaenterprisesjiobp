import { useEffect, useState } from "react"
import { getDrivers, deleteDriver } from "../services/ttDriverApi"
import AddTTDriverModal from "../components/AddTTDriverModal"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

export default function TTDrivers(){

const [data,setData] = useState([])
const [search,setSearch] = useState("")
const [modalOpen,setModalOpen] = useState(false)
const [editData,setEditData] = useState(null)

useEffect(()=>{
loadDrivers()
},[])

const loadDrivers = async()=>{
const res = await getDrivers()
setData(res)
}

const handleDelete = async(id)=>{
await deleteDriver(id)
loadDrivers()
}

const filtered = data.filter(d=>
Object.values(d).join(" ").toLowerCase().includes(search.toLowerCase())
)

const exportPDF = ()=>{
const doc = new jsPDF()

autoTable(doc,{
head:[["Name","Number","TT Number","Transport","Short","Remark"]],
body:filtered.map(d=>[
d.name,
d.number,
d.ttNumber,
d.transportName,
d.short,
d.remark
])
})

doc.save("TTDrivers.pdf")
}

const exportExcel = ()=>{
const ws = XLSX.utils.json_to_sheet(filtered)
const wb = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb,ws,"Drivers")

XLSX.writeFile(wb,"TTDrivers.xlsx")
}

return(

<div className="p-6">

<h1 className="text-xl font-bold mb-4">
T.T Driver Details
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


{/* <table className="w-full border">

<thead>

<tr className="bg-gray-200">

<th>ID</th>
<th>Name</th>
<th>Number</th>
<th>T.T Number</th>
<th>Transport Name</th>
<th>Short</th>
<th>Remark</th>
<th>Action</th>

</tr>

</thead>

<tbody>

{filtered.map((d,i)=>(
<tr key={d._id} className="text-center">

<td>{i+1}</td>
<td>{d.name}</td>
<td>{d.number}</td>
<td>{d.ttNumber}</td>
<td>{d.transportName}</td>
<td>{d.short}</td>
<td>{d.remark}</td>

<td>

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
className="text-red-600 ml-2"
>
Delete
</button>

</td>

</tr>
))}

</tbody>

</table> */}

<table className="w-full text-sm text-gray-300">

<thead className="bg-[#0F172A] text-gray-400">

<tr>

<th className="px-6 py-3 text-left">ID</th>
<th className="px-6 py-3 text-left">Name</th>
<th className="px-6 py-3 text-left">Number</th>
<th className="px-6 py-3 text-left">T.T Number</th>
<th className="px-6 py-3 text-left">Transport Name</th>
<th className="px-6 py-3 text-left">Short</th>
<th className="px-6 py-3 text-left">Remark</th>
<th className="px-6 py-3 text-left">Action</th>

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

<td className="px-6 py-3">{d.ttNumber}</td>

<td className="px-6 py-3">{d.transportName}</td>

<td className={`px-6 py-3 ${d.short.includes("-") ? "text-red-500" : "text-green-400"}`}>
  {d.short}
</td>

<td className="px-6 py-3">{d.remark}</td>

<td className="px-6 py-3">

<button
className="text-blue-400 hover:text-blue-300"
onClick={()=>{

setEditData(d)
setModalOpen(true)

}}
>
Edit
</button>

<button
onClick={()=>handleDelete(d._id)}
className="text-red-500 ml-3 hover:text-red-400"
>
Delete
</button>

</td>

</tr>
))}

</tbody>

</table>

<AddTTDriverModal
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