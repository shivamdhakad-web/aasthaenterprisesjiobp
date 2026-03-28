
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