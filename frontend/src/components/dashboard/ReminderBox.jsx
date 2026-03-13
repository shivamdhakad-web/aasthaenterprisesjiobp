import {useEffect,useState} from "react"

import {
getReminders,
deleteReminder,
completeReminder
} from "../../services/reminderApi"

import AddReminderModal from "./AddReminderModal"

export default function ReminderBox(){

const [data,setData] = useState([])
const [open,setOpen] = useState(false)

useEffect(()=>{
load()
},[])

const load = async()=>{

const res = await getReminders()

setData(res)

}

const remove = async(id)=>{

await deleteReminder(id)

load()

}

const complete = async(id)=>{

await completeReminder(id)

load()

}

return(

<div className=" rounded-xl p-6 h-[340px]">

<div className="flex justify-between items-center mb-4">

<h2 className="text-white">
Reminders
</h2>

<button
onClick={()=>setOpen(true)}
className="bg-blue-600 px-3 py-1 rounded text-xs text-white"
>
+ Add
</button>

</div>

<div className="space-y-3">

{data.map(r=>{

const now = new Date()
const reminderTime = new Date(r.dateTime)

const diff = reminderTime - now

const overdue = reminderTime < now && !r.completed
const upcoming = diff > 0 && diff < 3600000 && !r.completed

return(

<div
key={r._id}
className={`flex justify-between items-center p-3 rounded-lg
${overdue ? "bg-red-900/40 border border-red-700" :
upcoming ? "bg-yellow-900/40 border border-yellow-600" :
"bg-[#111827]"}`}
>

<div>

<p className={r.completed ? "line-through text-gray-500":"text-white"}>
{r.title}
</p>

<p className="text-xs text-gray-400">
{r.description}
</p>

<p className="text-xs text-gray-500">
{new Date(r.dateTime).toLocaleString()}
</p>

</div>

<div className="flex gap-3 text-xs">

<button
onClick={()=>complete(r._id)}
className="text-green-400"
>
Complete
</button>

<button
onClick={()=>remove(r._id)}
className="text-red-400"
>
Delete
</button>

</div>

</div>

)

})}

</div>

{open &&

<AddReminderModal
close={()=>setOpen(false)}
refresh={load}
/>

}

</div>

)

}