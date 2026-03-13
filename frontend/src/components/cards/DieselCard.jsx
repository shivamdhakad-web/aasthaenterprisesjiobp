import {useEffect,useState} from "react"
import {getTodayDieselStats} from "../../services/dieselApi"
import DieselAddModal from "../modals/DieselAddModal"
import DieselTable from "../dashboard/DieselTable"

export default function DieselCard(){

const [stats,setStats]=useState({
todayLiters:0,
percent:0
})

const [openAdd,setOpenAdd]=useState(false)
const [openView,setOpenView]=useState(false)

useEffect(()=>{
loadStats()
},[])

const loadStats=async()=>{
const data=await getTodayDieselStats()
setStats(data)
}

const percentColor=
stats.percent>=0 ? "text-green-400":"text-red-400"

return(

<>
<div className="group bg-[#0A0D14] border border-[#1A1D26] rounded-xl p-5 transition duration-300 hover:bg-[#0d1119]">

<div className="flex justify-between items-center">

<div>

<p className="text-sm text-gray-400">
DIESEL SOLD TODAY
</p>

<h2 className="text-2xl font-bold text-white mt-2">
{stats.todayLiters} L
</h2>

<p className={`${percentColor} text-sm mt-1`}>

{stats.percent>=0?"↑":"↓"}
{Math.abs(stats.percent)}% vs yesterday

</p>

</div>

<div className="relative w-[100px] h-[40px] flex items-center justify-center">

<div className="absolute transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 w-10 h-10 bg-[#22C1F1]/20 rounded-lg flex items-center justify-center text-[#22C1F1]">

💧

</div>

<div className="absolute flex gap-2 opacity-0 scale-75 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100">

<button
onClick={()=>setOpenAdd(true)}
className="bg-[#22C1F1] px-3 py-1 rounded text-white text-sm"
>
Add
</button>

<button
onClick={()=>setOpenView(true)}
className="border border-gray-600 px-3 py-1 rounded text-gray-300 text-sm"
>
View
</button>

</div>

</div>

</div>

</div>

{openAdd && (
<DieselAddModal
close={()=>setOpenAdd(false)}
reload={loadStats}
/>
)}

{openView && (
<DieselTable
close={()=>setOpenView(false)}
reload={loadStats}
/>
)}

</>

)
}