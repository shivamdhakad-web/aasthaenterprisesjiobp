import SimpleAuditRegisterPage, { helpers } from "./SimpleAuditRegisterPage"
import { addDailySale, deleteDailySale, getDailySales, updateDailySale } from "../../services/dailySaleApi"

const { formatDate, formatNumber, numberValue, today } = helpers

const empty = () => ({
  date: today(),
  product: "HSD",
  sale: "",
  rate: "",
  lossGain: "",
  remark: "",
})

const getProfit = (entry) => Number(entry.profit ?? numberValue(entry.sale) * numberValue(entry.rate))

export default function DailySalesPage() {
  return (
    <SimpleAuditRegisterPage
      config={{
        title: "Daily Sales",
        kicker: "Daily Sales Register",
        description: "Track product sales, rate, loss/gain, profit, remarks, and audit history.",
        pageKey: "dailySales",
        empty,
        api: {
          list: getDailySales,
          add: addDailySale,
          update: updateDailySale,
          remove: deleteDailySale,
        },
        requiredFields: ["date", "product", "sale", "rate"],
        searchFields: ["date", "product", "sale", "rate", "lossGain", "profit", "remark"],
        searchPlaceholder: "Search date, product, sale, remark",
        fields: [
          { key: "date", label: "Date", type: "date" },
          { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
          { key: "sale", label: "Sale", type: "number" },
          { key: "rate", label: "Rate", type: "number" },
          { key: "lossGain", label: "Loss / Gain (LTR)", type: "number" },
          { key: "remark", label: "Remark", full: true },
        ],
        columns: [
          { key: "date", label: "Date", render: (entry) => formatDate(entry.date) },
          { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
          { key: "sale", label: "Sale", render: (entry) => formatNumber(entry.sale) },
          { key: "rate", label: "Rate", render: (entry) => formatNumber(entry.rate) },
          {
            key: "lossGain",
            label: "Loss/Gain (LTR)",
            render: (entry) => formatNumber(entry.lossGain),
            className: (entry) => (numberValue(entry.lossGain) >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-red-500"),
          },
          {
            key: "profit",
            label: "Profit",
            render: (entry) => formatNumber(getProfit(entry)),
            className: () => "font-semibold text-emerald-500",
          },
          { key: "remark", label: "Remark" },
        ],
        buildPayload: (form) => {
          const sale = numberValue(form.sale)
          const rate = numberValue(form.rate)

          return {
            ...form,
            sale,
            rate,
            lossGain: numberValue(form.lossGain),
            profit: sale * rate,
          }
        },
        summary: (entries) => {
          const hsdEntries = entries.filter((entry) => String(entry.product || "").toLowerCase() === "hsd")
          const msEntries = entries.filter((entry) => String(entry.product || "").toLowerCase() === "ms")
          const hsdSale = hsdEntries.reduce((sum, entry) => sum + numberValue(entry.sale), 0)
          const msSale = msEntries.reduce((sum, entry) => sum + numberValue(entry.sale), 0)
          const totalProfit = entries.reduce((sum, entry) => sum + getProfit(entry), 0)
          const hsdLossGain = hsdEntries.reduce((sum, entry) => sum + numberValue(entry.lossGain), 0)
          const msLossGain = msEntries.reduce((sum, entry) => sum + numberValue(entry.lossGain), 0)
          const avgRateHsd = hsdEntries.length
            ? hsdEntries.reduce((sum, entry) => sum + numberValue(entry.rate), 0) / hsdEntries.length
            : 0
          const avgRateMs = msEntries.length
            ? msEntries.reduce((sum, entry) => sum + numberValue(entry.rate), 0) / msEntries.length
            : 0

          return [
            { label: "Entries", value: entries.length, tone: "blue" },
            { label: "HSD Sale", value: formatNumber(hsdSale), tone: "green" },
            { label: "MS Sale", value: formatNumber(msSale), tone: "amber" },
            { label: "Avg Rate HSD", value: formatNumber(avgRateHsd.toFixed(2)), tone: "violet" },
            { label: "Avg Rate MS", value: formatNumber(avgRateMs.toFixed(2)), tone: "blue" },
            { label: "HSD Loss / Gain", value: formatNumber(hsdLossGain.toFixed(2)), tone: hsdLossGain >= 0 ? "green" : "rose" },
            { label: "MS Loss / Gain", value: formatNumber(msLossGain.toFixed(2)), tone: msLossGain >= 0 ? "green" : "rose" },
            { label: "Total Profit", value: formatNumber(totalProfit), tone: "green" },
          ]
        },
        preview: (form) => {
          const profit = numberValue(form.sale) * numberValue(form.rate)

          return {
            label: "Calculated Profit",
            value: formatNumber(profit),
            className: "text-emerald-500",
          }
        },
        mobileTitle: (entry) => entry.product || "Product",
        mobileBadge: (entry) => formatNumber(getProfit(entry)),
        mobileFields: [
          { key: "sale", label: "Sale", render: (entry) => formatNumber(entry.sale) },
          { key: "rate", label: "Rate", render: (entry) => formatNumber(entry.rate) },
          { key: "lossGain", label: "Loss/Gain", render: (entry) => formatNumber(entry.lossGain) },
          { key: "remark", label: "Remark" },
        ],
      }}
    />
  )
}

