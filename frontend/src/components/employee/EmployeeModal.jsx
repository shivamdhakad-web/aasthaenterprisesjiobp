// import {useState,useEffect} from "react"

// export default function EmployeeModal({close,save,data}){

// const [form,setForm] = useState({

// name:"",
// role:"Employee",
// shift:"Morning",
// phone:"",
// status:"Active",
// joined:""

// })

// useEffect(()=>{

// if(data){

// setForm(data)

// }

// },[data])

// const change=(e)=>{

// setForm({
// ...form,
// [e.target.name]:e.target.value
// })

// }

// return(

// <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

// <div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-6 w-[420px]">

// <h2 className="text-white mb-4">
// Add Employee
// </h2>

// <div className="space-y-3">

// <input
// name="name"
// placeholder="Employee Name"
// value={form.name}
// onChange={change}
// className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
// />

// <select
// name="role"
// value={form.role}
// onChange={change}
// className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
// >

// <option>Manager</option>
// <option>Employee</option>

// </select>

// <select
// name="shift"
// value={form.shift}
// onChange={change}
// className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
// >

// <option>Morning</option>
// <option>Evening</option>
// <option>Night</option>

// </select>

// <input
// name="phone"
// placeholder="Phone"
// value={form.phone}
// onChange={change}
// className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
// />

// <select
// name="status"
// value={form.status}
// onChange={change}
// className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
// >

// <option>Active</option>
// <option>On Leave</option>

// </select>

// <input
// type="date"
// name="joined"
// value={form.joined}
// onChange={change}
// className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
// />

// </div>

// <div className="flex justify-end gap-3 mt-5">

// <button
// onClick={close}
// className="border border-gray-600 px-4 py-2 rounded text-gray-300"
// >
// Cancel
// </button>

// <button
// onClick={()=>save(form)}
// className="bg-red-600 px-4 py-2 rounded text-white"
// >
// Done
// </button>

// </div>

// </div>

// </div>

// )

// }

import { useState,useEffect } from "react"

export default function EmployeeModal({close,save,data}){

const [form,setForm] = useState({

name:"",
role:"",
shift:"",
phone:"",
joined:"",
tshirtSize:"",
pantSize:"",
shoesSize:""

})

useEffect(()=>{

if(data){

setForm(data)

}

},[data])

const change = (e)=>{

setForm({
...form,
[e.target.name]:e.target.value
})

}

const submit = ()=>{

save(form)

}

return(

<div className="fixed inset-0 bg-black/50 flex justify-center items-center">

<div className="bg-[#0B0F17] p-6 rounded-xl w-[400px] text-white">

<h2 className="text-xl mb-4">
Employee
</h2>

<div className="flex flex-col gap-3">

<input name="name" placeholder="Name" value={form.name} onChange={change} className="p-2 bg-[#111827] rounded"/>

<input name="role" placeholder="Role" value={form.role} onChange={change} className="p-2 bg-[#111827] rounded"/>

<input name="shift" placeholder="Shift" value={form.shift} onChange={change} className="p-2 bg-[#111827] rounded"/>

<input name="phone" placeholder="Phone" value={form.phone} onChange={change} className="p-2 bg-[#111827] rounded"/>

<input name="joined" type="date" value={form.joined} onChange={change} className="p-2 bg-[#111827] rounded"/>

<input name="tshirtSize" placeholder="Tshirt Size" value={form.tshirtSize} onChange={change} className="p-2 bg-[#111827] rounded"/>

<input name="pantSize" placeholder="Pant Size" value={form.pantSize} onChange={change} className="p-2 bg-[#111827] rounded"/>

<input name="shoesSize" placeholder="Shoes Size" value={form.shoesSize} onChange={change} className="p-2 bg-[#111827] rounded"/>

</div>

<div className="flex justify-end gap-3 mt-5">

<button
onClick={close}
className="px-4 py-2 bg-gray-600 rounded"
>
Cancel
</button>

<button
onClick={submit}
className="px-4 py-2 bg-red-600 rounded"
>
Save
</button>

</div>

</div>

</div>

)

}