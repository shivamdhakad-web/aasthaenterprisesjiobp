import { useState,useEffect } from "react"

import {
addCustomerDriver,
updateCustomerDriver
} from "../services/customerDriverApi"


export default function AddCustomerDriverModal({open,onClose,onSave,editData}){

const [form,setForm] = useState({

name:"",
number:"",
gadiNumber:"",
transportName:"",
route:"",
carrierId:"",
remark:""

})


useEffect(()=>{

if(editData){

setForm(editData)

}

},[editData])


if(!open) return null


const handleChange = (e)=>{

setForm({...form,[e.target.name]:e.target.value})

}


const handleSave = async()=>{

if(editData){

await updateCustomerDriver(editData._id,form)

}else{

await addCustomerDriver(form)

}

onSave()
onClose()

setForm({

name:"",
number:"",
gadiNumber:"",
transportName:"",
route:"",
carrierId:"",
remark:""

})

}


return(

<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] border border-[#1F2937] p-6 rounded w-[420px]">


<h2 className="text-lg mb-4">

{editData ? "Edit Driver" : "Add Driver"}

</h2>


<div className="grid gap-3">


<input
placeholder="Name"
name="name"
value={form.name}
onChange={handleChange}
className="input"
/>


<input
placeholder="Mobile Number"
name="number"
value={form.number}
onChange={handleChange}
className="input"
/>


<input
placeholder="Gadi Number"
name="gadiNumber"
value={form.gadiNumber}
onChange={handleChange}
className="input"
/>


<input
placeholder="Transport Name"
name="transportName"
value={form.transportName}
onChange={handleChange}
className="input"
/>


<input
placeholder="Route"
name="route"
value={form.route}
onChange={handleChange}
className="input"
/>


<input
placeholder="Carrier ID"
name="carrierId"
value={form.carrierId}
onChange={handleChange}
className="input"
/>


<input
placeholder="Remark"
name="remark"
value={form.remark}
onChange={handleChange}
className="input"
/>


</div>


<div className="flex justify-end gap-3 mt-5">


<button
className="px-4 py-2 bg-gray-600 rounded"
onClick={onClose}
>
Cancel
</button>


<button
className="px-4 py-2 bg-blue-500 rounded"
onClick={handleSave}
>
Save
</button>


</div>


</div>

</div>

)

}