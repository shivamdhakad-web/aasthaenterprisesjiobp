import { useState } from "react"

export default function DensityModal({close}){

const [quantity,setQuantity] = useState("")
const [weight,setWeight] = useState("")
const [density,setDensity] = useState(null)

const calculate = ()=>{

if(quantity && weight){

const d = weight / quantity

setDensity(d.toFixed(3))

}

}

return(

<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-6 w-[380px]">

<h2 className="text-white text-lg mb-5">
Density Calculator
</h2>

<div className="space-y-3">

<input
placeholder="Quantity (L)"
value={quantity}
onChange={(e)=>setQuantity(e.target.value)}
className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
/>

<input
placeholder="Weight (kg)"
value={weight}
onChange={(e)=>setWeight(e.target.value)}
className="w-full bg-[#111827] p-2 rounded border border-[#1F2937] text-white"
/>

<button
onClick={calculate}
className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded text-white"
>
Calculate Density
</button>

{density &&

<div className="bg-[#111827] p-3 rounded text-center text-green-400">

Density = {density}

</div>

}

</div>

<div className="flex justify-end mt-5">

<button
onClick={close}
className="border border-gray-600 px-4 py-2 rounded text-gray-300"
>
Close
</button>

</div>

</div>

</div>

)

}