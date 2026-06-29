import { Download, FileSpreadsheet, ImageDown, Pencil, Plus, Trash2, X } from "lucide-react"
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
const numberValue = (value) => Number(value || 0)

const blankItem = () => ({
  product: "Diesel",
  description: "",
  quantity: "",
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

  const addItem = () => setForm((current) => ({ ...current, items: [...current.items, blankItem()] }))

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
    const readyItems = previewBill.items.filter((item) => item.product && item.quantity && item.rate)

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

  const exportPdf = (bill = previewBill) => {
    const data = calculateBill(bill)
    const doc = new jsPDF("p", "mm", "a4")

    drawPdfHeader(doc, data)
    autoTable(doc, {
      startY: 74,
      head: [["No.", "Product", "Description", "Qty", "Rate", "Amount"]],
      body: data.items.map((item, index) => [
        index + 1,
        item.product,
        item.description || "-",
        item.quantity,
        money(item.rate),
        money(item.amount),
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 43, 99], textColor: 255, halign: "center" },
      styles: { fontSize: 9, cellPadding: 2.4 },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    })

    const finalY = doc.lastAutoTable.finalY + 8
    drawPdfTotals(doc, data, finalY)
    doc.save(`${data.billNo || "bill"}.pdf`)
  }

  const exportExcel = (bill = previewBill) => {
    const data = calculateBill(bill)
    const rows = [
      ["Aastha Enterprises - Jio-bp Station"],
      ["Bill No.", data.billNo, "Date", data.billDate],
      ["Customer", data.customerName || "-", "Phone", data.customerPhone || "-"],
      ["Vehicle", data.vehicleNo || "-", "Payment", data.paymentMode || "-"],
      [],
      ["No.", "Product", "Description", "Qty", "Rate", "Amount"],
      ...data.items.map((item, index) => [index + 1, item.product, item.description, item.quantity, item.rate, item.amount]),
      [],
      ["", "", "", "", "Sub Total", data.subTotal],
      ["", "", "", "", "Discount", data.discount],
      ["", "", "", "", "Grand Total", data.grandTotal],
      ["Remark", data.remark || "-"],
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    worksheet["!cols"] = [{ wch: 8 }, { wch: 18 }, { wch: 28 }, { wch: 10 }, { wch: 14 }, { wch: 14 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bill")
    XLSX.writeFile(workbook, `${data.billNo || "bill"}.xlsx`)
  }

  const exportImage = (bill = previewBill) => {
    const data = calculateBill(bill)
    const canvas = document.createElement("canvas")
    const width = 1100
    const rowHeight = 46
    const height = 440 + data.items.length * rowHeight
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")

    drawImageBill(ctx, data, width, height, rowHeight)
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, `${data.billNo || "bill"}.png`)
    })
  }

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden p-3 text-[color:var(--text-primary)] sm:p-5">
      <section className="mb-4 rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_18px_34px_rgba(16,24,20,0.07)]">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-emerald-500">Admin Billing Desk</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Bill Generator</h1>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              Create single or multiple-entry bills and export them as PDF, Excel, or image. Saved bills are kept for the last 10 days only.
            </p>
          </div>
          <button type="button" onClick={resetForm} className="hidden rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white sm:inline-flex">
            + New Bill
          </button>
        </div>
      </section>

      {notice.text ? <InlineNotice notice={notice} /> : null}

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard label="Saved Bills" value={bills.length} tone="blue" />
        <SummaryCard label="Current Entries" value={previewBill.items.length} tone="green" />
        <SummaryCard label="Bill Total" value={money(previewBill.grandTotal)} tone="amber" />
        <SummaryCard label="Auto Delete" value="10 Days" tone="rose" />
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
                    <input value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} placeholder="Description" className="input sm:col-span-2" />
                    <input type="number" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} placeholder="Qty" className="input" />
                    <input type="number" value={item.rate} onChange={(event) => updateItem(index, "rate", event.target.value)} placeholder="Rate" className="input" />
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
              <input type="number" value={form.discount} onChange={(event) => updateForm("discount", event.target.value)} placeholder="Discount" className="input" />
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
            <p className="text-sm text-[color:var(--text-secondary)]">Only last 10 days records stay in backend.</p>
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
      <div className="border-b-4 border-[#0b2b63] pb-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-emerald-600">Aastha Enterprises</p>
        <h3 className="text-2xl font-black">Jio-bp Station</h3>
        <p className="text-sm text-slate-500">Fuel Management System</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Info label="Bill No." value={bill.billNo} />
        <Info label="Date" value={formatDate(bill.billDate)} />
        <Info label="Customer" value={bill.customerName || "-"} />
        <Info label="Phone" value={bill.customerPhone || "-"} />
        <Info label="Vehicle" value={bill.vehicleNo || "-"} />
        <Info label="Payment" value={bill.paymentMode || "-"} />
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-[#0b2b63] text-white">
            <tr>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Rate</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="p-2">{item.product || "-"}</td>
                <td className="p-2 text-right">{item.quantity || 0}</td>
                <td className="p-2 text-right">{money(item.rate)}</td>
                <td className="p-2 text-right font-semibold">{money(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
        <TotalLine label="Sub Total" value={money(bill.subTotal)} />
        <TotalLine label="Discount" value={money(bill.discount)} />
        <TotalLine label="Grand Total" value={money(bill.grandTotal)} strong />
      </div>
      <p className="mt-4 text-xs text-slate-500">Remark: {bill.remark || "-"}</p>
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

function drawPdfHeader(doc, data) {
  doc.setFillColor(11, 43, 99)
  doc.rect(0, 0, 210, 22, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text("Aastha Enterprises", 105, 10, { align: "center" })
  doc.setFontSize(10)
  doc.text("Jio-bp Station • Fuel Management System", 105, 17, { align: "center" })
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.text("TAX / FUEL BILL", 105, 33, { align: "center" })
  doc.setFontSize(10)
  doc.text(`Bill No: ${data.billNo}`, 14, 45)
  doc.text(`Date: ${formatDate(data.billDate)}`, 145, 45)
  doc.text(`Customer: ${data.customerName || "-"}`, 14, 53)
  doc.text(`Phone: ${data.customerPhone || "-"}`, 145, 53)
  doc.text(`Vehicle: ${data.vehicleNo || "-"}`, 14, 61)
  doc.text(`Payment: ${data.paymentMode || "-"}`, 145, 61)
}

function drawPdfTotals(doc, data, y) {
  doc.setFontSize(10)
  doc.text(`Remark: ${data.remark || "-"}`, 14, y)
  doc.text(`Sub Total: ${money(data.subTotal)}`, 145, y)
  doc.text(`Discount: ${money(data.discount)}`, 145, y + 8)
  doc.setFontSize(13)
  doc.text(`Grand Total: ${money(data.grandTotal)}`, 145, y + 18)
  doc.setFontSize(9)
  doc.text("Authorized Signature", 150, 282)
  doc.line(145, 275, 195, 275)
}

function drawImageBill(ctx, data, width, height, rowHeight) {
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "#0b2b63"
  ctx.fillRect(0, 0, width, 120)
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 34px Arial"
  ctx.textAlign = "center"
  ctx.fillText("Aastha Enterprises", width / 2, 48)
  ctx.font = "20px Arial"
  ctx.fillText("Jio-bp Station • Fuel Management System", width / 2, 82)
  ctx.fillStyle = "#111827"
  ctx.font = "bold 28px Arial"
  ctx.fillText("TAX / FUEL BILL", width / 2, 160)
  ctx.textAlign = "left"
  ctx.font = "20px Arial"
  ctx.fillText(`Bill No: ${data.billNo}`, 60, 205)
  ctx.fillText(`Date: ${formatDate(data.billDate)}`, 760, 205)
  ctx.fillText(`Customer: ${data.customerName || "-"}`, 60, 240)
  ctx.fillText(`Phone: ${data.customerPhone || "-"}`, 760, 240)
  ctx.fillText(`Vehicle: ${data.vehicleNo || "-"}`, 60, 275)
  ctx.fillText(`Payment: ${data.paymentMode || "-"}`, 760, 275)
  ctx.strokeStyle = "#d1d5db"
  ctx.strokeRect(50, 310, 1000, rowHeight)
  ctx.fillStyle = "#0b2b63"
  ctx.fillRect(50, 310, 1000, rowHeight)
  ctx.fillStyle = "#ffffff"
  ;["No.", "Product", "Description", "Qty", "Rate", "Amount"].forEach((label, index) => {
    ctx.fillText(label, [70, 135, 310, 620, 745, 895][index], 340)
  })
  ctx.fillStyle = "#111827"
  data.items.forEach((item, index) => {
    const y = 310 + rowHeight * (index + 1)
    ctx.strokeRect(50, y, 1000, rowHeight)
    ctx.fillText(String(index + 1), 70, y + 30)
    ctx.fillText(item.product || "-", 135, y + 30)
    ctx.fillText(item.description || "-", 310, y + 30)
    ctx.fillText(String(item.quantity || 0), 620, y + 30)
    ctx.fillText(money(item.rate), 745, y + 30)
    ctx.fillText(money(item.amount), 895, y + 30)
  })
  const footerY = 330 + rowHeight * (data.items.length + 1)
  ctx.font = "bold 22px Arial"
  ctx.fillText(`Sub Total: ${money(data.subTotal)}`, 720, footerY)
  ctx.fillText(`Discount: ${money(data.discount)}`, 720, footerY + 38)
  ctx.fillStyle = "#059669"
  ctx.fillText(`Grand Total: ${money(data.grandTotal)}`, 720, footerY + 82)
  ctx.fillStyle = "#111827"
  ctx.font = "18px Arial"
  ctx.fillText(`Remark: ${data.remark || "-"}`, 60, footerY)
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
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
