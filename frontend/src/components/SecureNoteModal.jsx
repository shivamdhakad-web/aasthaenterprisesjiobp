import { useState,useEffect } from "react"
import { addNote,updateNote } from "../services/secureNoteApi"

export default function SecureNoteModal({open,onClose,onSave,editData}){

const [form,setForm] = useState({
title:"",
website:"",
username:"",
password:"",
note:"",
color:""
})

useEffect(()=>{

if(editData){

setForm(editData)

}

},[editData])


if(!open) return null


const handleChange = (e)=>{

setForm({
...form,
[e.target.name]:e.target.value
})

}



const handleSave = async()=>{

// RANDOM NOTE COLOR

const colors=[
"bg-yellow-200",
"bg-green-200",
"bg-blue-200",
"bg-purple-300",
"bg-pink-300",
"bg-orange-200"
]

const randomColor = colors[Math.floor(Math.random()*colors.length)]

const data={
...form,
color: randomColor
}


if(editData){

await updateNote(editData._id,data)

}else{

await addNote(data)

}


onSave()
onClose()

setForm({
title:"",
website:"",
username:"",
password:"",
note:"",
color:""
})

}



return(

<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">


<div className="bg-[#0B0F17] p-6 rounded-xl w-[420px] text-white">

<h2 className="text-lg font-semibold mb-4">

{editData ? "Edit Secure Note" : "Add Secure Note"}

</h2>


<div className="flex flex-col gap-3">

<input
name="title"
placeholder="Title"
value={form.title}
onChange={handleChange}
className="border border-gray-600 bg-transparent p-2 rounded"
/>


<input
name="website"
placeholder="Website"
value={form.website}
onChange={handleChange}
className="border border-gray-600 bg-transparent p-2 rounded"
/>


<input
name="username"
placeholder="Username"
value={form.username}
onChange={handleChange}
className="border border-gray-600 bg-transparent p-2 rounded"
/>


<input
name="password"
placeholder="Password"
value={form.password}
onChange={handleChange}
className="border border-gray-600 bg-transparent p-2 rounded"
/>


<textarea
name="note"
placeholder="Note"
value={form.note}
onChange={handleChange}
className="border border-gray-600 bg-transparent p-2 rounded"
/>

</div>



<div className="flex justify-end gap-3 mt-5">

<button
onClick={onClose}
className="px-4 py-2 bg-gray-600 rounded"
>

Cancel

</button>


<button
onClick={handleSave}
className="px-4 py-2 bg-green-500 rounded"
>

Save

</button>


</div>


</div>


</div>

)

}