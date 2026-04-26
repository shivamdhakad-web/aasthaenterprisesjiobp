import { useAuth } from "../../contexts/AuthContext"
import ApprovalActivityPanel from "./ApprovalActivityPanel"

export default function ApprovalWrappedPage({ moduleKey, title, children }) {
  const { user } = useAuth()

  return (
    <>
      {user?.role === "Manager" ? (
        <ApprovalActivityPanel moduleKey={moduleKey} title={title} />
      ) : null}
      {children}
    </>
  )
}