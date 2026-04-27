import { api } from "./api"

export const getSalarySummary = async (employeeId, monthOrOptions, dateValue) => {
  const target = employeeId ? `/salary/summary/${employeeId}` : "/salary/summary"
  let params = {}

  if (typeof monthOrOptions === "string") {
    params = monthOrOptions ? { month: monthOrOptions } : {}
  } else if (monthOrOptions && typeof monthOrOptions === "object") {
    params = { ...monthOrOptions }
  }

  if (dateValue) {
    params.date = dateValue
  }

  const { data } = await api.get(target, {
    params,
  })
  return data
}
