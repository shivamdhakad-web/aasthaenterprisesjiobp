import { api, executeOrRequestApproval } from "./api"


export const getEmployees = async () => {
const { data } = await api.get("/employees")
return data

}


export const addEmployee = async (data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"employees",
moduleLabel:"Employees",
operation:"create",
payload:data,
summary:`Add employee ${data.name || ""}`
},
request:()=>api.post("/employees",data)
})

}


export const updateEmployee = async (id,data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"employees",
moduleLabel:"Employees",
operation:"update",
resourceId:id,
payload:data,
summary:`Update employee ${data.name || id}`
},
request:()=>api.put(`/employees/${id}`,data)
})

}


export const deleteEmployee = async (id) => {
return executeOrRequestApproval({
approval:{
moduleKey:"employees",
moduleLabel:"Employees",
operation:"delete",
resourceId:id,
summary:`Delete employee ${id}`
},
request:()=>api.delete(`/employees/${id}`)
})

}
