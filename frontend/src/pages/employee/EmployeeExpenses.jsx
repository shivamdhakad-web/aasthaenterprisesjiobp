import { useEffect, useState } from "react";
import MobileActionFab from "../../components/MobileActionFab";
import {
  addMyExpense,
  getMyExpenses,
  updateMyExpense,
} from "../../services/employeeSelfApi";

const categories = ["Travel", "Stationery", "Food", "Repair", "Misc"];
const paymentModes = ["Cash", "UPI", "Bank"];

const baseForm = {
  date: new Date().toISOString().slice(0, 10),
  category: "Travel",
  description: "",
  amount: "",
  paymentMode: "Cash",
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export default function EmployeeExpenses() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(baseForm);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: "" });

  const load = async () => {
    const data = await getMyExpenses();
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const openForm = (item = null) => {
    if (item) {
      setEditing(item);
      setForm({
        date: item.date,
        category: item.category,
        description: item.description || "",
        amount: item.amount,
        paymentMode: item.paymentMode || "Cash",
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
    if (editing && !editing.canEdit) {
      setConfirmDialog({ open: true, message: "You cannot edit this expense entry." });
      return;
    }

    try {
      if (editing) {
        await updateMyExpense(editing._id, form);
        setConfirmDialog({ open: true, message: "Expenses have been updated" });
      } else {
        await addMyExpense(form);
        setConfirmDialog({ open: true, message: "Expense has been submitted" });
      }
      closeModal();
      load();
    } catch (error) {
      setConfirmDialog({
        open: true,
        message: error?.response?.data?.message || "Expense could not be saved",
      });
    }
  };

  const readOnlyMode = Boolean(editing && !editing.canEdit);

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header Section */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">My Expenses</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Employee side se jo expense add karoge woh admin expense page me bhi automatic show hoga.
        </p>
      </section>

      {/* Desktop Add Button */}
      <div className="hidden sm:flex sm:justify-end">
        <button onClick={() => openForm()} className="btn btn-green">
          + New Expense
        </button>
      </div>

      {/* Expenses Table */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.date}</td>
                  <td>{item.category}</td>
                  <td>{item.description || "-"}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.paymentMode}</td>
                  <td>
                    <button onClick={() => openForm(item)} className="text-blue-500">
                      {item.canEdit ? "Edit" : "View"}
                    </button>
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
                    {formatCurrency(item.amount)}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                    {item.date} • {item.category}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
                  {item.paymentMode}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--text-primary)]">{item.description || "-"}</p>
              <button
                onClick={() => openForm(item)}
                className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-500"
              >
                {item.canEdit ? "Edit expense" : "View expense"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modal for Expense Form */}
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
              {editing ? (readOnlyMode ? "View Expense" : "Edit Expense") : "Add Expense"}
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
                value={form.category}
                disabled={readOnlyMode}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="input"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                value={form.description}
                disabled={readOnlyMode}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Description"
                className="input"
              />
              <input
                value={form.amount}
                disabled={readOnlyMode}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                placeholder="Amount"
                className="input"
              />
              <select
                value={form.paymentMode}
                disabled={readOnlyMode}
                onChange={(event) => setForm({ ...form, paymentMode: event.target.value })}
                className="input"
              >
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>

              <div className="flex gap-3 pt-4">
                {!readOnlyMode && (
                  <button onClick={submit} className="btn btn-green flex-1">
                    {editing ? "Update Expense" : "Add Expense"}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium"
                >
                  {readOnlyMode ? "Close" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog (replaces alert) */}
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
            label: "New Expense",
            className: "bg-blue-600",
            onClick: () => openForm(),
          },
        ]}
      />
    </div>
  );
}