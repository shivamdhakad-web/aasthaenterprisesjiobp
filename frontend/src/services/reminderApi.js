import { api } from "./api"

export const getReminders = async()=>{
const { data } = await api.get("/reminders")
return data

}

export const addReminder = async(data)=>{
const { data: result } = await api.post("/reminders",data)
return result

}

export const deleteReminder = async(id)=>{
await api.delete(`/reminders/${id}`)

}

export const completeReminder = async(id)=>{
await api.put(`/reminders/${id}`)

}
