import {useEffect,useState} from "react"
import {getFuelMix} from "../../services/chartApi"

import {
 PieChart,
 Pie,
 Cell,
 Tooltip,
 ResponsiveContainer
} from "recharts"

const COLORS = ["#FF3B3B","#22C1F1","#22C55E"]

export default function FuelMixChart(){

const [data,setData] = useState([])

useEffect(()=>{
 load()
},[])

const load = async()=>{

 const res = await getFuelMix()

 setData(res)

}

return(

<div className="bg-[#0A0D14] border border-[#1A1D26] p-6 rounded-xl h-[358px] flex flex-col">

<h2 className="text-white mb-4">
Fuel Mix
</h2>

<div className="flex items-center justify-between flex-1">

{/* DONUT CHART */}

<div className="w-[170px] h-[180px]">

<ResponsiveContainer>

<PieChart>

<Pie
 data={data}
 dataKey="value"
 innerRadius={60}
 outerRadius={85}
 paddingAngle={2}
 stroke="none"
>

{data.map((entry,index)=>(
<Cell key={index} fill={COLORS[index]} />
))}

</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>

{/* LEGEND */}

<div className="space-y-4">

{data.map((item,index)=>(
<div
 key={index}
 className="flex items-center justify-between w-[120px]"
>

<div className="flex items-center gap-2 text-gray-400 text-sm">

<span
 className="w-3 h-3 rounded-full"
 style={{background:COLORS[index]}}
></span>

{item.name}

</div>

<div className="text-gray-300 text-sm">

{item.value}L

</div>

</div>
))}

</div>

</div>

</div>

)

}