import { api, executeOrRequestApproval } from "./api"


// GET SETTINGS
export const getSettings = async () => {
const { data } = await api.get("/mobile-dispenser/settings")
return data

}



// UPDATE SETTINGS
export const updateSettings = async (data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"mobile-dispenser-settings",
moduleLabel:"Mobile Dispenser Settings",
operation:"update",
payload:data,
summary:"Update mobile dispenser settings"
},
request:()=>api.put("/mobile-dispenser/settings",data)
})

}



// GET ENTRIES
export const getEntries = async () => {
const { data } = await api.get("/mobile-dispenser")
return data

}



// ADD ENTRY
export const addEntry = async (data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"mobile-dispenser-entries",
moduleLabel:"Mobile Dispenser Entries",
operation:"create",
payload:data,
summary:`Add mobile dispenser entry ${data.date || ""}`
},
request:()=>api.post("/mobile-dispenser",data)
})

}



// UPDATE ENTRY
export const updateEntry = async (id,data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"mobile-dispenser-entries",
moduleLabel:"Mobile Dispenser Entries",
operation:"update",
resourceId:id,
payload:data,
summary:`Update mobile dispenser entry ${id}`
},
request:()=>api.put(`/mobile-dispenser/${id}`,data)
})

}



// DELETE ENTRY
export const deleteEntry = async (id) => {
return executeOrRequestApproval({
approval:{
moduleKey:"mobile-dispenser-entries",
moduleLabel:"Mobile Dispenser Entries",
operation:"delete",
resourceId:id,
summary:`Delete mobile dispenser entry ${id}`
},
request:()=>api.delete(`/mobile-dispenser/${id}`)
})

}



// DELETE MONTH
export const deleteMonth = async (year,month) => {
return executeOrRequestApproval({
approval:{
moduleKey:"mobile-dispenser-entries",
moduleLabel:"Mobile Dispenser Entries",
operation:"deleteMonth",
meta:{ year, month },
summary:`Delete mobile dispenser month ${month}/${year}`
},
request:()=>api.delete(`/mobile-dispenser/month/${year}/${month}`)
})

}
