import { api, executeOrRequestApproval } from "./api"



/* GET PRODUCTS */

export const getProducts = async()=>{
 const { data } = await api.get("/lubricants/products")
 return data

}



/* ADD PRODUCT */

export const addProduct = async(data)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"lubricant-products",
   moduleLabel:"Lubricant Products",
   operation:"create",
   payload:data,
   summary:`Add product ${data.name || ""}`
  },
  request:()=>api.post("/lubricants/products",data)
 })

}



/* UPDATE PRODUCT */

export const updateProduct = async(id,data)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"lubricant-products",
   moduleLabel:"Lubricant Products",
   operation:"update",
   resourceId:id,
   payload:data,
   summary:`Update product ${data.name || id}`
  },
  request:()=>api.put(`/lubricants/products/${id}`,data)
 })

}



/* DELETE PRODUCT */

export const deleteProduct = async(id)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"lubricant-products",
   moduleLabel:"Lubricant Products",
   operation:"delete",
   resourceId:id,
   summary:`Delete product ${id}`
  },
  request:()=>api.delete(`/lubricants/products/${id}`)
 })

}



/* GET SALES */

export const getLubricants = async()=>{
 const { data } = await api.get("/lubricants")
 return data

}



/* ADD SALE */

export const addLubricant = async(data)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"lubricant-sales",
   moduleLabel:"Lubricant Sales",
   operation:"create",
   payload:data,
   summary:`Add lubricant sale ${data.product || ""}`
  },
  request:()=>api.post("/lubricants",data)
 })

}



/* UPDATE SALE */

export const updateLubricant = async(id,data)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"lubricant-sales",
   moduleLabel:"Lubricant Sales",
   operation:"update",
   resourceId:id,
   payload:data,
   summary:`Update lubricant sale ${data.product || id}`
  },
  request:()=>api.put(`/lubricants/${id}`,data)
 })

}



/* DELETE SALE */

export const deleteLubricant = async(id)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"lubricant-sales",
   moduleLabel:"Lubricant Sales",
   operation:"delete",
   resourceId:id,
   summary:`Delete lubricant sale ${id}`
  },
  request:()=>api.delete(`/lubricants/${id}`)
 })

}



/* DELETE MONTH DATA */

export const deleteMonth = async(data)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"lubricant-sales",
   moduleLabel:"Lubricant Sales",
   operation:"deleteMonth",
   meta:{ year:data.year, month:data.month },
   summary:`Delete lubricant month ${data.month}/${data.year}`
  },
  request:()=>api.post("/lubricants/delete-month",data)
 })

}
