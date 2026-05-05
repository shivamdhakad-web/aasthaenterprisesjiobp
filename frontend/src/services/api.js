import axios from "axios"
import { clearStoredSession, getStoredToken } from "../lib/session"

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const requestUrl = error?.config?.url || ""
    const hasStoredToken = Boolean(getStoredToken())
    const isLoginRequest = requestUrl.includes("/auth/login")

    if (status === 401 && hasStoredToken && !isLoginRequest) {
      clearStoredSession()

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:logout", {
            detail: { message: error?.response?.data?.message || "Session expired" },
          }),
        )

        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login"
        }
      }
    }

    return Promise.reject(error)
  },
)

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
  const sessionRaw = typeof window !== "undefined" ? window.localStorage.getItem("jiobp-auth-session") : null
  const session = sessionRaw ? JSON.parse(sessionRaw) : null

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

export const getCurrentRole = () => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem("jiobp-auth-session")
    const session = raw ? JSON.parse(raw) : null
    return session?.user?.role || null
  } catch {
    return null
  }
}