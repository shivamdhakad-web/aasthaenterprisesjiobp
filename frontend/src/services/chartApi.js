import { api } from "./api"

export const getSalesTrend = async()=>{
 const { data } = await api.get("/charts/sales-trend")
 return data

}

export const getFuelMix = async()=>{
 const { data } = await api.get("/charts/fuel-mix")
 return data

}

export const getFuelRevenueChart = async()=>{
const { data } = await api.get("/dashboard/fuel-revenue-chart")
return data

}
