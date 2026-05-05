import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getCurrentUser, login as loginRequest } from "../services/authApi"
import { clearStoredSession, getStoredSession, storeSession } from "../lib/session"

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

  const resetSession = useCallback(() => {
    clearStoredSession()
    setSession(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const storedSession = getStoredSession()

    if (!storedSession?.token) {
      setLoading(false)
      setSession(null)
      return
    }

    try {
      const data = await getCurrentUser()
      const nextSession = {
        ...storedSession,
        user: data.user,
      }

      setSession(nextSession)
      storeSession(nextSession)
    } catch {
      resetSession()
    } finally {
      setLoading(false)
    }
  }, [resetSession])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined
    }

    const handleExternalLogout = () => {
      resetSession()
      setLoading(false)
    }

    const revalidateSession = () => {
      if (getStoredSession()?.token) {
        refreshSession()
      }
    }

    window.addEventListener("auth:logout", handleExternalLogout)
    window.addEventListener("focus", revalidateSession)

    const intervalId = window.setInterval(revalidateSession, 60 * 1000)

    return () => {
      window.removeEventListener("auth:logout", handleExternalLogout)
      window.removeEventListener("focus", revalidateSession)
      window.clearInterval(intervalId)
    }
  }, [refreshSession, resetSession])

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
            expiresAt: data.expiresAt,
          }

          setSession(nextSession)
          storeSession(nextSession)
        }

        return data
      },
      logout: () => {
        resetSession()
      },
    }),
    [loading, resetSession, session],
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