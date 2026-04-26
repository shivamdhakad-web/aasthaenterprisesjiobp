import { api, executeOrRequestApproval } from "./api"


export const getCustomerDrivers = async () => {
const { data } = await api.get("/customerdrivers")
return data

}


export const addCustomerDriver = async (data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"customer-drivers",
moduleLabel:"Customer Drivers",
operation:"create",
payload:data,
summary:`Add customer driver ${data.name || ""}`
},
request:()=>api.post("/customerdrivers",data)
})

}


export const updateCustomerDriver = async (id,data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"customer-drivers",
moduleLabel:"Customer Drivers",
operation:"update",
resourceId:id,
payload:data,
summary:`Update customer driver ${data.name || id}`
},
request:()=>api.put(`/customerdrivers/${id}`,data)
})

}


export const deleteCustomerDriver = async (id) => {
return executeOrRequestApproval({
approval:{
moduleKey:"customer-drivers",
moduleLabel:"Customer Drivers",
operation:"delete",
resourceId:id,
summary:`Delete customer driver ${id}`
},
request:()=>api.delete(`/customerdrivers/${id}`)
})

}
