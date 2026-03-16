import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/secure-notes"

export const getNotes = async ()=>{
const res = await axios.get(API)
return res.data
}

export const addNote = async(data)=>{
const res = await axios.post(API,data)
return res.data
}

export const updateNote = async(id,data)=>{
const res = await axios.put(`${API}/${id}`,data)
return res.data
}

export const deleteNote = async(id)=>{
const res = await axios.delete(`${API}/${id}`)
return res.data
}