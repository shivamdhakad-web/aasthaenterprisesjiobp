import { api } from "./api"

export const getManualFinanceEntries = async () => {
  const { data } = await api.get("/manual-finance-entries")
  return data
}

export const addManualFinanceEntry = async (entry) => {
  const { data } = await api.post("/manual-finance-entries", entry)
  return data
}

export const updateManualFinanceEntry = async (id, entry) => {
  const { data } = await api.put(`/manual-finance-entries/${id}`, entry)
  return data
}

export const deleteManualFinanceEntry = async (id) => {
  const { data } = await api.delete(`/manual-finance-entries/${id}`)
  return data
}

export const requestManualFinanceEntryChange = async ({ operation, id, entry }) => {
  const { data } = await api.post("/approvals", {
    moduleKey: "manual-finance-entries",
    moduleLabel: "Income & Expenses",
    operation,
    resourceId: id,
    payload: entry,
    summary: operation === "delete" ? `Delete financial entry ${id}` : `Update ${entry.type}: ${entry.category}`,
  })
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("approval:created", { detail: data }))
  }
  return data
}

export const requestManualFinanceEntry = async (entry) => {
  const { data } = await api.post("/approvals", {
    moduleKey: "manual-finance-entries",
    moduleLabel: "Income & Expenses",
    operation: "create",
    payload: entry,
    summary: `Add ${entry.type}: ${entry.category}`,
  })
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("approval:created", { detail: data }))
  }
  return data
}
