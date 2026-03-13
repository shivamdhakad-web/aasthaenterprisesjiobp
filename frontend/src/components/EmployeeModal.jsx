import { useState,useEffect } from "react"

export default function EmployeeModal({open,onClose,onSave,editData}){

const emptyForm = {
name:"",
phone:"",
role:"",
shift:"",
salary:"",
tshirt:"",
pant:"",
shoes:""
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

<div className="bg-[#0B0F17] border border-[#1F2937] p-6 rounded-lg w-[420px] shadow-xl">

<h2 className="text-lg font-semibold mb-4">

{editData ? "Edit Employee" : "Add Employee"}

</h2>


<div className="grid grid-cols-2 gap-3">

<input
name="name"
placeholder="Name"
value={form.name}
onChange={handleChange}
className="input"
/>

<input
name="phone"
placeholder="Phone"
value={form.phone}
onChange={handleChange}
className="input"
/>

<input
name="role"
placeholder="Role"
value={form.role}
onChange={handleChange}
className="input"
/>

<input
name="shift"
placeholder="Shift"
value={form.shift}
onChange={handleChange}
className="input"
/>

<input
name="salary"
placeholder="Salary"
value={form.salary}
onChange={handleChange}
className="input"
/>

<input
name="tshirt"
placeholder="Tshirt Size"
value={form.tshirt}
onChange={handleChange}
className="input"
/>

<input
name="pant"
placeholder="Pant Size"
value={form.pant}
onChange={handleChange}
className="input"
/>

<input
name="shoes"
placeholder="Shoes Size"
value={form.shoes}
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
className="px-4 py-1 bg-blue-500 rounded"
onClick={()=>onSave(form)}
>
Save
</button>

</div>

</div>

</div>

)

}