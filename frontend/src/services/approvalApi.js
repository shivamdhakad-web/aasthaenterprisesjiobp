import { api } from "./api"

export const getApprovals = async () => {
  const { data } = await api.get("/approvals")
  return data
}

export const approveRequest = async (id, note = "") => {
  const { data } = await api.post(`/approvals/${id}/approve`, { note })
  return data
}

export const rejectRequest = async (id, note = "") => {
  const { data } = await api.post(`/approvals/${id}/reject`, { note })
  return data
}