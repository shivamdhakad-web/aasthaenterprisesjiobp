import { api } from "./api"

export const getManagerDashboardSettings = async () => {
  const { data } = await api.get("/manager-dashboard-settings")
  return data
}

export const updateManagerDashboardSettings = async (payload) => {
  const { data } = await api.put("/manager-dashboard-settings", payload)
  return data
}
