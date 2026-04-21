import { useEffect, useMemo, useState } from "react"
import { BellRing, Clock3, Plus, ShieldCheck, Trash2 } from "lucide-react"
import { getReminders, deleteReminder, completeReminder } from "../../services/reminderApi"
import AddReminderModal from "./AddReminderModal"

const reminderStyles = String.raw`
.reminder-console {
  --rem-cyan: #67e8f9;
  --rem-blue: #38bdf8;
  --rem-lime: #84cc16;
  --rem-amber: #f59e0b;
  --rem-red: #fb7185;
  --rem-ink: rgba(248, 250, 252, 0.98);
  --rem-muted: rgba(191, 203, 224, 0.66);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.8rem;
  background:
    radial-gradient(circle at 12% 0%, rgba(103, 232, 249, 0.12), transparent 30%),
    radial-gradient(circle at 90% 10%, rgba(132, 204, 22, 0.08), transparent 22%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.018)),
    rgba(8, 12, 22, 0.88);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
}

.reminder-console::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.016) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: radial-gradient(circle at 50% 0%, black, transparent 86%);
  opacity: 0.42;
  pointer-events: none;
}

.reminder-console__body {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
}

.reminder-console__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.reminder-console__title-wrap {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.reminder-console__icon {
  width: 2.8rem;
  height: 2.8rem;
  display: grid;
  place-items: center;
  border-radius: 1rem;
  border: 1px solid rgba(103, 232, 249, 0.22);
  background: rgba(103, 232, 249, 0.08);
  color: #cffafe;
}

.reminder-console__overline {
  margin: 0;
  color: rgba(103, 232, 249, 0.9);
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.reminder-console__title {
  margin: 0.18rem 0 0;
  color: white;
  font-size: 1.15rem;
  font-weight: 900;
}

.reminder-console__meta {
  margin-top: 0.14rem;
  color: var(--rem-muted);
  font-size: 0.78rem;
}

.reminder-console__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.5rem;
  padding: 0.7rem 0.92rem;
  border: 1px solid transparent;
  border-radius: 9999px;
  color: white;
  font-size: 0.82rem;
  font-weight: 900;
  background: linear-gradient(135deg, #67e8f9, #38bdf8 58%, #2563eb);
  box-shadow: 0 16px 34px rgba(56, 189, 248, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition: transform 0.18s ease, filter 0.18s ease;
}

.reminder-console__add:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.reminder-console__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 0.95rem;
}

.reminder-console__stat {
  min-height: 4.6rem;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.04);
}

.reminder-console__stat-label {
  display: block;
  color: var(--rem-muted);
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.reminder-console__stat-value {
  display: block;
  margin-top: 0.55rem;
  color: white;
  font-size: 1.2rem;
  font-weight: 900;
}

.reminder-console__list {
  display: grid;
  gap: 0.7rem;
  overflow-y: auto;
  padding-right: 0.15rem;
}

.reminder-console__list::-webkit-scrollbar {
  width: 4px;
}

.reminder-console__list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(103, 232, 249, 0.22);
}

.reminder-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.15rem;
  background: rgba(255, 255, 255, 0.042);
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.reminder-card:hover {
  transform: translateY(-1px);
}

.reminder-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, rgba(103, 232, 249, 0.8), rgba(132, 204, 22, 0.7));
  opacity: 0.4;
}

.reminder-card--overdue {
  border-color: rgba(251, 113, 133, 0.3);
  background: rgba(127, 29, 29, 0.22);
}

.reminder-card--overdue::before {
  background: linear-gradient(180deg, #fb7185, #ef4444);
  opacity: 0.9;
}

.reminder-card--upcoming {
  border-color: rgba(245, 158, 11, 0.28);
  background: rgba(120, 53, 15, 0.22);
}

.reminder-card--upcoming::before {
  background: linear-gradient(180deg, #f59e0b, #f97316);
  opacity: 0.9;
}

.reminder-card__inner {
  padding: 0.88rem 0.95rem 0.88rem 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}

.reminder-card__title {
  margin: 0;
  color: white;
  font-size: 0.94rem;
  font-weight: 900;
}

.reminder-card__title--completed {
  color: rgba(148, 163, 184, 0.72);
  text-decoration: line-through;
}

.reminder-card__desc {
  margin: 0.28rem 0 0;
  color: var(--rem-muted);
  font-size: 0.78rem;
  line-height: 1.55;
}

.reminder-card__time {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  margin-top: 0.5rem;
  color: rgba(203, 213, 225, 0.7);
  font-size: 0.72rem;
  font-weight: 700;
}

.reminder-card__actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 0 0 auto;
}

.reminder-card__btn {
  width: 2.2rem;
  height: 2.2rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.84);
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.reminder-card__btn:hover {
  transform: translateY(-1px);
}

.reminder-card__btn--complete {
  border-color: rgba(52, 211, 153, 0.24);
  color: #bbf7d0;
}

.reminder-card__btn--delete {
  border-color: rgba(251, 113, 133, 0.24);
  color: #fecdd3;
}

.reminder-console__empty {
  min-height: 11rem;
  display: grid;
  place-items: center;
  text-align: center;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 1.3rem;
  color: var(--rem-muted);
  background: rgba(255, 255, 255, 0.03);
}

@media (max-width: 640px) {
  .reminder-console__body {
    padding: 1rem;
  }

  .reminder-console__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .reminder-console__stats {
    grid-template-columns: 1fr;
  }
}
`

const safeText = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback
  return String(value)
}

