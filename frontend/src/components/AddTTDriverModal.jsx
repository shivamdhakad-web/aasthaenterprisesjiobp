import { useState, useEffect } from "react"
import { addDriver, updateDriver } from "../services/ttDriverApi"

export default function AddTTDriverModal({open,onClose,onSave,editData}){

const [form,setForm] = useState({
name:"",
number:"",
ttNumber:"",
transportName:"",
short:"",
remark:""
})

useEffect(()=>{

if(editData){

setForm({
name:editData.name || "",
number:editData.number || "",
ttNumber:editData.ttNumber || "",
transportName:editData.transportName || "",
short:editData.short || "",
remark:editData.remark || ""
})

}

},[editData])


if(!open) return null


const handleChange = (e)=>{

setForm({...form,[e.target.name]:e.target.value})

}


const handleSave = async()=>{

if(editData){

await updateDriver(editData._id,form)

}else{

await addDriver(form)

}

onSave()
onClose()

setForm({
name:"",
number:"",
ttNumber:"",
transportName:"",
short:"",
remark:""
})

}


return(

<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] border border-[#1F2937] p-6 rounded w-[420px]">

<h2 className="text-lg mb-4">

{editData ? "Edit T.T Driver" : "Add T.T Driver"}

</h2>


<div className="grid gap-3">

<input
placeholder="Driver Name"
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
placeholder="T.T Number"
name="ttNumber"
value={form.ttNumber}
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
placeholder="Short"
name="short"
value={form.short}
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