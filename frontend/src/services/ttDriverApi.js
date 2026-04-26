import { api, executeOrRequestApproval } from "./api"


export const getDrivers = async () => {
const { data } = await api.get("/ttdrivers")
return data

}


export const addDriver = async (data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"tt-drivers",
moduleLabel:"TT Drivers",
operation:"create",
payload:data,
summary:`Add TT driver ${data.name || ""}`
},
request:()=>api.post("/ttdrivers",data)
})

}


export const updateDriver = async (id,data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"tt-drivers",
moduleLabel:"TT Drivers",
operation:"update",
resourceId:id,
payload:data,
summary:`Update TT driver ${data.name || id}`
},
request:()=>api.put(`/ttdrivers/${id}`,data)
})

}


export const deleteDriver = async (id) => {
return executeOrRequestApproval({
approval:{
moduleKey:"tt-drivers",
moduleLabel:"TT Drivers",
operation:"delete",
resourceId:id,
summary:`Delete TT driver ${id}`
},
request:()=>api.delete(`/ttdrivers/${id}`)
})

}
