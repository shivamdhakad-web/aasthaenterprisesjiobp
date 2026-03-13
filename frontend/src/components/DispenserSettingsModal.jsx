import { useState,useEffect } from "react"

export default function DispenserSettingsModal({open,onClose,onSave,data}){

const [form,setForm] = useState({

openingStock:"",
currentStock:"",
margin:"",
dieselPerKM:""

})

useEffect(()=>{

if(data){

setForm(data)

}

},[data])


if(!open) return null


const handleChange = (e)=>{

setForm({...form,[e.target.name]:e.target.value})

}


return(

<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] border border-[#1F2937] p-6 rounded w-[400px]">

<h2 className="text-lg mb-4">

Dispenser Settings

</h2>


<div className="grid gap-3">


<input
name="openingStock"
placeholder="Opening Stock"
value={form.openingStock}
onChange={handleChange}
className="input"
/>


<input
name="currentStock"
placeholder="Current Stock"
value={form.currentStock}
onChange={handleChange}
className="input"
/>


<input
name="margin"
placeholder="Margin / Liter"
value={form.margin}
onChange={handleChange}
className="input"
/>


<input
name="dieselPerKM"
placeholder="Diesel Cost / KM"
value={form.dieselPerKM}
onChange={handleChange}
className="input"
/>


</div>


<div className="flex justify-end gap-3 mt-4">

<button
className="bg-gray-600 px-4 py-2 rounded"
onClick={onClose}
>
Cancel
</button>


<button
className="bg-green-500 px-4 py-2 rounded"
onClick={()=>onSave(form)}
>
Save
</button>

</div>


</div>

</div>

)

}