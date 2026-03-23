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

const [reportOpen,setReportOpen] = useState(false)
const [fromDate,setFromDate] = useState("")
const [toDate,setToDate] = useState("")
const [format,setFormat] = useState("pdf")
const [modalOpen,setModalOpen] = useState(false)
const [editData,setEditData] = useState(null)
const [openCard,setOpenCard] = useState(null)
const [copied,setCopied] = useState(false)

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

// SEARCH FILTER
const filtered = data.filter(d=>
Object.values(d).join(" ").toLowerCase().includes(search.toLowerCase())
)

// DATE FILTER
const getFilteredByDate = ()=>{
return filtered.filter(d=>{
const dDate = new Date(d.createdAt)
return (
(!fromDate || dDate >= new Date(fromDate)) &&
(!toDate || dDate <= new Date(toDate))
)
})
}

const copyText = (text)=>{
navigator.clipboard.writeText(text)

setCopied(true)

setTimeout(()=>{
setCopied(false)
},2000)
}

// PDF GENERATE (PRO)
const generatePDF = (filteredData)=>{

const doc = new jsPDF()

// LOGO (Make sure logo.png exists in public folder)
try{
doc.addImage("/logo.png", "PNG", 14, 10, 20, 20)
}catch{}

// TITLE
doc.setFontSize(18)
doc.text("Aastha Enterprises", 40, 18)

doc.setFontSize(12)
doc.text("Customer Drivers Report", 40, 26)

// DATE
doc.setFontSize(10)
doc.text(`From: ${fromDate || "All"}  To: ${toDate || "All"}`,14,38)

// SUMMARY
doc.text(`Total Records: ${filteredData.length}`,14,45)

autoTable(doc,{
startY:50,
head:[[
"Name","Number","Gadi","Transport","Route","Carrier","Remark"
]],
body:filteredData.map(d=>[
d.name,
d.number,
d.gadiNumber,
d.transportName,
d.route,
d.carrierId,
d.remark
]),
styles:{
fontSize:8,
cellPadding:3
},
headStyles:{
fillColor:[0,102,204],
textColor:255
},
alternateRowStyles:{
fillColor:[240,240,240]
}
})

doc.save("CustomerDrivers_Report.pdf")

}

// EXCEL GENERATE (PRO)
const generateExcel = (filteredData)=>{

const formatted = filteredData.map((d,i)=>({
ID:i+1,
Name:d.name,
Number:d.number,
Gadi:d.gadiNumber,
Transport:d.transportName,
Route:d.route,
Carrier:d.carrierId,
Remark:d.remark
}))

const ws = XLSX.utils.json_to_sheet(formatted)

// column width
ws["!cols"] = [
{ wch:5 },
{ wch:20 },
{ wch:15 },
{ wch:15 },
{ wch:20 },
{ wch:15 },
{ wch:15 },
{ wch:20 }
]

const wb = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb,ws,"Drivers Report")

XLSX.writeFile(wb,"CustomerDrivers_Report.xlsx")

}

// FINAL GENERATE HANDLER
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

<div className="p-3 sm:p-6">

<h1 className="text-xl font-bold mb-4">
Customer Driver Details
</h1>

<div className="flex flex-col sm:flex-row gap-3 mb-4">

<input
placeholder="Search..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border p-2 w-full sm:w-60"
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
className="bg-blue-600 text-white px-4 py-2 rounded"
>
Generate Report
</button>

</div>

{/* TABLE */}


<div className="hidden sm:block overflow-x-auto">
<table className="table text-sm text-gray-300">

<thead className="bg-[#0F172A] text-gray-400">

<tr>

<th className="px-4 py-2">ID</th>
<th className="px-4 py-2">Name</th>
<th className="px-4 py-2">Number</th>
<th className="px-4 py-2">Gadi Number</th>
<th className="px-4 py-2">Transport Name</th>
<th className="px-4 py-2">Route</th>
<th className="px-4 py-2">Carrier ID</th>
<th className="px-4 py-2">Remark</th>
<th className="px-4 py-2">Action</th>

