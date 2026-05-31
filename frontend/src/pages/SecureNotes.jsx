import { Copy, Globe, NotebookPen, Plus, Trash2, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import MobileActionFab from "../components/MobileActionFab"
import SecureNoteModal from "../components/SecureNoteModal"
import { deleteNote, getNotes } from "../services/secureNoteApi"

const toneClasses = {
  yellow: "bg-amber-100 text-amber-950 border-amber-200",
  green: "bg-emerald-100 text-emerald-950 border-emerald-200",
  blue: "bg-sky-100 text-sky-950 border-sky-200",
  purple: "bg-violet-100 text-violet-950 border-violet-200",
  pink: "bg-rose-100 text-rose-950 border-rose-200",
  orange: "bg-orange-100 text-orange-950 border-orange-200",
  default: "bg-[var(--bg-soft)] text-[color:var(--text-strong)] border-[var(--border-color)]",
}

const getNoteTone = (color = "") => {
  const key = Object.keys(toneClasses).find((item) => color.includes(item))
  return toneClasses[key] || toneClasses.default
}

const vaultCardClass =
  "rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]"

export default function SecureNotes() {
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [copied, setCopied] = useState("")
  const [expandedCard, setExpandedCard] = useState(null)

  const loadNotes = async () => {
    const data = await getNotes()
    setNotes(data)
  }

  useEffect(() => {
    loadNotes()
  }, [])

  const filtered = useMemo(
    () =>
      notes.filter((note) =>
        [note.title, note.website, note.username, note.note]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [notes, search]
  )

  const copyText = async (text, label = "Copied") => {
    await navigator.clipboard.writeText(text || "")
    setCopied(label)
    setTimeout(() => setCopied(""), 1800)
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this secure note?")
    if (!confirmed) return
    await deleteNote(id)
    if (expandedCard === id) setExpandedCard(null)
    loadNotes()
  }

  const openModal = (note = null) => {
    setEditData(note)
    setModalOpen(true)
  }

  const truncateNote = (text) => {
    if (!text) return "-"
    return text.length > 15 ? text.slice(0, 15) + "..." : text
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header */}
      <section className={`${vaultCardClass} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">
              Secure Notes
            </h1>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              Website, username aur private notes secure rakhein.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              placeholder="Search note..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input w-full sm:min-w-[260px]"
            />
            <button
              type="button"
              onClick={() => openModal()}
              className="hidden rounded-2xl bg-[var(--accent-strong)] px-5 py-3 text-sm font-medium text-white shadow-[0_16px_40px_rgba(37,99,235,0.24)] sm:inline-flex sm:items-center sm:justify-center"
            >
              + Add Note
            </button>
          </div>
        </div>
      </section>

      {/* Notes Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((note) => {
          const expanded = expandedCard === note._id
          const tone = getNoteTone(note.color)

          return (
            <article
              key={note._id}
              className={`rounded-[28px] border p-5 shadow-[0_20px_48px_rgba(15,23,42,0.08)] ${tone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">
                    {note.title || "Untitled note"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.28em] opacity-70">
                    Secure Entry
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCard((current) => (current === note._id ? null : note._id))
                  }
                  className="rounded-xl border border-current/15 bg-white/40 px-3 py-2 text-xs font-medium backdrop-blur"
                >
                  {expanded ? "Hide" : "Open"}
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <InfoRow
                  icon={<Globe size={14} />}
                  label="Website"
                  value={note.website || "-"}
                  onCopy={() => copyText(note.website, "Website copied")}
                />
                <InfoRow
                  icon={<User size={14} />}
                  label="Username"
                  value={note.username || "-"}
                  onCopy={() => copyText(note.username, "Username copied")}
                />

                {/* 🔥 NOTE PREVIEW WITH COPY BUTTON (full note copy) */}
                <div className="rounded-2xl border border-current/12 bg-white/45 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] opacity-70">
                    <span className="flex items-center gap-2">
                      <NotebookPen size={13} />
                      {expanded ? "Full Note" : "Note (preview)"}
                    </span>
                    {/* Copy button always visible, copies FULL note */}
                    <button
                      type="button"
                      onClick={() => copyText(note.note, "Note copied")}
                      className="rounded-lg border border-current/15 bg-white/50 p-2"
                      aria-label="Copy full note"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {expanded ? (note.note || "-") : truncateNote(note.note)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openModal(note)}
                  className="flex-1 rounded-2xl border border-current/15 bg-white/55 px-4 py-3 text-sm font-medium backdrop-blur"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(note._id)}
                  className="inline-flex items-center justify-center rounded-2xl border border-current/15 bg-white/55 px-4 py-3 text-sm font-medium backdrop-blur"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          )
        })}

        <button
          type="button"
          onClick={() => openModal()}
          className="hidden rounded-[28px] border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 text-left text-[color:var(--text-secondary)] transition hover:border-[var(--accent-strong)] hover:text-[color:var(--accent-strong)] sm:block"
        >
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-soft)]">
            <Plus size={24} />
          </div>
          <p className="text-lg font-semibold">Add New Note</p>
          <p className="mt-2 text-sm">Quickly create another secure vault record.</p>
        </button>
      </section>

      <SecureNoteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={loadNotes}
        editData={editData}
      />

      <MobileActionFab
        actions={[
          {
            label: "Add Note",
            className: "bg-green-600",
            onClick: () => openModal(),
          },
        ]}
      />

      {copied ? (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-[0_20px_40px_rgba(5,150,105,0.24)]">
          {copied}
        </div>
      ) : null}
    </div>
  )
}

