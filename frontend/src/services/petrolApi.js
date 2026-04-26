import { api, executeOrRequestApproval } from "./api"

export const getTodayPetrolStats = () =>
 api.get("/petrol/stats/today").then((res) => res.data)

export const addPetrolSale = (data) =>
 executeOrRequestApproval({
  approval:{
   moduleKey:"petrol-sales",
   moduleLabel:"Petrol Sales",
   operation:"create",
   payload:data,
   summary:`Add petrol sale ${data.date || ""}`
  },
  request:()=>api.post("/petrol/add",data)
 })

export const getPetrolSales = () =>
 api.get("/petrol/all").then((res) => res.data)

export const deletePetrolSale = (id) =>
 executeOrRequestApproval({
  approval:{
   moduleKey:"petrol-sales",
   moduleLabel:"Petrol Sales",
   operation:"delete",
   resourceId:id,
   summary:`Delete petrol sale ${id}`
  },
  request:()=>api.delete(`/petrol/delete/${id}`)
 })

export const updatePetrolSale = (id,data) =>
 executeOrRequestApproval({
  approval:{
   moduleKey:"petrol-sales",
   moduleLabel:"Petrol Sales",
   operation:"update",
   resourceId:id,
   payload:data,
   summary:`Update petrol sale ${id}`
  },
  request:()=>api.put(`/petrol/update/${id}`,data)
 })
