import { api } from "./api"

export const getAiReportSummary = async (payload) => {
  const { data } = await api.post("/ai/report-summary", payload)
  return data
}
