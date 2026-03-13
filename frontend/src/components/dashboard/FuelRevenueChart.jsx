import {useEffect,useState} from "react"
import {getFuelRevenueChart} from "../../services/chartApi"

import {
AreaChart,
Area,
XAxis,
YAxis,
Tooltip,
CartesianGrid,
ResponsiveContainer
} from "recharts"

export default function FuelRevenueChart(){

const [data,setData] = useState([])

useEffect(()=>{
load()
},[])

const load = async()=>{
const res = await getFuelRevenueChart()
setData(res)
}

return(

<div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-6 h-[340px]">

<h2 className="text-white mb-6">
Fuel Revenue Trend
</h2>

<ResponsiveContainer width="100%" height="85%">

<AreaChart data={data}>

<CartesianGrid stroke="#1F2535" strokeDasharray="3 3"/>

<XAxis dataKey="date" stroke="#6B7280"/>

<YAxis stroke="#6B7280"/>

<Tooltip/>

<Area
type="monotone"
dataKey="petrol"
stroke="#FF3B3B"
fill="#FF3B3B"
/>

<Area
type="monotone"
dataKey="diesel"
stroke="#22C1F1"
fill="#22C1F1"
/>

</AreaChart>

</ResponsiveContainer>

</div>

)

}