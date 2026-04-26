const SESSION_KEY = "jiobp-auth-session"

export const getStoredSession = () => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const storeSession = (session) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export const clearStoredSession = () => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(SESSION_KEY)
}

export const getStoredToken = () => getStoredSession()?.token || ""