import { Download, FileSpreadsheet, ImageDown, Pencil, Plus, Receipt, Trash2, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { saveAs } from "file-saver"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import MobileActionFab from "../../components/MobileActionFab"
import { useAuth } from "../../contexts/AuthContext"
import {
  addGeneratedBill,
  deleteGeneratedBill,
  getGeneratedBills,
  updateGeneratedBill,
} from "../../services/billGeneratorApi"

const today = () => new Date().toISOString().slice(0, 10)
const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
const rupees = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const numberValue = (value) => Number(value || 0)
const preventNumberWheel = (event) => event.currentTarget.blur()
const UPI_ID = "paytm.s1l8b58@pty"
const STATION_DETAILS = {
  name: "Aastha Enterprises",
  address: "Jiobp Petrol Pump | Jaora Ujjain Bypass Road, Lalakheda Funta, Jaora",
  phone: "9425497704",
  email: "aasthaenterprises704@gmail.com",
  gstin: "23ACDFA0271C1Z8",
  state: "23-Madhya Pradesh",
  bankName: "State Bank Of India, Jawahar Path, Jaora",
  accountNo: "43186819529",
  ifsc: "SBIN0030052",
  holder: "Aastha Enterprises",
}

const blankItem = () => ({
  product: "Diesel",
  date: today(),
  quantity: "",
  unit: "Ltr",
  rate: "",
})

const emptyForm = () => ({
  billNo: `BILL-${Date.now().toString().slice(-6)}`,
  billDate: today(),
  customerName: "",
  customerPhone: "",
  vehicleNo: "",
  paymentMode: "Cash",
  discount: "",
  remark: "",
  items: [blankItem()],
})

const calculateBill = (bill) => {
  const items = (bill.items || []).map((item) => {
    const quantity = numberValue(item.quantity)
    const rate = numberValue(item.rate)
    return {
      ...item,
      date: item.date || bill.billDate || today(),
      unit: item.unit || "Ltr",
      quantity,
      rate,
      amount: numberValue(item.amount || quantity * rate),
    }
  })
  const subTotal = items.reduce((sum, item) => sum + item.amount, 0)
  const discount = numberValue(bill.discount)

  return {
    ...bill,
    items,
    subTotal,
    discount,
    grandTotal: Math.max(subTotal - discount, 0),
  }
}

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")
const formatInvoiceDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-GB")
}
const upiPayload = (amount) =>
  `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(STATION_DETAILS.name)}&am=${Number(amount || 0).toFixed(2)}&cu=INR`
const qrUrl = (amount, size = 150) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiPayload(amount))}`
const loadDataUrl = async (url) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    return ""
  }
}
const loadImage = async (url) =>
  new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = url
  })
const numberToWords = (value) => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const underHundred = (num) => (num < 20 ? ones[num] : `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${ones[num % 10]}` : ""}`)
  const underThousand = (num) => `${num >= 100 ? `${ones[Math.floor(num / 100)]} Hundred${num % 100 ? " and " : ""}` : ""}${num % 100 ? underHundred(num % 100) : ""}`
  let amount = Math.floor(Number(value || 0))
  if (!amount) return "Zero Rupees"
  const parts = []
  const crore = Math.floor(amount / 10000000)
  amount %= 10000000
  const lakh = Math.floor(amount / 100000)
  amount %= 100000
  const thousand = Math.floor(amount / 1000)
  amount %= 1000
  if (crore) parts.push(`${underThousand(crore)} Crore`)
  if (lakh) parts.push(`${underThousand(lakh)} Lakh`)
  if (thousand) parts.push(`${underThousand(thousand)} Thousand`)
  if (amount) parts.push(underThousand(amount))
  return `${parts.join(" ")} Rupees`
}
const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not edited yet"

