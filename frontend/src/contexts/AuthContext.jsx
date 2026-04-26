import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getCurrentUser, login as loginRequest } from "../services/authApi"
import {
  clearStoredSession,
  getStoredSession,
  storeSession,
} from "../lib/session"

const AuthContext = createContext(null)

const getDefaultRoute = (role) => {
  if (role === "Admin") return "/admin"
  if (role === "Manager") return "/manager"
  if (role === "Employee") return "/employee"
  return "/login"
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession())
  const [loading, setLoading] = useState(Boolean(getStoredSession()?.token))

  useEffect(() => {
    const bootstrap = async () => {
      if (!session?.token) {
        setLoading(false)
        return
      }

      try {
        const data = await getCurrentUser()
        const nextSession = { ...session, user: data.user }
        setSession(nextSession)
        storeSession(nextSession)
      } catch {
        clearStoredSession()
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      loading,
      defaultRoute: getDefaultRoute(session?.user?.role),
      isAuthenticated: Boolean(session?.token),
      login: async (payload) => {
        const data = await loginRequest(payload)

        if (data.token && data.user) {
          const nextSession = {
            token: data.token,
            user: data.user,
          }

          setSession(nextSession)
          storeSession(nextSession)
        }

        return data
      },
      logout: () => {
        clearStoredSession()
        setSession(null)
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}