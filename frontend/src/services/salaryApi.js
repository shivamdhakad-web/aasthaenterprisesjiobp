import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/salary"



export const getSalary = async()=>{

const res = await axios.get(API)

return res.data

}



export const generateSalary = async(data)=>{

const res = await axios.post(API + "/generate",data)

return res.data

}