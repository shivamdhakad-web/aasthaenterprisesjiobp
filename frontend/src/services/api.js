import axios from "axios"
import { getStoredSession, getStoredToken } from "../lib/session"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

const notifyApprovalCreated = (response) => {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent("approval:created", {
      detail: response,
    }),
  )
}

export const executeOrRequestApproval = async ({ approval, request }) => {
  const session = getStoredSession()

  if (session?.user?.role === "Manager") {
    const { data } = await api.post("/approvals", approval)
    notifyApprovalCreated(data)

    if (typeof window !== "undefined") {
      window.alert(data.message || "Request sent for admin approval")
    }

    return data
  }

  const { data } = await request()
  return data
}

export const getCurrentRole = () => getStoredSession()?.user?.role || null