import { useState, useEffect } from "react"

export default function MeterModal({ close, save, data }) {

const [form,setForm] = useState({
nozzle:"",
shift:"Morning",
opening:"",
closing:"",
date:""
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

return(

<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-6 w-[400px]">

<h2 className="text-white text-lg mb-6">
Add Reading
</h2>

<div className="space-y-4">

<input
name="nozzle"
placeholder="Nozzle (N01)"
value={form.nozzle}
onChange={change}
className="w-full bg-[#111827] border border-[#1F2937] rounded px-3 py-2 text-white"
/>

<select
name="shift"
value={form.shift}
onChange={change}
className="w-full bg-[#111827] border border-[#1F2937] rounded px-3 py-2 text-white"
>

<option>Morning</option>
<option>Evening</option>

</select>

<input
name="opening"
placeholder="Opening"
value={form.opening}
onChange={change}
className="w-full bg-[#111827] border border-[#1F2937] rounded px-3 py-2 text-white"
/>

<input
name="closing"
placeholder="Closing"
value={form.closing}
onChange={change}
className="w-full bg-[#111827] border border-[#1F2937] rounded px-3 py-2 text-white"
/>

<input
name="date"
type="date"
value={form.date}
onChange={change}
className="w-full bg-[#111827] border border-[#1F2937] rounded px-3 py-2 text-white"
/>

</div>

<div className="flex justify-end gap-3 mt-6">

<button
onClick={close}
className="px-4 py-2 border border-gray-600 rounded text-gray-300"
>
Cancel
</button>

<button
onClick={()=>save(form)}
className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
>
Done
</button>

</div>

</div>

</div>

)

}