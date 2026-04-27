import { api } from "./api"

export const getStorageOverview = async () => {
  const { data } = await api.get("/storage")
  return data
}
