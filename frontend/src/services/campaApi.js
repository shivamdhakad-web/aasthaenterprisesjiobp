import { api, executeOrRequestApproval } from "./api"

const base = "/campa"

export const getProducts = async () => (await api.get(`${base}/products`)).data
export const getSales = async () => (await api.get(base)).data

export const addProduct = (payload) => executeOrRequestApproval({
  approval: { moduleKey: "campa-products", moduleLabel: "Campa Products", operation: "create", payload, summary: `Add product ${payload.name || ""}` },
  request: () => api.post(`${base}/products`, payload),
})

export const updateProduct = (id, payload) => executeOrRequestApproval({
  approval: { moduleKey: "campa-products", moduleLabel: "Campa Products", operation: "update", resourceId: id, payload, summary: `Update product ${payload.name || id}` },
  request: () => api.put(`${base}/products/${id}`, payload),
})

export const deleteProduct = (id) => executeOrRequestApproval({
  approval: { moduleKey: "campa-products", moduleLabel: "Campa Products", operation: "delete", resourceId: id, summary: `Delete product ${id}` },
  request: () => api.delete(`${base}/products/${id}`),
})

export const addSale = (payload) => executeOrRequestApproval({
  approval: { moduleKey: "campa-sales", moduleLabel: "Campa Sales", operation: "create", payload, summary: `Add Campa sale ${payload.product || ""}` },
  request: () => api.post(base, payload),
})

export const updateSale = (id, payload) => executeOrRequestApproval({
  approval: { moduleKey: "campa-sales", moduleLabel: "Campa Sales", operation: "update", resourceId: id, payload, summary: `Update Campa sale ${payload.product || id}` },
  request: () => api.put(`${base}/${id}`, payload),
})

export const deleteSale = (id) => executeOrRequestApproval({
  approval: { moduleKey: "campa-sales", moduleLabel: "Campa Sales", operation: "delete", resourceId: id, summary: `Delete Campa sale ${id}` },
  request: () => api.delete(`${base}/${id}`),
})

export const deleteMonth = (payload) => executeOrRequestApproval({
  approval: { moduleKey: "campa-sales", moduleLabel: "Campa Sales", operation: "deleteMonth", meta: { year: payload.year, month: payload.month }, summary: `Delete Campa sales for ${payload.month}/${payload.year}` },
  request: () => api.post(`${base}/delete-month`, payload),
})
