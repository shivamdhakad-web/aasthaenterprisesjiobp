import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/charts"

export const getSalesTrend = async()=>{

 const res = await axios.get(`${API}/sales-trend`)
 return res.data

}

export const getFuelMix = async()=>{

 const res = await axios.get(`${API}/fuel-mix`)
 return res.data

}

export const getFuelRevenueChart = async()=>{

const res = await axios.get(
"https://aasthaenterprisesjiobp.onrender.com/api/dashboard/fuel-revenue-chart"
)

return res.data

}