function InfoRow({ icon, label, value, onCopy }) {
  return (
    <div className="rounded-2xl border border-current/12 bg-white/45 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] opacity-70">
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg border border-current/15 bg-white/50 p-2"
        >
          <Copy size={14} />
        </button>
      </div>
      <p className="break-all text-sm font-medium">{value}</p>
    </div>
  )
}







// import { Copy, Eye, EyeOff, Globe, LockKeyhole, NotebookPen, Plus, Trash2, User } from "lucide-react"
// import { useEffect, useMemo, useState } from "react"
// import MobileActionFab from "../components/MobileActionFab"
// import SecureNoteModal from "../components/SecureNoteModal"
// import { deleteNote, getNotes } from "../services/secureNoteApi"

// const getDailyVaultPassword = () => {
//   const today = new Date()
//   const dd = String(today.getDate()).padStart(2, "0")
//   const mm = String(today.getMonth() + 1).padStart(2, "0")
//   const yy = String(today.getFullYear()).slice(-2)
//   return `${dd}${mm}${yy}`
// }

// const toneClasses = {
//   yellow: "bg-amber-100 text-amber-950 border-amber-200",
//   green: "bg-emerald-100 text-emerald-950 border-emerald-200",
//   blue: "bg-sky-100 text-sky-950 border-sky-200",
//   purple: "bg-violet-100 text-violet-950 border-violet-200",
//   pink: "bg-rose-100 text-rose-950 border-rose-200",
//   orange: "bg-orange-100 text-orange-950 border-orange-200",
//   default: "bg-[var(--bg-soft)] text-[color:var(--text-strong)] border-[var(--border-color)]",
// }

// const getNoteTone = (color = "") => {
//   const key = Object.keys(toneClasses).find((item) => color.includes(item))
//   return toneClasses[key] || toneClasses.default
// }

// const vaultCardClass =
//   "rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]"

// export default function SecureNotes() {
//   const [notes, setNotes] = useState([])
//   const [search, setSearch] = useState("")
//   const [modalOpen, setModalOpen] = useState(false)
//   const [editData, setEditData] = useState(null)
//   const [showPassword, setShowPassword] = useState(null)
//   const [vaultUnlocked, setVaultUnlocked] = useState(false)
//   const [vaultPassword, setVaultPassword] = useState("")
//   const [copied, setCopied] = useState("")
//   const [expandedCard, setExpandedCard] = useState(null)

//   const loadNotes = async () => {
//     const data = await getNotes()
//     setNotes(data)
//   }

//   useEffect(() => {
//     if (vaultUnlocked) {
//       loadNotes()
//     }
//   }, [vaultUnlocked])

//   useEffect(() => {
//     if (!vaultUnlocked) {
//       return undefined
//     }

