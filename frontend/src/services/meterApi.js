import { api, executeOrRequestApproval } from "./api"

export const getMeterReadings = async()=>{
const { data } = await api.get("/meter")
return data

}

export const addMeterReading = async(data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"meter-readings",
moduleLabel:"Meter Readings",
operation:"create",
payload:data,
summary:`Add meter reading ${data.nozzle || ""}`
},
request:()=>api.post("/meter",data)
})

}

export const deleteMeterReading = async(id)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"meter-readings",
moduleLabel:"Meter Readings",
operation:"delete",
resourceId:id,
summary:`Delete meter reading ${id}`
},
request:()=>api.delete(`/meter/${id}`)
})

}

export const updateMeterReading = async(id,data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"meter-readings",
moduleLabel:"Meter Readings",
operation:"update",
resourceId:id,
payload:data,
summary:`Update meter reading ${id}`
},
request:()=>api.put(`/meter/${id}`,data)
})

}
