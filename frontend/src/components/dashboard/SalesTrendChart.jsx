import { useEffect, useState } from "react"
import { getSalesTrend } from "../../services/chartApi"

import {
 XAxis,
 YAxis,
 Tooltip,
 CartesianGrid,
 ResponsiveContainer,
 Area,
 AreaChart
} from "recharts"

export default function SalesTrendChart(){

const [data,setData] = useState([])

useEffect(()=>{
 load()
},[])

const load = async()=>{
 const res = await getSalesTrend()
 setData(res)
}

return(

<div className="relative z-0 bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-6 h-[358px]">

<h2 className="text-white text-[15px] font-semibold mb-6">
Today's Sales Trend
</h2>

<ResponsiveContainer width="100%" height="85%">

<AreaChart
 data={data}
 margin={{ top:10, right:20, left:-10, bottom:0 }}
>

<defs>

<linearGradient id="petrol" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stopColor="#FF3B3B" stopOpacity={0.55}/>
<stop offset="100%" stopColor="#FF3B3B" stopOpacity={0}/>
</linearGradient>

<linearGradient id="diesel" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stopColor="#1FB6FF" stopOpacity={0.55}/>
<stop offset="100%" stopColor="#1FB6FF" stopOpacity={0}/>
</linearGradient>

</defs>

<CartesianGrid
 stroke="#1F2535"
 strokeDasharray="3 3"
/>

<XAxis
 dataKey="time"
 stroke="#6B7280"
 tick={{fontSize:12}}
 tickLine={false}
/>

<YAxis
 stroke="#6B7280"
 tick={{fontSize:12}}
 axisLine={false}
 tickLine={false}
/>

<Tooltip
 contentStyle={{
  background:"#0B0F17",
  border:"1px solid #1A1F2E",
  borderRadius:"8px",
  color:"#fff"
 }}
 cursor={{ stroke:"#94A3B8", strokeWidth:1 }}
/>

<Area
 type="monotone"
 dataKey="petrol"
 stroke="#FF3B3B"
 strokeWidth={3}
 fill="url(#petrol)"
 dot={false}
 activeDot={{ r:6 }}
/>

<Area
 type="monotone"
 dataKey="diesel"
 stroke="#1FB6FF"
 strokeWidth={3}
 fill="url(#diesel)"
 dot={false}
 activeDot={{ r:6 }}
/>

</AreaChart>

</ResponsiveContainer>

{/* Legend */}

<div className="flex gap-8 mt-0 ml-11 text-sm">

<div className="flex items-center gap-2 text-gray-400">
<span className="w-3 h-3 rounded-full bg-[#FF3B3B]"></span>
Petrol
</div>

<div className="flex items-center gap-2 text-gray-400">
<span className="w-3 h-3 rounded-full bg-[#1FB6FF]"></span>
Diesel
</div>

</div>

</div>

)

}