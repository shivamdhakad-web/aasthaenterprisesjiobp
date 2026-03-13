import { useEffect,useState } from "react"
import { getTankLevels } from "../../services/tankApi"

export default function TankTable({close}){

 const [data,setData] = useState({
  petrol:0,
  diesel:0,
  tankLevel:0
 })

 useEffect(()=>{
  load()
 },[])

 const load = async()=>{

  const res = await getTankLevels()

  setData(res)

 }

 return(

 <div className="fixed inset-0 z-5 bg-black/70 flex items-center justify-center">

  <div className="bg-[#0A0D14] border border-[#1A1D26] p-6 w-[700px] rounded-xl">

   <h2 className="text-white mb-4">
    Tank Levels
   </h2>

   <table className="w-full text-gray-300">

    <thead className="border-b border-[#1A1D26] text-sm text-gray-500">

     <tr>

      <th className="text-left p-2">Fuel</th>
      <th className="text-left p-2">Level %</th>

     </tr>

    </thead>

    <tbody>

     <tr className="border-b border-[#1A1D26]">

      <td className="p-2">Petrol</td>

      <td className="p-2">{data.petrol}%</td>

     </tr>

     <tr>

      <td className="p-2">Diesel</td>

      <td className="p-2">{data.diesel}%</td>

     </tr>

    </tbody>

   </table>

   <button
   onClick={close}
   className="mt-4 border border-gray-600 px-4 py-2 rounded text-gray-300"
   >
    Close
   </button>

  </div>

 </div>

 )

}