import { api } from "./api"

export const getTasks = async (params = {}) => {
  const { data } = await api.get("/tasks", { params })
  return data
}

export const addTask = async (payload) => {
  const { data } = await api.post("/tasks", payload)
  return data
}

export const updateTask = async (id, payload) => {
  const { data } = await api.put(`/tasks/${id}`, payload)
  return data
}

export const deleteTask = async (id) => {
  const { data } = await api.delete(`/tasks/${id}`)
  return data
}
