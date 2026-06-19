import { api, executeOrRequestApproval } from "./api"

export const getInvoiceDetails = async () => {
  const { data } = await api.get("/invoice-details")
  return data
}

export const addInvoiceDetail = async (payload) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "invoice-details",
      moduleLabel: "Invoice Details",
      operation: "create",
      payload,
      summary: `Add invoice detail ${payload.date || ""}`,
    },
    request: () => api.post("/invoice-details", payload),
  })

export const updateInvoiceDetail = async (id, payload) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "invoice-details",
      moduleLabel: "Invoice Details",
      operation: "update",
      resourceId: id,
      payload,
      summary: `Update invoice detail ${payload.date || id}`,
    },
    request: () => api.put(`/invoice-details/${id}`, payload),
  })

export const deleteInvoiceDetail = async (id) =>
  executeOrRequestApproval({
    approval: {
      moduleKey: "invoice-details",
      moduleLabel: "Invoice Details",
      operation: "delete",
      resourceId: id,
      summary: `Delete invoice detail ${id}`,
    },
    request: () => api.delete(`/invoice-details/${id}`),
  })
