import { api } from "./api"

export const getLeaves = async (params = {}) => {
  const { data } = await api.get("/leaves", { params })
  return data
}

export const decideLeave = async (id, payload) => {
  const { data } = await api.put(`/leaves/${id}/decision`, payload)
  return data
}
