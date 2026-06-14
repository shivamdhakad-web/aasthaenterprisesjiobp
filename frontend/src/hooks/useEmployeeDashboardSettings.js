import { useEffect, useMemo, useState } from "react"

import { getEmployeeDashboardSettings } from "../services/employeeDashboardSettingsApi"

const DEFAULT_STATE = {
  pages: [],
  loading: true,
  error: "",
}

export default function useEmployeeDashboardSettings(pageKey = "") {
  const [state, setState] = useState(DEFAULT_STATE)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await getEmployeeDashboardSettings()

        if (active) {
          setState({
            pages: Array.isArray(data?.pages) ? data.pages : [],
            loading: false,
            error: "",
          })
        }
      } catch (error) {
        if (active) {
          setState({
            pages: [],
            loading: false,
            error: error?.response?.data?.message || "Unable to load employee dashboard settings.",
          })
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const page = useMemo(
    () => state.pages.find((item) => item.key === pageKey),
    [pageKey, state.pages],
  )

  const canUse = (buttonKey) => {
    if (!pageKey || state.loading || !page) {
      return true
    }

    const button = page.buttons?.find((item) => item.key === buttonKey)
    return button?.enabled !== false
  }

  return {
    ...state,
    page,
    canUse,
  }
}
