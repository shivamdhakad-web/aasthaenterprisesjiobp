import { api } from "./api"

export const getAdminDashboardSettings = async () => {
  const { data } = await api.get("/admin-dashboard-settings")
  return data
}

export const updateAdminDashboardSettings = async (payload) => {
  const { data } = await api.put("/admin-dashboard-settings", payload)
  return data
}
