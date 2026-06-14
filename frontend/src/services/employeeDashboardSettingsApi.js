import { api } from "./api"

export const getEmployeeDashboardSettings = async () => {
  const { data } = await api.get("/employee-dashboard-settings")
  return data
}

export const updateEmployeeDashboardSettings = async (payload) => {
  const { data } = await api.put("/employee-dashboard-settings", payload)
  return data
}
