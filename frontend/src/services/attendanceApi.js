import { api, executeOrRequestApproval } from "./api"


export const getAttendance = async (employeeId) => {
const { data } = await api.get(`/attendance/${employeeId}`)
return data

}


export const addAttendance = async (employeeId,data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"attendance",
moduleLabel:"Attendance",
operation:"create",
payload:data,
meta:{ employeeId },
summary:`Add attendance for ${employeeId}`
},
request:()=>api.post(`/attendance/${employeeId}`,data)
})

}


export const updateAttendance = async (id,data) => {
return executeOrRequestApproval({
approval:{
moduleKey:"attendance",
moduleLabel:"Attendance",
operation:"update",
resourceId:id,
payload:data,
summary:`Update attendance ${id}`
},
request:()=>api.put(`/attendance/update/${id}`,data)
})

}


export const deleteAttendance = async (id) => {
return executeOrRequestApproval({
approval:{
moduleKey:"attendance",
moduleLabel:"Attendance",
operation:"delete",
resourceId:id,
summary:`Delete attendance ${id}`
},
request:()=>api.delete(`/attendance/delete/${id}`)
})

}


export const deleteMonth = async (employeeId,year,month) => {
return executeOrRequestApproval({
approval:{
moduleKey:"attendance",
moduleLabel:"Attendance",
operation:"deleteMonth",
meta:{ employeeId, year, month },
summary:`Delete attendance for ${month}/${year}`
},
request:()=>api.delete(`/attendance/month/${employeeId}/${year}/${month}`)
})

}
