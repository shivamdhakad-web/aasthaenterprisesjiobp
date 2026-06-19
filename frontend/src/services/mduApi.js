import { api, executeOrRequestApproval } from "./api"

export const getMduEntries = async () => {
  const { data } = await api.get("/mdu")
  return data
}

export const addMduEntry = async (payload) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "mdu",
      moduleLabel: "M.D.U",
      operation: "create",
      payload,
      summary: `Add M.D.U entry ${payload.date || ""}`,
    },
    request: () => api.post("/mdu", payload),
  })

export const updateMduEntry = async (id, payload) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "mdu",
      moduleLabel: "M.D.U",
      operation: "update",
      resourceId: id,
      payload,
      summary: `Update M.D.U entry ${payload.date || id}`,
    },
    request: () => api.put(`/mdu/${id}`, payload),
  })

export const deleteMduEntry = async (id) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "mdu",
      moduleLabel: "M.D.U",
      operation: "delete",
      resourceId: id,
      summary: `Delete M.D.U entry ${id}`,
    },
    request: () => api.delete(`/mdu/${id}`),
  })
