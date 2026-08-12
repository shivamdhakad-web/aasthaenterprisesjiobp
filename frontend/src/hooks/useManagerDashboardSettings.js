import { useEffect, useMemo, useState } from "react"

import { getManagerDashboardSettings } from "../services/managerDashboardSettingsApi"

const DEFAULT_STATE = {
  pages: [],
  loading: true,
  error: "",
}

export default function useManagerDashboardSettings(pageKey = "", enabled = true) {
  const [state, setState] = useState(DEFAULT_STATE)

  useEffect(() => {
    if (!enabled) {
      setState({ pages: [], loading: false, error: "" })
      return undefined
    }

    let active = true

    const load = async () => {
      try {
        const data = await getManagerDashboardSettings()

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
            error: error?.response?.data?.message || "Unable to load manager dashboard settings.",
          })
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [enabled])

  const page = useMemo(
    () => state.pages.find((item) => item.key === pageKey),
    [pageKey, state.pages],
  )

  const canUse = (buttonKey) => {
    if (!pageKey) {
      return true
    }

    if (state.loading) {
      return false
    }

    if (!page) {
      return true
    }

    const button = page.buttons?.find((item) => item.key === buttonKey)
    return button?.enabled !== false
  }

  const canShowCard = (cardKey) => {
    if (!pageKey) {
      return true
    }

    if (state.loading) {
      return false
    }

    if (!page) {
      return true
    }

    const card = page.cards?.find((item) => item.key === cardKey)
    return card?.enabled !== false
  }

  return {
    ...state,
    page,
    canUse,
    canShowCard,
  }
}

