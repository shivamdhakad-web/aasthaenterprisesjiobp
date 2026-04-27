import { api } from "./api"

export const getShiftSchedules = async (params = {}) => {
  const { data } = await api.get("/shifts", { params })
  return data
}

export const addShiftSchedule = async (payload) => {
  const { data } = await api.post("/shifts", payload)
  return data
}

export const updateShiftSchedule = async (id, payload) => {
  const { data } = await api.put(`/shifts/${id}`, payload)
  return data
}

export const deleteShiftSchedule = async (id) => {
  const { data } = await api.delete(`/shifts/${id}`)
  return data
}
