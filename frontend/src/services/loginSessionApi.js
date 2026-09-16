import { api } from "./api"

export const getLoginSessions = async (params = {}) => {
  const { data } = await api.get("/login-sessions", { params })
  return data
}

export const terminateLoginSession = async (id) => {
  const { data } = await api.patch(`/login-sessions/${id}/terminate`)
  return data
}
