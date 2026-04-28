import { useEffect, useState } from "react";
import MobileActionFab from "../../components/MobileActionFab";
import { applyMyLeave, getMyLeaves } from "../../services/employeeSelfApi";

const leaveTypes = ["CL", "SL", "PL", "LOP"];

const statusTone = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

const baseForm = {
  leaveType: "CL",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  reason: "",
};

export default function EmployeeLeave() {
  const [form, setForm] = useState(baseForm);
  const [items, setItems] = useState([]);
  const [balances, setBalances] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const load = async () => {
    const data = await getMyLeaves();
    setItems(data.items || []);
    setBalances(data.balances || []);
  };

  useEffect(() => {
    load();
  }, []);

  const openForm = () => {
    setForm(baseForm);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const submit = async () => {
    await applyMyLeave(form);
    setSuccessMessage("Leave Submitted ✅");
    setShowSuccessPopup(true);
    closeModal();
    load();
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header Section */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Leave Management</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Leave apply yahin se karo. Admin approval ke baad attendance me us date par automatic absent mark ho jayega.
        </p>
      </section>

      {/* Desktop Apply Button */}
      <div className="hidden sm:flex sm:justify-end">
        <button onClick={openForm} className="btn btn-green">
          + Apply Leave
        </button>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {balances.map((balance) => (
          <div key={balance.type} className="card">
            <p className="text-sm text-[color:var(--text-secondary)]">{balance.type} Balance</p>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
              {balance.remaining}
            </p>
            <p className="mt-2 text-xs text-[color:var(--text-secondary)]">
              Used {balance.used} / Total {balance.total}
            </p>
          </div>
        ))}
      </div>

      {/* Leave History Table */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Leave History</h2>
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
            {items.length} request{items.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.leaveType}</td>
                  <td>{formatDate(item.startDate)}</td>
                  <td>{formatDate(item.endDate)}</td>
                  <td>{item.days}</td>
                  <td>{item.reason || "-"}</td>
                  <td>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                    {item.leaveType}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {formatDate(item.startDate)} to {formatDate(item.endDate)}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
                Days: {item.days} • {item.reason || "No reason added"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile FAB */}
      <MobileActionFab
        actions={[
          {
            label: "Apply Leave",
            className: "bg-green-600",
            onClick: () => openForm(),
          },
        ]}
      />

      {/* Modal for Leave Application Form */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold text-[color:var(--text-strong)]">Apply Leave</h2>

            <div className="space-y-4">
              <select
                value={form.leaveType}
                onChange={(event) => setForm({ ...form, leaveType: event.target.value })}
                className="input"
              >
                {leaveTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                className="input"
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                className="input"
              />
              <textarea
                value={form.reason}
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
                placeholder="Reason for leave"
                rows={4}
                className="input"
              />

              <div className="flex gap-3 pt-4">
                <button onClick={submit} className="btn btn-green flex-1">
                  Apply Leave
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

      {/* Success Confirmation Dialog (with OK button) */}
      {showSuccessPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowSuccessPopup(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border-strong)] bg-white p-6 text-center shadow-xl dark:bg-[var(--bg-panel)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
              {successMessage}
            </h2>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="mt-5 w-full rounded-xl bg-green-600 py-2 text-white hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}