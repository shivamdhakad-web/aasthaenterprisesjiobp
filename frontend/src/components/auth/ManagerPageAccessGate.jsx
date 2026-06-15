import { Navigate } from "react-router-dom"

import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings"

export default function ManagerPageAccessGate({ pageKey, children }) {
  const { loading, page } = useManagerDashboardSettings(pageKey)

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-secondary)]">
          Loading manager access...
        </div>
      </div>
    )
  }

  if (page?.hidden) {
    return <Navigate to="/manager" replace />
  }

  return children
}
