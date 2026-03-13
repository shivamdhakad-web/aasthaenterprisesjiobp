import axios from "axios"

const API = "http://localhost:5000/api/card-swipe"



// GET ENTRIES (WITH FILTERS)
export const getEntries = async(params)=>{

const res = await axios.get(API,{
params
})

return res.data

}



// ADD ENTRY
export const addEntry = async(data)=>{

const res = await axios.post(API,data)

return res.data

}



// UPDATE ENTRY
export const updateEntry = async(id,data)=>{

const res = await axios.put(`${API}/${id}`,data)

return res.data

}



// DELETE ENTRY
export const deleteEntry = async(id)=>{

const res = await axios.delete(`${API}/${id}`)

return res.data

}



// DELETE MONTH
export const deleteMonth = async(year,month)=>{

const res = await axios.delete(`${API}/month/${year}/${month}`)

return res.data

}