import { api, executeOrRequestApproval } from "./api"

export const getDailySales = async () => {
  const { data } = await api.get("/daily-sales")
  return data
}

export const addDailySale = async (payload) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "daily-sales",
      moduleLabel: "Daily Sales",
      operation: "create",
      payload,
      summary: `Add daily sale ${payload.date || ""}`,
    },
    request: () => api.post("/daily-sales", payload),
  })

export const updateDailySale = async (id, payload) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "daily-sales",
      moduleLabel: "Daily Sales",
      operation: "update",
      resourceId: id,
      payload,
      summary: `Update daily sale ${payload.date || id}`,
    },
    request: () => api.put(`/daily-sales/${id}`, payload),
  })

export const deleteDailySale = async (id) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "daily-sales",
      moduleLabel: "Daily Sales",
      operation: "delete",
      resourceId: id,
      summary: `Delete daily sale ${id}`,
    },
    request: () => api.delete(`/daily-sales/${id}`),
  })
