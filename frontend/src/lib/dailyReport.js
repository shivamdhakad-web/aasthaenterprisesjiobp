import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export const TOTALISER_LABELS = [
  "HSD - (Nozzle - No. 1)",
  "MS - (Nozzle - No. 2)",
  "HSD - (Nozzle - No. 3)",
  "MS - (Nozzle - No. 4)",
  "HSD - (Nozzle - No. 5)",
  "MS - (Nozzle - No. 6)",
  "HSD - (Nozzle - No. 7)",
  "MS - (Nozzle - No. 8)",
  "Lubes - 2",
  "Lubes - 3",
  "Lubes - 4",
  "Lubes - 5",
  "Others",
]

export const DENOMINATION_VALUES = [
  { label: "500", value: 500 },
  { label: "200", value: 200 },
  { label: "100", value: 100 },
  { label: "50", value: 50 },
  { label: "20", value: 20 },
  { label: "10", value: 10 },
  { label: "COIN", value: 1 },
]

const toNumber = (value) => Number(value || 0)

export const formatDailyReportDate = (value) => {
  if (!value) {
    return "-"
  }

  if (typeof value === "string") {
    const matched = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (matched) {
      return `${matched[3]}-${matched[2]}-${matched[1]}`
    }
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat("en-GB").format(date).replace(/\//g, "-")
}

const makeCreditRows = (count) =>
  Array.from({ length: count }, () => ({
    label: "",
    value: "",
    details: "",
  }))

export const createDailyReportForm = (employeeName = "") => ({
  employeeName,
  reportDate: new Date().toISOString().slice(0, 10),
  location: "JAORA EXPRESSWAY",
  shift: "",
  manualTotalEnabled: false,
  manualTotalSales: "",
  lube: "",
  totaliserRows: TOTALISER_LABELS.map((label) => ({
    label,
    closing: "",
    opening: "",
    pumpTest: "",
    ownUse: "",
    rate: "",
  })),
  cashDrops: ["", "", "", "", ""],
  cashStart: "",
  online: {
    upiNo: "",
    upiAmt: "",
    cardNo: "",
    cardAmt: "",
  },
  fleet: {
    count: "",
    amount: "",
  },
  creditCustomers: makeCreditRows(10),
  hht: {
    creditCard: "",
    fleet: "",
    other: "",
  },
  denominations: DENOMINATION_VALUES.map((item) => ({
    ...item,
    qty: "",
  })),
  creditList: makeCreditRows(12),
  signatures: {
    systemLogin: "",
    shiftSupervisor: "",
  },
})

export const hydrateDailyReport = (report = {}) => ({
  ...createDailyReportForm(report.employeeName || ""),
  ...report,
  reportDate: report.reportDate ? new Date(report.reportDate).toISOString().slice(0, 10) : createDailyReportForm().reportDate,
  cashDrops: report.cashDrops?.length ? report.cashDrops.map((value) => String(value ?? "")) : createDailyReportForm().cashDrops,
  totaliserRows:
    report.totaliserRows?.length
      ? report.totaliserRows.map((row) => ({
          label: row.label,
          closing: row.closing ?? "",
          opening: row.opening ?? "",
          pumpTest: row.pumpTest ?? "",
          ownUse: row.ownUse ?? "",
          rate: row.rate ?? "",
        }))
      : createDailyReportForm().totaliserRows,
  online: {
    upiNo: report.online?.upiNo ?? "",
    upiAmt: report.online?.upiAmt ?? "",
    cardNo: report.online?.cardNo ?? "",
    cardAmt: report.online?.cardAmt ?? "",
  },
  fleet: {
    count: report.fleet?.count ?? "",
    amount: report.fleet?.amount ?? "",
  },
  creditCustomers:
    report.creditCustomers?.length
      ? report.creditCustomers.map((item) => ({
          label: item.label || "",
          value: item.value ?? "",
          details: item.details || "",
        }))
      : createDailyReportForm().creditCustomers,
  hht: {
    creditCard: report.hht?.creditCard ?? "",
    fleet: report.hht?.fleet ?? "",
    other: report.hht?.other ?? "",
  },
  denominations:
    report.denominations?.length
      ? report.denominations.map((item, index) => ({
          label: item.label || DENOMINATION_VALUES[index]?.label || "",
          value: item.value ?? DENOMINATION_VALUES[index]?.value ?? 0,
          qty: item.qty ?? "",
        }))
      : createDailyReportForm().denominations,
  creditList:
    report.creditList?.length
      ? report.creditList.map((item) => ({
          label: item.label || "",
          value: item.value ?? "",
          details: item.details || "",
        }))
      : createDailyReportForm().creditList,
  signatures: {
    systemLogin: report.signatures?.systemLogin || "",
    shiftSupervisor: report.signatures?.shiftSupervisor || "",
  },
})

export const calculateDailyReport = (form) => {
  const totaliserRows = (form.totaliserRows || []).map((row) => {
    const closing = toNumber(row.closing)
    const opening = toNumber(row.opening)
    const dispensed = closing - opening
    const pumpTest = toNumber(row.pumpTest)
    const ownUse = toNumber(row.ownUse)
    const netDispensed = Math.max(0, dispensed - pumpTest - ownUse)
    const rate = toNumber(row.rate)
    const amount = netDispensed * rate

    return {
      ...row,
      closing,
      opening,
      dispensed,
      pumpTest,
      ownUse,
      netDispensed,
      rate,
      amount,
    }
  })

  const grandAmount = totaliserRows.reduce((sum, row) => sum + row.amount, 0)
  const totalSales = form.manualTotalEnabled ? toNumber(form.manualTotalSales) : grandAmount

  const cashTotal = (form.cashDrops || []).reduce((sum, value) => sum + toNumber(value), 0)
  const cashNet = cashTotal - toNumber(form.cashStart)

  const onlineTotal = toNumber(form.online?.upiAmt) + toNumber(form.online?.cardAmt)
  const fleetAmount = toNumber(form.fleet?.amount)
  const creditTotal = (form.creditCustomers || []).reduce((sum, item) => sum + toNumber(item.value), 0)
  const totalCollection = cashNet + onlineTotal + fleetAmount + creditTotal

  const hhtTotal =
    toNumber(form.hht?.creditCard) + toNumber(form.hht?.fleet) + toNumber(form.hht?.other)

  const denominations = (form.denominations || []).map((item) => ({
    ...item,
    qty: toNumber(item.qty),
    total: toNumber(item.qty) * toNumber(item.value),
  }))

  const denominationTotal = denominations.reduce((sum, item) => sum + item.total, 0)

  return {
    totaliserRows,
    cashTotal,
    cashNet,
    onlineTotal,
    fleetAmount,
    creditTotal,
    totalCollection,
    totalSales,
    grandAmount,
    hhtTotal,
    shortOver: totalCollection - totalSales,
    difference: hhtTotal - totalSales,
    denominations,
    denominationTotal,
    summaryTotal: denominationTotal + onlineTotal + fleetAmount + creditTotal,
  }
}

export const toDailyReportPayload = (form, employeeName) => {
  const calculated = calculateDailyReport(form)

  return {
    employeeName: employeeName || form.employeeName || "",
    reportDate: form.reportDate,
    location: form.location,
    shift: form.shift,
    manualTotalEnabled: form.manualTotalEnabled,
    manualTotalSales: toNumber(form.manualTotalSales),
    lube: form.lube,
    totaliserRows: calculated.totaliserRows,
    cashDrops: (form.cashDrops || []).map((value) => toNumber(value)),
    online: {
      upiNo: toNumber(form.online?.upiNo),
      upiAmt: toNumber(form.online?.upiAmt),
      cardNo: toNumber(form.online?.cardNo),
      cardAmt: toNumber(form.online?.cardAmt),
    },
    fleet: {
      count: toNumber(form.fleet?.count),
      amount: calculated.fleetAmount,
    },
    creditCustomers: (form.creditCustomers || [])
      .filter((item) => item.label || toNumber(item.value))
      .map((item) => ({
        label: item.label || "",
        value: toNumber(item.value),
        details: item.details || "",
      })),
    hht: {
      creditCard: toNumber(form.hht?.creditCard),
      fleet: toNumber(form.hht?.fleet),
      other: toNumber(form.hht?.other),
    },
    denominations: calculated.denominations,
    creditList: (form.creditList || [])
      .filter((item) => item.label || item.details)
      .map((item) => ({
        label: item.label || "",
        details: item.details || "",
        value: toNumber(item.value),
      })),
    signatures: {
      systemLogin: form.signatures?.systemLogin || "",
      shiftSupervisor: form.signatures?.shiftSupervisor || "",
    },
    totals: {
      grandAmount: calculated.grandAmount,
      cashTotal: calculated.cashTotal,
      cashNet: calculated.cashNet,
      onlineTotal: calculated.onlineTotal,
      fleetAmount: calculated.fleetAmount,
      creditTotal: calculated.creditTotal,
      totalCollection: calculated.totalCollection,
      shortOver: calculated.shortOver,
      hhtTotal: calculated.hhtTotal,
      difference: calculated.difference,
      denominationTotal: calculated.denominationTotal,
      summaryTotal: calculated.summaryTotal,
    },
  }
}

export const exportDailyReportPdf = (report, employeeName = "Employee") => {
  const hydratedReport = hydrateDailyReport(report)
  const calculated = calculateDailyReport(hydratedReport)
  const fixedCreditCustomers = Array.from({ length: 10 }, (_, index) => ({
    label: hydratedReport.creditCustomers?.[index]?.label || "",
    value: hydratedReport.creditCustomers?.[index]?.value ?? "",
  }))
  const fixedCreditList = Array.from({ length: 12 }, (_, index) => ({
    label: hydratedReport.creditList?.[index]?.label || "",
    details: hydratedReport.creditList?.[index]?.details || "",
  }))

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 7
  const contentWidth = pageWidth - margin * 2

  const baseTableStyles = {
    theme: "grid",
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: {
      fontSize: 4.6,
      cellPadding: 0.4,
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      textColor: [0, 0, 0],
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
    },
  }

  const drawSectionBar = (title, y) => {
    doc.setDrawColor(0, 0, 0)
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, y, contentWidth, 5, "FD")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.1)
    doc.setTextColor(0, 0, 0)
    doc.text(title, margin + 1.8, y + 3.45)
    return y + 5
  }

  const drawMetaField = (label, value, x, y, width) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(5.4)
    doc.setTextColor(0, 0, 0)
    doc.text(`${label}:`, x, y)
    doc.rect(x + 15, y - 3.6, width - 15, 5.2)
    doc.text(String(value || ""), x + 17, y)
  }

  const renderGridTable = (y, head, body, options = {}) => {
    autoTable(doc, {
      ...baseTableStyles,
      startY: y,
      head: [head],
      body,
      ...options,
    })
    return doc.lastAutoTable.finalY
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(0, 0, 0)
  doc.text("Fuel Forecourt Operations - DSM Shift Check Sheet", pageWidth / 2, 9, {
    align: "center",
  })

  drawMetaField("DSM Name", employeeName, margin, 15, 56)
  drawMetaField("Date", formatDailyReportDate(hydratedReport.reportDate), 65, 15, 34)
  drawMetaField("R.O. Location", hydratedReport.location || "JAORA EXPRESSWAY", 102, 15, 64)
  drawMetaField("Shift", hydratedReport.shift || "", 170, 15, 33)

  let cursor = 19

  cursor = drawSectionBar("(A) Totaliser Reading", cursor)
  cursor = renderGridTable(
    cursor,
    [
      "Totaliser\nReadings",
      "Closing\nreading",
      "Opening\nreading",
      "Dispensed\nQty.",
      "Pump\nTest",
      "Own\nUse",
      "Net\nDispensed",
      "Rate",
      "Amount",
    ],
    calculated.totaliserRows.map((row) => [
      row.label,
      row.closing.toFixed(2),
      row.opening.toFixed(2),
      row.dispensed.toFixed(2),
      row.pumpTest.toFixed(2),
      row.ownUse.toFixed(2),
      row.netDispensed.toFixed(2),
      row.rate.toFixed(2),
      row.amount.toFixed(2),
    ]),
    {
      columnStyles: {
        0: { cellWidth: 23 },
        1: { cellWidth: 18 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 14 },
        5: { cellWidth: 14 },
        6: { cellWidth: 18 },
        7: { cellWidth: 14 },
        8: { cellWidth: 16 },
      },
    },
  )

  doc.setFont("helvetica", "normal")
  doc.setFontSize(5)
  doc.text(
    `Manual Total Enabled: ${hydratedReport.manualTotalEnabled ? "Yes" : "No"}   Manual Total Sales (Rs.): ${toNumber(hydratedReport.manualTotalSales).toFixed(2)}   Grand Amount: ${calculated.grandAmount.toFixed(2)}`,
    margin + 1,
    cursor + 3.4,
  )
  cursor += 6

  cursor = drawSectionBar("(B) Cash Collection", cursor)
  cursor = renderGridTable(
    cursor,
    [
      "Particulars",
      "1st Drop",
      "2nd Drop",
      "3rd Drop",
      "4th Drop",
      "Last Drop",
      "Total Dropped",
      "Start Cash",
      "Net Collection",
    ],
    [[
      "Cash Envelopes (Rs.)",
      toNumber(hydratedReport.cashDrops?.[0]).toFixed(2),
      toNumber(hydratedReport.cashDrops?.[1]).toFixed(2),
      toNumber(hydratedReport.cashDrops?.[2]).toFixed(2),
      toNumber(hydratedReport.cashDrops?.[3]).toFixed(2),
      toNumber(hydratedReport.cashDrops?.[4]).toFixed(2),
      calculated.cashTotal.toFixed(2),
      toNumber(hydratedReport.cashStart).toFixed(2),
      calculated.cashNet.toFixed(2),
    ]],
    {
      columnStyles: {
        0: { cellWidth: 37 },
      },
    },
  )

  cursor = drawSectionBar("(C) ONLINE", cursor + 2)
  cursor = renderGridTable(
    cursor,
    ["Particulars", "Amount (Rs.)"],
    [
      ["UPI", toNumber(hydratedReport.online?.upiAmt).toFixed(2)],
      ["CARD", toNumber(hydratedReport.online?.cardAmt).toFixed(2)],
      ["TOTAL", calculated.onlineTotal.toFixed(2)],
    ],
  )

  cursor = drawSectionBar("(D) Fleet Card Sales", cursor + 2)
  cursor = renderGridTable(
    cursor,
    ["Particulars", "Amount (Rs.)"],
    [["Fleet Card Slips", calculated.fleetAmount.toFixed(2)]],
  )

  cursor = drawSectionBar("(E) CREDIT CUSTOMERS", cursor + 2)
  cursor = renderGridTable(
    cursor,
    ["Party Name", "Amount (Rs.)"],
    fixedCreditCustomers.map((item) => [item.label || "", toNumber(item.value).toFixed(2)]),
  )

  cursor = drawSectionBar("(F) Total collection for all MOP's (B+C+D+E)", cursor + 2)
  cursor = renderGridTable(
    cursor,
    ["Particulars", "Amount"],
    [
      ["Cash Net (B)", calculated.cashNet.toFixed(2)],
      ["Online Total (C)", calculated.onlineTotal.toFixed(2)],
      ["Fleet (D)", calculated.fleetAmount.toFixed(2)],
      ["Credit (E)", calculated.creditTotal.toFixed(2)],
      ["Total Collection (F)", calculated.totalCollection.toFixed(2)],
    ],
  )

  cursor = drawSectionBar("(G) Shortage / Overage (F - A)", cursor + 2)
  cursor = renderGridTable(cursor, ["Difference (F - A)"], [[calculated.shortOver.toFixed(2)]])

  cursor = drawSectionBar("(H) Sales recorded in HHT/System", cursor + 2)
  cursor = renderGridTable(
    cursor,
    ["Particulars", "Amount"],
    [
      ["Credit Card Sales", toNumber(hydratedReport.hht?.creditCard).toFixed(2)],
      ["Fleet Card Sales", toNumber(hydratedReport.hht?.fleet).toFixed(2)],
      ["Any other approved MOP", toNumber(hydratedReport.hht?.other).toFixed(2)],
      ["Total Sales (H)", calculated.hhtTotal.toFixed(2)],
    ],
  )

  cursor = drawSectionBar("(I) Difference - Sales booked in System & Actual Sales (H - A)", cursor + 2)
  renderGridTable(cursor, ["Difference (H - A)"], [[calculated.difference.toFixed(2)]])

  doc.addPage()

  let secondCursor = 8
  secondCursor = drawSectionBar("Cash Denominations (Drop / Count)", secondCursor)
  secondCursor = renderGridTable(
    secondCursor,
    ["Denom", "Qty", "Total"],
    [
      ...calculated.denominations.map((item) => [
        item.label,
        item.qty.toFixed(0),
        item.total.toFixed(2),
      ]),
      ["Total Cash", "", calculated.denominationTotal.toFixed(2)],
    ],
    {
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
      },
      margin: { left: margin, right: 110 },
      tableWidth: 90,
    },
  )

  renderGridTable(
    secondCursor - 32,
    ["Summary (Cash / UPI / Card / Fleet)", "Amount"],
    [
      ["CASH (notes)", calculated.denominationTotal.toFixed(2)],
      ["UPI", toNumber(hydratedReport.online?.upiAmt).toFixed(2)],
      ["CARD", toNumber(hydratedReport.online?.cardAmt).toFixed(2)],
      ["FLEET", calculated.fleetAmount.toFixed(2)],
      ["CREDIT (E)", calculated.creditTotal.toFixed(2)],
      ["TOTAL", calculated.summaryTotal.toFixed(2)],
    ],
    {
      margin: { left: 103, right: margin },
      tableWidth: 100,
    },
  )

  secondCursor += 2
  secondCursor = drawSectionBar("LUBE", secondCursor)
  doc.setDrawColor(0, 0, 0)
  doc.rect(margin, secondCursor, contentWidth, 6)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(5)
  doc.text(`LUBE :- ${hydratedReport.lube || ""}`, margin + 1.5, secondCursor + 4)
  secondCursor += 8

  secondCursor = drawSectionBar("Credit Customer List (Naam Udhaari Party / Vivaran)", secondCursor)
  secondCursor = renderGridTable(
    secondCursor,
    ["Naam (Udhaari Party)", "Vivaran"],
    fixedCreditList.map((item) => [item.label || "", item.details || ""]),
  )

  doc.setFont("helvetica", "normal")
  doc.setFontSize(5)
  doc.text("Signature: ____________________", margin, Math.min(secondCursor + 10, 276))
  doc.text("Signature: ____________________", 60, Math.min(secondCursor + 10, 276))
  doc.text(
    `System Login: ${hydratedReport.signatures?.systemLogin || "________________"}`,
    118,
    Math.min(secondCursor + 10, 276),
  )
  doc.text(
    `Shift Supervisor Name: ${hydratedReport.signatures?.shiftSupervisor || "________________"}`,
    margin,
    Math.min(secondCursor + 16, 282),
  )

  doc.setFontSize(4.5)
  doc.text(
    "Auto calculations: Dispensed = Closing - Opening; Net Dispensed = Dispensed - PumpTest - OwnUse; Amount = NetDispensed x Rate.",
    margin,
    289,
  )

  const safeName = String(employeeName || "daily_report").replace(/\s+/g, "_")
  doc.save(`${safeName}_daily_report.pdf`)
}
