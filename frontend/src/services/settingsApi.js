import axios from "axios"
import { api, executeOrRequestApproval } from "./api"

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

export const getSettings = async () => {
  const { data } = await api.get("/settings")
  return data
}

export const updateSettings = async (data) => {
  return executeOrRequestApproval({
    approval: {
      moduleKey: "settings",
      moduleLabel: "Station Settings",
      operation: "update",
      payload: data,
      summary: "Update station settings",
    },
    request: () => api.put("/settings", data),
  })
}

export const changeDashboardPassword = async (payload) => {
  const { data } = await api.post("/settings/passwords/change", payload)
  return data
}

export const getFuelPrices = async () => {
  const res = await api.get(`/settings/fuel-prices`)
  return res.data
}

export const updateFuelPrices = async (data) => {
  const res = await api.put(`/settings/fuel-prices`, data)
  return res.data
}

export const getFuelHistory = async () => {
  const res = await api.get(`/settings/fuel-history`)
  return res.data
}

export const addFuelHistory = async (data) => {
  const res = await api.post(`/settings/fuel-history`, data)
  return res.data
}

export const deleteFuelHistory = async (id) => {
  const res = await api.delete(`/settings/fuel-history/${id}`)
  return res.data
}

export const getTankSettings = async () => {
  const res = await api.get(`/settings/tank`)
  return res.data
}

export const updateTankSettings = async (id, data) => {
  const res = await api.put(`/settings/tank/${id}`, data)
  return res.data
}

export const getCreditSettings = async () => {
  const res = await api.get(`/settings/credit`)
  return res.data
}

export const updateCreditSettings = async (data) => {
  const res = await api.put(`/settings/credit`, data)
  return res.data
}

export const getInvoiceSettings = async () => {
  const res = await axios.get(`${API}/settings/invoice`)
  return res.data
}

export const updateInvoiceSettings = async (data) => {
  const res = await axios.put(`${API}/settings/invoice`, data)
  return res.data
}

export const uploadLogo = async (formData) => {
  const res = await axios.post(`${API}/settings/logo`, formData)
  return res.data
}

export const getUsers = async () => {
  const res = await axios.get(`${API}/users`)
  return res.data
}

export const addUser = async (data) => {
  const res = await axios.post(`${API}/users`, data)
  return res.data
}

export const updateUser = async (id, data) => {
  const res = await axios.put(`${API}/users/${id}`, data)
  return res.data
}

export const deleteUser = async (id) => {
  const res = await axios.delete(`${API}/users/${id}`)
  return res.data
}

export const getNotifications = async () => {
  const res = await axios.get(`${API}/settings/notifications`)
  return res.data
}

export const updateNotifications = async (data) => {
  const res = await axios.put(`${API}/settings/notifications`, data)
  return res.data
}

export const getEmailSettings = async () => {
  const res = await axios.get(`${API}/settings/email`)
  return res.data
}

export const updateEmailSettings = async (data) => {
  const res = await axios.put(`${API}/settings/email`, data)
  return res.data
}

export const testEmail = async () => {
  const res = await axios.post(`${API}/settings/email/test`)
  return res.data
}

export const downloadBackup = async () => {
  const res = await axios.get(`${API}/settings/backup`)
  return res.data
}

export const exportReports = async () => {
  const res = await axios.get(`${API}/settings/export`)
  return res.data
}

export const resetSystem = async () => {
  const res = await axios.post(`${API}/settings/reset`)
  return res.data
}