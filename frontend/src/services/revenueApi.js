import { api } from "./api"

export const getTodayRevenue = async()=>{
 const { data } = await api.get("/revenue/today")
 return data

}
