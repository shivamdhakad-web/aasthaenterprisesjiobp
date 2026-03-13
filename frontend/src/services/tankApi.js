import axios from "axios"

const API = "http://localhost:5000/api/tank"

export const getTankLevels = async()=>{

 const res = await axios.get(`${API}/levels`)

 return res.data

}

export const updateTank = async(data)=>{

 const res = await axios.post(`${API}/update`,data)

 return res.data

}