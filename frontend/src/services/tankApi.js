import { api, executeOrRequestApproval } from "./api"

export const getTankLevels = async()=>{
 const { data } = await api.get("/tank/levels")
 return data

}

export const updateTank = async(data)=>{
 return executeOrRequestApproval({
  approval:{
   moduleKey:"tank",
   moduleLabel:"Tank Levels",
   operation:"update",
   resourceId:data.id || data._id,
   payload:data,
   summary:`Update tank ${(data.fuelType || data.id || "").toString()}`
  },
  request:()=>api.post("/tank/update",data)
 })

}
