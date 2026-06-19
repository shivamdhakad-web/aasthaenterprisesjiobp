import { api, executeOrRequestApproval } from "./api"

export const getDcdEntries = async () => {
  const { data } = await api.get("/dcd")
  return data
}

export const addDcdEntry = async (payload) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "dcd",
      moduleLabel: "D.C.D",
      operation: "create",
      payload,
      summary: `Add D.C.D entry ${payload.date || ""}`,
    },
    request: () => api.post("/dcd", payload),
  })

export const updateDcdEntry = async (id, payload) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "dcd",
      moduleLabel: "D.C.D",
      operation: "update",
      resourceId: id,
      payload,
      summary: `Update D.C.D entry ${payload.date || id}`,
    },
    request: () => api.put(`/dcd/${id}`, payload),
  })

export const deleteDcdEntry = async (id) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "dcd",
      moduleLabel: "D.C.D",
      operation: "delete",
      resourceId: id,
      summary: `Delete D.C.D entry ${id}`,
    },
    request: () => api.delete(`/dcd/${id}`),
  })
