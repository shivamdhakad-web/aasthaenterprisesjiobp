import { createContext, useContext, useEffect, useMemo, useState } from "react"

const ThemeContext = createContext(null)
const STORAGE_KEY = "jio-bp-theme"

const getStoredTheme = () => {
  if (typeof window === "undefined") {
    return "night"
  }

  return window.localStorage.getItem(STORAGE_KEY) === "day" ? "day" : "night"
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    document.documentElement.style.colorScheme = theme === "day" ? "light" : "dark"
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      isDayTheme: theme === "day",
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "day" ? "night" : "day")),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider")
  }

  return context
}
