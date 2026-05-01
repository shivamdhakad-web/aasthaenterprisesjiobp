import { api } from "./api"

export const getSmartCalculatorEntries = async () => {
  const { data } = await api.get("/smart-calculator")
  return data
}

export const saveSmartCalculatorEntry = async (payload) => {
  const { data } = await api.post("/smart-calculator", payload)
  return data
}

export const deleteSmartCalculatorEntry = async (id) => {
  const { data } = await api.delete(`/smart-calculator/${id}`)
  return data
}