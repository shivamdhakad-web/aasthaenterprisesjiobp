import { api } from "./api"

export const getAiReportSummary = async (payload) => {
  const { data } = await api.post("/ai/report-summary", payload)
  return data
}

export const getAiChatModels = async () => {
  const { data } = await api.get("/ai/chat-models")
  return data
}

export const sendAiChatMessage = async (payload) => {
  const { data } = await api.post("/ai/chat", payload)
  return data
}
