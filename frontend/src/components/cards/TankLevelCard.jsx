import { useEffect,useState } from "react"
import { getTankLevels } from "../../services/tankApi"

import TankUpdateModal from "../modals/TankUpdateModal"
import TankTable from "../dashboard/TankTable"

export default function TankLevelCard(){

const [data,setData] = useState({
 tankLevel:0,
 petrol:0,
 diesel:0
})

const [openAdd,setOpenAdd] = useState(false)
const [openView,setOpenView] = useState(false)

useEffect(()=>{
 load()
},[])

const load = async()=>{

 const res = await getTankLevels()

 setData(res)

}

return(

<>

<div className="group bg-[#0A0D14] border border-[#1A1D26] rounded-xl p-5 relative">

<div className="flex justify-between">

<div>

<p className="text-sm text-gray-400">
TANK LEVEL
</p>

<h2 className="text-2xl text-white font-bold mt-2">
{data.tankLevel}%
</h2>

<p className="text-gray-400 text-sm mt-1">
Petrol: {data.petrol}% | Diesel: {data.diesel}%
</p>

</div>



</div>

<div className="absolute inset-0 hidden group-hover:flex items-center justify-end gap-2 mr-2 mb-4">

<button
onClick={()=>setOpenAdd(true)}
className="bg-yellow-500 px-3 py-1 rounded text-black"
>
Add
</button>

<button
onClick={()=>setOpenView(true)}
className="border border-gray-500 px-3 py-1 rounded text-gray-300"
>
View
</button>

</div>

</div>

{openAdd &&
<TankUpdateModal
close={()=>setOpenAdd(false)}
reload={load}
/>
}

{openView &&
<TankTable
close={()=>setOpenView(false)}
/>
}

</>

)

}