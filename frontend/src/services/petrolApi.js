import axios from "axios"

const API = "http://localhost:5000/api/petrol"

export const getTodayPetrolStats = () =>
 axios.get(`${API}/stats/today`)

export const addPetrolSale = (data) =>
 axios.post(`${API}/add`,data)

export const getPetrolSales = () =>
 axios.get(`${API}/all`)

export const deletePetrolSale = (id) =>
 axios.delete(`${API}/delete/${id}`)

export const updatePetrolSale = (id,data) =>
 axios.put(`${API}/update/${id}`,data)