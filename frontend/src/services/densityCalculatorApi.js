import { api } from "./api"

export const getDensityCalculatorEntries = async (params = {}) => {
  const { data } = await api.get("/density-calculator", { params })
  return data
}

export const getDensityCalculatorPresets = async () => {
  const { data } = await api.get("/density-calculator/presets")
  return data
}

export const saveDensityCalculatorEntry = async (payload) => {
  const { data } = await api.post("/density-calculator", payload)
  return data
}

export const deleteDensityCalculatorEntry = async (id) => {
  const { data } = await api.delete(`/density-calculator/${id}`)
  return data
}