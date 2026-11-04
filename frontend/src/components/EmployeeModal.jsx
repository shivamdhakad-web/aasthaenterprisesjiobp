import { useEffect, useState } from "react"

export default function EmployeeModal({open,onClose,onSave,editData}){

const emptyForm = {
name:"",
status:"Active",
phone:"",
role:"",
shift:"",
salary:"",
loginPassword:"",
tshirt:"",
pant:"",
shoes:""
}

const [form,setForm] = useState(() =>
  editData ? { ...emptyForm, ...editData, status: editData.status || "Active" } : emptyForm,
)

useEffect(() => {
  setForm(editData ? { ...emptyForm, ...editData, status: editData.status || "Active" } : emptyForm)
}, [editData])


if(!open) return null


const handleChange = (e)=>{

setForm({...form,[e.target.name]:e.target.value})

}


return(

<div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6">

<div className="my-auto max-h-[calc(100dvh-1.5rem)] w-[min(420px,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6">

<h2 className="text-lg font-semibold mb-4">

{editData ? "Edit Employee" : "Add Employee"}

</h2>


<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

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

<label className="block text-sm text-slate-300">
  Employment Status
  <select
    name="status"
    value={form.status}
    onChange={handleChange}
    className="input mt-1"
  >
    <option value="Active">Active</option>
    <option value="Not Active">Not Active</option>
  </select>
</label>

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
name="loginPassword"
type="password"
placeholder="Employee Login Password"
value={form.loginPassword}
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


<div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row">

<button
className="px-4 py-1 bg-gray-600 rounded"
type="button"
onClick={onClose}
>
Cancel
</button>

<button
className="px-4 py-1 bg-blue-500 rounded"
type="button"
onClick={()=>onSave(form)}
>
Save
</button>

</div>

</div>

</div>

)

}