</tr>

</thead>

<tbody>

{filtered.map((d,i)=>(

<tr
key={d._id}
className="border-b border-[#1E293B] hover:bg-[#0F172A]"
>

<td className="px-6 py-2">{i+1}</td>
<td className="px-4 py-2">{d.name}</td>
<td className="px-4 py-2">{d.number}</td>
<td className="px-4 py-2">{d.gadiNumber}</td>
<td className="px-4 py-2">{d.transportName}</td>
<td className="px-4 py-2">{d.route}</td>
<td className="px-4 py-2">{d.carrierId}</td>
<td className="px-4 py-2">{d.remark}</td>

<td className="px-4 py-2">

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

</div>

<div className="grid grid-cols-1 gap-4 sm:hidden">

{filtered.map((d)=>{

const isOpen = openCard === d._id

return(

<div
key={d._id}
onClick={()=>setOpenCard(isOpen ? null : d._id)}
className="p-4 rounded-2xl border border-[#1A1F2E] bg-[#0B0F17] shadow-lg active:scale-95 transition-all duration-300"
>

{/* HEADER */}
<div className="flex justify-between items-start">

<div className="space-y-1">

<p className="text-sm">
<span className="text-gray-400">👤 Name :</span>{" "}
<span className="text-white font-semibold">{d.name}</span>
</p>

<p className="text-sm">
<span className="text-gray-400">📞 Number :</span>{" "}
<span className="text-white">{d.number}</span>
</p>

</div>

<button
onClick={(e)=>{
e.stopPropagation()
copyText(d.number)
}}
className="bg-white/10 px-2 py-1 rounded text-xs hover:bg-white/20"
>
📋
</button>

</div>


{/* BASIC */}
<div className="mt-1 space-y-1">

<p className="text-sm">
<span className="text-gray-400">🚛 Gadi :</span>{" "}
<span className="text-white">{d.gadiNumber}</span>
</p>

<p className="text-sm">
<span className="text-gray-400">🏢 Transport :</span>{" "}
<span className="text-white">{d.transportName}</span>
</p>

<p className="text-sm">
<span className="text-gray-400">🛣 Route :</span>{" "}
<span className="text-white">{d.route}</span>
</p>

</div>


{/* EXPAND */}
<div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 mt-3" : "max-h-0"}`}>

<div className="border-t border-white/10 pt-3 space-y-2">

<p className="text-sm">
<span className="text-gray-400">🆔 Carrier :</span>{" "}
<span className="text-white">{d.carrierId}</span>
</p>

<p className="text-sm">
<span className="text-gray-400">📝 Remark :</span>{" "}
<span className="text-white">{d.remark}</span>
</p>

{/* ACTIONS */}
<div className="flex gap-3 mt-3">

<button
onClick={(e)=>{
e.stopPropagation()
setEditData(d)
setModalOpen(true)
}}
className="flex-1 flex items-center justify-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 py-2 rounded-lg text-sm active:scale-95 transition"
>
✏️ Edit
</button>

<button
onClick={(e)=>{
e.stopPropagation()
handleDelete(d._id)
}}
className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 text-red-400 border border-red-500/30 py-2 rounded-lg text-sm active:scale-95 transition"
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

{/* REPORT MODAL */}

{reportOpen && (

<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] p-6 rounded-xl w-[350px] text-white">

<h2 className="text-lg font-semibold mb-4">
Generate Report
</h2>

<p className="text-sm text-gray-400 mb-2">
Select date range & format
</p>

<div className="flex flex-col gap-3">

<input
type="date"
value={fromDate}
onChange={(e)=>setFromDate(e.target.value)}
className="border p-2 bg-transparent"
/>

<input
type="date"
value={toDate}
onChange={(e)=>setToDate(e.target.value)}
className="border p-2 bg-transparent"
/>

<select
value={format}
onChange={(e)=>setFormat(e.target.value)}
className="border p-2 bg-black"
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

{copied && (
<div className="fixed top-3 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm shadow-lg">
Copied
</div>
)}

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