import { Navigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export default function RoleRedirect() {
  const { defaultRoute, isAuthenticated } = useAuth()

  return <Navigate to={isAuthenticated ? defaultRoute : "/login"} replace />
}