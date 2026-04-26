import { Plus, X } from "lucide-react"
import { useState } from "react"

export default function MobileActionFab({ actions = [] }) {
  const [open, setOpen] = useState(false)

  if (!actions.length) {
    return null
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 sm:hidden">
      {open ? (
        <div className="mb-3 flex flex-col items-end gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setOpen(false)
                action.onClick?.()
              }}
              className={`min-w-[148px] rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
                action.className || "bg-blue-600"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_16px_32px_rgba(37,99,235,0.32)]"
      >
        {open ? <X size={20} /> : <Plus size={22} />}
      </button>
    </div>
  )
}
