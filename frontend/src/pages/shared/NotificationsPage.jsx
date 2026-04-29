import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getEmployeeChoices } from "../../services/authApi";
import {
  getNotifications,
  markNotificationRead,
  sendNotification,
} from "../../services/notificationApi";
import MobileActionFab from "../../components/MobileActionFab"; // FAB component

const defaultForm = {
  title: "",
  message: "",
  mode: "manager",
  selectedEmployees: [],
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [isModalOpen, setIsModalOpen] = useState(false); // modal state (mobile only)

  const load = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    load();

    if (user?.role === "Admin") {
      getEmployeeChoices().then(setEmployees).catch(() => setEmployees([]));
    }
  }, [user?.role]);

  const handleSend = async () => {
    const payload = {
      title: form.title,
      message: form.message,
      targetRoles:
        form.mode === "manager"
          ? ["Manager"]
          : form.mode === "employees"
            ? ["Employee"]
            : form.mode === "everyone"
              ? ["Manager", "Employee"]
              : [],
      targetEmployeeIds: form.mode === "selected" ? form.selectedEmployees : [],
    };

    await sendNotification(payload);
    setForm(defaultForm);
    await load();
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleModalSubmit = async () => {
    await handleSend();
    closeModal();
  };

  // Shared form fields (used in both desktop box and mobile modal)
  const renderFormFields = () => (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Title"
          className="input"
        />
        <select
          value={form.mode}
          onChange={(event) => setForm({ ...form, mode: event.target.value })}
          className="input"
        >
          <option value="manager">Manager</option>
          <option value="employees">All Employees</option>
          <option value="selected">Selected Employees</option>
          <option value="everyone">Everyone</option>
        </select>
      </div>
      <textarea
        value={form.message}
        onChange={(event) => setForm({ ...form, message: event.target.value })}
        placeholder="Message"
        className="input mt-3 min-h-[120px]"
      />

      {form.mode === "selected" && (
        <select
          multiple
          value={form.selectedEmployees}
          onChange={(event) =>
            setForm({
              ...form,
              selectedEmployees: Array.from(event.target.selectedOptions).map(
                (item) => item.value
              ),
            })
          }
          className="input mt-3 min-h-[120px]"
        >
          {employees.map((employee) => (
            <option key={employee._id} value={employee._id}>
              {employee.name}
            </option>
          ))}
        </select>
      )}
    </>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5">
        <h1 className="text-2xl font-semibold text-white">Notifications</h1>
        <p className="mt-2 text-sm text-gray-400">
          {user?.role === "Admin"
            ? "Information can be sent to managers and employees from right here."
            : "Updates from the Admin will appear here in the form of bell notifications."}
        </p>
      </div>

      {/* Send Notification Box – visible only on desktop (md and up) */}
      {user?.role === "Admin" && (
        <div className="hidden rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5 md:block">
          <h2 className="text-lg font-semibold text-white">Send New Notification</h2>
          <div className="mt-4">{renderFormFields()}</div>
          <div className="flex justify-end">
            <button
              onClick={handleSend}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              Send Notification
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="grid gap-4">
        {notifications.map((item) => (
          <div key={item._id} className="rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      item.isRead
                        ? "border-green-500/30 bg-green-500/10 text-green-300"
                        : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                    }`}
                  >
                    {item.isRead ? "Read" : "Unread"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-300">{item.message}</p>
                <p className="mt-3 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>

                {user?.role === "Admin" && (
                  <p className="mt-2 text-xs text-gray-500">
                    Remaining unread: {item.unreadCount ?? 0}
                  </p>
                )}

                {user?.role === "Admin" && item.readBy?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.readBy.map((reader) => (
                      <span
                        key={`${item._id}-${reader.userId}`}
                        className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-200"
                      >
                        {reader.name || reader.role} Read
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {user?.role !== "Admin" && !item.isRead && (
                <button
                  onClick={async () => {
                    await markNotificationRead(item._id);
                    load();
                  }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white"
                >
                  Mark Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile FAB – only visible on small screens */}
      {user?.role === "Admin" && (
        <MobileActionFab
          actions={[
            {
              label: "New Notification",
              className: "bg-red-600",
              onClick: openModal,
            },
          ]}
        />
      )}

      {/* Mobile Modal (Send Notification) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold text-white">Send New Notification</h2>
            <div className="space-y-4">{renderFormFields()}</div>
            <div className="mt-6 flex gap-3">
              
              <button
                onClick={closeModal}
                className="rounded-lg border border-[#1F2937] bg-[#04060B] px-4 py-2 text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}