export default function ReminderBox() {
  const [data, setData] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const res = await getReminders()
    setData(res)
  }

  const remove = async (id) => {
    await deleteReminder(id)
    load()
  }

  const complete = async (id) => {
    await completeReminder(id)
    load()
  }

  const stats = useMemo(() => {
    const now = new Date()

    return data.reduce(
      (acc, item) => {
        const reminderTime = new Date(item.dateTime)
        const diff = reminderTime - now

        if (item.completed) acc.done += 1
        else if (reminderTime < now) acc.overdue += 1
        else if (diff > 0 && diff < 3600000) acc.alert += 1

        return acc
      },
      { done: 0, overdue: 0, alert: 0 }
    )
  }, [data])

  return (
    <>
      <style>{reminderStyles}</style>

      <div className="reminder-console h-[340px]">
        <div className="reminder-console__body">
          <div className="reminder-console__head">
            <div className="reminder-console__title-wrap">
              <div className="reminder-console__icon">
                <BellRing size={18} />
              </div>

              <div>
                <p className="reminder-console__overline">Station Alerts</p>
                <h2 className="reminder-console__title">Reminder Console</h2>
                <p className="reminder-console__meta">{data.length} total reminders in view</p>
              </div>
            </div>

            <button onClick={() => setOpen(true)} className="reminder-console__add">
              <Plus size={15} />
              Add
            </button>
          </div>

          <div className="reminder-console__stats">
            <div className="reminder-console__stat">
              <span className="reminder-console__stat-label">Upcoming</span>
              <strong className="reminder-console__stat-value">{stats.alert}</strong>
            </div>

            <div className="reminder-console__stat">
              <span className="reminder-console__stat-label">Overdue</span>
              <strong className="reminder-console__stat-value">{stats.overdue}</strong>
            </div>

            <div className="reminder-console__stat">
              <span className="reminder-console__stat-label">Completed</span>
              <strong className="reminder-console__stat-value">{stats.done}</strong>
            </div>
          </div>

          <div className="reminder-console__list">
            {data.length === 0 && (
              <div className="reminder-console__empty">
                <div>
                  <ShieldCheck size={18} className="mx-auto mb-2 text-cyan-200" />
                  <p>No reminders yet.</p>
                </div>
              </div>
            )}

            {data.map((reminder) => {
              const now = new Date()
              const reminderTime = new Date(reminder.dateTime)

              const diff = reminderTime - now

              const overdue = reminderTime < now && !reminder.completed
              const upcoming = diff > 0 && diff < 3600000 && !reminder.completed

              return (
                <div
                  key={reminder._id}
                  className={`reminder-card ${overdue ? "reminder-card--overdue" : upcoming ? "reminder-card--upcoming" : ""}`}
                >
                  <div className="reminder-card__inner">
                    <div>
                      <p className={`reminder-card__title ${reminder.completed ? "reminder-card__title--completed" : ""}`}>
                        {safeText(reminder.title)}
                      </p>

                      <p className="reminder-card__desc">{safeText(reminder.description)}</p>

                      <p className="reminder-card__time">
                        <Clock3 size={13} />
                        {new Date(reminder.dateTime).toLocaleString()}
                      </p>
                    </div>

                    <div className="reminder-card__actions">
                      <button
                        onClick={() => complete(reminder._id)}
                        className="reminder-card__btn reminder-card__btn--complete"
                        title="Complete"
                      >
                        <ShieldCheck size={14} />
                      </button>

                      <button
                        onClick={() => remove(reminder._id)}
                        className="reminder-card__btn reminder-card__btn--delete"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {open && <AddReminderModal close={() => setOpen(false)} refresh={load} />}
        </div>
      </div>
    </>
  )
}




// import {useEffect,useState} from "react"

// import {
// getReminders,
// deleteReminder,
// completeReminder
// } from "../../services/reminderApi"

// import AddReminderModal from "./AddReminderModal"

// export default function ReminderBox(){

// const [data,setData] = useState([])
// const [open,setOpen] = useState(false)

// useEffect(()=>{
// load()
// },[])

// const load = async()=>{

// const res = await getReminders()

// setData(res)

// }

// const remove = async(id)=>{

// await deleteReminder(id)

// load()

// }

// const complete = async(id)=>{

// await completeReminder(id)

// load()

// }

// return(

// <div className=" rounded-xl p-6 h-[340px]">

// <div className="flex justify-between items-center mb-4">

// <h2 className="text-white">
// Reminders
// </h2>

// <button
// onClick={()=>setOpen(true)}
// className="bg-blue-600 px-3 py-1 rounded text-xs text-white"
// >
// + Add
// </button>

// </div>

// <div className="space-y-3">

// {data.map(r=>{

// const now = new Date()
// const reminderTime = new Date(r.dateTime)

// const diff = reminderTime - now

// const overdue = reminderTime < now && !r.completed
// const upcoming = diff > 0 && diff < 3600000 && !r.completed

// return(

// <div
// key={r._id}
// className={`flex justify-between items-center p-3 rounded-lg
// ${overdue ? "bg-red-900/40 border border-red-700" :
// upcoming ? "bg-yellow-900/40 border border-yellow-600" :
// "bg-[#111827]"}`}
// >

// <div>

// <p className={r.completed ? "line-through text-gray-500":"text-white"}>
// {r.title}
// </p>

// <p className="text-xs text-gray-400">
// {r.description}
// </p>

// <p className="text-xs text-gray-500">
// {new Date(r.dateTime).toLocaleString()}
// </p>

// </div>

// <div className="flex gap-3 text-xs">

// <button
// onClick={()=>complete(r._id)}
// className="text-green-400"
// >
// Complete
// </button>

// <button
// onClick={()=>remove(r._id)}
// className="text-red-400"
// >
// Delete
// </button>

// </div>

// </div>

// )

// })}

// </div>

// {open &&

// <AddReminderModal
// close={()=>setOpen(false)}
// refresh={load}
// />

// }

// </div>

// )

// }