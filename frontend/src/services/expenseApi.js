import { api, executeOrRequestApproval } from "./api"


/* GET */

export const getExpenses = async()=>{
const { data } = await api.get("/expenses")
return data

}


/* ADD */

export const addExpense = async(data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"expenses",
moduleLabel:"Expenses",
operation:"create",
payload:data,
summary:`Add expense ${data.category || ""}`
},
request:()=>api.post("/expenses",data)
})

}


/* UPDATE */

export const updateExpense = async(id,data)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"expenses",
moduleLabel:"Expenses",
operation:"update",
resourceId:id,
payload:data,
summary:`Update expense ${data.category || id}`
},
request:()=>api.put(`/expenses/${id}`,data)
})

}


/* DELETE */

export const deleteExpense = async(id)=>{
return executeOrRequestApproval({
approval:{
moduleKey:"expenses",
moduleLabel:"Expenses",
operation:"delete",
resourceId:id,
summary:`Delete expense ${id}`
},
request:()=>api.delete(`/expenses/${id}`)
})

}
