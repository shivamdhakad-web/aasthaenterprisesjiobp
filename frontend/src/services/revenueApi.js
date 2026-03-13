import axios from "axios"

const API = "http://localhost:5000/api/revenue"

export const getTodayRevenue = async()=>{

 const res = await axios.get(`${API}/today`)

 return res.data

}