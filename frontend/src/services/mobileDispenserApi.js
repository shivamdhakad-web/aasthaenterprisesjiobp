import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/mobile-dispenser"


// GET SETTINGS
export const getSettings = async () => {

const res = await axios.get(`${API}/settings`)

return res.data

}



// UPDATE SETTINGS
export const updateSettings = async (data) => {

const res = await axios.put(`${API}/settings`,data)

return res.data

}



// GET ENTRIES
export const getEntries = async () => {

const res = await axios.get(API)

return res.data

}



// ADD ENTRY
export const addEntry = async (data) => {

const res = await axios.post(API,data)

return res.data

}



// UPDATE ENTRY
export const updateEntry = async (id,data) => {

const res = await axios.put(`${API}/${id}`,data)

return res.data

}



// DELETE ENTRY
export const deleteEntry = async (id) => {

const res = await axios.delete(`${API}/${id}`)

return res.data

}



// DELETE MONTH
export const deleteMonth = async (year,month) => {

const res = await axios.delete(
`${API}/month/${year}/${month}`
)

return res.data

}