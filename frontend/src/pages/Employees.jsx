import { useEffect,useState } from "react"

import {
getEmployees,
addEmployee,
updateEmployee,
deleteEmployee
} from "../services/employeeApi"

import {
getAttendance,
addAttendance,
updateAttendance,
deleteAttendance
} from "../services/attendanceApi"

import EmployeeModal from "../components/EmployeeModal"
import AttendanceModal from "../components/AttendanceModal"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function Employees(){

const [employees,setEmployees] = useState([])
const [search,setSearch] = useState("")

const [modalOpen,setModalOpen] = useState(false)
const [editEmployee,setEditEmployee] = useState(null)

const [attendance,setAttendance] = useState([])
const [selectedEmployee,setSelectedEmployee] = useState(null)

const [attendanceModal,setAttendanceModal] = useState(false)
const [editAttendance,setEditAttendance] = useState(null)

const [selectedMonth,setSelectedMonth] = useState("")

const [openCard,setOpenCard] = useState(null)
const [reportOpen,setReportOpen] = useState(false)
const [fromDate,setFromDate] = useState("")
const [toDate,setToDate] = useState("")

const [view,setView] = useState(
window.innerWidth < 640 ? "mobile" : "desktop"
)


const getFilteredByDate = () => {

return filteredAttendance.filter(a => {

const d = new Date(a.date)

return (
(!fromDate || d >= new Date(fromDate)) &&
(!toDate || d <= new Date(toDate))
)

})

}

useEffect(()=>{
const handleResize = ()=>{
if(window.innerWidth < 640){
setView("mobile")
}else{
setView("desktop")
}
}

handleResize()
window.addEventListener("resize",handleResize)
return ()=>window.removeEventListener("resize",handleResize)
},[])

const fetchEmployees = async()=>{

const data = await getEmployees()
setEmployees(data)

}

useEffect(()=>{

fetchEmployees()

},[])


const saveEmployee = async(data)=>{

if(editEmployee){

await updateEmployee(editEmployee._id,data)

}else{

await addEmployee(data)

}

setModalOpen(false)
setEditEmployee(null)

fetchEmployees()

}


const openLedger = async(emp)=>{

setSelectedEmployee(emp)

const data = await getAttendance(emp._id)

setAttendance(data)

}


const saveAttendance = async(data)=>{

if(editAttendance){

await updateAttendance(editAttendance._id,data)

}else{

await addAttendance(selectedEmployee._id,data)

}

setAttendanceModal(false)
setEditAttendance(null)

openLedger(selectedEmployee)

}


const removeEmployee = async(id)=>{

await deleteEmployee(id)

fetchEmployees()

}


const removeAttendance = async(id)=>{

await deleteAttendance(id)

openLedger(selectedEmployee)

}


/* SALARY CALCULATION */

const calculateSalary = ()=>{

if(!selectedEmployee) return {}

const salary = selectedEmployee.salary || 0

const perDay = salary / 30
const doublePay = salary / 15

let present=0
let absent=0
let dbl=0

let shortage=0
let advance=0

filteredAttendance.forEach(a=>{

if(a.status==="present") present++
if(a.status==="absent") absent++
if(a.status==="double") dbl++

shortage += Number(a.shortage || 0)

advance += Number(a.advanceCash || 0)
advance += Number(a.advancePetrol || 0)

})

const earned =
Math.round(present*perDay)+(dbl*doublePay)

const final =
earned + shortage - advance

return{
present,
absent,
dbl,
earned,
shortage,
advance,
final
}

}

const filteredAttendance = attendance.filter(a=>{

if(!selectedMonth) return true

const entryDate = new Date(a.date)

const entryMonth =
entryDate.toISOString().slice(0,7)

return entryMonth === selectedMonth

})

const deleteMonth = async()=>{

if(!selectedMonth){

alert("Select month first")

return

}

const confirmDelete =
window.confirm("Delete this month attendance?")

if(!confirmDelete) return

const toDelete =
attendance.filter(a=>{

const d = new Date(a.date)

return d.toISOString().slice(0,7) === selectedMonth

})

for(const a of toDelete){

await deleteAttendance(a._id)

}

openLedger(selectedEmployee)

}

let totalShortage = 0

filteredAttendance.forEach(a=>{

totalShortage += Number(a.shortage || 0)

})

const generateEmployeePDF = () => {

const filteredData = getFilteredByDate()

// =====================
// 🔹 SUMMARY CALCULATION
// =====================
let present=0, absent=0, dbl=0, shortage=0, advance=0

filteredData.forEach(a=>{
if(a.status==="present") present++
if(a.status==="absent") absent++
if(a.status==="double") dbl++

shortage += Number(a.shortage || 0)
advance += Number(a.advanceCash || 0)
advance += Number(a.advancePetrol || 0)
})

// =====================
// 🔹 DATE BASED SALARY
// =====================
const salary = selectedEmployee.salary || 0

const totalDays = filteredData.length || 1
const perDay = salary / totalDays
const doublePay = perDay * 2

const earned =
Math.round(present * perDay) +
Math.round(dbl * doublePay)

const final = earned + shortage - advance


// =====================
// 🔹 PDF START
// =====================
const doc = new jsPDF()

// HEADER
doc.setFont("helvetica","bold")
doc.setFontSize(18)
doc.text("Aastha Enterprises", 14, 18)

doc.setFontSize(12)
doc.setFont("helvetica","bold")
doc.text("Employee Attendance Report", 14, 26)


// EMPLOYEE INFO
doc.setFontSize(10)
doc.text(`Name: ${selectedEmployee.name}`, 14, 36)
doc.text(`Role: ${selectedEmployee.role}`, 14, 42)
doc.text(`From: ${fromDate || "All"}  To: ${toDate || "All"}`, 14, 48)


// LINE
doc.setDrawColor(200)
doc.line(14, 52, 196, 52)


// SUMMARY TITLE
doc.setFont("helvetica","bold")
doc.setFontSize(13)
doc.text("Summary", 14, 60)

// RESET FONT (IMPORTANT FIX)
doc.setFont("helvetica","normal")
doc.setFontSize(10)
doc.setCharSpace(0)

// ROW 1
doc.text("Present: " + present, 14, 70)
doc.text("Absent: " + absent, 80, 70)
doc.text("Double: " + dbl, 150, 70)

// ROW 2 (NO SPACE BUG NOW)
doc.text("Earned: Rs." + earned, 14, 75)
doc.text("Shortage: Rs." + shortage, 80, 75)
doc.text("Advance: Rs." + advance, 150, 75)

// FINAL
doc.setFont("helvetica","bold")
doc.setTextColor(0,150,0)
doc.text("Final Balance: Rs." + final, 14, 80)

doc.setTextColor(0,0,0)


// =====================
// 🔹 TABLE
// =====================
autoTable(doc,{
startY: 85,

head:[["Date","Status","Short","Cash","Petrol"]],

body: filteredData.map(a=>[
a.date?.slice(0,10),
a.status,
a.shortage,
a.advanceCash,
a.advancePetrol
]),

styles:{
fontSize:9,
cellPadding:4
},

headStyles:{
fillColor:[0,102,204],
textColor:255,
fontStyle:"bold"
},

alternateRowStyles:{
fillColor:[245,245,245]
}

})


// =====================
// 🔹 SAVE
// =====================
doc.save(`${selectedEmployee.name}_Report.pdf`)
}



const summary = calculateSalary()


return(

<div className="p-6 text-gray-300">

<h1 className="text-3xl mb-4 font-bold">Employees & Attendance</h1>


<div className="flex gap-3 mb-4">

<input
placeholder="Search employee"
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="input"
/>

<button
className="bg-blue-500 px-4 py-2 rounded"
onClick={()=>{
setEditEmployee(null)
setModalOpen(true)
}}
>
+ Add Employee
</button>

</div>




<div className="hidden sm:block overflow-x-auto">
<table className="table">

<thead>

<tr className="text-gray-400 border-b border-[#1F2937] bg-[#111827]">

<th>Name</th>
<th>Role</th>
<th>Shift</th>
<th>Phone</th>
<th>Salary</th>
<th>Tshirt</th>
<th>Pant</th>
<th>Shoes</th>
<th>Action</th>

</tr>

</thead>


<tbody>

{employees
.filter(e=>e.name.toLowerCase().includes(search.toLowerCase()))
.map(emp=>(

<tr
key={emp._id}
className="border-t border-[#1F2937] hover:bg-[#111827] cursor-pointer"
onClick={()=>openLedger(emp)}
>

<td>{emp.name}</td>
<td>{emp.role}</td>
<td>{emp.shift}</td>
<td>{emp.phone}</td>
<td>₹{emp.salary}</td>
<td>{emp.tshirt}</td>
<td>{emp.pant}</td>
<td>{emp.shoes}</td>

<td>

<button
className="text-blue-400 mr-2"
onClick={(e)=>{
e.stopPropagation()
setEditEmployee(emp)
setModalOpen(true)
}}
>
Edit
</button>

<button
className="text-red-400"
onClick={(e)=>{
e.stopPropagation()
removeEmployee(emp._id)
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

<div className="lg:hidden grid gap-4">
{employees
.filter(e=>e.name.toLowerCase().includes(search.toLowerCase()))
.map(emp=>{

const isOpen = openCard === emp._id

return(

<div
key={emp._id}
onClick={()=>{
if(isOpen){
setOpenCard(null)
setSelectedEmployee(null)
}else{
setOpenCard(emp._id)
}
}}
className="bg-[#0B0F17] border border-[#1F2937] rounded-2xl p-4 shadow-lg active:scale-95 transition"
>

{/* HEADER */}
<div className="flex justify-between items-center">

<div>
<p className="text-white font-semibold text-lg">
{emp.name}
</p>

<p className="text-gray-400 text-sm">
{emp.role} • Shift {emp.shift}
</p>
</div>

<p className="text-green-400 font-semibold">
₹{emp.salary}
</p>

</div>

{/* PHONE */}
<p className="text-gray-400 text-sm mt-2">
📞 {emp.phone}
</p>

{/* EXPAND */}
<div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[400px] mt-4" : "max-h-0"}`}>

<div className="border-t border-[#1F2937] pt-3 space-y-3">

<p className="text-sm text-gray-400">
👕 Tshirt: {emp.tshirt} | 👖 Pant: {emp.pant} | 👟 Shoes: {emp.shoes}
</p>

<div className="flex gap-3">

<button
onClick={(e)=>{
e.stopPropagation()
setEditEmployee(emp)
setModalOpen(true)
}}
className="flex-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 py-2 rounded-lg text-sm"
>
Edit
</button>

<button
onClick={(e)=>{
e.stopPropagation()
removeEmployee(emp._id)
}}
className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 py-2 rounded-lg text-sm"
>
Delete
</button>

</div>

{/* OPEN ATTENDANCE */}
<button
onClick={(e)=>{
e.stopPropagation()

if(selectedEmployee?._id === emp._id){
setSelectedEmployee(null) 
}else{
openLedger(emp)
}

}}
className="w-full bg-green-500/10 border border-green-500/30 text-green-400 py-2 rounded-lg text-sm"
>
View Attendance
</button>

</div>

</div>

</div>

)

})}
</div>

{view === "desktop" && selectedEmployee &&(

<div className="mt-6 bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

<div className="flex justify-between items-center mb-3">

<h2 className="text-lg">
Attendance : {selectedEmployee.name}
</h2>

<div className="bg-[#0B0F17] border border-[#1F2937] p-3 rounded w-[200px]">

Total Shortage : 

<span className={totalShortage >= 0 ? "text-green-400":"text-red-400"}>

₹{totalShortage}

</span>

</div>

<div className="flex gap-2">

<input
type="month"
value={selectedMonth}
onChange={(e)=>setSelectedMonth(e.target.value)}
className="input w-[180px]"
/>

<button
className="btn btn-green"
onClick={()=>{
setEditAttendance(null)
setAttendanceModal(true)
}}
>
+ Add
</button>

<button
className="btn btn-purple"
onClick={()=>setReportOpen(true)}
>
PDF
</button>

<button
className="btn btn-red"
onClick={deleteMonth}
>
Delete Month
</button>

</div>

</div>



<div className="grid grid-cols-3 gap-4 mb-4">

<div className="card">
Present : {summary.present}
</div>

<div className="card">
Absent : {summary.absent}
</div>

<div className="card">
Double : {summary.dbl}
</div>

<div className="card">
Earned : ₹{Math.round(summary.earned)}
</div>

<div className="card">
Shortage : ₹{summary.shortage}
</div>

<div className="card">
Advance : ₹{summary.advance}
</div>

<div className="card col-span-3 text-lg">
Final Balance : ₹{Math.round(summary.final)}
</div>

</div>


<button
className="bg-green-500 px-3 py-1 rounded mb-2"
onClick={()=>{
setEditAttendance(null)
setAttendanceModal(true)
}}
>
+ Add
</button>

<table className="table">

<thead>

<tr className="text-gray-400 border-b border-[#1F2937]">

<th>Date</th>
<th>Status</th>
<th>Short</th>
<th>Cash</th>
<th>Petrol</th>
<th>Action</th>

</tr>

</thead>


<tbody>

{filteredAttendance.map(a=>(

<tr key={a._id} className="border-t border-[#1F2937]">

<td>{a.date?.slice(0,10)}</td>
<td>{a.status}</td>
<td
className={
Number(a.shortage) >= 0
? "text-green-400"
: "text-red-400"
}
>
{Number(a.shortage) > 0 ? `+${a.shortage}` : a.shortage}
</td>
<td>{a.advanceCash}</td>
<td>{a.advancePetrol}</td>

<td>

<button
className="text-blue-400 mr-2"
onClick={()=>{
setEditAttendance(a)
setAttendanceModal(true)
}}
>
Edit
</button>

<button
className="text-red-400"
onClick={()=>removeAttendance(a._id)}
>
Delete
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

)}

{view === "mobile" && selectedEmployee && (

<div className="mt-6 space-y-4">

<div className="bg-[#0B0F17] p-4 rounded-xl border border-[#1F2937]">

<p className="text-white font-semibold text-lg">
👤 {selectedEmployee.name}
</p>

<p className="text-gray-400 text-sm">
Attendance Summary
</p>

</div>


<div className="grid grid-cols-2 gap-3">

<div className="card">Present: {summary.present}</div>
<div className="card">Absent: {summary.absent}</div>
<div className="card">Double: {summary.dbl}</div>
<div className="card">Earned: ₹{summary.earned}</div>
<div className="card text-red-400">Short: ₹{summary.shortage}</div>
<div className="card text-yellow-400">Advance: ₹{summary.advance}</div>

<div className="col-span-2 bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-center text-lg font-semibold">
Final Balance: ₹{summary.final}
</div>

</div>

<div className="flex gap-2">

<input
type="month"
value={selectedMonth}
onChange={(e)=>setSelectedMonth(e.target.value)}
className="input flex-1"
/>

<button
onClick={()=>setAttendanceModal(true)}
className="btn btn-green"
>
+ Add
</button>

<button
onClick={()=>window.print()}
className="btn btn-purple"
>
PDF
</button>

</div>

<div className="space-y-3">

{filteredAttendance.map(a=>(

<div
key={a._id}
className="bg-[#0B0F17] border border-[#1F2937] rounded-xl p-3"
>

<p className="text-gray-400 text-sm">
📅 {a.date?.slice(0,10)}
</p>

<p className="text-white text-sm">
Status: {a.status}
</p>

<p className={Number(a.shortage)>=0 ? "text-green-400":"text-red-400"}>
Short: {a.shortage}
</p>

<p className="text-sm text-gray-400">
Cash: {a.advanceCash} | Petrol: {a.advancePetrol}
</p>

<div className="flex gap-3 mt-2">

<button
onClick={()=>{
setEditAttendance(a)
setAttendanceModal(true)
}}
className="flex-1 bg-blue-500/10 text-blue-400 py-1 rounded"
>
Edit
</button>

<button
onClick={()=>removeAttendance(a._id)}
className="flex-1 bg-red-500/10 text-red-400 py-1 rounded"
>
Delete
</button>

</div>

</div>

))}

</div>

</div>

)}



{reportOpen && (

<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] border border-[#1F2937] p-6 rounded-xl w-[350px] text-white">

<h2 className="text-lg font-semibold mb-4">
Generate Report
</h2>

<p className="text-sm text-gray-400 mb-3">
Select date range
</p>

<div className="flex flex-col gap-3">

<input
type="date"
value={fromDate}
onChange={(e)=>setFromDate(e.target.value)}
className="bg-[#111827] border border-[#1F2937] p-2 rounded"
/>

<input
type="date"
value={toDate}
onChange={(e)=>setToDate(e.target.value)}
className="bg-[#111827] border border-[#1F2937] p-2 rounded"
/>

</div>

<div className="flex justify-end gap-3 mt-5">

<button
onClick={()=>setReportOpen(false)}
className="bg-gray-600 px-3 py-1 rounded"
>
Cancel
</button>

<button
onClick={()=>{
generateEmployeePDF()
setReportOpen(false)
}}
className="bg-green-600 px-3 py-1 rounded"
>
Download
</button>

</div>

</div>

</div>

)}




<EmployeeModal
open={modalOpen}
onClose={()=>setModalOpen(false)}
onSave={saveEmployee}
editData={editEmployee}
/>

<AttendanceModal
open={attendanceModal}
onClose={()=>setAttendanceModal(false)}
onSave={saveAttendance}
editData={editAttendance}
/>

</div>

)

}