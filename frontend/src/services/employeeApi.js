import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/employees"


export const getEmployees = async () => {

const res = await axios.get(API)

return res.data

}


export const addEmployee = async (data) => {

const res = await axios.post(API,data)

return res.data

}


export const updateEmployee = async (id,data) => {

const res = await axios.put(`${API}/${id}`,data)

return res.data

}


export const deleteEmployee = async (id) => {

const res = await axios.delete(`${API}/${id}`)

return res.data

}