import { useEffect, useMemo, useState } from "react";
import MobileActionFab from "../../components/MobileActionFab";
import { getEmployees } from "../../services/employeeApi";
import {
  addShiftSchedule,
  deleteShiftSchedule,
  getShiftSchedules,
  updateShiftSchedule,
} from "../../services/shiftApi";

const weekdayOptions = [
  { label: "Sunday", value: "0" },
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
];

const baseForm = {
  employeeId: "all",
  scheduleType: "recurring",
  weekDay: "1",
  date: new Date().toISOString().slice(0, 10),
  shiftName: "A Shift",
  startTime: "08:00",
  endTime: "16:00",
  period: "day",
  notes: "",
};

const getDisplayTarget = (item) => (item.appliesToAll ? "All Employees" : item.employeeId?.name || "-");

export default function ShiftSchedulePage() {
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(baseForm);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: "" });

  const load = async () => {
    const [employeeData, scheduleData] = await Promise.all([getEmployees(), getShiftSchedules()]);
    setEmployees(employeeData);
    setItems(scheduleData);
  };

  useEffect(() => {
    load();
  }, []);

  const openForm = (item = null) => {
    if (item) {
      setEditing(item);
      setForm({
        employeeId: item.appliesToAll ? "all" : item.employeeId?._id || item.employeeId,
        scheduleType: item.scheduleType,
        weekDay: String(item.weekDay ?? "1"),
        date: item.date?.slice?.(0, 10) || baseForm.date,
        shiftName: item.shiftName,
        startTime: item.startTime,
        endTime: item.endTime,
        period: item.period,
        notes: item.notes || "",
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
      await updateShiftSchedule(editing._id, form);
      setConfirmDialog({ open: true, message: "Schedule updated successfully!" });
    } else {
      await addShiftSchedule(form);
      setConfirmDialog({ open: true, message: "Schedule saved successfully!" });
    }
    closeModal();
    load();
  };

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) =>
      [getDisplayTarget(item), item.shiftName, item.notes, item.period]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [items, search]);

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header Section */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Shift / Duty Schedule</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Yahan se employee-wise ya sabke liye shift timing, weekly duty, aur day/night schedule assign kar sakte ho.
        </p>
      </section>

      {/* Desktop Add Button */}
      <div className="hidden sm:flex sm:justify-end">
        <button onClick={() => openForm()} className="btn btn-green">
          + New Schedule
        </button>
      </div>

      {/* Search & Reset Section */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search schedule"
            className="input sm:max-w-[420px]"
          />
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="table">
            <thead>
              <tr>
                <th>Target</th>
                <th>Type</th>
                <th>Day / Date</th>
                <th>Shift</th>
                <th>Timing</th>
                <th>Period</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id}>
                  <td>{getDisplayTarget(item)}</td>
                  <td>{item.scheduleType}</td>
                  <td>
                    {item.scheduleType === "recurring"
                      ? weekdayOptions.find((option) => option.value === String(item.weekDay))?.label
                      : item.date?.slice?.(0, 10)}
                   </td>
                  <td>{item.shiftName}</td>
                  <td>{item.startTime} - {item.endTime}</td>
                  <td className="capitalize">{item.period}</td>
                  <td>{item.notes || "-"}</td>
                  <td>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openForm(item)} className="text-blue-500">
                        Edit
                      </button>
                      <button onClick={() => deleteShiftSchedule(item._id).then(load)} className="text-red-500">
                        Delete
                      </button>
                    </div>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 lg:hidden">
          {filteredItems.map((item) => (
            <div key={item._id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[color:var(--text-strong)]">{item.shiftName}</p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{getDisplayTarget(item)}</p>
                </div>
                <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1 text-xs capitalize text-[color:var(--text-secondary)]">
                  {item.period}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--text-primary)]">
                {item.startTime} - {item.endTime}
              </p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                {item.scheduleType === "recurring"
                  ? weekdayOptions.find((option) => option.value === String(item.weekDay))?.label
                  : item.date?.slice?.(0, 10)}
              </p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{item.notes || "-"}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openForm(item)}
                  className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 text-sm text-blue-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteShiftSchedule(item._id).then(load)}
                  className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal for Schedule Form */}
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
              {editing ? "Edit Schedule" : "New Schedule"}
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

                <select
                  value={form.scheduleType}
                  onChange={(event) => setForm({ ...form, scheduleType: event.target.value })}
                  className="input"
                >
                  <option value="recurring">Recurring weekly</option>
                  <option value="one-time">One-time date</option>
                </select>

                {form.scheduleType === "recurring" ? (
                  <select
                    value={form.weekDay}
                    onChange={(event) => setForm({ ...form, weekDay: event.target.value })}
                    className="input"
                  >
                    {weekdayOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                    className="input"
                  />
                )}

                <input
                  value={form.shiftName}
                  onChange={(event) => setForm({ ...form, shiftName: event.target.value })}
                  placeholder="Shift name"
                  className="input"
                />
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                  className="input"
                />
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                  className="input"
                />
                <select
                  value={form.period}
                  onChange={(event) => setForm({ ...form, period: event.target.value })}
                  className="input"
                >
                  <option value="day">Day shift</option>
                  <option value="night">Night shift</option>
                </select>
              </div>

              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Duty note or instruction"
                rows={3}
                className="input"
              />

              <div className="flex gap-3 pt-4">
                <button onClick={submit} className="btn btn-green flex-1">
                  {editing ? "Update Schedule" : "Save Schedule"}
                </button>
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
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
          {
            label: editing ? "Edit Schedule" : "New Schedule",
            className: "bg-green-600",
            onClick: () => openForm(),
          },
        ]}
      />
    </div>
  );
}