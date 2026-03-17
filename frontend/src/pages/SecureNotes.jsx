import { useEffect,useState } from "react"
import {
getNotes,
deleteNote
} from "../services/secureNoteApi"

import SecureNoteModal from "../components/SecureNoteModal"

export default function SecureNotes(){

const [notes,setNotes] = useState([])
const [search,setSearch] = useState("")
const [modalOpen,setModalOpen] = useState(false)
const [editData,setEditData] = useState(null)
const [showPassword,setShowPassword] = useState(null)

const [vaultUnlocked,setVaultUnlocked] = useState(false)
const [vaultPassword,setVaultPassword] = useState("")
const [copied,setCopied] = useState(false)

useEffect(()=>{
if(vaultUnlocked){
loadNotes()
}
},[vaultUnlocked])

const loadNotes = async()=>{
const data = await getNotes()
setNotes(data)
}

const handleDelete = async(id)=>{
await deleteNote(id)
loadNotes()
}

const filtered = notes.filter(n=>
n.title.toLowerCase().includes(search.toLowerCase())
)

const copyText = (text)=>{
navigator.clipboard.writeText(text)

setCopied(true)

setTimeout(()=>{
setCopied(false)
},2000)

}

// AUTO LOCK

useEffect(()=>{

let timer

if(vaultUnlocked){

timer=setTimeout(()=>{

setVaultUnlocked(false)

},120000)

}

return ()=>clearTimeout(timer)

},[vaultUnlocked])



/* VAULT LOCK SCREEN */

if(!vaultUnlocked){

return(

<div className="flex items-center justify-center h-screen bg-[#04060B]">

<div className="bg-[#0B0F17] p-6 rounded w-[350px]">

<h2 className="text-lg mb-4 text-white">
Enter Vault Password
</h2>

<input
type="password"
value={vaultPassword}
onChange={(e)=>setVaultPassword(e.target.value)}
className="border p-2 w-full"
/>

<button
onClick={()=>{

if(vaultPassword==="1234"){

setVaultUnlocked(true)

}else{

alert("Wrong Password")

}

}}
className="mt-4 w-full bg-green-500 text-white p-2 rounded"
>

Unlock

</button>

</div>

</div>

)

}



// return(

// <div className="p-6">

// <h1 className="text-2xl font-bold mb-6 text-white">
// Secure Notes
// </h1>


// <input
// placeholder="Search note..."
// value={search}
// onChange={(e)=>setSearch(e.target.value)}
// className="border p-2 mb-6 w-60"
// />


// <div className="grid grid-cols-4 gap-6 text-white">

// {filtered.map((n)=>(
// <div
// key={n._id}
// className={`p-5 rounded-xl shadow-md ${n.color} ${
// n.color?.includes("yellow") || n.color?.includes("green") || n.color?.includes("orange")
// ? "text-black"
// : "text-white"
// }`}
// >

// <h2 className="font-semibold text-lg">
// {n.title}
// <button
// className="ml-2 text-sm cursor-pointer"
// onClick={()=>copyText(n.title)}
// >
// 📋
// </button>
// </h2>

// <p className="text-sm mt-2">
// {n.website}
// <button
// className="ml-2 text-sm cursor-pointer"
// onClick={()=>copyText(n.website)}
// >
// 📋
// </button>
// </p>

// <p className="text-sm mt-2">
// Username: {n.username}

// <button
// className="ml-2 text-sm cursor-pointer"
// onClick={()=>copyText(n.username)}
// >
// 📋
// </button>

// </p>

// <p className="text-sm mt-2">

// Password:

// {showPassword===n._id ? n.password : " ***********"}

// <button
// className="ml-2 cursor-pointer"
// onClick={()=>setShowPassword(
// showPassword===n._id ? null : n._id
// )}
// >
// 👁
// </button>

// <button
// className="ml-2 cursor-pointer"
// onClick={()=>copyText(n.password)}
// >
// 📋
// </button>

// </p>

// <p className="text-sm mt-2">
// {n.note}
// <button
// className="ml-2 cursor-pointer"
// onClick={()=>copyText(n.note)}
// >
// 📋
// </button>
// </p>


// <div className="mt-3 flex gap-3">

// <button
// className="text-blue-600"
// onClick={()=>{

// setEditData(n)
// setModalOpen(true)

// }}
// >

// Edit

// </button>

// <button
// className="text-red-600"
// onClick={()=>handleDelete(n._id)}
// >

// Delete

// </button>

// </div>

// </div>
// ))}



// {/* ADD NOTE CARD */}

// <div
// onClick={()=>{

// setEditData(null)
// setModalOpen(true)

// }}
// className="border-2 border-dashed flex items-center justify-center rounded-xl h-[150px] cursor-pointer text-white"
// >

// + Add Note

// </div>


// </div>



// <SecureNoteModal
// open={modalOpen}
// onClose={()=>setModalOpen(false)}
// onSave={loadNotes}
// editData={editData}
// />

// {copied && (

// <div className="fixed top-18 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm transition-all">

// Copied to clipboard

// </div>

// )}


// </div>

// )

return(

<div className="p-3 sm:p-4 md:p-6">

<h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">
Secure Notes
</h1>

<input
placeholder="Search note..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border p-2 mb-4 sm:mb-6 w-full sm:w-72 rounded bg-[#0B0F17] text-white"
/>

{/* GRID RESPONSIVE */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 text-white">

{filtered.map((n)=>(
<div
key={n._id}
className={`p-4 sm:p-5 rounded-xl shadow-md ${n.color} ${
n.color?.includes("yellow") || n.color?.includes("green") || n.color?.includes("orange")
? "text-black"
: "text-white"
}`}
>

<h2 className="font-semibold text-base sm:text-lg flex justify-between items-center">
<span>{n.title}</span>

<button
className="text-xs sm:text-sm"
onClick={()=>copyText(n.title)}
>
📋
</button>
</h2>

<p className="text-xs sm:text-sm mt-2 flex justify-between items-center">
<span>{n.website}</span>

<button onClick={()=>copyText(n.website)}>📋</button>
</p>

<p className="text-xs sm:text-sm mt-2 flex justify-between items-center">
<span>Username: {n.username}</span>

<button onClick={()=>copyText(n.username)}>📋</button>
</p>

<p className="text-xs sm:text-sm mt-2 flex justify-between items-center">

<span>
Password:
{showPassword===n._id ? n.password : " ********"}
</span>

<div className="flex gap-2">
<button
onClick={()=>setShowPassword(
showPassword===n._id ? null : n._id
)}
>
👁
</button>

<button onClick={()=>copyText(n.password)}>
📋
</button>
</div>

</p>

<p className="text-xs sm:text-sm mt-2 flex justify-between items-center">
<span>{n.note}</span>

<button onClick={()=>copyText(n.note)}>📋</button>
</p>

<div className="mt-3 flex gap-3 text-sm">

<button
className="text-blue-500"
onClick={()=>{
setEditData(n)
setModalOpen(true)
}}
>
Edit
</button>

<button
className="text-red-500"
onClick={()=>handleDelete(n._id)}
>
Delete
</button>

</div>

</div>
))}


{/* ADD NOTE */}

<div
onClick={()=>{
setEditData(null)
setModalOpen(true)
}}
className="border-2 border-dashed flex items-center justify-center rounded-xl h-[120px] sm:h-[150px] cursor-pointer text-gray-400 hover:text-white"
>

+ Add Note

</div>

</div>


<SecureNoteModal
open={modalOpen}
onClose={()=>setModalOpen(false)}
onSave={loadNotes}
editData={editData}
/>

{/* TOAST */}

{copied && (

<div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg text-xs sm:text-sm">

Copied to clipboard

</div>

)}

</div>

)

}