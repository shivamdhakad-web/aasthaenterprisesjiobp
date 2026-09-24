import axios from "axios"
import { api } from "./api"

export const getStationDocuments = async () => {
  const { data } = await api.get("/station-documents")
  return data
}

export const getStationDocumentUsage = async () => {
  const { data } = await api.get("/station-documents/usage")
  return data
}

export const saveStationDocument = async (payload) => {
  const { data } = await api.post("/station-documents", payload)
  return data.document
}

export const deleteStationDocument = async (id) => {
  const { data } = await api.delete(`/station-documents/${id}`)
  return data
}

export const uploadStationFile = async ({ file, cloudName, uploadPreset, category }) => {
  const resourceType = file.type === "application/pdf" ? "raw" : "image"
  const body = new FormData()
  body.append("file", file)
  body.append("upload_preset", uploadPreset)
  body.append("folder", "station-documents")
  body.append("context", `category=${category}`)
  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    body,
    { onUploadProgress: undefined },
  )
  return { ...data, resourceType }
}