export default function BillGeneratorPage() {
  const { user } = useAuth()
  const [bills, setBills] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [editingBill, setEditingBill] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [confirmBill, setConfirmBill] = useState(null)
  const [showForm, setShowForm] = useState(true)
  const [search, setSearch] = useState("")

  const previewBill = useMemo(() => calculateBill(form), [form])
  const filteredBills = useMemo(
    () =>
      bills.filter((bill) =>
        [bill.billNo, bill.customerName, bill.customerPhone, bill.vehicleNo, bill.paymentMode]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [bills, search],
  )

  useEffect(() => {
    loadBills()
  }, [])

  useEffect(() => {
    if (!notice.text) return undefined
    const timeout = window.setTimeout(() => setNotice({ type: "", text: "" }), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const loadBills = async () => {
    const data = await getGeneratedBills()
    setBills(Array.isArray(data) ? data : [])
  }

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const updateItem = (index, key, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    }))
  }

  const addItem = () =>
    setForm((current) => ({
      ...current,
      items: [...current.items, { ...blankItem(), date: current.billDate || today() }],
    }))

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const resetForm = () => {
    setEditingBill(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const editBill = (bill) => {
    setEditingBill(bill)
    setForm({
      ...emptyForm(),
      ...bill,
      discount: bill.discount || "",
      items: bill.items?.length ? bill.items : [blankItem()],
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const saveBill = async () => {
    const readyItems = previewBill.items.filter((item) => item.product && item.date && item.quantity && item.rate)

    if (!form.billDate || !form.billNo || readyItems.length === 0) {
      setNotice({ type: "error", text: "Please add bill number, date, and at least one complete entry." })
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...previewBill,
        items: readyItems,
        createdBy: user?.name || "Admin",
      }

      if (editingBill) {
        await updateGeneratedBill(editingBill._id, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", text: "Bill updated successfully." })
      } else {
        await addGeneratedBill(payload)
        setNotice({ type: "success", text: "Bill saved successfully." })
      }

      resetForm()
      await loadBills()
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to save bill." })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!confirmBill) return

    try {
      await deleteGeneratedBill(confirmBill._id)
      await loadBills()
      setNotice({ type: "success", text: "Bill deleted successfully." })
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Unable to delete bill." })
    } finally {
      setConfirmBill(null)
    }
  }

  const exportPdf = async (bill = previewBill) => {
    const data = calculateBill(bill)
    const doc = new jsPDF("p", "mm", "a4")
    const qrDataUrl = await loadDataUrl(qrUrl(data.grandTotal, 180))
    const logoDataUrl = await loadDataUrl("/jio-bp.png")

    drawPdfHeader(doc, data, logoDataUrl)
    const totalQuantity = data.items.reduce((sum, item) => sum + numberValue(item.quantity), 0)
    autoTable(doc, {
      startY: 94,
      head: [["#", "Item Name", "Date", "Quantity", "Unit", "Price/ Unit", "Amount"]],
      body: data.items.map((item, index) => [
        index + 1,
        item.product,
        formatInvoiceDate(item.date),
        item.quantity,
        item.unit || "Ltr",
        rupees(item.rate),
        rupees(item.amount),
      ]),
      foot: [["", "Total", "", totalQuantity, "", "", rupees(data.grandTotal)]],
      theme: "plain",
      headStyles: { fillColor: [0, 135, 0], textColor: 255, halign: "center", fontStyle: "bold" },
      footStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold", halign: "center", lineColor: [130, 130, 130], lineWidth: { top: 0.3, bottom: 0.3 } },
      styles: { fontSize: 9, cellPadding: { top: 1.35, right: 1.6, bottom: 1.35, left: 1.6 }, halign: "center", valign: "middle" },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { fontStyle: "bold" },
        2: { fontStyle: "bold" },
        6: { halign: "right" },
      },
    })

    const finalY = doc.lastAutoTable.finalY + 7
    drawPdfTotals(doc, data, finalY, qrDataUrl)
    doc.save(`${data.billNo || "bill"}.pdf`)
  }

  const exportExcel = (bill = previewBill) => {
    const data = calculateBill(bill)
    const rows = [
      ["Aastha Enterprises - Jio-bp Station"],
      [STATION_DETAILS.address],
      [`Phone no.: ${STATION_DETAILS.phone}`, `Email: ${STATION_DETAILS.email}`],
      [`GSTIN: ${STATION_DETAILS.gstin}`, `State: ${STATION_DETAILS.state}`],
      [],
      ["Tax Invoice"],
      ["Bill To", data.customerName || "-", "Contact No.", data.customerPhone || "-"],
      ["Vehicle", data.vehicleNo || "-", "Payment Mode", data.paymentMode || "-"],
      [],
      ["#", "Item Name", "Date", "Quantity", "Unit", "Price/ Unit", "Amount"],
      ...data.items.map((item, index) => [index + 1, item.product, formatInvoiceDate(item.date), item.quantity, item.unit || "Ltr", item.rate, item.amount]),
      [],
      ["Total", "", "", data.items.reduce((sum, item) => sum + numberValue(item.quantity), 0), "", "", data.grandTotal],
      [],
      ["Invoice Amount In Words", numberToWords(data.grandTotal)],
      ["Sub Total", data.subTotal],
      ["Total", data.grandTotal],
      ["Balance", data.grandTotal],
      ["UPI ID", UPI_ID],
      ["UPI QR Link", qrUrl(data.grandTotal, 180)],
      ["Bank Name", STATION_DETAILS.bankName],
      ["Bank Account No.", STATION_DETAILS.accountNo],
      ["Bank IFSC code", STATION_DETAILS.ifsc],
      ["Account Holder's Name", STATION_DETAILS.holder],
      ["Remark", data.remark || "-"],
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    worksheet["!cols"] = [{ wch: 8 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bill")
    XLSX.writeFile(workbook, `${data.billNo || "bill"}.xlsx`)
  }

  const exportImage = async (bill = previewBill) => {
    const data = calculateBill(bill)
    const canvas = document.createElement("canvas")
    const width = 1100
    const rowHeight = 46
    const height = 1080 + data.items.length * rowHeight
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")

    const qrImage = await loadImage(qrUrl(data.grandTotal, 180))
    const logoImage = await loadImage("/jio-bp.png")
    drawImageBill(ctx, data, width, height, rowHeight, qrImage, logoImage)
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, `${data.billNo || "bill"}.png`)
    })
  }

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden p-3 text-[color:var(--text-primary)] sm:p-5">
      <section className="mb-4 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-2 shadow-[0_12px_28px_rgba(16,24,20,0.06)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Receipt size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-[color:var(--text-strong)]">Bill Generator</h1>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">{bills.length} bills</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={resetForm} className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white sm:inline-flex">
            + New Bill
          </button>
        </div>
      </section>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Saved Bills" value={bills.length} tone="blue" />
        <SummaryCard label="Current Entries" value={previewBill.items.length} tone="green" />
        <SummaryCard label="Bill Total" value={money(previewBill.grandTotal)} tone="amber" />
      </div>

      {showForm ? (
        <section className="mb-5 grid gap-5 xl:grid-cols-[1fr_440px]">
          <div className="rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[color:var(--text-strong)]">{editingBill ? "Edit Bill" : "Create Bill"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[var(--border-color)] p-2 sm:hidden">
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <input value={form.billNo} onChange={(event) => updateForm("billNo", event.target.value)} placeholder="Bill No." className="input" />
              <input type="date" value={form.billDate} onChange={(event) => updateForm("billDate", event.target.value)} className="input" />
              <select value={form.paymentMode} onChange={(event) => updateForm("paymentMode", event.target.value)} className="input">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Credit</option>
                <option>Bank</option>
              </select>
              <input value={form.customerName} onChange={(event) => updateForm("customerName", event.target.value)} placeholder="Customer Name" className="input" />
              <input value={form.customerPhone} onChange={(event) => updateForm("customerPhone", event.target.value)} placeholder="Customer Phone" className="input" />
              <input value={form.vehicleNo} onChange={(event) => updateForm("vehicleNo", event.target.value)} placeholder="Vehicle No." className="input" />
            </div>

            <div className="mt-4 space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold text-[color:var(--text-strong)]">Entry #{index + 1}</p>
                    <button type="button" onClick={() => removeItem(index)} className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm text-red-500">
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-5">
                    <input value={item.product} onChange={(event) => updateItem(index, "product", event.target.value)} placeholder="Product" className="input" />
                    <input type="date" value={item.date || form.billDate} onChange={(event) => updateItem(index, "date", event.target.value)} className="input sm:col-span-2" />
                    <input type="text" inputMode="decimal" onWheel={preventNumberWheel} value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} placeholder="Qty" className="input" />
                    <input type="text" inputMode="decimal" onWheel={preventNumberWheel} value={item.rate} onChange={(event) => updateItem(index, "rate", event.target.value)} placeholder="Rate" className="input" />
                  </div>
                  <p className="mt-2 text-right text-sm font-semibold text-emerald-500">
                    Amount: {money(numberValue(item.quantity) * numberValue(item.rate))}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px]">
              <button type="button" onClick={addItem} className="rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 font-semibold text-blue-500">
                <Plus className="mr-2 inline" size={16} /> Add Another Entry
              </button>
              <input type="text" inputMode="decimal" onWheel={preventNumberWheel} value={form.discount} onChange={(event) => updateForm("discount", event.target.value)} placeholder="Discount" className="input" />
            </div>

            <textarea
              value={form.remark}
              onChange={(event) => updateForm("remark", event.target.value)}
              placeholder="Remark"
              rows={2}
              className="input mt-3 min-h-[84px]"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => exportPdf(previewBill)} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-semibold">
                <Download className="mr-2 inline" size={16} /> PDF
              </button>
              <button type="button" onClick={() => exportExcel(previewBill)} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-semibold">
                <FileSpreadsheet className="mr-2 inline" size={16} /> Excel
              </button>
              <button type="button" onClick={() => exportImage(previewBill)} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-semibold">
                <ImageDown className="mr-2 inline" size={16} /> Image
              </button>
              <button type="button" onClick={saveBill} disabled={saving} className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {saving ? "Saving..." : editingBill ? "Update Bill" : "Save Bill"}
              </button>
            </div>
          </div>

          <BillPreview bill={previewBill} />
        </section>
      ) : null}

      <section className="rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[color:var(--text-strong)]">Saved Bills</h2>
            <p className="text-sm text-[color:var(--text-secondary)]">Saved bills stay available until you delete them.</p>
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bill, customer, vehicle" className="input sm:max-w-[360px]" />
        </div>

        <div className="hidden overflow-x-auto rounded-3xl border border-[var(--border-color)] sm:block">
          <table className="table min-w-[980px] text-sm">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Entries</th>
                <th>Total</th>
                <th>Audit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill._id}>
                  <td className="font-semibold">{bill.billNo}</td>
                  <td>{formatDate(bill.billDate)}</td>
                  <td>{bill.customerName || "-"}</td>
                  <td>{bill.items?.length || 0}</td>
                  <td className="font-semibold text-emerald-500">{money(bill.grandTotal)}</td>
                  <td className="text-left text-xs leading-5 text-[color:var(--text-secondary)]">
                    <div>Edited: {formatDateTime(bill.lastEditedAt)}</div>
                    <div>By: {bill.lastEditedBy || "-"} {bill.lastEditedByRole ? `(${bill.lastEditedByRole})` : ""}</div>
                  </td>
                  <td>
                    <BillActions bill={bill} onEdit={editBill} onDelete={setConfirmBill} onPdf={exportPdf} onExcel={exportExcel} onImage={exportImage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 sm:hidden">
          {filteredBills.map((bill) => (
            <div key={bill._id} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[color:var(--text-strong)]">{bill.billNo}</p>
                  <p className="text-sm text-[color:var(--text-secondary)]">{formatDate(bill.billDate)} • {bill.customerName || "No customer"}</p>
                </div>
                <p className="font-bold text-emerald-500">{money(bill.grandTotal)}</p>
              </div>
              <div className="mt-3">
                <BillActions bill={bill} onEdit={editBill} onDelete={setConfirmBill} onPdf={exportPdf} onExcel={exportExcel} onImage={exportImage} compact />
              </div>
            </div>
          ))}
        </div>
      </section>

      {confirmBill ? (
        <ConfirmDialog
          title="Delete Bill"
          description={`Delete ${confirmBill.billNo}? This action cannot be undone.`}
          onCancel={() => setConfirmBill(null)}
          onConfirm={confirmDelete}
        />
      ) : null}

      <MobileActionFab actions={[{ label: "New Bill", className: "bg-blue-600", onClick: resetForm }]} />
    </div>
  )
}

function BillPreview({ bill }) {
  return (
    <div className="rounded-[28px] border border-[var(--border-strong)] bg-white p-5 text-slate-950 shadow-[0_18px_34px_rgba(16,24,20,0.08)]">
      <div className="flex items-start justify-between gap-4 border-b-2 border-green-700 pb-3">
        <div>
          <h3 className="text-2xl font-black">{STATION_DETAILS.name}</h3>
          <p className="mt-1 text-sm">{STATION_DETAILS.address}</p>
          <p className="text-sm">Phone no.: {STATION_DETAILS.phone}</p>
          <p className="text-sm">Email: {STATION_DETAILS.email}</p>
          <p className="text-sm">GSTIN: {STATION_DETAILS.gstin}</p>
          <p className="text-sm">State: {STATION_DETAILS.state}</p>
        </div>
        <img src="/jio-bp.png" alt="Jio bp" className="mt-2 h-16 w-24 object-contain" />
      </div>
      <h3 className="mt-2 text-center text-2xl font-black text-green-700">Tax Invoice</h3>
      <div className="mt-5 text-sm leading-7">
        <p className="font-bold">Bill To</p>
        <p className="font-bold">{bill.customerName || "-"}</p>
        <p>Vehicle No.: {bill.vehicleNo || "-"}</p>
        <p>Contact No.: {bill.customerPhone || "-"}</p>
      </div>
      <div className="mt-5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Item Name</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-center">Unit</th>
              <th className="p-2 text-right">Rate</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{item.product || "-"}</td>
                <td className="p-2 font-semibold">{formatInvoiceDate(item.date)}</td>
                <td className="p-2 text-right">{item.quantity || 0}</td>
                <td className="p-2 text-center">{item.unit || "Ltr"}</td>
                <td className="p-2 text-right">{rupees(item.rate)}</td>
                <td className="p-2 text-right font-semibold">{rupees(item.amount)}</td>
              </tr>
            ))}
            <tr className="border-y-2 border-slate-400 font-bold">
              <td className="p-2" />
              <td className="p-2">Total</td>
              <td />
              <td className="p-2 text-right">{bill.items.reduce((sum, item) => sum + numberValue(item.quantity), 0)}</td>
              <td />
              <td />
              <td className="p-2 text-right">{rupees(bill.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
        <div>
          <p className="font-bold">Invoice Amount In Words</p>
          <p className="mt-2">{numberToWords(bill.grandTotal)}</p>
          <p className="mt-5 font-bold">Terms And Conditions</p>
          <p className="mt-2">Thank you for doing business with us.</p>
        </div>
        <div className="space-y-2">
          <TotalLine label="Sub Total" value={rupees(bill.subTotal)} />
          <div className="bg-green-700 px-2 py-1 text-white">
            <TotalLine label="Total" value={rupees(bill.grandTotal)} strong />
          </div>
          <TotalLine label="Balance" value={rupees(bill.grandTotal)} />
          <TotalLine label="Payment Mode" value={bill.paymentMode || "Credit"} />
          <TotalLine label="Current Balance" value={rupees(bill.grandTotal)} />
        </div>
      </div>
      <div className="mt-8 grid gap-5 text-sm sm:grid-cols-2">
        <div className="flex gap-3">
          <img src={qrUrl(bill.grandTotal, 140)} alt="UPI QR" className="h-28 w-28" />
          <div>
            <p className="font-bold">Pay To:</p>
            <p>Bank Name: {STATION_DETAILS.bankName}</p>
            <p>Bank Account No.: {STATION_DETAILS.accountNo}</p>
            <p>Bank IFSC code: {STATION_DETAILS.ifsc}</p>
            <p>Account Holder's Name: {STATION_DETAILS.holder}</p>
            <p>UPI ID: {UPI_ID}</p>
          </div>
        </div>
        <div className="text-center">
          <p>For: {STATION_DETAILS.name}</p>
          <div className="mx-auto mt-7 h-16 w-44 border border-slate-200 bg-slate-50 p-2 text-xs font-semibold italic">AASTHA ENTERPRISES<br />PARTNERS</div>
          <p className="mt-2 font-bold">Authorized Signatory</p>
        </div>
      </div>
    </div>
  )
}

function BillActions({ bill, onEdit, onDelete, onPdf, onExcel, onImage, compact = false }) {
  const buttonClass = compact ? "rounded-xl px-3 py-2 text-xs" : "rounded-xl px-3 py-2 text-sm"

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button type="button" onClick={() => onPdf(bill)} className={`${buttonClass} border border-[var(--border-color)] bg-[var(--bg-soft)]`}>
        PDF
      </button>
      <button type="button" onClick={() => onExcel(bill)} className={`${buttonClass} border border-[var(--border-color)] bg-[var(--bg-soft)]`}>
        Excel
      </button>
      <button type="button" onClick={() => onImage(bill)} className={`${buttonClass} border border-[var(--border-color)] bg-[var(--bg-soft)]`}>
        Image
      </button>
      <button type="button" onClick={() => onEdit(bill)} className={`${buttonClass} border border-blue-500/20 bg-blue-500/10 text-blue-500`}>
        <Pencil size={14} className="inline" /> Edit
      </button>
      <button type="button" onClick={() => onDelete(bill)} className={`${buttonClass} border border-red-500/20 bg-red-500/10 text-red-500`}>
        <Trash2 size={14} className="inline" /> Delete
      </button>
    </div>
  )
}

function drawPdfHeader(doc, data, logoDataUrl) {
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text(STATION_DETAILS.name, 14, 14)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.6)
  doc.text("Jiobp Petrol Pump | Jaora Ujjain Bypass Road, Lalakheda", 14, 21)
  doc.text("Funta, Jaora", 14, 26)
  doc.text(`Phone no.: ${STATION_DETAILS.phone}`, 14, 31)
  doc.text(`Email: ${STATION_DETAILS.email}`, 14, 36)
  doc.text(`GSTIN: ${STATION_DETAILS.gstin}`, 14, 41)
  doc.text(`State: ${STATION_DETAILS.state}`, 14, 46)
  if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", 164, 24, 28, 18)
  doc.setDrawColor(0, 135, 0)
  doc.setLineWidth(0.5)
  doc.line(12, 50, 198, 50)
  doc.setTextColor(0, 135, 0)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("Tax Invoice", 105, 56, { align: "center" })
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9.2)
  doc.text("Bill To", 14, 64)
  doc.text(data.customerName || "-", 14, 71)
  doc.setFont("helvetica", "normal")
  doc.text(`Vehicle No.: ${data.vehicleNo || "-"}`, 14, 78)
  doc.text(`Contact No.: ${data.customerPhone || "-"}`, 14, 84)
}

