import { api, executeOrRequestApproval } from "./api"

export const getTodayDieselStats = async ()=>{
 const { data } = await api.get("/diesel/stats/today")
 return data
}

export const addDieselSale = async(data)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"diesel-sales",
   moduleLabel:"Diesel Sales",
   operation:"create",
   payload:data,
   summary:`Add diesel sale ${data.date || ""}`
  },
  request:()=>api.post("/diesel/add",data)
 })
}

export const getDieselSales = async()=>{
 const { data } = await api.get("/diesel/all")
 return data
}

export const deleteDieselSale = async(id)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"diesel-sales",
   moduleLabel:"Diesel Sales",
   operation:"delete",
   resourceId:id,
   summary:`Delete diesel sale ${id}`
  },
  request:()=>api.delete(`/diesel/delete/${id}`)
 })
}

export const updateDieselSale = async(id,data)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"diesel-sales",
   moduleLabel:"Diesel Sales",
   operation:"update",
   resourceId:id,
   payload:data,
   summary:`Update diesel sale ${id}`
  },
  request:()=>api.put(`/diesel/update/${id}`,data)
 })
}
