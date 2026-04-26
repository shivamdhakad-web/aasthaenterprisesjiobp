import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export default function ProtectedRoute({ roles }) {
  const { loading, isAuthenticated, user, defaultRoute } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#04060B] text-gray-300">
        Loading dashboard...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={defaultRoute} replace />
  }

  return <Outlet />
}