function drawPdfTotals(doc, data, y, qrDataUrl) {
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setDrawColor(130, 130, 130)
  doc.line(14, y, 196, y)

  doc.text("Invoice Amount In Words", 14, y + 8)
  doc.setFont("helvetica", "normal")
  doc.text(numberToWords(data.grandTotal), 14, y + 15, { maxWidth: 86 })
  doc.setFont("helvetica", "bold")
  doc.text("Terms And Conditions", 14, y + 31)
  doc.setFont("helvetica", "normal")
  doc.text("Thank you for doing business with us.", 14, y + 38)

  const totalsX = 110
  let totalLineY = y + 8
  doc.text("Sub Total", totalsX, totalLineY)
  doc.text(rupees(data.subTotal), 194, totalLineY, { align: "right" })
  if (numberValue(data.discount) > 0) {
    totalLineY += 7
    doc.setFont("helvetica", "normal")
    doc.text("Discount", totalsX, totalLineY)
    doc.text(rupees(data.discount), 194, totalLineY, { align: "right" })
    doc.setFont("helvetica", "bold")
  }
  doc.setFillColor(0, 135, 0)
  doc.rect(totalsX - 1, totalLineY + 4, 86, 6.5, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("Total", totalsX, totalLineY + 8.8)
  doc.text(rupees(data.grandTotal), 194, totalLineY + 8.8, { align: "right" })
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  ;[
    ["Balance", rupees(data.grandTotal)],
    ["Payment Mode", data.paymentMode || "Credit"],
    ["Current Balance", rupees(data.grandTotal)],
  ].forEach(([label, value], index) => {
    const lineY = totalLineY + 17 + index * 7
    doc.text(label, totalsX, lineY)
    doc.text(value, 194, lineY, { align: "right" })
  })
  doc.line(totalsX - 1, totalLineY + 42, 196, totalLineY + 42)

  const payY = Math.min(totalLineY + 58, 238)
  if (qrDataUrl) doc.addImage(qrDataUrl, "PNG", 14, payY, 23, 23)
  doc.setFont("helvetica", "bold")
  doc.text("Pay To:", 42, payY + 4)
  doc.setFont("helvetica", "normal")
  doc.text(`Bank Name: ${STATION_DETAILS.bankName}`, 42, payY + 11)
  doc.text(`Bank Account No.: ${STATION_DETAILS.accountNo}`, 42, payY + 18)
  doc.text(`Bank IFSC code: ${STATION_DETAILS.ifsc}`, 42, payY + 25)
  doc.text(`Account Holder's Name: ${STATION_DETAILS.holder}`, 42, payY + 32)
  doc.text(`UPI ID: ${UPI_ID}`, 42, payY + 39)
  doc.text(`For: ${STATION_DETAILS.name}`, 135, payY + 6)
  doc.rect(133, payY + 12, 43, 14)
  doc.setFont("helvetica", "bolditalic")
  doc.setFontSize(9)
  doc.text("AASTHA ENTERPRISES", 154.5, payY + 20, { align: "center" })
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Authorized Signatory", 154.5, payY + 33, { align: "center" })
}

function drawImageBill(ctx, data, width, height, rowHeight, qrImage, logoImage) {
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "#111827"
  ctx.textAlign = "left"
  ctx.font = "bold 26px Arial"
  ctx.fillText(STATION_DETAILS.name, 50, 70)
  ctx.font = "16px Arial"
  ctx.fillText("Jiobp Petrol Pump | Jaora Ujjain Bypass Road, Lalakheda", 50, 98)
  ctx.fillText("Funta, Jaora", 50, 118)
  ctx.fillText(`Phone no.: ${STATION_DETAILS.phone}`, 50, 140)
  ctx.fillText(`Email: ${STATION_DETAILS.email}`, 50, 162)
  ctx.fillText(`GSTIN: ${STATION_DETAILS.gstin}`, 50, 184)
  ctx.fillText(`State: ${STATION_DETAILS.state}`, 50, 206)
  if (logoImage) ctx.drawImage(logoImage, 885, 116, 120, 75)
  ctx.strokeStyle = "#008700"
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(40, 228)
  ctx.lineTo(1030, 228)
  ctx.stroke()
  ctx.fillStyle = "#008700"
  ctx.textAlign = "center"
  ctx.font = "bold 30px Arial"
  ctx.fillText("Tax Invoice", width / 2, 260)
  ctx.textAlign = "left"
  ctx.fillStyle = "#111827"
  ctx.font = "bold 18px Arial"
  ctx.fillText("Bill To", 48, 310)
  ctx.fillText(data.customerName || "-", 48, 340)
  ctx.font = "18px Arial"
  ctx.fillText(`Vehicle No.: ${data.vehicleNo || "-"}`, 48, 370)
  ctx.fillText(`Contact No.: ${data.customerPhone || "-"}`, 48, 400)
  ctx.strokeStyle = "#d1d5db"
  ctx.strokeRect(40, 430, 990, rowHeight)
  ctx.fillStyle = "#008700"
  ctx.fillRect(40, 430, 990, rowHeight)
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 18px Arial"
  ;["#", "Item Name", "Date", "Quantity", "Unit", "Price/ Unit", "Amount"].forEach((label, index) => {
    ctx.fillText(label, [50, 105, 300, 520, 690, 790, 940][index], 460)
  })
  ctx.fillStyle = "#111827"
  data.items.forEach((item, index) => {
    const y = 430 + rowHeight * (index + 1)
    ctx.strokeRect(40, y, 990, rowHeight)
    ctx.font = "18px Arial"
    ctx.fillText(String(index + 1), 50, y + 28)
    ctx.font = "bold 18px Arial"
    ctx.fillText(item.product || "-", 105, y + 28)
    ctx.fillText(formatInvoiceDate(item.date), 300, y + 28)
    ctx.font = "18px Arial"
    ctx.fillText(String(item.quantity || 0), 550, y + 28)
    ctx.fillText(item.unit || "Ltr", 700, y + 28)
    ctx.fillText(rupees(item.rate), 790, y + 28)
    ctx.fillText(rupees(item.amount), 940, y + 28)
  })
  const totalY = 430 + rowHeight * (data.items.length + 1)
  ctx.strokeStyle = "#777777"
  ctx.lineWidth = 2
  ctx.strokeRect(40, totalY, 990, rowHeight)
  ctx.font = "bold 18px Arial"
  ctx.fillText("Total", 105, totalY + 28)
  ctx.fillText(String(data.items.reduce((sum, item) => sum + numberValue(item.quantity), 0)), 550, totalY + 28)
  ctx.textAlign = "right"
  ctx.fillText(rupees(data.grandTotal), 1025, totalY + 28)
  ctx.textAlign = "left"
  const footerY = totalY + 60
  ctx.strokeStyle = "#777777"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(40, footerY)
  ctx.lineTo(1030, footerY)
  ctx.stroke()
  ctx.font = "bold 19px Arial"
  ctx.fillText("Invoice Amount In Words", 48, footerY + 34)
  ctx.font = "18px Arial"
  wrapCanvasText(ctx, numberToWords(data.grandTotal), 48, footerY + 62, 420, 22)
  ctx.font = "bold 19px Arial"
  ctx.fillText("Terms And Conditions", 48, footerY + 112)
  ctx.font = "18px Arial"
  ctx.fillText("Thank you for doing business with us.", 48, footerY + 140)
  drawCanvasTotal(ctx, "Sub Total", rupees(data.subTotal), 575, footerY + 34)
  ctx.fillStyle = "#008700"
  ctx.fillRect(570, footerY + 48, 460, 28)
  ctx.fillStyle = "#ffffff"
  drawCanvasTotal(ctx, "Total", rupees(data.grandTotal), 575, footerY + 68)
  ctx.fillStyle = "#111827"
  ;[
    ["Balance", rupees(data.grandTotal)],
    ["Payment Mode", data.paymentMode || "Credit"],
    ["Current Balance", rupees(data.grandTotal)],
  ].forEach(([label, value], index) => drawCanvasTotal(ctx, label, value, 575, footerY + 98 + index * 26))
  const payY = footerY + 210
  if (qrImage) ctx.drawImage(qrImage, 48, payY, 105, 105)
  ctx.font = "bold 18px Arial"
  ctx.fillText("Pay To:", 175, payY + 18)
  ctx.font = "16px Arial"
  ctx.fillText(`Bank Name: ${STATION_DETAILS.bankName}`, 175, payY + 46)
  ctx.fillText(`Bank Account No.: ${STATION_DETAILS.accountNo}`, 175, payY + 72)
  ctx.fillText(`Bank IFSC code: ${STATION_DETAILS.ifsc}`, 175, payY + 98)
  ctx.fillText(`Account Holder's Name: ${STATION_DETAILS.holder}`, 175, payY + 124)
  ctx.fillText(`UPI ID: ${UPI_ID}`, 175, payY + 150)
  ctx.fillText(`For: ${STATION_DETAILS.name}`, 735, payY + 20)
  ctx.strokeRect(700, payY + 45, 180, 70)
  ctx.font = "bold italic 16px Arial"
  ctx.fillText("AASTHA ENTERPRISES", 715, payY + 82)
  ctx.font = "bold 18px Arial"
  ctx.fillText("Authorized Signatory", 710, payY + 140)
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(" ")
  let line = ""
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y)
      line = word
      y += lineHeight
    } else {
      line = test
    }
  })
  if (line) ctx.fillText(line, x, y)
}

function drawCanvasTotal(ctx, label, value, x, y) {
  ctx.font = "18px Arial"
  ctx.fillText(label, x, y)
  ctx.textAlign = "right"
  ctx.fillText(value, 1025, y)
  ctx.textAlign = "left"
}

function TotalLine({ label, value, strong = false }) {
  return (
    <div className={`flex justify-between ${strong ? "text-lg font-black text-emerald-600" : "font-semibold"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-600",
    green: "border-green-200 bg-green-50 text-green-600",
    amber: "border-amber-200 bg-amber-50 text-amber-600",
    rose: "border-rose-200 bg-rose-50 text-rose-600",
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_12px_24px_rgba(16,24,20,0.05)] ${tones[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  )
}

function InlineNotice({ notice }) {
  return (
    <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${notice.type === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"}`}>
      {notice.text}
    </div>
  )
}

function ConfirmDialog({ title, description, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
        <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2 text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
