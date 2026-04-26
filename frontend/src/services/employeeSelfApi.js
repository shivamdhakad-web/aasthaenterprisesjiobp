import { api } from "./api"

export const getEmployeeOverview = async () => {
  const { data } = await api.get("/employee/overview")
  return data
}

export const getMyAttendance = async () => {
  const { data } = await api.get("/employee/attendance")
  return data
}

export const addMyAttendance = async (payload) => {
  const { data } = await api.post("/employee/attendance", payload)
  return data
}

export const updateMyAttendance = async (id, payload) => {
  const { data } = await api.put(`/employee/attendance/${id}`, payload)
  return data
}

export const getEmployeeProducts = async () => {
  const { data } = await api.get("/employee/lubricants/products")
  return data
}

export const getMyLubricants = async () => {
  const { data } = await api.get("/employee/lubricants")
  return data
}

export const addMyLubricant = async (payload) => {
  const { data } = await api.post("/employee/lubricants", payload)
  return data
}

export const updateMyLubricant = async (id, payload) => {
  const { data } = await api.put(`/employee/lubricants/${id}`, payload)
  return data
}

export const getMyDailyReports = async () => {
  const { data } = await api.get("/employee/daily-reports")
  return data
}

export const addMyDailyReport = async (payload) => {
  const { data } = await api.post("/employee/daily-reports", payload)
  return data
}

export const updateMyDailyReport = async (id, payload) => {
  const { data } = await api.put(`/employee/daily-reports/${id}`, payload)
  return data
}
