import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/revenue"

export const getTodayRevenue = async()=>{

 const res = await axios.get(`${API}/today`)

 return res.data

}