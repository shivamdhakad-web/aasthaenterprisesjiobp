import { api } from "./api"

export const getBackups = async () => {
  const { data } = await api.get("/backups")
  return data
}

export const createBackup = async (payload) => {
  const { data } = await api.post("/backups/create", payload)
  return data
}

export const previewStoredBackup = async (id) => {
  const { data } = await api.get(`/backups/${id}/preview`)
  return data
}

export const previewStoredBackupWithPassword = async (id, backupPassword = "") => {
  const { data } = await api.get(`/backups/${id}/preview`, {
    params: { backupPassword },
  })
  return data
}

export const previewUploadedBackup = async (payload) => {
  const { data } = await api.post("/backups/preview-upload", payload)
  return data
}

export const restoreBackup = async (payload) => {
  const { data } = await api.post("/backups/restore", payload)
  return data
}

export const getRestoreDiff = async (payload) => {
  const { data } = await api.post("/backups/diff", payload)
  return data
}

export const healthCheckBackup = async (payload) => {
  const { data } = await api.post("/backups/health-check", payload)
  return data
}

export const compareBackups = async (payload) => {
  const { data } = await api.post("/backups/compare", payload)
  return data
}

export const emergencyRestoreLatest = async (payload) => {
  const { data } = await api.post("/backups/emergency-restore-latest", payload)
  return data
}

export const getBackupLogs = async () => {
  const { data } = await api.get("/backups/logs")
  return data
}

export const toggleBackupLock = async (id) => {
  const { data } = await api.patch(`/backups/${id}/lock`)
  return data
}

export const deleteBackup = async (id) => {
  const { data } = await api.delete(`/backups/${id}`)
  return data
}

export const getBackupDownloadUrl = (id) => `${api.defaults.baseURL}/backups/${id}/download`
