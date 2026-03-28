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
const [reportOpen,setReportOpen] = useState(false)
const [fromDate,setFromDate] = useState("")
const [toDate,setToDate] = useState("")
const [format,setFormat] = useState("pdf")
const [openCard,setOpenCard] = useState(null)

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

const generatePDF = (filteredData)=>{

const doc = new jsPDF()

doc.setFontSize(16)
doc.text("T.T Drivers Report",14,15)

doc.setFontSize(10)
doc.text(`From: ${fromDate || "All"} To: ${toDate || "All"}`,14,22)

doc.text(`Total Records: ${filteredData.length}`,14,30)

autoTable(doc,{
startY:35,
head:[["Name","Number","TT Number","Transport","Short","Remark"]],
body:filteredData.map(d=>[
d.name,
d.number,
d.ttNumber,
d.transportName,
d.short,
d.remark
]),
styles:{fontSize:8},
headStyles:{fillColor:[22,163,74]}
})

doc.save("TTDrivers_Report.pdf")

}

const generateExcel = (filteredData)=>{

const formatted = filteredData.map((d,i)=>({
ID:i+1,
Name:d.name,
Number:d.number,
TT_Number:d.ttNumber,
Transport:d.transportName,
Short:d.short,
Remark:d.remark
}))

const ws = XLSX.utils.json_to_sheet(formatted)

ws["!cols"] = [
{wch:5},
{wch:20},
{wch:15},
{wch:15},
{wch:20},
{wch:10},
{wch:20}
]

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb,ws,"TT Drivers")

XLSX.writeFile(wb,"TTDrivers_Report.xlsx")

}

const getFilteredByDate = ()=>{
return filtered.filter(d=>{
const dDate = new Date(d.createdAt)

return (
(!fromDate || dDate >= new Date(fromDate)) &&
(!toDate || dDate <= new Date(toDate))
)
})
}

const handleGenerate = ()=>{

const filteredData = getFilteredByDate()

if(format==="pdf"){
generatePDF(filteredData)
}else{
generateExcel(filteredData)
}

setReportOpen(false)

}

return(

<div className="p-6">

<h1 className="text-xl font-bold mb-4">
T.T Driver Details
</h1>

<div className="flex flex-col sm:flex-row gap-3 mb-4">

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
onClick={()=>setReportOpen(true)}
className="bg-purple-600 text-white px-3 py-1 rounded"
>
Generate Report
</button>

</div>

<div className="hidden sm:block overflow-x-auto">
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
</div>

{/* MOBILE VIEW */}

<div className="sm:hidden space-y-4">

{filtered.map((d)=>{

const isOpen = openCard === d._id

return(

<div
key={d._id}
onClick={()=>setOpenCard(isOpen ? null : d._id)}
className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4 active:scale-95 transition"
>

{/* TOP */}

<div className="flex justify-between items-center">

<div>
<p className="text-xs text-gray-400">Driver</p>
<p className="text-white font-semibold text-lg">{d.name}</p>
</div>

<p className={`text-sm font-bold ${d.short.includes("-") ? "text-red-400" : "text-green-400"}`}>
{d.short}
</p>

</div>

{/* BASIC INFO */}

<div className="mt-3 text-sm text-gray-300 space-y-1">

<p>📞 {d.number}</p>
<p>🚛 {d.ttNumber}</p>

</div>

{/* EXPAND */}

{isOpen && (

<div className="mt-4 border-t border-[#1A1F2E] pt-3 space-y-2">

<p className="text-sm text-gray-400">
Transport : <span className="text-white">{d.transportName}</span>
</p>

<p className="text-sm text-gray-400">
Remark : <span className="text-white">{d.remark || "-"}</span>
</p>

{/* ACTION BUTTONS */}

<div className="flex gap-2 mt-3">

<button
onClick={(e)=>{
e.stopPropagation()
setEditData(d)
setModalOpen(true)
}}
className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg text-sm"
>
Edit
</button>

<button
onClick={(e)=>{
e.stopPropagation()
handleDelete(d._id)
}}
className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-lg text-sm"
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

<AddTTDriverModal
open={modalOpen}
onClose={()=>{

setModalOpen(false)
setEditData(null)

}}
onSave={loadDrivers}
editData={editData}
/>


{reportOpen && (

<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] p-6 rounded-xl w-[350px] text-white">

<h2 className="text-lg font-semibold mb-4">
Generate Report
</h2>

<div className="flex flex-col gap-3">

<input
type="date"
value={fromDate}
onChange={(e)=>setFromDate(e.target.value)}
className="border p-2 bg-transparent  text-white [&::-webkit-calendar-picker-indicator]:invert"
/>

<input
type="date"
value={toDate}
onChange={(e)=>setToDate(e.target.value)}
className="border p-2 bg-transparent  text-white [&::-webkit-calendar-picker-indicator]:invert"
/>

<select
value={format}
onChange={(e)=>setFormat(e.target.value)}
className="border p-2 bg-[#0B0F17]"
>
<option value="pdf">PDF</option>
<option value="excel">Excel</option>
</select>

</div>

<div className="flex justify-end gap-3 mt-4">

<button
onClick={()=>setReportOpen(false)}
className="bg-gray-600 px-3 py-1 rounded"
>
Cancel
</button>

<button
onClick={handleGenerate}
className="bg-green-600 px-3 py-1 rounded"
>
Download
</button>

</div>

</div>

</div>

)}

</div>



)
}