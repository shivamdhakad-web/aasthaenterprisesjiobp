import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/diesel"

export const getTodayDieselStats = async ()=>{
 const res = await axios.get(`${API}/stats/today`)
 return res.data
}

export const addDieselSale = async(data)=>{
 const res = await axios.post(`${API}/add`,data)
 return res.data
}

export const getDieselSales = async()=>{
 const res = await axios.get(`${API}/all`)
 return res.data
}

export const deleteDieselSale = async(id)=>{
 const res = await axios.delete(`${API}/delete/${id}`)
 return res.data
}

export const updateDieselSale = async(id,data)=>{
 const res = await axios.put(`${API}/update/${id}`,data)
 return res.data
}