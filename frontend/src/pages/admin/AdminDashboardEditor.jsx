import { useEffect, useMemo, useState } from "react"
import { Save, ShieldCheck, SlidersHorizontal } from "lucide-react"

import {
  getAdminDashboardSettings,
  updateAdminDashboardSettings,
} from "../../services/adminDashboardSettingsApi"

const sortPages = (pages) =>
  [...pages].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))

export default function AdminDashboardEditor() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [search, setSearch] = useState("")

  const load = async () => {
    setLoading(true)

    try {
      const data = await getAdminDashboardSettings()
      setPages(sortPages(Array.isArray(data?.pages) ? data.pages : []))
      setNotice({ type: "", text: "" })
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to load admin dashboard settings.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!notice.text) {
      return undefined
    }

    const timeout = window.setTimeout(() => setNotice({ type: "", text: "" }), 2800)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const filteredPages = useMemo(
    () =>
      pages.filter((page) =>
        [page.label, page.key].join(" ").toLowerCase().includes(search.toLowerCase()),
      ),
    [pages, search],
  )

  const updatePage = (key, patch) => {
    setPages((current) =>
      sortPages(current.map((page) => (page.key === key ? { ...page, ...patch } : page))),
    )
  }

  const normalizeOrder = () => {
    setPages((current) =>
      sortPages(current).map((page, index) => ({
        ...page,
        order: index + 1,
      })),
    )
  }

  const save = async () => {
    setSaving(true)

    try {
      const data = await updateAdminDashboardSettings({ pages })
      setPages(sortPages(data?.pages || pages))
      setNotice({ type: "success", text: data?.message || "Admin dashboard settings saved." })
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save admin dashboard settings.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-4 text-[color:var(--text-primary)] sm:p-6">
      <section className="mb-5 rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_36px_rgba(16,24,20,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
              <SlidersHorizontal size={14} />
              Admin Dashboard Control
            </div>
            <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Admin Edit Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--text-secondary)]">
              Control admin sidebar order and menu display names only.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">
              <ShieldCheck size={14} />
              Admin Pages
            </div>
            <p className="mt-1 text-xl font-bold text-[color:var(--text-strong)]">{pages.length}</p>
          </div>
        </div>
      </section>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search admin pages"
            className="input w-full sm:max-w-[420px]"
          />
          <button
            type="button"
            onClick={normalizeOrder}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]"
          >
            Normalize Order
          </button>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-secondary)]">
          Loading admin dashboard settings...
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_16px_32px_rgba(16,24,20,0.05)] lg:block">
            <table className="table min-w-[760px]">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Page Name</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => (
                  <tr key={page.key}>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={page.order}
                        onChange={(event) => updatePage(page.key, { order: Number(event.target.value || 0) })}
                        className="input mx-auto max-w-[100px] text-center"
                      />
                    </td>
                    <td>
                      <input
                        value={page.label}
                        onChange={(event) => updatePage(page.key, { label: event.target.value })}
                        className="input"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 lg:hidden">
            {filteredPages.map((page) => (
              <div
                key={page.key}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_16px_28px_rgba(16,24,20,0.08)]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                  Admin Page
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">{page.label}</h2>

                <div className="mt-4 grid gap-3">
                  <label className="text-sm font-medium text-[color:var(--text-secondary)]">
                    Order Number
                    <input
                      type="number"
                      min="1"
                      value={page.order}
                      onChange={(event) => updatePage(page.key, { order: Number(event.target.value || 0) })}
                      className="input mt-2"
                    />
                  </label>
                  <label className="text-sm font-medium text-[color:var(--text-secondary)]">
                    Display Name
                    <input
                      value={page.label}
                      onChange={(event) => updatePage(page.key, { label: event.target.value })}
                      className="input mt-2"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function InlineNotice({ notice }) {
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
        notice.type === "error"
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {notice.text}
    </div>
  )
}
