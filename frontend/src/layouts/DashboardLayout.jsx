import { useState } from "react"
import Sidebar from "../components/sidebar/Sidebar"
import Topbar from "../components/header/Topbar"
import { Outlet } from "react-router-dom"

export default function DashboardLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="app-shell flex w-full overflow-hidden bg-[var(--bg-main)]"
      style={{ height: "var(--app-screen-height, 100vh)" }}
    >
      {/* SIDEBAR */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* MAIN AREA */}
      <div
        className="flex flex-1 flex-col min-w-0 overflow-hidden bg-[var(--bg-main)]"
        style={{ height: "var(--app-screen-height, 100vh)" }}
      >
        <Topbar toggleSidebar={() => setOpen(!open)} />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-[var(--bg-main)] transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