//     const timer = setTimeout(() => {
//       setVaultUnlocked(false)
//       setVaultPassword("")
//       setShowPassword(null)
//       setExpandedCard(null)
//     }, 120000)

//     return () => clearTimeout(timer)
//   }, [vaultUnlocked])

//   const filtered = useMemo(
//     () =>
//       notes.filter((note) =>
//         [note.title, note.website, note.username, note.note].join(" ").toLowerCase().includes(search.toLowerCase()),
//       ),
//     [notes, search],
//   )

//   const copyText = async (text, label = "Copied") => {
//     await navigator.clipboard.writeText(text || "")
//     setCopied(label)
//     setTimeout(() => setCopied(""), 1800)
//   }

//   const handleDelete = async (id) => {
//     const confirmed = window.confirm("Delete this secure note?")
//     if (!confirmed) {
//       return
//     }

//     await deleteNote(id)
//     if (expandedCard === id) {
//       setExpandedCard(null)
//     }
//     loadNotes()
//   }

//   const openModal = (note = null) => {
//     setEditData(note)
//     setModalOpen(true)
//   }

//   if (!vaultUnlocked) {
//     return (
//       <div className="flex min-h-[calc(100vh-120px)] items-center justify-center p-4 sm:p-6">
//         <div className={`${vaultCardClass} w-full max-w-md p-6 sm:p-8`}>
//           <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--bg-soft)] text-[color:var(--accent-strong)]">
//             <LockKeyhole size={26} />
//           </div>
//           <h1 className="text-center text-2xl font-semibold text-[color:var(--text-strong)]">
//             Secure Notes Vault
//           </h1>

//           <div className="mt-6 space-y-3">
//             <input
//               type="password"
//               value={vaultPassword}
//               onChange={(event) => setVaultPassword(event.target.value)}
//               placeholder="Enter vault password"
//               className="input"
//             />
//             <button
//               type="button"
//               onClick={() => {
//                 if (vaultPassword === getDailyVaultPassword()) {
//                   setVaultUnlocked(true)
//                   setVaultPassword("")
//                   return
//                 }

//                 window.alert("Wrong Password")
//               }}
//               className="btn btn-green w-full"
//             >
//               Unlock Vault
//             </button>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
//       <section className={`${vaultCardClass} p-5 sm:p-6`}>
//         <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//           <div>
//             <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">Secure Notes</h1>
//             <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
//               Website, username, password aur private notes ko secure vault me manage karo.
//             </p>
//           </div>

//           <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//             <input
//               placeholder="Search note..."
//               value={search}
//               onChange={(event) => setSearch(event.target.value)}
//               className="input w-full sm:min-w-[260px]"
//             />
//             <button
//               type="button"
//               onClick={() => openModal()}
//               className="hidden rounded-2xl bg-[var(--accent-strong)] px-5 py-3 text-sm font-medium text-white shadow-[0_16px_40px_rgba(37,99,235,0.24)] sm:inline-flex sm:items-center sm:justify-center"
//             >
//               + Add Note
//             </button>
//           </div>
//         </div>
//       </section>

//       <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
//         {filtered.map((note) => {
//           const expanded = expandedCard === note._id
//           const tone = getNoteTone(note.color)

//           return (
//             <article
//               key={note._id}
//               className={`rounded-[28px] border p-5 shadow-[0_20px_48px_rgba(15,23,42,0.08)] ${tone}`}
//             >
//               <div className="flex items-start justify-between gap-3">
//                 <div className="min-w-0">
//                   <p className="truncate text-lg font-semibold">{note.title || "Untitled note"}</p>
//                   <p className="mt-1 text-xs uppercase tracking-[0.28em] opacity-70">Secure Entry</p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setExpandedCard((current) => (current === note._id ? null : note._id))
//                   }
//                   className="rounded-xl border border-current/15 bg-white/40 px-3 py-2 text-xs font-medium backdrop-blur"
//                 >
//                   {expanded ? "Hide" : "Open"}
//                 </button>
//               </div>

