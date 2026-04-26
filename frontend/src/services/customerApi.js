import { api, executeOrRequestApproval } from "./api"


// GET CUSTOMERS
export const getCustomers = async () => {
    const { data } = await api.get("/customers")
    return data
}


// ADD CUSTOMER
export const addCustomer = async (data) => {
    return executeOrRequestApproval({
      approval: {
        moduleKey: "customers",
        moduleLabel: "Credit Customers",
        operation: "create",
        payload: data,
        summary: `Add customer ${data.name || ""}`,
      },
      request: () => api.post("/customers", data),
    })
}


// UPDATE CUSTOMER
export const updateCustomer = async (id,data) => {
    return executeOrRequestApproval({
      approval: {
        moduleKey: "customers",
        moduleLabel: "Credit Customers",
        operation: "update",
        resourceId: id,
        payload: data,
        summary: `Update customer ${data.name || id}`,
      },
      request: () => api.put(`/customers/${id}`,data),
    })
}


// DELETE CUSTOMER
export const deleteCustomer = async (id) => {
    return executeOrRequestApproval({
      approval: {
        moduleKey: "customers",
        moduleLabel: "Credit Customers",
        operation: "delete",
        resourceId: id,
        summary: `Delete customer ${id}`,
      },
      request: () => api.delete(`/customers/${id}`),
    })
}


// CUSTOMER LEDGER
export const getCustomerLedger = async (id) => {
    const { data } = await api.get(`/customers/${id}/ledger`)
    return data
}


// ADD FUEL
export const addFuel = async (id,data) => {
    return executeOrRequestApproval({
      approval: {
        moduleKey: "customers",
        moduleLabel: "Credit Customers",
        operation: "fuel",
        resourceId: id,
        payload: data,
        summary: `Add fuel entry for customer ${id}`,
      },
      request: () => api.post(`/customers/${id}/fuel`,data),
    })
}


// ADD PAYMENT
export const addPayment = async (id,data) => {
    return executeOrRequestApproval({
      approval: {
        moduleKey: "customers",
        moduleLabel: "Credit Customers",
        operation: "payment",
        resourceId: id,
        payload: data,
        summary: `Add payment for customer ${id}`,
      },
      request: () => api.post(`/customers/${id}/payment`,data),
    })
}
