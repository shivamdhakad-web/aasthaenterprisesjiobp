import { useState,useEffect } from "react"

export default function AttendanceModal({open,onClose,onSave,editData}){

const emptyForm = {

date:"",
status:"present",
shortage:"",
advanceCash:"",
advancePetrol:"",
remark:""

}

const [form,setForm] = useState(emptyForm)


useEffect(()=>{

if(editData){

setForm(editData)

}else{

setForm(emptyForm)

}

},[editData,open])


if(!open) return null


const handleChange = (e)=>{

setForm({...form,[e.target.name]:e.target.value})

}


return(

<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] border border-[#1F2937] p-6 rounded-lg w-[400px] shadow-xl">

<h2 className="text-lg font-semibold mb-4">

{editData ? "Edit Attendance" : "Add Attendance"}

</h2>


<div className="grid gap-3">

<input
type="date"
name="date"
value={form.date}
onChange={handleChange}
className="input text-white [&::-webkit-calendar-picker-indicator]:invert"
/>


<select
name="status"
value={form.status}
onChange={handleChange}
className="input"
>

<option value="present">Present</option>
<option value="absent">Absent</option>
<option value="double">Double Shift</option>

</select>


<input
type="number"
name="shortage"
placeholder="Shortage (+ / -)"
value={form.shortage}
onChange={handleChange}
className="input"
/>


<input
name="advanceCash"
placeholder="Advance Cash"
value={form.advanceCash}
onChange={handleChange}
className="input"
/>


<input
name="advancePetrol"
placeholder="Advance Petrol"
value={form.advancePetrol}
onChange={handleChange}
className="input"
/>


<input
name="remark"
placeholder="Remark"
value={form.remark}
onChange={handleChange}
className="input"
/>

</div>


<div className="flex justify-end gap-3 mt-5">

<button
className="px-4 py-1 bg-gray-600 rounded"
onClick={onClose}
>
Cancel
</button>

<button
className="px-4 py-1 bg-green-500 rounded"
onClick={()=>onSave(form)}
>
Save
</button>

</div>

</div>

</div>

)

}