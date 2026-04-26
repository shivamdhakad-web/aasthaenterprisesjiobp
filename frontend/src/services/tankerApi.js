import { api, executeOrRequestApproval } from "./api"

export const getDeliveries = async()=>{
const { data } = await api.get("/tanker-deliveries")
return data

}

export const addDelivery = async(data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"tanker-deliveries",
moduleLabel:"Tanker Deliveries",
operation:"create",
payload:data,
summary:`Add tanker delivery ${data.invoice || data.date || ""}`
},
request:()=>api.post("/tanker-deliveries",data)
})

}

export const updateDelivery = async(id,data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"tanker-deliveries",
moduleLabel:"Tanker Deliveries",
operation:"update",
resourceId:id,
payload:data,
summary:`Update tanker delivery ${id}`
},
request:()=>api.put(`/tanker-deliveries/${id}`,data)
})

}

export const deleteDelivery = async(id)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"tanker-deliveries",
moduleLabel:"Tanker Deliveries",
operation:"delete",
resourceId:id,
summary:`Delete tanker delivery ${id}`
},
request:()=>api.delete(`/tanker-deliveries/${id}`)
})

}
