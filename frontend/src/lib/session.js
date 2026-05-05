const SESSION_KEY = "jiobp-auth-session"
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000

const getSafeExpiry = (expiresAt) => {
  const parsedExpiry = expiresAt ? new Date(expiresAt).getTime() : NaN

  if (Number.isFinite(parsedExpiry)) {
    return new Date(parsedExpiry).toISOString()
  }

  return new Date(Date.now() + SESSION_DURATION_MS).toISOString()
}

export const getStoredSession = () => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    const session = raw ? JSON.parse(raw) : null

    if (!session) {
      return null
    }

    const expiresAt = getSafeExpiry(session.expiresAt)

    if (new Date(expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(SESSION_KEY)
      return null
    }

    return {
      ...session,
      expiresAt,
    }
  } catch {
    return null
  }
}

export const storeSession = (session) => {
  if (typeof window === "undefined" || !session) {
    return
  }

  const normalizedSession = {
    ...session,
    expiresAt: getSafeExpiry(session.expiresAt),
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalizedSession))
}

export const clearStoredSession = () => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(SESSION_KEY)
}

export const getStoredToken = () => getStoredSession()?.token || ""
export { SESSION_DURATION_MS }