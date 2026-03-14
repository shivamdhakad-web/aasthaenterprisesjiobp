import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/ttdrivers"


export const getDrivers = async () => {

const res = await axios.get(API)

return res.data

}


export const addDriver = async (data) => {

const res = await axios.post(API,data)

return res.data

}


export const updateDriver = async (id,data) => {

const res = await axios.put(`${API}/${id}`,data)

return res.data

}


export const deleteDriver = async (id) => {

const res = await axios.delete(`${API}/${id}`)

return res.data

}