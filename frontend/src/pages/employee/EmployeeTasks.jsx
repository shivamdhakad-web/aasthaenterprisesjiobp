import { useEffect, useMemo, useState } from "react";
import { getMyTasks, updateMyTaskStatus } from "../../services/employeeSelfApi";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const priorityTone = {
  low: "text-blue-500",
  medium: "text-yellow-500",
  high: "text-red-500",
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [notes, setNotes] = useState({});
  const [statuses, setStatuses] = useState({});

  // Custom dialogs ke liye states
  const [confirmModal, setConfirmModal] = useState({ open: false, taskId: null, pendingStatus: "", pendingNote: "" });
  const [infoModal, setInfoModal] = useState({ open: false, message: "" });

  const load = async () => {
    const data = await getMyTasks();
    setTasks(data.items || []);
    setCounts(data.counts || { total: 0, pending: 0, inProgress: 0, completed: 0 });
    setNotes(Object.fromEntries((data.items || []).map((item) => [item._id, item.employeeNote || ""])));
    setStatuses(Object.fromEntries((data.items || []).map((item) => [item._id, item.status || "pending"])));
  };

  useEffect(() => {
    load();
  }, []);

  const pendingTasks = useMemo(() => tasks.filter((task) => task.status !== "completed").length, [tasks]);

  // Jab "Save" click ho – confirm dialog dikhao
  const askToSave = (taskId) => {
    setConfirmModal({
      open: true,
      taskId,
      pendingStatus: statuses[taskId],
      pendingNote: notes[taskId] || "",
    });
  };

  // Confirm ke baad actual save karo
  const saveTask = async () => {
    const { taskId, pendingStatus, pendingNote } = confirmModal;
    if (!taskId) return;

    try {
      await updateMyTaskStatus(taskId, {
        status: pendingStatus,
        employeeNote: pendingNote,
      });
      setInfoModal({ open: true, message: "Task update saved" });
      await load();
      setNotes((current) => ({ ...current, [taskId]: "" }));
    } catch (error) {
      setInfoModal({
        open: true,
        message: error?.response?.data?.message || "The task update could not be saved.",
      });
    } finally {
      setConfirmModal({ open: false, taskId: null, pendingStatus: "", pendingNote: "" });
    }
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">My Tasks</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Daily tasks assigned by your admin or manager will be displayed here. You can update the status as completed or pending.
        </p>
      </section>

      {/* Count Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <TaskCountCard label="Total Tasks" value={counts.total} />
        <TaskCountCard label="Pending" value={counts.pending} />
        <TaskCountCard label="In Progress" value={counts.inProgress} />
        <TaskCountCard label="Completed" value={counts.completed} />
      </div>

      {/* Tasks List */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Assigned Tasks</h2>
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
            {pendingTasks} active
          </span>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task._id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">{task.title}</p>
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
                  onChange={(event) => setStatuses((current) => ({ ...current, [task._id]: event.target.value }))}
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
                  onChange={(event) => setNotes((current) => ({ ...current, [task._id]: event.target.value }))}
                  placeholder="Add progress note"
                  className="input"
                />
                <button onClick={() => askToSave(task._id)} className="btn btn-green w-full lg:w-auto">
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Confirm Dialog (Yes/No) */}
      {confirmModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setConfirmModal({ open: false, taskId: null, pendingStatus: "", pendingNote: "" })}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-6 text-lg text-[color:var(--text-strong)]">Want to save task updates?</p>
            <div className="flex gap-3">
              
              <button
                onClick={() => setConfirmModal({ open: false, taskId: null, pendingStatus: "", pendingNote: "" })}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium"
              >
                No
              </button>
              <button onClick={saveTask} className="btn btn-green flex-1">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Dialog (OK) – for success/error messages */}
      {infoModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setInfoModal({ open: false, message: "" })}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-6 text-lg text-[color:var(--text-strong)]">{infoModal.message}</p>
            <button onClick={() => setInfoModal({ open: false, message: "" })} className="btn btn-green w-full">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCountCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">{value}</p>
    </div>
  );
}