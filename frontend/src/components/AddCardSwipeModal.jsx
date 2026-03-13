import { useState,useEffect } from "react"

import { addEntry,updateEntry } from "../services/cardSwipeApi"


export default function AddCardSwipeModal({open,onClose,onSave,editData}){


const [form,setForm] = useState({

date:"",
time:"",
amount:"",
charges:"",
txnDetails:"",
machine:"Self",
paymentMethod:"Online",
remark:""

})

useEffect(()=>{

if(editData){

setForm({
date:editData.date?.split("T")[0],
time:editData.time,
amount:editData.amount,
charges:editData.charges,
txnDetails:editData.txnDetails,
machine:editData.machine,
paymentMethod:editData.paymentMethod,
remark:editData.remark
})

}

},[editData])


if(!open) return null


const handleChange = (e)=>{

setForm({...form,[e.target.name]:e.target.value})

}



// const handleSave = async()=>{

// try{

// await addEntry({

// ...form,
// amount:Number(form.amount),
// charges:Number(form.charges)

// })

// onSave()
// onClose()

// setForm({

// date:"",
// time:"",
// amount:"",
// charges:"",
// txnDetails:"",
// machine:"Self",
// paymentMethod:"Online",
// remark:""

// })

// }catch(err){

// console.log(err)
// alert("Save failed")

// }

// }

const handleSave = async()=>{

try{

if(editData){

await updateEntry(editData._id,{
...form,
amount:Number(form.amount),
charges:Number(form.charges)
})

}else{

await addEntry({
...form,
amount:Number(form.amount),
charges:Number(form.charges)
})

}

onSave()
onClose()

}catch(err){

alert("Save failed")

}

}

return(

<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">


<div className="bg-[#0B0F17] border border-[#1F2937] p-6 rounded w-[420px]">


<h2 className="text-lg mb-4">

Add Card Swipe

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
type="time"
name="time"
value={form.time}
onChange={handleChange}
className="input text-white [&::-webkit-calendar-picker-indicator]:invert"
/>


<input
placeholder="Amount"
name="amount"
value={form.amount}
onChange={handleChange}
className="input"
/>


<input
placeholder="Charges"
name="charges"
value={form.charges}
onChange={handleChange}
className="input"
/>


<input
placeholder="Txn Details"
name="txnDetails"
value={form.txnDetails}
onChange={handleChange}
className="input"
/>



<select
name="machine"
value={form.machine}
onChange={handleChange}
className="input"
>

<option value="Self">Self</option>
<option value="DSM">DSM</option>

</select>



<select
name="paymentMethod"
value={form.paymentMethod}
onChange={handleChange}
className="input"
>

<option value="Cash">Cash</option>
<option value="Online">Online</option>

</select>



<input
placeholder="Remark"
name="remark"
value={form.remark}
onChange={handleChange}
className="input"
/>


</div>



<div className="flex justify-end gap-3 mt-5">


<button
className="px-4 py-2 bg-gray-600 rounded"
onClick={onClose}
>

Cancel

</button>


<button
className="px-4 py-2 bg-blue-500 rounded"
onClick={handleSave}
>

Save

</button>


</div>


</div>


</div>

)

}