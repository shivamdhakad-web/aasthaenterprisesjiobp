import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/customerdrivers"


export const getCustomerDrivers = async () => {

const res = await axios.get(API)

return res.data

}


export const addCustomerDriver = async (data) => {

const res = await axios.post(API,data)

return res.data

}


export const updateCustomerDriver = async (id,data) => {

const res = await axios.put(`${API}/${id}`,data)

return res.data

}


export const deleteCustomerDriver = async (id) => {

const res = await axios.delete(`${API}/${id}`)

return res.data

}