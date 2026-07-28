import { api } from "./api"

export const getNotifications = async () => {
  const { data } = await api.get("/notifications")
  return data
}

export const sendNotification = async (payload) => {
  const { data } = await api.post("/notifications", payload)
  return data
}

export const markNotificationRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`)
  return data
}

export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`)
  return data
}
