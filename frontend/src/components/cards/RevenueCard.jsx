import {useEffect,useState} from "react"
import {getTodayRevenue}
from "../../services/revenueApi"

export default function RevenueCard(){

const [data,setData]=useState({
revenue:0,
percent:0
})

useEffect(()=>{
load()
},[])

const load=async()=>{

const res = await getTodayRevenue()

setData(res)

}

const percentColor =
data.percent >=0
? "text-green-400"
: "text-red-400"

return(

<div className="bg-[#0A0D14] border border-[#1A1D26] border-t-2 border-t-green-500 rounded-xl p-5">

  <div className="flex justify-between items-center">

    <div>

      <p className="text-sm text-gray-400">
        REVENUE TODAY
      </p>

      <h2 className="text-2xl font-bold text-white mt-2">
        ₹{data.revenue.toLocaleString()}
      </h2>

      <p className={`${percentColor} text-sm mt-1`}>
        {data.percent >= 0 ? "↑" : "↓"}
        {Math.abs(data.percent)}% vs yesterday
      </p>

    </div>

    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
      $
    </div>

  </div>

</div>
)

}