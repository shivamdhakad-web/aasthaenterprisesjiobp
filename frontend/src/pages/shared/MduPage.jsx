import SimpleAuditRegisterPage, { helpers } from "./SimpleAuditRegisterPage"
import { addMduEntry, deleteMduEntry, getMduEntries, updateMduEntry } from "../../services/mduApi"

const { formatDate, formatNumber, numberValue, today } = helpers

const empty = () => ({
  date: today(),
  openingStock: "",
  decant: "",
  sale: "",
  physicalStock: "",
  rate: "",
  remark: "",
})

const getLossGain = (entry) =>
  Number(entry.lossGain ?? numberValue(entry.physicalStock) - (numberValue(entry.openingStock) + numberValue(entry.decant) - numberValue(entry.sale)))

export default function MduPage() {
  return (
    <SimpleAuditRegisterPage
      config={{
        title: "M.D.U",
        kicker: "MDU DSR Register",
        description: "Track opening stock, decant, sales, physical stock, loss/gain, rate, remarks, and audit history.",
        pageKey: "mdu",
        empty,
        api: {
          list: getMduEntries,
          add: addMduEntry,
          update: updateMduEntry,
          remove: deleteMduEntry,
        },
        requiredFields: ["date", "openingStock", "physicalStock"],
        searchFields: ["date", "openingStock", "decant", "sale", "physicalStock", "rate", "remark"],
        searchPlaceholder: "Search date, stock, rate, remark",
        fields: [
          { key: "date", label: "Date", type: "date" },
          { key: "openingStock", label: "Opening Stock", type: "number" },
          { key: "decant", label: "Decant", type: "number" },
          { key: "sale", label: "Sale", type: "number" },
          { key: "physicalStock", label: "Physical Stock", type: "number" },
          { key: "rate", label: "Rate", type: "number" },
          { key: "remark", label: "Remark", full: true },
        ],
        columns: [
          { key: "date", label: "Date", render: (entry) => formatDate(entry.date) },
          { key: "openingStock", label: "Op. Stock", render: (entry) => formatNumber(entry.openingStock) },
          { key: "decant", label: "Decant", render: (entry) => formatNumber(entry.decant) },
          { key: "sale", label: "Sale", render: (entry) => formatNumber(entry.sale) },
          { key: "physicalStock", label: "Physical Stock", render: (entry) => formatNumber(entry.physicalStock) },
          {
            key: "lossGain",
            label: "Loss/Gain",
            render: (entry) => formatNumber(getLossGain(entry)),
            className: (entry) => (getLossGain(entry) >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-red-500"),
          },
          { key: "rate", label: "Rate", render: (entry) => formatNumber(entry.rate) },
          { key: "remark", label: "Remark" },
        ],
        buildPayload: (form) => {
          const openingStock = numberValue(form.openingStock)
          const decant = numberValue(form.decant)
          const sale = numberValue(form.sale)
          const physicalStock = numberValue(form.physicalStock)

          return {
            ...form,
            openingStock,
            decant,
            sale,
            physicalStock,
            rate: numberValue(form.rate),
            lossGain: physicalStock - (openingStock + decant - sale),
          }
        },
        summary: (entries) => {
          const totalSale = entries.reduce((sum, entry) => sum + numberValue(entry.sale), 0)
          const totalDecant = entries.reduce((sum, entry) => sum + numberValue(entry.decant), 0)
          const rateEntries = entries.filter((entry) => numberValue(entry.rate) > 0)
          const avgRate = rateEntries.length
            ? rateEntries.reduce((sum, entry) => sum + numberValue(entry.rate), 0) / rateEntries.length
            : 0
          const profit = avgRate * totalSale
          const loss = entries.reduce((sum, entry) => {
            const value = getLossGain(entry)
            return value < 0 ? sum + Math.abs(value) : sum
          }, 0)
          const gain = entries.reduce((sum, entry) => {
            const value = getLossGain(entry)
            return value > 0 ? sum + value : sum
          }, 0)

          return [
            { label: "Entries", value: entries.length, tone: "blue" },
            { label: "Total Decant", value: formatNumber(totalDecant), tone: "green" },
            { label: "Total Sale", value: formatNumber(totalSale), tone: "amber" },
            { label: "Avg Rate", value: formatNumber(avgRate.toFixed(2)), tone: "violet" },
            { label: "Profit", value: formatNumber(profit.toFixed(2)), tone: profit >= 0 ? "green" : "rose" },
            { label: "Loss / Gain", value: `${formatNumber(loss)} / ${formatNumber(gain)}`, tone: gain >= loss ? "green" : "rose" },
          ]
        },
        preview: (form) => {
          const lossGain =
            numberValue(form.physicalStock) -
            (numberValue(form.openingStock) + numberValue(form.decant) - numberValue(form.sale))

          return {
            label: "Calculated Loss / Gain",
            value: formatNumber(lossGain),
            className: lossGain >= 0 ? "text-emerald-500" : "text-red-500",
          }
        },
        mobileTitle: (entry) => `Sale ${formatNumber(entry.sale)}`,
        mobileBadge: (entry) => formatNumber(getLossGain(entry)),
        mobileFields: [
          { key: "openingStock", label: "Opening", render: (entry) => formatNumber(entry.openingStock) },
          { key: "decant", label: "Decant", render: (entry) => formatNumber(entry.decant) },
          { key: "physicalStock", label: "Physical", render: (entry) => formatNumber(entry.physicalStock) },
          { key: "rate", label: "Rate", render: (entry) => formatNumber(entry.rate) },
        ],
      }}
    />
  )
}

