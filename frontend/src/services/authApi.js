import { api } from "./api"

export const login = async (payload) => {
  const { data } = await api.post("/auth/login", payload)
  return data
}

export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me")
  return data
}

export const getEmployeeChoices = async () => {
  const { data } = await api.get("/auth/employees")
  return data
}