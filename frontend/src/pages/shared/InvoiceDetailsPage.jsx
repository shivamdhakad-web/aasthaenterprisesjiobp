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
  rsp: "",
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

const getLfrAmount = (entry) => numberValue(entry.qty) * numberValue(entry.lfr)

const getMargin = (entry) => numberValue(entry.rsp) - getPurchaseAmount(entry)

export default function InvoiceDetailsPage() {
  return (
    <SimpleAuditRegisterPage
      config={{
        title: "Invoice Details",
        kicker: "Fuel Invoice Register",
        description: "Track product invoice quantity, invoice amount, transport cost, LFR, purchase amount, remarks, and audit history.",
        pageKey: "invoiceDetails",
        iconBg: "bg-violet-50",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6 text-violet-600"
          >
            <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3z" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
            <path d="M9 16h4" />
          </svg>
        ),
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
          { key: "rsp" },
        ],
        searchFields: ["date", "product", "qty", "invoiceAmount", "transportCost", "lfr", "rsp", "remark"],
        searchPlaceholder: "Search date, product, invoice amount, RSP, remark",
        categoryFilter: {
          keys: ["product", "qty"],
          allLabel: "All Categories",
          options: ["MS", "HSD", "19000", "22000", "24000", "12000", "14000"],
        },
        fields: [
          { key: "date", label: "Date", type: "date" },
          { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
          { key: "qty", label: "Qty", type: "select", options: ["19000", "22000", "24000", "12000", "14000"] },
          { key: "invoiceAmount", label: "Invoice Amount", type: "number" },
          { key: "transportCost", label: "Transport Cost", type: "number" },
          { key: "lfr", label: "LFR", type: "number" },
          { key: "rsp", label: "RSP", type: "number" },
          { key: "remark", label: "Remark", full: true },
        ],
        columns: [
          { key: "date", label: "Date", render: (entry) => formatDate(entry.date) },
          { key: "product", label: "Product", type: "select", options: ["HSD", "MS"] },
          { key: "qty", label: "Qty", render: (entry) => formatNumber(entry.qty) },
          { key: "invoiceAmount", label: "Invoice Amount", render: (entry) => formatNumber(entry.invoiceAmount) },
          { key: "transportCost", label: "Transport Cost", render: (entry) => formatNumber(entry.transportCost) },
          { key: "lfr", label: "LFR", render: (entry) => formatNumber(entry.lfr) },
          { key: "lfrAmount", label: "LFR Amount", render: (entry) => formatNumber(getLfrAmount(entry)) },
          { key: "rsp", label: "RSP", render: (entry) => formatNumber(entry.rsp) },
          {
            key: "purchaseAmount",
            label: "Purchase Amount",
            render: (entry) => formatNumber(getPurchaseAmount(entry)),
            className: () => "font-semibold text-emerald-500",
          },
          {
            key: "margin",
            label: "Margin",
            render: (entry) => formatNumber(getMargin(entry)),
            className: (entry) => (getMargin(entry) >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-rose-500"),
          },
          { key: "remark", label: "Remark" },
        ],
        buildPayload: (form) => {
          const qty = numberValue(form.qty)
          const invoiceAmount = numberValue(form.invoiceAmount)
          const transportCost = numberValue(form.transportCost)
          const lfr = numberValue(form.lfr)
          const rsp = numberValue(form.rsp)
          const purchaseAmount = qty ? (invoiceAmount + transportCost) / qty + lfr : 0

          return {
            ...form,
            qty,
            invoiceAmount,
            transportCost,
            lfr,
            rsp,
            purchaseAmount,
          }
        },
        summary: (entries) => {
          const hsdEntries = entries.filter((entry) => String(entry.product || "").toLowerCase() === "hsd")
          const msEntries = entries.filter((entry) => String(entry.product || "").toLowerCase() === "ms")
          const sumField = (list, key) => list.reduce((sum, entry) => sum + numberValue(entry[key]), 0)
          const sumLfrAmount = (list) => list.reduce((sum, entry) => sum + getLfrAmount(entry), 0)
          const avgPurchase = (list) => {
            const totalQty = sumField(list, "qty")
            if (!totalQty) return 0

            return (sumField(list, "invoiceAmount") + sumField(list, "transportCost") + sumLfrAmount(list)) / totalQty
          }

          return [
            { label: "HSD Total Qty", value: formatNumber(sumField(hsdEntries, "qty")), tone: "green" },
            { label: "MS Total Qty", value: formatNumber(sumField(msEntries, "qty")), tone: "amber" },
            { label: "Total HSD LFR Amount", value: formatNumber(sumLfrAmount(hsdEntries)), tone: "violet" },
            { label: "Total MS LFR Amount", value: formatNumber(sumLfrAmount(msEntries)), tone: "blue" },
            { label: "Avg Purchase Rate HSD", value: formatNumber(avgPurchase(hsdEntries).toFixed(2)), tone: "green" },
            { label: "Avg Purchase Rate MS", value: formatNumber(avgPurchase(msEntries).toFixed(2)), tone: "amber" },
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
          const margin = numberValue(form.rsp) - purchaseAmount

          return {
            label: "Calculated Purchase Amount / Margin",
            value: `${formatNumber(purchaseAmount)} / ${formatNumber(margin)}`,
            className: margin >= 0 ? "text-emerald-500" : "text-rose-500",
          }
        },
        mobileTitle: (entry) => entry.product || "Product",
        mobileBadge: (entry) => formatNumber(getPurchaseAmount(entry)),
        mobileFields: [
          { key: "qty", label: "Qty", render: (entry) => formatNumber(entry.qty) },
          { key: "invoiceAmount", label: "Invoice", render: (entry) => formatNumber(entry.invoiceAmount) },
          { key: "transportCost", label: "Transport", render: (entry) => formatNumber(entry.transportCost) },
          { key: "lfr", label: "LFR", render: (entry) => formatNumber(entry.lfr) },
          { key: "lfrAmount", label: "LFR Amount", render: (entry) => formatNumber(getLfrAmount(entry)) },
          { key: "rsp", label: "RSP", render: (entry) => formatNumber(entry.rsp) },
          { key: "margin", label: "Margin", render: (entry) => formatNumber(getMargin(entry)) },
        ],
      }}
    />
  )
}
