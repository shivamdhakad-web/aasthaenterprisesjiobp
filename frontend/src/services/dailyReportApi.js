import { api } from "./api"

export const getDailyReports = async (params = {}) => {
  const { data } = await api.get("/daily-reports", { params })
  return data
}

export const updateDailyReport = async (id, payload) => {
  const { data } = await api.put(`/daily-reports/${id}`, payload)
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
