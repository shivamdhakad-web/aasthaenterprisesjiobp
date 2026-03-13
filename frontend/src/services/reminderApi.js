import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/reminders"

export const getReminders = async()=>{

const res = await axios.get(API)

return res.data

}

export const addReminder = async(data)=>{

const res = await axios.post(API,data)

return res.data

}

export const deleteReminder = async(id)=>{

await axios.delete(`${API}/${id}`)

}

export const completeReminder = async(id)=>{

await axios.put(`${API}/${id}`)

}