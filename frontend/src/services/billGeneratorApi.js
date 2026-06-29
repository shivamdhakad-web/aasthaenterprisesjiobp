import { api } from "./api"

export const getGeneratedBills = async () => {
  const { data } = await api.get("/bill-generator")
  return data
}

export const addGeneratedBill = async (payload) => {
  const { data } = await api.post("/bill-generator", payload)
  return data
}

export const updateGeneratedBill = async (id, payload) => {
  const { data } = await api.put(`/bill-generator/${id}`, payload)
  return data
}

export const deleteGeneratedBill = async (id) => {
  const { data } = await api.delete(`/bill-generator/${id}`)
  return data
}
