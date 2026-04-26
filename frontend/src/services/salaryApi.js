import { api } from "./api"

export const getSalarySummary = async (employeeId, month) => {
  const target = employeeId ? `/salary/summary/${employeeId}` : "/salary/summary"
  const { data } = await api.get(target, {
    params: month ? { month } : {},
  })
  return data
}
