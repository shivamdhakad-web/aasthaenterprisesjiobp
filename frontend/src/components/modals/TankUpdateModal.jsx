import { useState } from "react"
import { updateTank } from "../../services/tankApi"

export default function TankUpdateModal({ close, reload }) {

 const [form,setForm] = useState({
  fuelType:"",
  currentStock:""
 })

 const handleChange = (e)=>{
  setForm({...form,[e.target.name]:e.target.value})
 }

 const submit = async()=>{

  await updateTank(form)

  reload()

  close()

 }

 return(

 <div className="fixed inset-0 z-5 bg-black/70 flex items-center justify-center">

  <div className="bg-[#0A0D14] border border-[#1A1D26] p-6 w-[500px] rounded-xl">

   <h2 className="text-white text-lg mb-4">
    Update Tank Level
   </h2>

   <select
   name="fuelType"
   onChange={handleChange}
   className="w-full mb-3 p-2 bg-black border border-[#1A1F2E] text-gray-300"
   >

    <option value="">Select Fuel</option>
    <option value="petrol">Petrol</option>
    <option value="diesel">Diesel</option>

   </select>

   <input
   type="number"
   name="currentStock"
   placeholder="Current Stock (Liters)"
   onChange={handleChange}
   className="w-full mb-4 p-2 bg-black border border-[#1A1F2E]"
   />

   <div className="flex gap-2">

    <button
    onClick={submit}
    className="bg-yellow-500 w-full py-2 rounded text-black"
    >
     Update
    </button>

    <button
    onClick={close}
    className="border border-gray-600 w-full py-2 rounded text-gray-300"
    >
     Cancel
    </button>

   </div>

  </div>

 </div>

 )

}