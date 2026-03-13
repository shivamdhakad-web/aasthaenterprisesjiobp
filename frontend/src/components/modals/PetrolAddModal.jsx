import {useState} from "react"
import {addPetrolSale} from "../../services/petrolApi"

export default function PetrolAddModal({close,reload}){

const [form,setForm]=useState({
date:"",
liters:"",
price:"",
description:""
})

const handleChange=(e)=>{
setForm({...form,[e.target.name]:e.target.value})
}

const handleSubmit=async()=>{

await addPetrolSale(form)

reload()

close()

}

return(

<div className="fixed inset-0 z-5 flex items-center justify-center bg-black/70">

<div className="bg-[#0A0D14] border border-[#1A1D26] w-[500px] p-6 rounded-xl">

<h2 className="text-white text-lg mb-4">
Add Petrol Sale
</h2>

<input
type="date"
name="date"
onChange={handleChange}
className="w-full mb-3 p-2 bg-black border border-[#1A1F2E]"
/>

<input
type="number"
name="liters"
placeholder="Liters"
onChange={handleChange}
className="w-full mb-3 p-2 bg-black border border-[#1A1F2E]"
/>

<input
type="number"
name="price"
placeholder="Price"
onChange={handleChange}
className="w-full mb-3 p-2 bg-black border border-[#1A1F2E]"
/>

<textarea
name="description"
placeholder="Description"
onChange={handleChange}
className="w-full mb-4 p-2 bg-black border border-[#1A1F2E]"
/>

<div className="flex gap-2">

<button
onClick={handleSubmit}
className="bg-red-500 text-white px-4 py-2 rounded w-full"
>
Add
</button>

<button
onClick={close}
className="border border-gray-600 px-4 py-2 rounded w-full text-gray-300"
>
Cancel
</button>

</div>

</div>

</div>

)
}