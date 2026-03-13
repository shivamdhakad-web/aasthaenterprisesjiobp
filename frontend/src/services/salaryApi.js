import axios from "axios"

const API = "http://localhost:5000/api/salary"



export const getSalary = async()=>{

const res = await axios.get(API)

return res.data

}



export const generateSalary = async(data)=>{

const res = await axios.post(API + "/generate",data)

return res.data

}