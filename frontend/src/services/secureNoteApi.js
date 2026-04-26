import { api, executeOrRequestApproval } from "./api"

export const getNotes = async ()=>{
const { data } = await api.get("/secure-notes")
return data
}

export const addNote = async(data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"secure-notes",
moduleLabel:"Secure Notes",
operation:"create",
payload:data,
summary:`Add secure note ${data.title || ""}`
},
request:()=>api.post("/secure-notes",data)
})
}

export const updateNote = async(id,data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"secure-notes",
moduleLabel:"Secure Notes",
operation:"update",
resourceId:id,
payload:data,
summary:`Update secure note ${data.title || id}`
},
request:()=>api.put(`/secure-notes/${id}`,data)
})
}

export const deleteNote = async(id)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"secure-notes",
moduleLabel:"Secure Notes",
operation:"delete",
resourceId:id,
summary:`Delete secure note ${id}`
},
request:()=>api.delete(`/secure-notes/${id}`)
})
}
