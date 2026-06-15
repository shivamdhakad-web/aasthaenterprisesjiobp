import { useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, Save, ShieldCheck, SlidersHorizontal } from "lucide-react"

import {
  getManagerDashboardSettings,
  updateManagerDashboardSettings,
} from "../../services/managerDashboardSettingsApi"

const sortPages = (pages) =>
  [...pages].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))

export default function ManagerDashboardEditor() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [search, setSearch] = useState("")

  const load = async () => {
    setLoading(true)

    try {
      const data = await getManagerDashboardSettings()
      setPages(sortPages(Array.isArray(data?.pages) ? data.pages : []))
      setNotice({ type: "", text: "" })
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to load manager dashboard settings.",
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

  const visibleCount = pages.filter((page) => !page.hidden).length
  const allowedButtonCount = pages.reduce(
    (total, page) => total + (page.buttons || []).filter((button) => button.enabled !== false).length,
    0,
  )

  const updatePage = (key, patch) => {
    setPages((current) =>
      sortPages(current.map((page) => (page.key === key ? { ...page, ...patch } : page))),
    )
  }

  const updateButton = (pageKey, buttonKey, enabled) => {
    setPages((current) =>
      current.map((page) =>
        page.key === pageKey
          ? {
              ...page,
              buttons: (page.buttons || []).map((button) =>
                button.key === buttonKey ? { ...button, enabled } : button,
              ),
            }
          : page,
      ),
    )
  }

  const setAllButtons = (enabled) => {
    setPages((current) =>
      current.map((page) => ({
        ...page,
        buttons: (page.buttons || []).map((button) => ({ ...button, enabled })),
      })),
    )
  }

  const setAllPagesVisible = () => {
    setPages((current) => current.map((page) => ({ ...page, hidden: false })))
  }

  const hideNonCorePages = () => {
    const corePages = new Set(["dashboard", "approvals", "notifications", "employees", "settings"])

    setPages((current) =>
      current.map((page) => ({
        ...page,
        hidden: !corePages.has(page.key),
      })),
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
      const data = await updateManagerDashboardSettings({ pages })
      setPages(sortPages(data?.pages || pages))
      setNotice({ type: "success", text: data?.message || "Manager dashboard settings saved." })
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.message || "Unable to save manager dashboard settings.",
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
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">
              <SlidersHorizontal size={14} />
              Manager Dashboard Control
            </div>
            <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Manager Edit Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--text-secondary)]">
              Control manager sidebar order, menu names, page visibility, and page-level action button access.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-end">
            <SummaryPill label="Visible Pages" value={`${visibleCount}/${pages.length}`} />
            <SummaryPill label="Allowed Buttons" value={allowedButtonCount} />
          </div>
        </div>
      </section>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search manager pages"
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setAllButtons(true)}
            className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 font-medium text-green-500"
          >
            Allow All Buttons
          </button>
          <button
            type="button"
            onClick={setAllPagesVisible}
            className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 font-medium text-cyan-500"
          >
            Show All Pages
          </button>
          <button
            type="button"
            onClick={hideNonCorePages}
            className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 font-medium text-amber-500"
          >
            Core Pages Only
          </button>
          <button
            type="button"
            onClick={() => setAllButtons(false)}
            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-medium text-red-500"
          >
            Block All Buttons
          </button>
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
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[color:var(--text-secondary)]">
          Loading manager dashboard settings...
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_16px_32px_rgba(16,24,20,0.05)] lg:block">
            <table className="table min-w-[980px]">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Page Name</th>
                  <th>Status</th>
                  <th>Button Access</th>
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
                        className="input mx-auto max-w-[90px] text-center"
                      />
                    </td>
                    <td>
                      <input
                        value={page.label}
                        onChange={(event) => updatePage(page.key, { label: event.target.value })}
                        className="input"
                      />
                    </td>
                    <td>
                      <VisibilityToggle
                        hidden={page.hidden}
                        onClick={() => updatePage(page.key, { hidden: !page.hidden })}
                      />
                    </td>
                    <td>
                      <ButtonAccessEditor page={page} onChange={updateButton} />
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                      Manager Page
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">{page.label}</h2>
                  </div>
                  <VisibilityToggle
                    hidden={page.hidden}
                    onClick={() => updatePage(page.key, { hidden: !page.hidden })}
                  />
                </div>

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

                {page.buttons?.length ? (
                  <div className="mt-4 border-t border-[var(--border-color)] pt-4">
                    <ButtonAccessEditor page={page} onChange={updateButton} />
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-sm text-[color:var(--text-secondary)]">
                    This page has no manager action buttons.
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">
        <ShieldCheck size={14} />
        {label}
      </div>
      <p className="mt-1 text-xl font-bold text-[color:var(--text-strong)]">{value}</p>
    </div>
  )
}

function ButtonAccessEditor({ page, onChange }) {
  if (!page.buttons?.length) {
    return <span className="text-sm text-[color:var(--text-secondary)]">No action buttons</span>
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
      {page.buttons.map((button) => (
        <button
          key={button.key}
          type="button"
          onClick={() => onChange(page.key, button.key, !button.enabled)}
          className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
            button.enabled
              ? "border-green-500/20 bg-green-500/10 text-green-500"
              : "border-red-500/20 bg-red-500/10 text-red-500"
          }`}
        >
          {button.label}: {button.enabled ? "Allowed" : "Blocked"}
        </button>
      ))}
    </div>
  )
}

function VisibilityToggle({ hidden, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium ${
        hidden
          ? "border-red-500/20 bg-red-500/10 text-red-500"
          : "border-green-500/20 bg-green-500/10 text-green-500"
      }`}
    >
      {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
      {hidden ? "Hidden" : "Visible"}
    </button>
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
