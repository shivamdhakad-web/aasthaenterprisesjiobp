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
        searchFields: ["date", "product", "qty", "invoiceAmount", "transportCost", "lfr", "remark"],
        searchPlaceholder: "Search date, product, invoice amount, remark",
        fields: [
          { key: "date", label: "Date", type: "date" },
          { key: "product", label: "Product" },
          { key: "qty", label: "Qty", type: "number" },
          { key: "invoiceAmount", label: "Invoice Amount", type: "number" },
          { key: "transportCost", label: "Transport Cost", type: "number" },
          { key: "lfr", label: "LFR", type: "number" },
          { key: "remark", label: "Remark", full: true },
        ],
        columns: [
          { key: "date", label: "Date", render: (entry) => formatDate(entry.date) },
          { key: "product", label: "Product" },
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
          const totalQty = entries.reduce((sum, entry) => sum + numberValue(entry.qty), 0)
          const totalInvoice = entries.reduce((sum, entry) => sum + numberValue(entry.invoiceAmount), 0)
          const totalTransport = entries.reduce((sum, entry) => sum + numberValue(entry.transportCost), 0)
          const averagePurchase = entries.length
            ? entries.reduce((sum, entry) => sum + getPurchaseAmount(entry), 0) / entries.length
            : 0

          return [
            { label: "Entries", value: entries.length, tone: "blue" },
            { label: "Total Qty", value: formatNumber(totalQty), tone: "green" },
            { label: "Invoice Amount", value: formatNumber(totalInvoice), tone: "amber" },
            { label: "Transport Cost", value: formatNumber(totalTransport), tone: "rose" },
            { label: "Avg Purchase", value: formatNumber(averagePurchase), tone: "green" },
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
