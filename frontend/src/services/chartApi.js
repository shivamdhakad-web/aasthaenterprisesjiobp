import axios from "axios"

const API = "http://localhost:5000/api/charts"

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
"http://localhost:5000/api/dashboard/fuel-revenue-chart"
)

return res.data

}