import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/attendance"


export const getAttendance = async (employeeId) => {

const res = await axios.get(`${API}/${employeeId}`)

return res.data

}


export const addAttendance = async (employeeId,data) => {

const res = await axios.post(`${API}/${employeeId}`,data)

return res.data

}


export const updateAttendance = async (id,data) => {

const res = await axios.put(`${API}/update/${id}`,data)

return res.data

}


export const deleteAttendance = async (id) => {

const res = await axios.delete(`${API}/delete/${id}`)

return res.data

}


export const deleteMonth = async (employeeId,year,month) => {

const res = await axios.delete(`${API}/month/${employeeId}/${year}/${month}`)

return res.data

}