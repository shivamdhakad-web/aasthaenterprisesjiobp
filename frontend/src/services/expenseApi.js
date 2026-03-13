import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/expenses"


/* GET */

export const getExpenses = async()=>{

const res = await axios.get(API)

return res.data

}


/* ADD */

export const addExpense = async(data)=>{

const res = await axios.post(API,data)

return res.data

}


/* UPDATE */

export const updateExpense = async(id,data)=>{

const res = await axios.put(`${API}/${id}`,data)

return res.data

}


/* DELETE */

export const deleteExpense = async(id)=>{

const res = await axios.delete(`${API}/${id}`)

return res.data

}