import axios from "axios"

const API = "https://aasthaenterprisesjiobp.onrender.com/api/customers"


// GET CUSTOMERS
export const getCustomers = async () => {

    const res = await axios.get(API)

    return res.data
}


// ADD CUSTOMER
export const addCustomer = async (data) => {

    const res = await axios.post(API, data)

    return res.data
}


// UPDATE CUSTOMER
export const updateCustomer = async (id,data) => {

    const res = await axios.put(`${API}/${id}`,data)

    return res.data
}


// DELETE CUSTOMER
export const deleteCustomer = async (id) => {

    const res = await axios.delete(`${API}/${id}`)

    return res.data
}


// CUSTOMER LEDGER
export const getCustomerLedger = async (id) => {

    const res = await axios.get(`${API}/${id}/ledger`)

    return res.data
}


// ADD FUEL
export const addFuel = async (id,data) => {

    const res = await axios.post(`${API}/${id}/fuel`,data)

    return res.data
}


// ADD PAYMENT
export const addPayment = async (id,data) => {

    const res = await axios.post(`${API}/${id}/payment`,data)

    return res.data
}