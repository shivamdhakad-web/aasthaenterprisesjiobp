import { useEffect, useState } from "react"
import axios from "axios"

export default function Settings(){

const [settings,setSettings] = useState({
 companyName:"",
 stationName:"",
 gstNumber:"",
 address:"",
 contacts:[]
})

const [name,setName] = useState("")
const [phone,setPhone] = useState("")

/* LOAD SETTINGS */

const loadSettings = async()=>{

 const res = await axios.get("https://aasthaenterprisesjiobp.onrender.com/api/settings")

 if(res.data){
  setSettings(res.data)
 }

}

useEffect(()=>{
 loadSettings()
},[])



/* ADD CONTACT */

const addContact = ()=>{

 if(!name || !phone) return

 const newContact = { name, phone }

 setSettings({
  ...settings,
  contacts:[...settings.contacts,newContact]
 })

 setName("")
 setPhone("")
}



/* DELETE CONTACT */

const deleteContact = (index)=>{

 const updated = settings.contacts.filter((_,i)=>i !== index)

 setSettings({
  ...settings,
  contacts:updated
 })
}



/* SAVE SETTINGS */

const saveSettings = async()=>{

 await axios.put(
  "https://aasthaenterprisesjiobp.onrender.com/api/settings",
  settings
 )

 alert("Settings Saved")

}



return(

<div className="p-3 text-gray-200">

<h1 className="text-xl font-bold mb-5 text-white">

⚙️ Station Settings

</h1>



{/* STATION INFO */}

<div className="bg-[#0b0f17] border border-[#1F2937] p-5 rounded-xl shadow-xl mb-5">

<h2 className="text-xl font-semibold text-white mb-6">

Station Information

</h2>



<div className="grid md:grid-cols-2 gap-6">

<div>
<label className="text-sm text-gray-400">
Company Name
</label>

<input
value={settings.companyName}
onChange={(e)=>setSettings({...settings,companyName:e.target.value})}
className="bg-[#04060b] border border-[#374151] p-3 rounded-lg w-full mt-1 focus:outline-none focus:border-red-500"
/>
</div>



<div>
<label className="text-sm text-gray-400">
Station Name
</label>

<input
value={settings.stationName}
onChange={(e)=>setSettings({...settings,stationName:e.target.value})}
className="bg-[#04060b] border border-[#374151] p-3 rounded-lg w-full mt-1 focus:outline-none focus:border-red-500"
/>
</div>



<div>
<label className="text-sm text-gray-400">
GST Number
</label>

<input
value={settings.gstNumber}
onChange={(e)=>setSettings({...settings,gstNumber:e.target.value})}
className="bg-[#04060b] border border-[#374151] p-3 rounded-lg w-full mt-1 focus:outline-none focus:border-red-500"
/>
</div>



<div>
<label className="text-sm text-gray-400">
Address
</label>

<input
value={settings.address}
onChange={(e)=>setSettings({...settings,address:e.target.value})}
className="bg-[#04060b] border border-[#374151] p-3 rounded-lg w-full mt-1 focus:outline-none focus:border-red-500"
/>
</div>

</div>

</div>



{/* CONTACTS */}

<div className="bg-[#0b0f17] border border-[#1F2937] p-5 rounded-2xl shadow-xl mb-5">

<h2 className="text-xl font-semibold text-white mb-6">

📞 Contact Numbers

</h2>



<table className="w-full text-sm mb-6">

<thead>

<tr className="text-gray-400 border-b border-[#1F2937]">

<th className="p-3 text-left">Name</th>
<th className="p-3 text-left">Phone</th>
<th className="p-3"></th>

</tr>

</thead>



<tbody>

{settings.contacts.map((c,i)=>(

<tr
key={i}
className="border-b border-[#1F2937] hover:bg-[#020617]"
>

<td className="p-3">{c.name}</td>
<td className="p-3">{c.phone}</td>

<td className="p-3 text-right">

<button
onClick={()=>deleteContact(i)}
className="text-red-400 hover:text-red-500"
>

Delete

</button>

</td>

</tr>

))}

</tbody>

</table>



{/* ADD CONTACT */}

<div className="flex gap-4">

<input
placeholder="Name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="bg-[#04060b] border border-[#374151] p-3 rounded-lg"
/>



<input
placeholder="Phone"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
className="bg-[#04060b] border border-[#374151] p-3 rounded-lg"
/>



<button
onClick={addContact}
className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-medium"
>

Add

</button>

</div>

</div>



{/* SAVE */}

<button
onClick={saveSettings}
className="bg-gradient-to-r from-red-600 to-red-500 hover:scale-105 transition px-8 py-3 rounded-lg text-white font-semibold shadow-lg"
>

Save Settings

</button>

</div>

)

}