//               <div className="mt-4 space-y-3 text-sm">
//                 <InfoRow
//                   icon={<Globe size={14} />}
//                   label="Website"
//                   value={note.website || "-"}
//                   onCopy={() => copyText(note.website, "Website copied")}
//                 />
//                 <InfoRow
//                   icon={<User size={14} />}
//                   label="Username"
//                   value={note.username || "-"}
//                   onCopy={() => copyText(note.username, "Username copied")}
//                 />
//                 <div className="rounded-2xl border border-current/12 bg-white/45 px-4 py-3">
//                   <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] opacity-70">
//                     <span className="flex items-center gap-2">
//                       <LockKeyhole size={13} />
//                       Password
//                     </span>
//                     <div className="flex items-center gap-2">
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setShowPassword((current) => (current === note._id ? null : note._id))
//                         }
//                         className="rounded-lg border border-current/15 bg-white/50 p-2"
//                       >
//                         {showPassword === note._id ? <EyeOff size={14} /> : <Eye size={14} />}
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => copyText(note.password, "Password copied")}
//                         className="rounded-lg border border-current/15 bg-white/50 p-2"
//                       >
//                         <Copy size={14} />
//                       </button>
//                     </div>
//                   </div>
//                   <p className="break-all text-sm font-medium">
//                     {showPassword === note._id ? note.password || "-" : "********"}
//                   </p>
//                 </div>

//                 {expanded ? (
//                   <div className="rounded-2xl border border-current/12 bg-white/45 px-4 py-3">
//                     <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] opacity-70">
//                       <span className="flex items-center gap-2">
//                         <NotebookPen size={13} />
//                         Note
//                       </span>
//                       <button
//                         type="button"
//                         onClick={() => copyText(note.note, "Note copied")}
//                         className="rounded-lg border border-current/15 bg-white/50 p-2"
//                       >
//                         <Copy size={14} />
//                       </button>
//                     </div>
//                     <p className="whitespace-pre-wrap text-sm leading-6">{note.note || "-"}</p>
//                   </div>
//                 ) : null}
//               </div>

//               <div className="mt-4 flex gap-2">
//                 <button
//                   type="button"
//                   onClick={() => openModal(note)}
//                   className="flex-1 rounded-2xl border border-current/15 bg-white/55 px-4 py-3 text-sm font-medium backdrop-blur"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => handleDelete(note._id)}
//                   className="inline-flex items-center justify-center rounded-2xl border border-current/15 bg-white/55 px-4 py-3 text-sm font-medium backdrop-blur"
//                 >
//                   <Trash2 size={16} />
//                 </button>
//               </div>
//             </article>
//           )
//         })}

//         <button
//           type="button"
//           onClick={() => openModal()}
//           className="hidden rounded-[28px] border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 text-left text-[color:var(--text-secondary)] transition hover:border-[var(--accent-strong)] hover:text-[color:var(--accent-strong)] sm:block"
//         >
//           <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-soft)]">
//             <Plus size={24} />
//           </div>
//           <p className="text-lg font-semibold">Add New Note</p>
//           <p className="mt-2 text-sm">Quickly create another secure vault record.</p>
//         </button>
//       </section>

//       <SecureNoteModal
//         open={modalOpen}
//         onClose={() => setModalOpen(false)}
//         onSave={loadNotes}
//         editData={editData}
//       />

//       <MobileActionFab
//         actions={[
//           {
//             label: "Add Note",
//             className: "bg-green-600",
//             onClick: () => openModal(),
//           },
//         ]}
//       />

//       {copied ? (
//         <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-[0_20px_40px_rgba(5,150,105,0.24)]">
//           {copied}
//         </div>
//       ) : null}
//     </div>
//   )
// }

// function InfoRow({ icon, label, value, onCopy }) {
//   return (
//     <div className="rounded-2xl border border-current/12 bg-white/45 px-4 py-3">
//       <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] opacity-70">
//         <span className="flex items-center gap-2">
//           {icon}
//           {label}
//         </span>
//         <button
//           type="button"
//           onClick={onCopy}
//           className="rounded-lg border border-current/15 bg-white/50 p-2"
//         >
//           <Copy size={14} />
//         </button>
//       </div>
//       <p className="break-all text-sm font-medium">{value}</p>
//     </div>
//   )
// }
