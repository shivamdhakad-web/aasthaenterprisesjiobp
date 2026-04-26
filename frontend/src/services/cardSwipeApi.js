import { api, executeOrRequestApproval } from "./api"



// GET ENTRIES (WITH FILTERS)
export const getEntries = async(params)=>{
const { data } = await api.get("/card-swipe",{ params })
return data

}



// ADD ENTRY
export const addEntry = async(data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"card-swipe",
moduleLabel:"Card Swipe",
operation:"create",
payload:data,
summary:`Add card swipe ${data.date || ""}`
},
request:()=>api.post("/card-swipe",data)
})

}



// UPDATE ENTRY
export const updateEntry = async(id,data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"card-swipe",
moduleLabel:"Card Swipe",
operation:"update",
resourceId:id,
payload:data,
summary:`Update card swipe ${id}`
},
request:()=>api.put(`/card-swipe/${id}`,data)
})

}



// DELETE ENTRY
export const deleteEntry = async(id)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"card-swipe",
moduleLabel:"Card Swipe",
operation:"delete",
resourceId:id,
summary:`Delete card swipe ${id}`
},
request:()=>api.delete(`/card-swipe/${id}`)
})

}



// DELETE MONTH
export const deleteMonth = async(year,month)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"card-swipe",
moduleLabel:"Card Swipe",
operation:"deleteMonth",
meta:{ year, month },
summary:`Delete card swipe month ${month}/${year}`
},
request:()=>api.delete(`/card-swipe/month/${year}/${month}`)
})

}
