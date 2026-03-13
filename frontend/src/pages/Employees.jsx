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

const printPDF = ()=>{

window.print()

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


{selectedEmployee &&(

<div className="mt-6 bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

{/* add */}
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
onClick={()=>window.print()}
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


{/* SUMMARY */}

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
Earned : ₹{summary.earned}
</div>

<div className="card">
Shortage : ₹{summary.shortage}
</div>

<div className="card">
Advance : ₹{summary.advance}
</div>

<div className="card col-span-3 text-lg">
Final Balance : ₹{summary.final}
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