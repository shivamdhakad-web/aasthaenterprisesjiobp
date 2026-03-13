import { useState } from "react"

export default function AddDispenserModal({open,onClose,onSave}){

const [form,setForm] = useState({

date:"",
stockAdd:"",
startNozzle:"",
endNozzle:"",
startKM:"",
endKM:""

})

if(!open) return null


const handleChange = (e)=>{

setForm({...form,[e.target.name]:e.target.value})

}


return(

<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] border border-[#1F2937] p-6 rounded w-[400px]">

<h2 className="text-lg mb-4">

Add Mobile Dispenser Entry

</h2>


<div className="grid gap-3">


<input
type="date"
name="date"
value={form.date}
onChange={handleChange}
className="input text-white [&::-webkit-calendar-picker-indicator]:invert"
/>

<input
placeholder="Stock Add (Liter)"
name="stockAdd"
value={form.stockAdd}
onChange={handleChange}
className="input"
/>

<input
placeholder="Start Nozzle"
name="startNozzle"
value={form.startNozzle}
onChange={handleChange}
className="input"
/>


<input
placeholder="End Nozzle"
name="endNozzle"
value={form.endNozzle}
onChange={handleChange}
className="input"
/>


<input
placeholder="Start KM"
name="startKM"
value={form.startKM}
onChange={handleChange}
className="input"
/>


<input
placeholder="End KM"
name="endKM"
value={form.endKM}
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
className="bg-blue-500 px-4 py-2 rounded"
onClick={()=>onSave(form)}
>
Save
</button>

</div>


</div>

</div>

)

}