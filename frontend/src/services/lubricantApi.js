import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/lubricants"



/* GET PRODUCTS */

export const getProducts = async()=>{

 const res = await axios.get(API + "/products")

 return res.data

}



/* ADD PRODUCT */

export const addProduct = async(data)=>{

 const res = await axios.post(API + "/products",data)

 return res.data

}



/* UPDATE PRODUCT */

export const updateProduct = async(id,data)=>{

 const res = await axios.put(API + "/products/" + id,data)

 return res.data

}



/* DELETE PRODUCT */

export const deleteProduct = async(id)=>{

 const res = await axios.delete(API + "/products/" + id)

 return res.data

}



/* GET SALES */

export const getLubricants = async()=>{

 const res = await axios.get(API)

 return res.data

}



/* ADD SALE */

export const addLubricant = async(data)=>{

 const res = await axios.post(API,data)

 return res.data

}



/* UPDATE SALE */

export const updateLubricant = async(id,data)=>{

 const res = await axios.put(API + "/" + id,data)

 return res.data

}



/* DELETE SALE */

export const deleteLubricant = async(id)=>{

 const res = await axios.delete(API + "/" + id)

 return res.data

}



/* DELETE MONTH DATA */

export const deleteMonth = async(data)=>{

 const res = await axios.post(API + "/delete-month",data)

 return res.data

}