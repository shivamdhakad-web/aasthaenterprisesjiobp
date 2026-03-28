import { useEffect,useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
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
const [reportOpen,setReportOpen] = useState(false)

const [fromDateTime,setFromDateTime] = useState("")
const [toDateTime,setToDateTime] = useState("")

const [reportMachine,setReportMachine] = useState("")
const [reportPayment,setReportPayment] = useState("")

const [format,setFormat] = useState("pdf")

const getReportData = () => {

return entries.filter(e => {

const entryDateTime = new Date(e.date)

if(e.time){
  const [hours, minutes] = e.time.split(":")
  entryDateTime.setHours(hours)
  entryDateTime.setMinutes(minutes)
}

const from = fromDateTime ? new Date(fromDateTime) : null
const to = toDateTime ? new Date(toDateTime) : null

if(to) to.setSeconds(59)

// DEBUG (optional)
console.log("ENTRY FIXED:", entryDateTime)

return (

(!from || entryDateTime >= from) &&
(!to || entryDateTime <= to) &&
(!reportMachine || e.machine === reportMachine) &&
(!reportPayment || e.paymentMethod === reportPayment)

)

})

}


const getSummary = (data)=>{

let totalAmount = 0
let totalCharges = 0

let cash = 0
let online = 0

let self = 0
let dsm = 0

data.forEach(e=>{

totalAmount += Number(e.amount || 0)
totalCharges += Number(e.charges || 0)

if(e.paymentMethod === "Cash") cash += e.amount
if(e.paymentMethod === "Online") online += e.amount

if(e.machine === "Self") self += e.amount
if(e.machine === "DSM") dsm += e.amount

})

return {
totalAmount,
totalCharges,
net: totalAmount - totalCharges,
cash,
online,
self,
dsm,
count: data.length
}

}


const handleGenerate = ()=>{

const filteredData = getReportData()

if(filteredData.length === 0){
alert("No data found")
return
}

if(format === "pdf"){
generatePDF(filteredData)
}else{
generateExcel(filteredData)
}

setReportOpen(false)

}

const generatePDF = (data)=>{

const summary = getSummary(data)

const doc = new jsPDF()

doc.setFontSize(16)
doc.text("Card Swipe Report",14,15)

doc.setFontSize(10)
doc.text(`From: ${fromDateTime || "All"}`,14,22)
doc.text(`To: ${toDateTime || "All"}`,14,28)

doc.text(`Machine: ${reportMachine || "All"}`,120,22)
doc.text(`Payment: ${reportPayment || "All"}`,120,28)

// 🔹 SUMMARY
doc.setFontSize(12)
doc.text("Summary",14,40)

doc.setFontSize(10)

doc.text(`Total Swipe: Rs.${summary.totalAmount}`,14,48)
doc.text(`Total Charges: Rs.${summary.totalCharges}`,14,54) 

doc.text(`Cash: Rs.${summary.cash}`,120,48)
doc.text(`Online: Rs.${summary.online}`,120,54)

doc.text(`Self: Rs.${summary.self}`,120,60)
doc.text(`DSM: Rs.${summary.dsm}`,120,66)

doc.text(`Transactions: ${summary.count}`,14,68)

// 🔹 TABLE
autoTable(doc,{
startY:75,
head:[["Date","Time","Amount","Charges","Machine","Payment"]],
body:data.map(e=>[
new Date(e.date).toLocaleDateString(),
e.time,
e.amount,
e.charges,
e.machine,
e.paymentMethod
]),
styles:{fontSize:8},
headStyles:{fillColor:[22,163,74]}
})

doc.save("CardSwipe_Report.pdf")

}

const generateExcel = (data)=>{

const summary = getSummary(data)

const formatted = data.map((e,i)=>({
ID:i+1,
Date:new Date(e.date).toLocaleDateString(),
Time:e.time,
Amount:e.amount,
Charges:e.charges,
Machine:e.machine,
Payment:e.paymentMethod
}))

const ws = XLSX.utils.json_to_sheet(formatted)

const wb = XLSX.utils.book_new()

// DATA SHEET
XLSX.utils.book_append_sheet(wb,ws,"Data")

// SUMMARY SHEET
const summarySheet = XLSX.utils.json_to_sheet([summary])
XLSX.utils.book_append_sheet(wb,summarySheet,"Summary")

XLSX.writeFile(wb,"CardSwipe_Report.xlsx")

}


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
className="input  text-white [&::-webkit-calendar-picker-indicator]:invert"
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

<div className="flex justify-end mb-2 gap-1">
<button
onClick={()=>setReportOpen(true)}
className="bg-purple-600 text-white px-4 py-2 rounded"
>
Generate Report
</button>

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
<div>
    {reportOpen && (

<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] p-6 rounded-xl w-[350px] text-white">

<h2 className="text-lg font-semibold mb-4">
Generate Report
</h2>

<div className="flex flex-col gap-3">

<input
type="datetime-local"
value={fromDateTime}
onChange={(e)=>setFromDateTime(e.target.value)}
className="border p-2 bg-transparent rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
/>

<input
type="datetime-local"
value={toDateTime}
onChange={(e)=>setToDateTime(e.target.value)}
className="border p-2 bg-transparent rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
/>

<select
value={reportMachine}
onChange={(e)=>setReportMachine(e.target.value)}
className="border p-2 bg-[#0B0F17] rounded"
>
<option value="">All Machine</option>
<option value="Self">Self</option>
<option value="DSM">DSM</option>
</select>

<select
value={reportPayment}
onChange={(e)=>setReportPayment(e.target.value)}
className="border p-2 bg-[#0B0F17] rounded"
>
<option value="">All Payment</option>
<option value="Cash">Cash</option>
<option value="Online">Online</option>
</select>

<select
value={format}
onChange={(e)=>setFormat(e.target.value)}
className="border p-2 bg-[#0B0F17] rounded"
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