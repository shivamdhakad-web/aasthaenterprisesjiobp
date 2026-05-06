import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const passwordHints = [
  "Admin password: 123",
  "Manager password: 456",
  "Employee password: 789",
]

export default function Login() {
  const [password, setPassword] = useState("")
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [employeePassword, setEmployeePassword] = useState("")
  const [stage, setStage] = useState("password")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { login, isAuthenticated, defaultRoute } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(defaultRoute, { replace: true })
    }
  }, [defaultRoute, isAuthenticated, navigate])

  const getRolePath = (role) => {
    if (role === "Admin") return "/admin"
    if (role === "Manager") return "/manager"
    if (role === "Employee") return "/employee"
    return "/"
  }

  const handleLogin = async () => {
    setError("")

    try {
      if (stage === "employee" && !selectedEmployee) {
        setError("Please choose employee")
        return
      }

      if (stage === "employee" && !employeePassword) {
        setError("Please enter employee personal password")
        return
      }

      const response = await login({
        password,
        employeeId: stage === "employee" ? selectedEmployee : undefined,
        employeePassword: stage === "employee" ? employeePassword : undefined,
      })

      if (response.requiresEmployeeSelection) {
        setEmployees(response.employees || [])
        setStage("employee")
        return
      }

      if (response.user?.role) {
        navigate(getRolePath(response.user.role), { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed")
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-main)] px-4 transition-colors duration-300">
      <div className="theme-surface w-full max-w-[420px] rounded-2xl border p-8 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-muted)]">Role-Based Secure Login</p>
        <h2 className="theme-text-strong mt-3 text-2xl font-semibold leading-tight tracking-tight">
  {stage === "employee" ? (
    <span className="flex flex-col items-center gap-1">
      <span>Employee Verification</span>
      <span className="text-sm font-normal text-[color:var(--text-secondary)]">
        Select employee & enter personal password
      </span>
    </span>
  ) : (
    <span className="flex flex-col items-center gap-1">
      <span>Admin • Manager • Employee</span>
      <span className="text-sm font-normal text-[color:var(--text-secondary)] mt-1">
        Secure Station Access
      </span>
    </span>
  )}
</h2>

        <input
          type="password"
          placeholder="Enter Access Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input mt-6 rounded-lg p-3"
        />

        {stage === "employee" ? (
          <>
            <select
              value={selectedEmployee}
              onChange={(event) => setSelectedEmployee(event.target.value)}
              className="input mt-4 rounded-lg p-3"
            >
              <option value="">Choose employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name}
                </option>
              ))}
            </select>

            <input
              type="password"
              placeholder="Employee Personal Password"
              value={employeePassword}
              onChange={(event) => setEmployeePassword(event.target.value)}
              className="input mt-4 rounded-lg p-3"
            />
          </>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <button
          onClick={handleLogin}
          className="mt-5 w-full rounded-lg bg-green-500 px-5 py-3 text-white"
        >
          {stage === "employee" ? "Open Employee Dashboard" : "Login"}
        </button>

        {stage === "employee" ? (
          <button
            onClick={() => {
              setStage("password")
              setSelectedEmployee("")
              setEmployeePassword("")
              setError("")
            }}
            className="mt-3 w-full rounded-lg border border-[color:var(--border-strong)] px-5 py-3 text-sm text-[color:var(--text-secondary)]"
          >
            Back
          </button>
        ) : null}

        {/* <div className="mt-5 rounded-xl border border-[color:var(--border-strong)] bg-[var(--bg-soft)] p-4 text-left text-sm text-[color:var(--text-secondary)]">
          {passwordHints.map((hint) => (
            <p key={hint}>{hint}</p>
          ))}
        </div> */}
      </div>
    </div>
  )
}
