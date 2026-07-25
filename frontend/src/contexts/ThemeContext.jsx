import { createContext, useContext, useEffect, useMemo, useState } from "react"

const ThemeContext = createContext(null)
const STORAGE_KEY = "jio-bp-theme"
const ZOOM_STORAGE_KEY = "jio-bp-zoom-level"
const DEFAULT_ZOOM = 90
const ZOOM_STEPS = [80, 90, 100, 110, 125, 150]

const getStoredTheme = () => {
  if (typeof window === "undefined") {
    return "night"
  }

  return window.localStorage.getItem(STORAGE_KEY) === "day" ? "day" : "night"
}

const getStoredZoom = () => {
  if (typeof window === "undefined") {
    return DEFAULT_ZOOM
  }

  const raw = window.localStorage.getItem(ZOOM_STORAGE_KEY)
  if (!raw) return DEFAULT_ZOOM

  const stored = Number(raw)
  return ZOOM_STEPS.includes(stored) ? stored : DEFAULT_ZOOM
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme)
  const [zoomLevel, setZoomLevel] = useState(getStoredZoom)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    document.documentElement.style.colorScheme = theme === "day" ? "light" : "dark"
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const activeZoom = ZOOM_STEPS.includes(Number(zoomLevel)) ? Number(zoomLevel) : DEFAULT_ZOOM
    const zoomFactor = activeZoom / 100
    const screenVh = (100 / zoomFactor).toFixed(3) + "vh"

    document.documentElement.style.zoom = `${activeZoom}%`
    document.documentElement.style.setProperty("--app-screen-height", screenVh)
    document.documentElement.style.setProperty("--app-zoom-factor", String(zoomFactor))

    const bg = theme === "day" ? "#f4f5ef" : "#04060b"
    document.documentElement.style.backgroundColor = bg
    document.body.style.backgroundColor = bg

    window.localStorage.setItem(ZOOM_STORAGE_KEY, String(activeZoom))
  }, [zoomLevel, theme])

  const zoomIn = () => {
    setZoomLevel((current) => {
      const active = ZOOM_STEPS.includes(Number(current)) ? Number(current) : DEFAULT_ZOOM
      const idx = ZOOM_STEPS.indexOf(active)
      if (idx !== -1 && idx < ZOOM_STEPS.length - 1) {
        return ZOOM_STEPS[idx + 1]
      }
      return active
    })
  }

  const zoomOut = () => {
    setZoomLevel((current) => {
      const active = ZOOM_STEPS.includes(Number(current)) ? Number(current) : DEFAULT_ZOOM
      const idx = ZOOM_STEPS.indexOf(active)
      if (idx !== -1 && idx > 0) {
        return ZOOM_STEPS[idx - 1]
      }
      return active
    })
  }

  const resetZoom = () => {
    setZoomLevel(DEFAULT_ZOOM)
  }

  const activeZoomLevel = ZOOM_STEPS.includes(Number(zoomLevel)) ? Number(zoomLevel) : DEFAULT_ZOOM

  const value = useMemo(
    () => ({
      theme,
      isDayTheme: theme === "day",
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "day" ? "night" : "day")),
      zoomLevel: activeZoomLevel,
      setZoomLevel,
      zoomIn,
      zoomOut,
      resetZoom,
    }),
    [theme, activeZoomLevel],
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
