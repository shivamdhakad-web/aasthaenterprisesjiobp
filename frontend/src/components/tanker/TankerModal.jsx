import {useState,useEffect} from "react"

export default function TankerModal({close,save,data}){

const [form,setForm] = useState({

supplier:"",
fuel:"Petrol",
quantity:"",
density:"",
date:"",
invoice:""

})

useEffect(()=>{

if(data){

setForm(data)

}

},[data])

const change=(e)=>{

setForm({
...form,
[e.target.name]:e.target.value
})

}

return(

<div className="fixed inset-0 bg-black/60 flex items-center justify-center">

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-6 w-[420px]">

<h2 className="text-white mb-4">
Record Delivery
</h2>

<div className="space-y-3">

<input
name="supplier"
placeholder="Supplier"
value={form.supplier}
onChange={change}
className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
/>

<select
name="fuel"
value={form.fuel}
onChange={change}
className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
>

<option>Petrol</option>
<option>Diesel</option>
<option>Premium</option>

</select>

<input
name="quantity"
placeholder="Quantity (L)"
value={form.quantity}
onChange={change}
className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
/>

<input
name="density"
placeholder="Density"
value={form.density}
onChange={change}
className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
/>

<input
type="date"
name="date"
value={form.date}
onChange={change}
className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
/>

<input
name="invoice"
placeholder="Invoice Number"
value={form.invoice}
onChange={change}
className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
/>

</div>

<div className="flex justify-end gap-3 mt-5">

<button
onClick={close}
className="border border-gray-600 px-4 py-2 rounded text-gray-300"
>
Cancel
</button>

<button
onClick={()=>save(form)}
className="bg-blue-600 px-4 py-2 rounded text-white"
>
Done
</button>

</div>

</div>

</div>

)

}