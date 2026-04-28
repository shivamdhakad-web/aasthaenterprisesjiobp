import { useEffect, useState } from "react";
import MobileActionFab from "../../components/MobileActionFab";
import {
  addMyLubricant,
  getEmployeeProducts,
  getMyLubricants,
  updateMyLubricant,
} from "../../services/employeeSelfApi";

const baseForm = {
  date: new Date().toISOString().slice(0, 10),
  product: "",
  price: "",
  quantity: "",
};

export default function EmployeeLubricants() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState(baseForm);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: "" });

  const load = async () => {
    const [productData, salesData] = await Promise.all([getEmployeeProducts(), getMyLubricants()]);
    setProducts(productData);
    setSales(salesData);
  };

  useEffect(() => {
    load();
  }, []);

  const handleProduct = (value) => {
    const product = products.find((item) => item.name === value);
    setForm((current) => ({
      ...current,
      product: value,
      price: product?.price || "",
    }));
  };

  const openForm = (sale = null) => {
    if (sale) {
      setEditing(sale);
      setForm({
        date: sale.date,
        product: sale.product,
        price: sale.price,
        quantity: sale.quantity,
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
      setConfirmDialog({ open: true, message: "You cannot edit this sale entry." });
      return;
    }

    try {
      if (editing) {
        await updateMyLubricant(editing._id, form);
        setConfirmDialog({ open: true, message: "Lubricant sale update ho gayi hai" });
      } else {
        await addMyLubricant(form);
        setConfirmDialog({ open: true, message: "Lubricant sale add ho gayi hai" });
      }
      closeModal();
      await load();
    } catch (error) {
      setConfirmDialog({
        open: true,
        message: error?.response?.data?.message || "Sale save nahi ho payi",
      });
    }
  };

  const readOnlyMode = Boolean(editing && !editing.canEdit);

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header Section */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 sm:p-5">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">My Lubricant Sales</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Yahan sirf apni sales add ya edit kar sakte ho. Product master aur stock admin side se control hota hai.
        </p>
      </section>

      {/* Desktop Add Button */}
      <div className="hidden sm:flex sm:justify-end">
        <button onClick={() => openForm()} className="btn btn-green">
          + New Sale
        </button>
      </div>

      {/* Sales Table */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.date}</td>
                  <td>{sale.product}</td>
                  <td>{sale.quantity}</td>
                  <td>Rs. {sale.price}</td>
                  <td>Rs. {sale.total}</td>
                  <td>
                    <button onClick={() => openForm(sale)} className="text-blue-500">
                      {sale.canEdit ? "Edit" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {sales.map((sale) => (
            <div
              key={sale._id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
            >
              <p className="text-sm text-[color:var(--text-secondary)]">{sale.date}</p>
              <p className="mt-2 text-lg font-medium text-[color:var(--text-strong)]">{sale.product}</p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                Qty {sale.quantity} - Rs. {sale.total}
              </p>
              <button
                onClick={() => openForm(sale)}
                className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-500"
              >
                {sale.canEdit ? "Edit sale" : "View sale"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modal for Sale Form */}
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
              {editing ? (readOnlyMode ? "View Sale" : "Edit Sale") : "Add Sale"}
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
                value={form.product}
                disabled={readOnlyMode}
                onChange={(event) => handleProduct(event.target.value)}
                className="input"
              >
                <option value="">Select product</option>
                {products.map((item) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                value={form.price}
                disabled={readOnlyMode}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                placeholder="Price"
                className="input"
              />
              <input
                value={form.quantity}
                disabled={readOnlyMode}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                placeholder="Quantity"
                className="input"
              />

              <div className="flex gap-3 pt-4">
                {!readOnlyMode && (
                  <button onClick={submit} className="btn btn-green flex-1">
                    {editing ? "Update Sale" : "Add Sale"}
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
            label: "New Sale",
            className: "bg-green-600",
            onClick: () => openForm(),
          },
        ]}
      />
    </div>
  );
}