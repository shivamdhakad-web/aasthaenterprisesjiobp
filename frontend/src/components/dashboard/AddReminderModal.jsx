import {useState} from "react"
import {addReminder} from "../../services/reminderApi"

export default function AddReminderModal({close,refresh}){

const [title,setTitle] = useState("")
const [description,setDescription] = useState("")
const [dateTime,setDateTime] = useState("")

const save = async()=>{

await addReminder({
title,
description,
dateTime
})

refresh()
close()

}

return(

<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-6 w-[360px]">

<h2 className="text-white mb-5">
Add Reminder
</h2>

<input
placeholder="Reminder title"
value={title}
onChange={(e)=>setTitle(e.target.value)}
className="w-full mb-3 bg-[#111827] border border-[#1F2937] rounded px-3 py-2 text-white"
/>

<textarea
placeholder="Description"
value={description}
onChange={(e)=>setDescription(e.target.value)}
className="w-full mb-3 bg-[#111827] border border-[#1F2937] rounded px-3 py-2 text-white"
/>

<input
type="datetime-local"
value={dateTime}
onChange={(e)=>setDateTime(e.target.value)}
className="w-full mb-6 bg-[#111827] border border-[#1F2937] rounded px-3 py-2 text-white"
/>

<div className="flex justify-end gap-3">

<button
onClick={close}
className="px-4 py-2 border border-gray-600 rounded text-gray-300"
>
Cancel
</button>

<button
onClick={save}
className="px-4 py-2 bg-blue-600 rounded text-white"
>
Done
</button>

</div>

</div>

</div>

)

}