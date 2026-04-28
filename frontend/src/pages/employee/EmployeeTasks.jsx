import { useEffect, useMemo, useState } from "react"
import { getMyTasks, updateMyTaskStatus } from "../../services/employeeSelfApi"

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
]

const priorityTone = {
  low: "text-blue-500",
  medium: "text-yellow-500",
  high: "text-red-500",
}

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([])
  const [counts, setCounts] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 })
  const [notes, setNotes] = useState({})
  const [statuses, setStatuses] = useState({})

  const load = async () => {
    const data = await getMyTasks()
    setTasks(data.items || [])
    setCounts(data.counts || { total: 0, pending: 0, inProgress: 0, completed: 0 })
    setNotes(
      Object.fromEntries((data.items || []).map((item) => [item._id, item.employeeNote || ""])),
    )
    setStatuses(
      Object.fromEntries((data.items || []).map((item) => [item._id, item.status || "pending"])),
    )
  }

  useEffect(() => {
    load()
  }, [])

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status !== "completed").length,
    [tasks],
  )

  const saveTask = async (taskId) => {
    const confirmed = window.confirm("Task update save karni hai?")
    if (!confirmed) {
      return
    }

    await updateMyTaskStatus(taskId, {
      status: statuses[taskId],
      employeeNote: notes[taskId],
    })

    window.alert("Task update save ho gayi hai")
    await load()
    setNotes((current) => ({ ...current, [taskId]: "" }))
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">
          Tasks / Work Assignments
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Admin ya manager se assigned daily tasks yahin milenge. Aap completed ya pending status
          update kar sakte ho.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <TaskCountCard label="Total Tasks" value={counts.total} />
        <TaskCountCard label="Pending" value={counts.pending} />
        <TaskCountCard label="In Progress" value={counts.inProgress} />
        <TaskCountCard label="Completed" value={counts.completed} />
      </div>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Assigned Tasks</h2>
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
            {pendingTasks} active
          </span>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                    {task.title}
                  </p>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Assigned: {formatDate(task.assignedDate)} • Due: {formatDate(task.dueDate)}
                  </p>
                  <p className="text-sm text-[color:var(--text-primary)]">
                    {task.description || "No task description added."}
                  </p>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Manager Instruction: {task.instructions || "-"}
                  </p>
                </div>

                <div className="rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  <span className={priorityTone[task.priority] || "text-[color:var(--text-strong)]"}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto]">
                <select
                  value={statuses[task._id] || task.status}
                  onChange={(event) =>
                    setStatuses((current) => ({ ...current, [task._id]: event.target.value }))
                  }
                  className="input"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <input
                  value={notes[task._id] || ""}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [task._id]: event.target.value }))
                  }
                  placeholder="Add progress note"
                  className="input"
                />

                <button onClick={() => saveTask(task._id)} className="btn btn-green w-full lg:w-auto">
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function TaskCountCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">{value}</p>
    </div>
  )
}
