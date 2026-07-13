import SimpleAuditRegisterPage, { helpers } from "./SimpleAuditRegisterPage"
import {
  addInvoiceDetail,
  deleteInvoiceDetail,
  getInvoiceDetails,
  updateInvoiceDetail,
} from "../../services/invoiceDetailApi"

const { formatDate, formatNumber, numberValue, today } = helpers

const empty = () => ({
  date: today(),
  product: "HSD",
  qty: "",
  invoiceAmount: "",
  transportCost: "",
  lfr: "",
  remark: "",
})

const getPurchaseAmount = (entry) =>
  Number(
    entry.purchaseAmount ??
      (numberValue(entry.qty)
        ? (numberValue(entry.invoiceAmount) + numberValue(entry.transportCost)) / numberValue(entry.qty) +
          numberValue(entry.lfr)
        : 0),
  )

export default function InvoiceDetailsPage() {
  return (
    <SimpleAuditRegisterPage
      config={{
        title: "Invoice Details",
        kicker: "Fuel Invoice Register",
        description: "Track product invoice quantity, invoice amount, transport cost, LFR, purchase amount, remarks, and audit history.",
        pageKey: "invoiceDetails",
        empty,
        api: {
          list: getInvoiceDetails,
          add: addInvoiceDetail,
          update: updateInvoiceDetail,
          remove: deleteInvoiceDetail,
        },
        requiredFields: ["date", "product", "qty", "invoiceAmount"],
        bulkDefaults: [
          { key: "date" },
          { key: "product" },
          { key: "lfr" },
          { key: "qty" },
        ],
        searchFields: ["date", "product", "qty", "invoiceAmount", "transportCost", "lfr", "remark"],
        searchPlaceholder: "Search date, product, invoice amount, remark",
        fields: [
          { key: "date", label: "Date", type: "date" },
          { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
          { key: "qty", label: "Qty", type: "select", options: ["19000", "22000", "24000", "12000", "14000"] },
          { key: "invoiceAmount", label: "Invoice Amount", type: "number" },
          { key: "transportCost", label: "Transport Cost", type: "number" },
          { key: "lfr", label: "LFR", type: "number" },
          { key: "remark", label: "Remark", full: true },
        ],
        columns: [
          { key: "date", label: "Date", render: (entry) => formatDate(entry.date) },
          { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
          { key: "qty", label: "Qty", render: (entry) => formatNumber(entry.qty) },
          { key: "invoiceAmount", label: "Invoice Amount", render: (entry) => formatNumber(entry.invoiceAmount) },
          { key: "transportCost", label: "Transport Cost", render: (entry) => formatNumber(entry.transportCost) },
          { key: "lfr", label: "LFR", render: (entry) => formatNumber(entry.lfr) },
          {
            key: "purchaseAmount",
            label: "Purchase Amount",
            render: (entry) => formatNumber(getPurchaseAmount(entry)),
            className: () => "font-semibold text-emerald-500",
          },
          { key: "remark", label: "Remark" },
        ],
        buildPayload: (form) => {
          const qty = numberValue(form.qty)
          const invoiceAmount = numberValue(form.invoiceAmount)
          const transportCost = numberValue(form.transportCost)
          const lfr = numberValue(form.lfr)

          return {
            ...form,
            qty,
            invoiceAmount,
            transportCost,
            lfr,
            purchaseAmount: qty ? (invoiceAmount + transportCost) / qty + lfr : 0,
          }
        },
        summary: (entries) => {
          const hsdEntries = entries.filter((entry) => String(entry.product || "").toLowerCase() === "hsd")
          const msEntries = entries.filter((entry) => String(entry.product || "").toLowerCase() === "ms")
          const sumField = (list, key) => list.reduce((sum, entry) => sum + numberValue(entry[key]), 0)
          const avgPurchase = (list) =>
            list.length ? list.reduce((sum, entry) => sum + getPurchaseAmount(entry), 0) / list.length : 0

          return [
            { label: "HSD Total Qty", value: formatNumber(sumField(hsdEntries, "qty")), tone: "green" },
            { label: "MS Total Qty", value: formatNumber(sumField(msEntries, "qty")), tone: "amber" },
            { label: "Avg Purchase Rate HSD", value: formatNumber(avgPurchase(hsdEntries).toFixed(2)), tone: "violet" },
            { label: "Avg Purchase Rate MS", value: formatNumber(avgPurchase(msEntries).toFixed(2)), tone: "blue" },
            { label: "Total Invoice Amount HSD", value: formatNumber(sumField(hsdEntries, "invoiceAmount")), tone: "green" },
            { label: "Total Transport Cost HSD", value: formatNumber(sumField(hsdEntries, "transportCost")), tone: "rose" },
            { label: "Total Invoice Amount MS", value: formatNumber(sumField(msEntries, "invoiceAmount")), tone: "amber" },
            { label: "Total Transport Cost MS", value: formatNumber(sumField(msEntries, "transportCost")), tone: "rose" },
          ]
        },
        preview: (form) => {
          const qty = numberValue(form.qty)
          const purchaseAmount = qty
            ? (numberValue(form.invoiceAmount) + numberValue(form.transportCost)) / qty + numberValue(form.lfr)
            : 0

          return {
            label: "Calculated Purchase Amount",
            value: formatNumber(purchaseAmount),
            className: "text-emerald-500",
          }
        },
        mobileTitle: (entry) => entry.product || "Product",
        mobileBadge: (entry) => formatNumber(getPurchaseAmount(entry)),
        mobileFields: [
          { key: "qty", label: "Qty", render: (entry) => formatNumber(entry.qty) },
          { key: "invoiceAmount", label: "Invoice", render: (entry) => formatNumber(entry.invoiceAmount) },
          { key: "transportCost", label: "Transport", render: (entry) => formatNumber(entry.transportCost) },
          { key: "lfr", label: "LFR", render: (entry) => formatNumber(entry.lfr) },
        ],
      }}
    />
  )
}

