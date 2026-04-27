import { useEffect, useMemo, useState } from "react"
import MobileActionFab from "../../components/MobileActionFab"
import { getEmployees } from "../../services/employeeApi"
import { addTask, deleteTask, getTasks, updateTask } from "../../services/taskApi"

const priorities = ["low", "medium", "high"]
const statuses = ["pending", "in_progress", "completed"]

const baseForm = {
  employeeId: "all",
  title: "",
  description: "",
  instructions: "",
  assignedDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  priority: "medium",
  status: "pending",
}

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")

export default function TasksPage() {
  const [employees, setEmployees] = useState([])
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [form, setForm] = useState(baseForm)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    const [employeeData, taskData] = await Promise.all([
      getEmployees(),
      getTasks(),
    ])

    setEmployees(employeeData)
    setItems(taskData)
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    if (editing) {
      await updateTask(editing._id, form)
    } else {
      await addTask(form)
    }

    setEditing(null)
    setForm(baseForm)
    load()
  }

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase()

    return items.filter((item) => {
      const haystack = [item.employeeName || item.employeeId?.name, item.title, item.description, item.instructions]
        .join(" ")
        .toLowerCase()

      return haystack.includes(term) && (!statusFilter || item.status === statusFilter)
    })
  }, [items, search, statusFilter])

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Tasks / Work Assignments</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Daily assigned tasks, completed / pending status, aur manager instructions yahin manage
          honge.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={form.employeeId}
            onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
            className="input"
          >
            <option value="all">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Task title"
            className="input"
          />
          <input
            type="date"
            value={form.assignedDate}
            onChange={(event) => setForm({ ...form, assignedDate: event.target.value })}
            className="input"
          />
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            className="input"
          />
          <select
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value })}
            className="input"
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            className="input"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button onClick={submit} className="btn btn-green w-full">
            {editing ? "Update Task" : "Assign Task"}
          </button>
          <button
            onClick={() => {
              setEditing(null)
              setForm(baseForm)
            }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]"
          >
            Reset Form
          </button>
        </div>
        <textarea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Task description"
          rows={3}
          className="input mt-3"
        />
        <textarea
          value={form.instructions}
          onChange={(event) => setForm({ ...form, instructions: event.target.value })}
          placeholder="Manager instructions"
          rows={3}
          className="input mt-3"
        />
      </section>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search task"
            className="input sm:max-w-[420px]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="input sm:max-w-[220px]"
          >
            <option value="">All status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Task</th>
                <th>Assigned</th>
                <th>Due</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Instructions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.employeeName || item.employeeId?.name || "-"}</td>
                  <td>{item.title}</td>
                  <td>{formatDate(item.assignedDate)}</td>
                  <td>{formatDate(item.dueDate)}</td>
                  <td className="capitalize">{item.priority}</td>
                  <td>{item.status}</td>
                  <td>{item.instructions || "-"}</td>
                  <td>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setEditing(item)
                          setForm({
                            employeeId: item.employeeId?._id || item.employeeId,
                            title: item.title,
                            description: item.description || "",
                            instructions: item.instructions || "",
                            assignedDate: item.assignedDate?.slice?.(0, 10) || baseForm.assignedDate,
                            dueDate: item.dueDate?.slice?.(0, 10) || "",
                            priority: item.priority || "medium",
                            status: item.status || "pending",
                          })
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }}
                        className="text-blue-500"
                      >
                        Edit
                      </button>
                      <button onClick={() => deleteTask(item._id).then(load)} className="text-red-500">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 lg:hidden">
          {filteredItems.map((item) => (
            <div key={item._id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[color:var(--text-strong)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {item.employeeName || item.employeeId?.name || "-"}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1 text-xs capitalize text-[color:var(--text-secondary)]">
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--text-primary)]">{item.description || "-"}</p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                Due {formatDate(item.dueDate)} • {item.priority}
              </p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                {item.instructions || "No manager instruction"}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setEditing(item)
                    setForm({
                      employeeId: item.employeeId?._id || item.employeeId,
                      title: item.title,
                      description: item.description || "",
                      instructions: item.instructions || "",
                      assignedDate: item.assignedDate?.slice?.(0, 10) || baseForm.assignedDate,
                      dueDate: item.dueDate?.slice?.(0, 10) || "",
                      priority: item.priority || "medium",
                      status: item.status || "pending",
                    })
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTask(item._id).then(load)}
                  className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <MobileActionFab
        actions={[
          {
            label: editing ? "Edit Task" : "New Task",
            className: "bg-green-600",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          },
        ]}
      />
    </div>
  )
}
