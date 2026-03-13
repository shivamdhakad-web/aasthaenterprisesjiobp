import axios from "axios"

const API = "http://localhost:5000/api/meter"

export const getMeterReadings = async()=>{

const res = await axios.get(API)

return res.data

}

export const addMeterReading = async(data)=>{

const res = await axios.post(API,data)

return res.data

}

export const deleteMeterReading = async(id)=>{

await axios.delete(`${API}/${id}`)

}

export const updateMeterReading = async(id,data)=>{

await axios.put(`${API}/${id}`,data)

}