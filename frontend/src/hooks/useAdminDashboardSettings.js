import { useEffect, useState } from "react"

import { getAdminDashboardSettings } from "../services/adminDashboardSettingsApi"

const DEFAULT_STATE = {
  pages: [],
  loading: true,
  error: "",
}

export default function useAdminDashboardSettings(enabled = true) {
  const [state, setState] = useState(DEFAULT_STATE)

  useEffect(() => {
    if (!enabled) {
      setState({ pages: [], loading: false, error: "" })
      return undefined
    }

    let active = true

    const load = async () => {
      try {
        const data = await getAdminDashboardSettings()

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
            error: error?.response?.data?.message || "Unable to load admin dashboard settings.",
          })
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [enabled])

  return state
}
