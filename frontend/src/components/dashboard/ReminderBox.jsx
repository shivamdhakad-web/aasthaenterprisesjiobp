import { useEffect, useState } from "react";

import {
  getReminders,
  deleteReminder,
  completeReminder,
} from "../../services/reminderApi";

import AddReminderModal from "./AddReminderModal";

export default function ReminderBox() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getReminders();
    setData(res);
  };

  const remove = async (id) => {
    await deleteReminder(id);
    load();
  };

  const complete = async (id) => {
    await completeReminder(id);
    load();
  };

  return (
    <div className="rounded-xl p-4 sm:p-6 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[color:var(--text-strong)] text-lg sm:text-xl font-semibold">
          Reminders
        </h2>

        {/* Desktop Add Button */}
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm text-white hidden sm:block transition"
        >
          + Add Reminder
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3 max-h-[calc(100vh-200px)] sm:max-h-[260px] overflow-y-auto pr-1">
        {data.map((r) => {
          const now = new Date();
          const reminderTime = new Date(r.dateTime);
          const diff = reminderTime - now;
          const overdue = reminderTime < now && !r.completed;
          const upcoming = diff > 0 && diff < 3600000 && !r.completed;

          let statusBorder = "";
          let statusBg = "bg-[var(--bg-panel)]";
          if (overdue) {
            statusBorder = "border-l-4 border-red-500";
            statusBg = "bg-[var(--bg-soft)]";
          } else if (upcoming) {
            statusBorder = "border-l-4 border-yellow-500";
            statusBg = "bg-[var(--bg-soft)]";
          }

          return (
            <div
              key={r._id}
              className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 rounded-xl gap-3 ${statusBorder} ${statusBg} border border-[var(--border-color)]`}
            >
              {/* Left content */}
              <div className="flex-1">
                <p
                  className={`text-base sm:text-sm font-medium ${
                    r.completed
                      ? "line-through text-[color:var(--text-secondary)]"
                      : "text-[color:var(--text-strong)]"
                  }`}
                >
                  {r.title}
                </p>
                {r.description && (
                  <p className="text-sm text-[color:var(--text-secondary)] mt-1">
                    {r.description}
                  </p>
                )}
                <p className="text-xs text-[color:var(--text-secondary)] mt-1">
                  {new Date(r.dateTime).toLocaleString()}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 text-sm sm:text-xs">
                {!r.completed && (
                  <button
                    onClick={() => complete(r._id)}
                    className="px-3 py-2 sm:py-1 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 transition"
                  >
                    ✓ Complete
                  </button>
                )}
                <button
                  onClick={() => remove(r._id)}
                  className="px-3 py-2 sm:py-1 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition"
                >
                  ✕ Delete
                </button>
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="text-center text-[color:var(--text-secondary)] py-8">
            No reminders yet. Tap + to add one.
          </div>
        )}
      </div>

      {/* MOBILE FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 
                   text-white w-14 h-14 rounded-full shadow-lg 
                   flex items-center justify-center text-2xl z-40
                   sm:hidden"
      >
        +
      </button>

      {/* MODAL */}
      {open && <AddReminderModal close={() => setOpen(false)} refresh={load} />}
    </div>
  );
}