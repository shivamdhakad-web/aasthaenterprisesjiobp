import { useEffect, useMemo, useState } from "react";
import MobileActionFab from "../../components/MobileActionFab";
import { useAuth } from "../../contexts/AuthContext";
import useManagerDashboardSettings from "../../hooks/useManagerDashboardSettings";
import { getEmployees } from "../../services/employeeApi";
import { addTask, deleteTask, getTasks, updateTask } from "../../services/taskApi";

const priorities = ["low", "medium", "high"];
const statuses = ["pending", "in_progress", "completed"];

const baseForm = {
  employeeId: "all",
  title: "",
  description: "",
  instructions: "",
  assignedDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  priority: "medium",
  status: "pending",
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    case "in_progress":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

export default function TasksPage() {
  const { user } = useAuth();
  const isManager = user?.role === "Manager";
  const { canUse } = useManagerDashboardSettings("tasks", isManager);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(baseForm);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: "" });
  const [openCard, setOpenCard] = useState(null);

  const load = async () => {
    const [employeeData, taskData] = await Promise.all([getEmployees(), getTasks()]);
    setEmployees(employeeData);
    setItems(taskData);
  };

  useEffect(() => {
    load();
  }, []);

  const canManagerUse = (buttonKey) => !isManager || canUse(buttonKey);

  const openForm = (item = null) => {
    if (item && !canManagerUse("updateTask")) {
      setConfirmDialog({ open: true, message: "You do not have access to update tasks." });
      return;
    }
    if (!item && !canManagerUse("assignTask")) {
      setConfirmDialog({ open: true, message: "You do not have access to assign tasks." });
      return;
    }

    if (item) {
      setEditing(item);
      setForm({
        employeeId: item.employeeId?._id || item.employeeId,
        title: item.title,
        description: item.description || "",
        instructions: item.instructions || "",
        assignedDate: item.assignedDate?.slice?.(0, 10) || baseForm.assignedDate,
        dueDate: item.dueDate?.slice?.(0, 10) || "",
        priority: item.priority || "medium",
        status: item.status || "pending",
      });
    } else {
      setEditing(null);
      setForm(baseForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(baseForm);
  };

  const submit = async () => {
    if (editing) {
      if (!canManagerUse("updateTask")) {
        setConfirmDialog({ open: true, message: "You do not have access to update tasks." });
        return;
      }
      await updateTask(editing._id, form);
      setConfirmDialog({ open: true, message: "Task updated successfully!" });
    } else {
      if (!canManagerUse("assignTask")) {
        setConfirmDialog({ open: true, message: "You do not have access to assign tasks." });
        return;
      }
      await addTask(form);
      setConfirmDialog({ open: true, message: "Task assigned successfully!" });
    }
    closeModal();
    load();
  };

  const handleDelete = async (id) => {
    if (!canManagerUse("deleteTask")) {
      setConfirmDialog({ open: true, message: "You do not have access to delete tasks." });
      return;
    }

    await deleteTask(id);
    await load();
  };

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) => {
      const haystack = [item.employeeName || item.employeeId?.name, item.title, item.description, item.instructions]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term) && (!statusFilter || item.status === statusFilter);
    });
  }, [items, search, statusFilter]);

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header Section */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Tasks / Work Assignments</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Daily assigned tasks, completed/pending status, and manager instructions will be managed here.
        </p>
      </section>

      {/* Desktop Add Task Button */}
      {canManagerUse("assignTask") && (
        <div className="hidden sm:flex sm:justify-end">
          <button onClick={() => openForm()} className="btn btn-green">
            + New Task
          </button>
        </div>
      )}

      {/* Search & Filter Section */}
      <section className="rounded-2xl p-0">
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

        {/* Desktop Table */}
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
                  <td>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.instructions || "-"}</td>
                  <td>
                    <div className="flex items-center justify-center gap-3">
                      {canManagerUse("updateTask") && (
                        <button onClick={() => openForm(item)} className="text-blue-500">
                          Edit
                        </button>
                      )}
                      {canManagerUse("deleteTask") && (
                        <button onClick={() => handleDelete(item._id)} className="text-red-500">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards – expandable with colored status */}
        <div className="space-y-3 lg:hidden">
          {filteredItems.map((item) => {
            const isOpen = openCard === item._id;
            return (
              <div
                key={item._id}
                onClick={() => setOpenCard(isOpen ? null : item._id)}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)] active:scale-[0.98] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[color:var(--text-strong)]">{item.title}</p>
                    <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                      {item.employeeName || item.employeeId?.name || "-"}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs capitalize ${getStatusColor(item.status)}`}>
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

                {isOpen && (
                  <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-3">
                    <div className="flex gap-2">
                      {canManagerUse("updateTask") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openForm(item);
                          }}
                          className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                        >
                          Edit
                        </button>
                      )}
                      {canManagerUse("deleteTask") && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDelete(item._id);
                          }}
                          className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal for Task Form */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold text-[color:var(--text-strong)]">
              {editing ? "Edit Task" : "Assign New Task"}
            </h2>

            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
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
              </div>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Task description"
                rows={3}
                className="input"
              />
              <textarea
                value={form.instructions}
                onChange={(event) => setForm({ ...form, instructions: event.target.value })}
                placeholder="Manager instructions"
                rows={3}
                className="input"
              />

              <div className="flex gap-3 pt-4">
                <button onClick={submit} className="btn btn-green flex-1">
                  {editing ? "Update Task" : "Assign Task"}
                </button>
                <button onClick={closeModal} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDialog({ open: false, message: "" })}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-6 text-lg text-[color:var(--text-strong)]">{confirmDialog.message}</p>
            <button
              onClick={() => setConfirmDialog({ open: false, message: "" })}
              className="btn btn-green w-full"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <MobileActionFab
        actions={[
          canManagerUse("assignTask")
            ? {
                label: "New Task",
                className: "bg-green-600",
                onClick: () => openForm(),
              }
            : null,
        ].filter(Boolean)}
      />
    </div>
  );
}
