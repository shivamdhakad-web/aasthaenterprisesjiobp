import { useState } from "react"
import SimpleAuditRegisterPage, { helpers } from "./SimpleAuditRegisterPage"
import { addDcdEntry, deleteDcdEntry, getDcdEntries, updateDcdEntry } from "../../services/dcdApi"

const { formatDate, formatNumber, numberValue, today } = helpers

const empty = () => ({
  date: today(),
  product: "HSD",
  volume: "",
  purchasePrice: "",
  salePrice: "",
  shift: "",
  remark: "",
})

const getProfit = (entry) =>
  Number(entry.profit ?? (numberValue(entry.salePrice) - numberValue(entry.purchasePrice)) * numberValue(entry.volume))

const getMargin = (entry) => numberValue(entry.salePrice) - numberValue(entry.purchasePrice)

export default function DcdPage() {
  const [productOptions, setProductOptions] = useState(["HSD", "HSD PC"])

  const addProductOption = (value) => {
    setProductOptions((current) => (current.includes(value) ? current : [...current, value]))
  }

  return (
    <SimpleAuditRegisterPage
      config={{
        title: "D.C.D",
        kicker: "Diesel Credit/Daily Register",
        description: "Track date, volume, purchase price, sale price, profit, shift, remarks, and audit history.",
        pageKey: "dcd",
        aiSummary: { valueKey: "profit", categoryKey: "product" },
        iconBg: "bg-orange-50",
        badgeStyle: "bg-orange-100 text-orange-700",
        lineStyle: "bg-orange-200",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6 text-orange-600"
          >
            <ellipse cx="12" cy="5" rx="5" ry="2" />
            <path d="M7 5v14c0 1.1 2.2 2 5 2s5-.9 5-2V5" />
            <path d="M7 12c0 1.1 2.2 2 5 2s5-.9 5-2" />
            <path d="M10 9h4" />
          </svg>
        ),
        empty,
        api: {
          list: getDcdEntries,
          add: addDcdEntry,
          update: updateDcdEntry,
          remove: deleteDcdEntry,
        },
        requiredFields: ["date", "product", "volume", "purchasePrice", "salePrice"],
        bulkDefaults: [
          { key: "date" },
          { key: "product" },
          { key: "salePrice" },
        ],
        searchFields: ["date", "product", "volume", "purchasePrice", "salePrice", "shift", "remark"],
        searchPlaceholder: "Search date, product, volume, shift, remark",
        categoryFilter: {
          key: "product",
          allLabel: "All Categories",
          options: productOptions,
        },
        fields: [
          { key: "date", label: "Date", type: "date" },
          {
            key: "product",
            label: "Product",
            type: "select",
            options: productOptions,
            allowCustomOption: true,
            onAddOption: addProductOption,
          },
          { key: "volume", label: "Volume", type: "number" },
          { key: "purchasePrice", label: "Purchase Price", type: "number" },
          { key: "salePrice", label: "Sale Price", type: "number" },
          { key: "shift", label: "Shift" },
          { key: "remark", label: "Remark", full: true },
        ],
        columns: [
          { key: "date", label: "Date", render: (entry) => formatDate(entry.date) },
          { key: "product", label: "Product" },
          { key: "volume", label: "Volume", render: (entry) => formatNumber(entry.volume) },
          { key: "purchasePrice", label: "Purchase Price", render: (entry) => formatNumber(entry.purchasePrice) },
          { key: "salePrice", label: "Sale Price", render: (entry) => formatNumber(entry.salePrice) },
          {
            key: "margin",
            label: "Margin",
            render: (entry) => formatNumber(getMargin(entry)),
            className: (entry) => (getMargin(entry) >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-red-500"),
          },
          {
            key: "profit",
            label: "Profit",
            render: (entry) => formatNumber(getProfit(entry)),
            className: (entry) => (getProfit(entry) >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-red-500"),
          },
          { key: "shift", label: "Shift" },
          { key: "remark", label: "Remark" },
        ],
        buildPayload: (form) => ({
          ...form,
          product: form.product || "",
          volume: numberValue(form.volume),
          purchasePrice: numberValue(form.purchasePrice),
          salePrice: numberValue(form.salePrice),
          profit: (numberValue(form.salePrice) - numberValue(form.purchasePrice)) * numberValue(form.volume),
        }),
        summary: (entries) => {
          const totalVolume = entries.reduce((sum, entry) => sum + numberValue(entry.volume), 0)
          const totalProfit = entries.reduce((sum, entry) => sum + getProfit(entry), 0)
          const avgSale = entries.length
            ? entries.reduce((sum, entry) => sum + numberValue(entry.salePrice), 0) / entries.length
            : 0

          return [
            { label: "Total Volume", value: formatNumber(totalVolume), tone: "green" },
            { label: "Total Profit", value: formatNumber(totalProfit), tone: totalProfit >= 0 ? "green" : "rose" },
            { label: "Avg Sale Price", value: formatNumber(avgSale), tone: "amber" },
          ]
        },
        preview: (form) => {
          const margin = numberValue(form.salePrice) - numberValue(form.purchasePrice)
          const profit = (numberValue(form.salePrice) - numberValue(form.purchasePrice)) * numberValue(form.volume)

          return {
            label: "Calculated Margin / Profit",
            value: `${formatNumber(margin)} / ${formatNumber(profit)}`,
            className: profit >= 0 ? "text-emerald-500" : "text-red-500",
          }
        },
        mobileTitle: (entry) => entry.product || `Shift ${entry.shift || "-"}`,
        mobileBadge: (entry) => formatNumber(getProfit(entry)),
        mobileFields: [
          { key: "product", label: "Product" },
          { key: "volume", label: "Volume", render: (entry) => formatNumber(entry.volume) },
          { key: "purchasePrice", label: "Purchase", render: (entry) => formatNumber(entry.purchasePrice) },
          { key: "salePrice", label: "Sale", render: (entry) => formatNumber(entry.salePrice) },
          { key: "margin", label: "Margin", render: (entry) => formatNumber(getMargin(entry)) },
          { key: "remark", label: "Remark" },
        ],
      }}
    />
  )
}
