import { useEffect, useState } from "react";
import MobileActionFab from "../../components/MobileActionFab";
import useEmployeeDashboardSettings from "../../hooks/useEmployeeDashboardSettings";
import {
  addMyAttendance,
  getMyAttendance,
  updateMyAttendance,
} from "../../services/employeeSelfApi";

const initialForm = {
  date: new Date().toISOString().slice(0, 10),
  status: "present",
  remark: "",
};

const getDateKey = (value) => new Date(value).toISOString().slice(0, 10);

export default function EmployeeAttendance() {
  const { canUse } = useEmployeeDashboardSettings("attendance");
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: "" });

  const load = async () => {
    const data = await getMyAttendance();
    setEntries(data);
  };

  useEffect(() => {
    load();
  }, []);

  const openForm = (entry = null) => {
    if (entry) {
      setEditing(entry);
      setForm({
        date: new Date(entry.date).toISOString().slice(0, 10),
        status: entry.status,
        remark: entry.remark || "",
      });
    } else {
      setEditing(null);
      setForm(initialForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(initialForm);
  };

  const submit = async () => {
    if (editing && (!editing.canEdit || !canUse("editEntry"))) {
      setConfirmDialog({ open: true, message: "You cannot edit this attendance entry." });
      return;
    }

    const duplicateEntry = entries.find(
      (entry) => getDateKey(entry.date) === form.date && (!editing || entry._id !== editing._id)
    );

    if (duplicateEntry) {
      setConfirmDialog({ open: true, message: "Attendance for this date already exists!" });
      return;
    }

    try {
      if (editing) {
        await updateMyAttendance(editing._id, form);
        setConfirmDialog({ open: true, message: "Attendance has been updated" });
      } else {
        await addMyAttendance(form);
        setConfirmDialog({ open: true, message: "Attendance has been submitted" });
      }

      closeModal();
      load();
    } catch (error) {
      setConfirmDialog({
        open: true,
        message: error?.response?.data?.message || "Attendance could not be saved",
      });
    }
  };

  const canAddEntry = canUse("newEntry");
  const canEditEntry = canUse("editEntry");
  const readOnlyMode = Boolean(editing && (!editing.canEdit || !canEditEntry));

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header Section */}
      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 sm:p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">My Attendance</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          You can mark or update the current month's entries from here.
        </p>
      </div>

      {/* Desktop Add Button */}
      {canAddEntry ? (
      <div className="hidden sm:flex sm:justify-end">
        <button onClick={() => openForm()} className="btn btn-green">
          + New Entry
        </button>
      </div>
      ) : null}

      {/* Attendance List Table */}
      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Remark</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="capitalize">{entry.status}</td>
                  <td>{entry.remark || "-"}</td>
                  <td>
                    <button onClick={() => openForm(entry)} className="text-blue-500">
                      {entry.canEdit && canEditEntry ? "Edit" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
              <div className="space-y-3 md:hidden">
  {entries.map((entry) => (
    <div
      key={entry._id}
      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4 flex justify-between items-center"
    >
      {/* Left side content */}
      <div className="flex-1">
        <p className="text-sm text-[color:var(--text-secondary)]">
          {new Date(entry.date).toLocaleDateString()}
        </p>
        <p className="mt-2 text-lg font-medium capitalize text-[color:var(--text-strong)]">
          {entry.status}
        </p>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          {entry.remark || "No remark"}
        </p>
      </div>

      {/* Right side button - vertically centered */}
      <button
        onClick={() => openForm(entry)}
        className="ml-4 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-500"
      >
        {entry.canEdit && canEditEntry ? "Edit entry" : "View entry"}
      </button>
    </div>
  ))}
</div>
      </div>

      {/* Modal for Attendance Form */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold text-[color:var(--text-strong)]">
              {editing ? (readOnlyMode ? "View Attendance" : "Edit Attendance") : "Add Attendance"}
            </h2>

            <div className="space-y-4">
              <input
                type="date"
                value={form.date}
                disabled={readOnlyMode}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                className="input"
              />
              <select
                value={form.status}
                disabled={readOnlyMode}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className="input"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="double">Double Shift</option>
                <option value="half">Half Shift</option>
              </select>
              <input
                value={form.remark}
                disabled={readOnlyMode}
                onChange={(event) => setForm({ ...form, remark: event.target.value })}
                placeholder="Remark"
                className="input"
              />

              <div className="flex gap-3 pt-4">
 
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium"
                >
                  {readOnlyMode ? "Close" : "Cancel"}
                </button>
                               {!readOnlyMode && (
                  <button onClick={submit} className="btn btn-green flex-1">
                    {editing ? "Update Entry" : "Save Entry"}
                  </button>
                )}
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
      {canAddEntry ? (
      <MobileActionFab
        actions={[
          {
            label: "New Entry",
            className: "bg-green-600",
            onClick: () => openForm(),
          },
        ]}
      />
      ) : null}
    </div>
  );
}
