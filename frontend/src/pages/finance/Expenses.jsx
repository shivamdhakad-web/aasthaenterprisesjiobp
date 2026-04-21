// import {useState,useEffect} from "react"
// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"
// import {
// getExpenses,
// addExpense,
// deleteExpense,
// updateExpense
// } from "../../services/expenseApi"

// export default function Expenses(){

// const [data,setData] = useState([])
// const [open,setOpen] = useState(false)
// const [editId,setEditId] = useState(null)

// const [search,setSearch] = useState("")
// const [category,setCategory] = useState("")
// const [dateFilter,setDateFilter] = useState("")
// const [openCard,setOpenCard] = useState(null)
// const [reportOpen,setReportOpen] = useState(false)
// const [fromDate,setFromDate] = useState("")
// const [toDate,setToDate] = useState("")

// const [form,setForm] = useState({

// date:"",
// category:"Electricity",
// description:"",
// amount:"",
// paymentMode:"Cash",
// addedBy:"Admin"

// })


// const generateExpensePDF = () => {

// const filteredData = data.filter(e=>{

// const d = new Date(e.date)

// return (
// (!fromDate || d >= new Date(fromDate)) &&
// (!toDate || d <= new Date(toDate)) &&
// (!category || e.category === category)
// )

// })

// // 🔹 TOTAL
// let total = 0
// filteredData.forEach(e=>{
// total += Number(e.amount || 0)
// })

// const doc = new jsPDF()

// // 🔹 HEADER
// doc.setFont("helvetica","bold")
// doc.setFontSize(18)
// doc.text("Aastha Enterprises", 14, 18)

// doc.setFontSize(12)
// doc.setFont("helvetica","normal")
// doc.text("Expense Report", 14, 26)


// // 🔹 DATE RANGE (IMPORTANT)
// doc.setFontSize(10)
// doc.text(
// "From: " + (fromDate || "All") + 
// "   To: " + (toDate || "All"),
// 14, 36
// )

// doc.text("Total Records: " + filteredData.length, 14, 42)


// // 🔹 LINE
// doc.setDrawColor(200)
// doc.line(14, 46, 196, 46)


// // 🔹 SUMMARY
// doc.setFont("helvetica","bold")
// doc.text("Summary", 14, 54)

// doc.setFont("helvetica","normal")
// doc.text("Total Expense: Rs. " + total, 14, 62)


// // 🔹 TABLE
// autoTable(doc,{
// startY: 70,

// head:[["Date","Category","Description","Amount","Mode","Added By"]],

// body: filteredData.map(e=>[
// e.date,
// e.category,
// e.description,
// "Rs. " + e.amount,
// e.mode,
// e.addedBy
// ]),

// styles:{
// fontSize:9,
// cellPadding:4
// },

// headStyles:{
// fillColor:[0,102,204],
// textColor:255
// },

// alternateRowStyles:{
// fillColor:[245,245,245]
// }

// })

// doc.save("Expense_Report.pdf")
// }



// const load = async()=>{

// const res = await getExpenses()
// setData(res)

// }

// useEffect(()=>{

// load()

// },[])



// const saveExpense = async()=>{

// if(editId){

// await updateExpense(editId,form)

// }else{

// await addExpense(form)

// }

// setEditId(null)

// setOpen(false)

// load()

// }



// const remove = async(id)=>{

// await deleteExpense(id)

// load()

// }

// // FILTERED DATA

// const filteredData = data.filter(e => 
//  (!search || e.description.toLowerCase().includes(search.toLowerCase())) &&
//  (!category || e.category === category) &&
//  (!dateFilter || e.date === dateFilter)
// )

// // SUMMARY CALCULATION

// const today = new Date()
// const currentMonth = today.getMonth()
// const currentYear = today.getFullYear()

// let todayTotal = 0
// let weekTotal = 0
// let monthTotal = 0
// let grandTotal = 0

// filteredData.forEach(e => {

//  const d = new Date(e.date)

//  grandTotal += Number(e.amount || 0)

//  if(d.toDateString() === today.toDateString()){
//   todayTotal += Number(e.amount)
//  }

//  const diffDays = (today - d) / (1000*60*60*24)

//  if(diffDays <= 7){
//   weekTotal += Number(e.amount)
//  }

//  if(
//   d.getMonth() === currentMonth &&
//   d.getFullYear() === currentYear
//  ){
//   monthTotal += Number(e.amount)
//  }

// })


// return(

// <div className="p-6">


// <div className="flex justify-between mb-6">

// <h1 className="text-white text-2xl font-semibold">
// Expenses
// </h1>

// <button
// onClick={()=>setOpen(true)}
// className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
// >
// + Add Expense
// </button>

// </div>


// <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">

// <div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4">
// <p className="text-gray-400 text-sm font-bold">Today</p>
// <p className="text-white text-xl font-semibold">₹{todayTotal}</p>
// </div>

// <div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4">
// <p className="text-gray-400 text-sm font-bold">Week</p>
// <p className="text-white text-xl font-semibold">₹{weekTotal}</p>
// </div>

// <div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4">
// <p className="text-gray-400 text-sm font-bold">Month</p>
// <p className="text-white text-xl font-semibold">₹{monthTotal}</p>
// </div>

// <div className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4">
// <p className="text-gray-400 text-sm font-bold">Total</p>
// <p className="text-white text-xl font-semibold">₹{grandTotal}</p>
// </div>

// </div>

// {/* FILTERS */}


// <div className="flex flex-col sm:flex-row gap-3 mb-4">
// <input
// placeholder="Search..."
// value={search}
// onChange={(e)=>setSearch(e.target.value)}
// className="bg-[#111827] border border-[#1F2937] px-4 py-2 rounded text-gray-300"
// />

// <select
// value={category}
// onChange={(e)=>setCategory(e.target.value)}
// className="bg-[#111827] border border-[#1F2937] px-4 py-2 rounded text-gray-300"
// >

// <option value="">All Category</option>
// <option>Electricity</option>
// <option>Maintenance</option>
// <option>Salary</option>
// <option>Cleaning</option>
// <option>Misc</option>

// </select>

// <input
// type="date"
// value={dateFilter}
// onChange={(e)=>setDateFilter(e.target.value)}
// className="bg-[#111827] border border-[#1F2937] px-4 py-2 rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <button
// onClick={()=>setReportOpen(true)}
// className="bg-purple-600 text-white px-4 py-2 rounded"
// >
// Generate Report
// </button>

// </div>

// <div className=" hidden sm:block bg-[#0B0F17] border border-[#1A1F2E] rounded">

// <table className="w-full text-gray-300">

// <thead className="border-b border-[#1F2937]">

// <tr>

// <th className="p-3 text-left">Date</th>
// <th className="p-3 text-left">Category</th>
// <th className="p-3 text-left">Description</th>
// <th className="p-3 text-left">Amount</th>
// <th className="p-3 text-left">Mode</th>
// <th className="p-3 text-left">Added By</th>
// <th className="p-3 text-left">Action</th>

// </tr>

// </thead>

// <tbody>

// {filteredData
// .filter(e => 
// (!search || e.description.toLowerCase().includes(search.toLowerCase())) &&
// (!category || e.category === category) &&
// (!dateFilter || e.date === dateFilter)
// )
// .map((e)=>(

// <tr key={e._id} className="border-b border-[#1F2937]">

// <td className="p-3">{e.date}</td>
// <td className="p-3">{e.category}</td>
// <td className="p-3">{e.description}</td>
// <td className="p-3 text-red-400">₹{e.amount}</td>
// <td className="p-3">{e.paymentMode}</td>
// <td className="p-3">{e.addedBy}</td>

// <td className="p-3">

// <button
// onClick={()=>remove(e._id)}
// className="text-red-400"
// >
// Delete
// </button>

// <button
// onClick={()=>{

// setForm({
// date:e.date,
// category:e.category,
// description:e.description,
// amount:e.amount,
// paymentMode:e.paymentMode,
// addedBy:e.addedBy
// })

// setEditId(e._id)

// setOpen(true)

// }}
// className="text-blue-400 ml-3"
// >
// Edit
// </button>

// </td>

// </tr>

// ))}

// </tbody>

// </table>

// </div>

// <div className="grid grid-cols-1 gap-4 sm:hidden">

// {filteredData.map((e)=>{

// const isOpen = openCard === e._id

// return(

// <div
// key={e._id}
// onClick={()=>setOpenCard(isOpen ? null : e._id)}
// className="p-4 rounded-2xl border border-[#1A1F2E] bg-[#0B0F17] shadow-lg active:scale-95 transition-all duration-300"
// >

// {/* HEADER */}
// <div className="flex justify-between items-center">

// <div>
// <p className="text-white font-semibold">
// {e.category}
// </p>

// <p className="text-gray-400 text-xs">
// {e.date}
// </p>
// </div>

// <p className="text-red-400 font-semibold">
// ₹{e.amount}
// </p>

// </div>


// {/* DESCRIPTION */}
// <p className="text-gray-300 text-sm mt-2">
// {e.description}
// </p>


// {/* EXPAND */}
// <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 mt-3" : "max-h-0"}`}>

// <div className="border-t border-[#1F2937] pt-3 space-y-2">

// <p className="text-sm">
// <span className="text-gray-400">💳 Mode:</span>{" "}
// <span className="text-white">{e.paymentMode}</span>
// </p>

// <p className="text-sm">
// <span className="text-gray-400">👤 Added By:</span>{" "}
// <span className="text-white">{e.addedBy}</span>
// </p>

// {/* ACTIONS */}
// <div className="flex gap-3 mt-3">

// <button
// onClick={(ev)=>{
// ev.stopPropagation()

// setForm({
// date:e.date,
// category:e.category,
// description:e.description,
// amount:e.amount,
// paymentMode:e.paymentMode,
// addedBy:e.addedBy
// })

// setEditId(e._id)
// setOpen(true)

// }}
// className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 py-2 rounded-lg text-sm active:scale-95 transition"
// >
// ✏️ Edit
// </button>

// <button
// onClick={(ev)=>{
// ev.stopPropagation()
// remove(e._id)
// }}
// className="flex-1 bg-red-500/10 text-red-400 border border-red-500/30 py-2 rounded-lg text-sm active:scale-95 transition"
// >
// 🗑 Delete
// </button>

// </div>

// </div>

// </div>

// </div>

// )

// })}

// </div>

// {open &&(

// <div className="fixed inset-0 flex items-center justify-center bg-black/60">

// <div className="bg-[#0B0F17] border border-[#1A1F2E] p-6 rounded w-[350px]">

// <h2 className="text-white mb-4">
// Add Expense
// </h2>


// <input
// type="date"
// value={form.date}
// onChange={(e)=>setForm({...form,date:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827] text-white [&::-webkit-calendar-picker-indicator]:invert"
// />



// <select
// value={form.category}
// onChange={(e)=>setForm({...form,category:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827]"
// >

// <option>Electricity</option>
// <option>Maintenance</option>
// <option>Salary</option>
// <option>Cleaning</option>
// <option>Misc</option>

// </select>



// <input
// placeholder="Description"
// value={form.description}
// onChange={(e)=>setForm({...form,description:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827]"
// />



// <input
// placeholder="Amount"
// value={form.amount}
// onChange={(e)=>setForm({...form,amount:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827]"
// />



// <select
// value={form.paymentMode}
// onChange={(e)=>setForm({...form,paymentMode:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827]"
// >

// <option>Cash</option>
// <option>UPI</option>
// <option>Bank</option>

// </select>



// <input
// placeholder="Added By"
// value={form.addedBy}
// onChange={(e)=>setForm({...form,addedBy:e.target.value})}
// className="w-full mb-4 p-2 bg-[#111827]"
// />



// <div className="flex justify-end gap-3">

// <button
// onClick={()=>setOpen(false)}
// className="bg-gray-700 px-4 py-2"
// >
// Cancel
// </button>

// <button
// onClick={saveExpense}
// className="bg-red-600 px-4 py-2"
// >
// Save
// </button>

// </div>

// </div>

// </div>

// )}

// {reportOpen && (

// <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

// <div className="bg-[#0B0F17] p-6 rounded-xl w-[320px] text-white">

// <h2 className="text-lg mb-4 font-semibold">
// Generate Expense Report
// </h2>

// <div className="flex flex-col gap-3">

// <input
// type="date"
// value={fromDate}
// onChange={(e)=>setFromDate(e.target.value)}
// className="border p-2 bg-transparent rounded  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <input
// type="date"
// value={toDate}
// onChange={(e)=>setToDate(e.target.value)}
// className="border p-2 bg-transparent rounded  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// </div>

// <div className="flex justify-end gap-3 mt-4">

// <button
// onClick={()=>setReportOpen(false)}
// className="bg-gray-600 px-3 py-1 rounded"
// >
// Cancel
// </button>

// <button
// onClick={()=>{
// generateExpensePDF()
// setReportOpen(false)
// }}
// className="bg-green-600 px-3 py-1 rounded"
// >
// Download
// </button>

// </div>

// </div>

// </div>

// )}


// </div>

// )

// }















































import { useEffect, useRef, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { getExpenses, addExpense, deleteExpense, updateExpense } from "../../services/expenseApi"

const pageStyles = String.raw`
:root {
  --expense-bg: #040507;
  --expense-surface: rgba(11, 13, 18, 0.72);
  --expense-surface-strong: rgba(11, 13, 18, 0.88);
  --expense-surface-soft: rgba(17, 20, 28, 0.7);
  --expense-border: rgba(255, 255, 255, 0.1);
  --expense-border-strong: rgba(255, 255, 255, 0.14);
  --expense-text: rgba(249, 249, 251, 0.98);
  --expense-muted: rgba(170, 176, 193, 0.72);
  --expense-gold: #f59e0b;
  --expense-gold-soft: rgba(245, 158, 11, 0.14);
  --expense-violet: #7c3aed;
  --expense-blue: #38bdf8;
  --expense-danger: #fb7185;
  --expense-success: #34d399;
  --expense-shadow: 0 28px 90px rgba(0, 0, 0, 0.55);
  --expense-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.expense-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 18%, rgba(124, 58, 237, 0.14), transparent 24%),
    radial-gradient(circle at 84% 72%, rgba(245, 158, 11, 0.16), transparent 28%),
    radial-gradient(circle at 50% 100%, rgba(56, 189, 248, 0.08), transparent 22%),
    linear-gradient(180deg, #020304 0%, #050608 28%, #040507 100%);
  color: var(--expense-text);
}

.expense-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.03), transparent 22%),
    radial-gradient(circle at 76% 0%, rgba(255, 255, 255, 0.035), transparent 18%);
  pointer-events: none;
  opacity: 0.85;
}

.expense-page::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 140px 140px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.55), transparent 95%);
  pointer-events: none;
  opacity: 0.22;
}

.expense-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(110px);
  pointer-events: none;
  opacity: 0.82;
}

.expense-orb--gold {
  top: 8rem;
  right: -6rem;
  width: 20rem;
  height: 20rem;
  background: rgba(245, 158, 11, 0.18);
}

.expense-orb--violet {
  left: -6rem;
  top: 26rem;
  width: 22rem;
  height: 22rem;
  background: rgba(124, 58, 237, 0.16);
}

.expense-orb--blue {
  bottom: 6rem;
  right: 16%;
  width: 18rem;
  height: 18rem;
  background: rgba(56, 189, 248, 0.12);
}

.expense-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1220px);
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

.expense-frame {
  position: absolute;
  inset: 6rem -1rem auto -1rem;
  height: clamp(26rem, 48vw, 40rem);
  border: 1px solid rgba(245, 158, 11, 0.7);
  border-radius: 2.8rem;
  transform: rotate(-1.35deg);
  box-shadow:
    0 0 0 1px rgba(245, 158, 11, 0.1),
    0 0 120px rgba(245, 158, 11, 0.08);
  opacity: 0.9;
  pointer-events: none;
}

.expense-frame::before {
  content: "";
  position: absolute;
  inset: 18% 40% -18% -10%;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.15), transparent 70%);
  filter: blur(34px);
}

.expense-overline {
  margin: 0 0 0.7rem;
  color: rgba(245, 158, 11, 0.92);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.expense-overline--muted {
  color: rgba(205, 213, 255, 0.62);
}

.expense-title {
  margin: 0;
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  line-height: 0.94;
  letter-spacing: -0.05em;
  font-weight: 700;
  text-shadow: 0 10px 36px rgba(0, 0, 0, 0.42);
}

.expense-subtitle {
  max-width: 40rem;
  margin: 1rem 0 0;
  color: rgba(221, 226, 236, 0.76);
  font-size: 1rem;
  line-height: 1.75;
}

.expense-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(18rem, 0.75fr);
  gap: 1.15rem;
  margin-bottom: 1.4rem;
}

.expense-panel,
.expense-command-bar,
.expense-metric,
.expense-ledger,
.expense-mobile-card,
.expense-modal {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02)),
    var(--expense-surface);
  border: 1px solid var(--expense-border);
  border-radius: 1.7rem;
  box-shadow: var(--expense-shadow), var(--expense-highlight);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
}

.expense-panel--strong,
.expense-ledger,
.expense-modal,
.expense-mobile-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02)),
    var(--expense-surface-strong);
}

.expense-hero-copy {
  min-height: 20rem;
  padding: 1.6rem;
}

.expense-hero-copy::after {
  content: "";
  position: absolute;
  inset: auto -4rem -5rem auto;
  width: 16rem;
  height: 16rem;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.2), transparent 72%);
  filter: blur(26px);
  pointer-events: none;
}

.expense-hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.35rem;
}

.expense-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.15rem;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(241, 245, 249, 0.9);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.expense-chip--gold {
  border-color: rgba(245, 158, 11, 0.28);
  background: rgba(245, 158, 11, 0.12);
  color: #fde68a;
}

.expense-chip--soft {
  color: rgba(222, 226, 236, 0.76);
}

.expense-hero-spotlight {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 20rem;
  padding: 1.35rem;
}

.expense-spotlight-label {
  display: block;
  color: rgba(245, 158, 11, 0.88);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.expense-spotlight-value {
  display: block;
  margin-top: 0.55rem;
  font-size: clamp(2.2rem, 4vw, 3.35rem);
  font-weight: 700;
  letter-spacing: -0.05em;
  color: white;
}

.expense-spotlight-note {
  margin: 0.7rem 0 0;
  color: rgba(221, 226, 236, 0.7);
  line-height: 1.7;
}

.expense-spotlight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1.3rem;
}

.expense-spotlight-card {
  padding: 0.95rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.expense-spotlight-card span {
  display: block;
  color: rgba(187, 194, 209, 0.7);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.expense-spotlight-card strong {
  display: block;
  margin-top: 0.45rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.expense-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 1rem 0;
}

    .expense-section-head--desktop-only {
    display: none;
    }

    @media (min-width: 640px) {
    .expense-section-head--desktop-only {
        display: flex;
    }
    }

.expense-section-head--table {
  margin-top: 0.15rem;
}

.expense-section-title {
  margin: 0.15rem 0 0;
  font-size: 1.32rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: white;
}

.expense-section-badge {
  padding: 0.55rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(228, 233, 240, 0.78);
  font-size: 0.82rem;
  font-weight: 600;
}

.expense-metrics {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.4rem;
}

.expense-metrics--desktop-only {
  display: none;
}

.expense-metrics--primary {
  grid-template-columns: minmax(0, 1.35fr) repeat(3, minmax(0, 1fr));
}

.expense-metric {
  min-height: 10.5rem;
  padding: 1.3rem 1.35rem;
}

.expense-metric::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.14), transparent 42%);
  pointer-events: none;
}

.expense-metric::after {
  content: "";
  position: absolute;
  right: 1rem;
  bottom: 0.9rem;
  width: 5rem;
  height: 5rem;
  border-radius: 9999px;
  filter: blur(8px);
  opacity: 0.5;
  pointer-events: none;
}

.expense-metric--featured {
  min-height: 12rem;
}

.expense-metric--gold::after {
  background: radial-gradient(circle, rgba(245, 158, 11, 0.42), transparent 70%);
}

.expense-metric--violet::after {
  background: radial-gradient(circle, rgba(124, 58, 237, 0.35), transparent 70%);
}

.expense-metric--blue::after {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 70%);
}

.expense-metric--green::after {
  background: radial-gradient(circle, rgba(52, 211, 153, 0.35), transparent 70%);
}

.expense-metric-label {
  display: block;
  color: var(--expense-muted);
  font-size: 0.9rem;
}

.expense-metric-value {
  display: block;
  margin-top: 0.6rem;
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-weight: 700;
  color: white;
  letter-spacing: -0.04em;
}

.expense-metric--featured .expense-metric-value {
  font-size: clamp(2rem, 4vw, 3rem);
}

.expense-metric-meta {
  display: block;
  margin-top: 0.7rem;
  color: rgba(217, 221, 232, 0.66);
  font-size: 0.82rem;
  line-height: 1.55;
}

.expense-command-bar {
  padding: 1rem;
  margin-bottom: 1rem;
}

.expense-command-bar__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(11rem, 0.9fr) minmax(10rem, 0.9fr) auto auto;
  gap: 0.85rem;
}

.expense-mobile-actions {
  display: none;
}

.expense-input,
.expense-input-legacy {
  width: 100%;
  min-height: 3rem;
  padding: 0.88rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--expense-text);
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.expense-input:focus,
.expense-input-legacy:focus {
  border-color: rgba(245, 158, 11, 0.34);
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 0 3px rgba(245, 158, 11, 0.12);
}

.expense-input::placeholder,
.expense-input-legacy::placeholder {
  color: rgba(196, 203, 216, 0.46);
}

.expense-input option,
.expense-input-legacy option {
  background: #0c1017;
  color: white;
}

.expense-input::-webkit-calendar-picker-indicator,
.expense-input-legacy::-webkit-calendar-picker-indicator {
  filter: invert(1) opacity(0.74);
}

.expense-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.88rem 1.2rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  color: white;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
  overflow: hidden;
}

.expense-button::before {
  content: "";
  position: absolute;
  inset: 1px 1px auto 1px;
  height: 52%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent);
  opacity: 0.62;
  pointer-events: none;
}

.expense-button:hover {
  transform: translateY(-1px);
}

.expense-button--gold {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.96), rgba(217, 119, 6, 0.95));
  box-shadow:
    0 18px 36px rgba(245, 158, 11, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
}

.expense-button--violet {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.96), rgba(79, 70, 229, 0.95));
  box-shadow:
    0 18px 36px rgba(124, 58, 237, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.expense-button--ghost {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 12px 24px rgba(0, 0, 0, 0.22);
}

.expense-button--danger {
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.16), rgba(190, 24, 93, 0.2));
  border-color: rgba(251, 113, 133, 0.18);
  color: #fecdd3;
}

.expense-button--row {
  min-height: 2.4rem;
  padding: 0.55rem 0.95rem;
}

.expense-ledger {
  overflow: hidden;
}

.expense-ledger__scroll {
  overflow-x: auto;
}

.expense-ledger table {
  width: 100%;
  border-collapse: collapse;
}

.expense-ledger thead {
  background: linear-gradient(180deg, rgba(30, 24, 13, 0.96), rgba(15, 14, 20, 0.9));
}

.expense-ledger th {
  padding: 1rem;
  color: rgba(222, 224, 231, 0.78);
  font-size: 0.8rem;
  font-weight: 700;
  text-align: left;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.expense-ledger td {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(238, 241, 245, 0.88);
}

.expense-ledger tbody tr {
  transition: background-color 0.2s ease;
}

.expense-ledger tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.expense-ledger__amount {
  color: #fde68a;
  font-weight: 700;
}

.expense-ledger__actions {
  display: flex;
  gap: 0.65rem;
}

.expense-ledger__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.38rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.78rem;
  font-weight: 600;
}

.expense-ledger__chip--category {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.18);
  color: #fde68a;
}

.expense-ledger__chip--mode {
  background: rgba(99, 102, 241, 0.14);
  border-color: rgba(129, 140, 248, 0.18);
  color: #c7d2fe;
}

.expense-mobile-list {
  display: none;
}

.expense-mobile-card {
  padding: 1rem;
}

.expense-mobile-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}

.expense-mobile-card__category {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(245, 158, 11, 0.18);
  background: rgba(245, 158, 11, 0.1);
  color: #fde68a;
  font-size: 0.78rem;
  font-weight: 600;
}

.expense-mobile-card__amount {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 700;
  color: white;
}

.expense-mobile-card__date {
  margin: 0.3rem 0 0;
  color: var(--expense-muted);
  font-size: 0.82rem;
}

.expense-mobile-card__description {
  margin: 1rem 0 0;
  color: rgba(231, 235, 240, 0.84);
  line-height: 1.65;
}

.expense-mobile-card__extra {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease, margin-top 0.28s ease;
}

.expense-mobile-card__extra--open {
  grid-template-rows: 1fr;
  margin-top: 0.95rem;
}

.expense-mobile-card__extra-wrap {
  overflow: hidden;
}

.expense-mobile-card__extra-inner {
  padding-top: 0.95rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.expense-mobile-card__meta {
  display: grid;
  gap: 0.55rem;
  color: rgba(223, 229, 237, 0.8);
  font-size: 0.92rem;
}

.expense-mobile-card__meta strong {
  color: white;
}

.expense-mobile-card__actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 1rem;
}

.expense-mobile-card__actions .expense-button {
  flex: 1;
}

.expense-empty {
  padding: 1.15rem 1.2rem;
  text-align: center;
  color: rgba(201, 208, 220, 0.74);
}

.expense-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.expense-modal {
  width: min(100%, 26rem);
  padding: 1.35rem;
}

.expense-modal--wide {
  width: min(100%, 27rem);
}

.expense-modal__head {
  margin-bottom: 1rem;
}

.expense-modal__title {
  margin: 0;
  font-size: 1.28rem;
  font-weight: 700;
  color: white;
}

.expense-modal__copy {
  margin: 0.45rem 0 0;
  color: rgba(214, 219, 229, 0.7);
  line-height: 1.65;
}

.expense-modal__body {
  display: grid;
  gap: 0.85rem;
}

.expense-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.expense-tilt {
  --tilt-rx: 0deg;
  --tilt-ry: 0deg;
  --tilt-scale: 1;
  --tilt-lift: 0px;
  --tilt-inner-x: 0px;
  --tilt-inner-y: 0px;
  --tilt-pointer-x: 50%;
  --tilt-pointer-y: 50%;
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  transform:
    perspective(1500px)
    rotateX(var(--tilt-rx))
    rotateY(var(--tilt-ry))
    translateY(var(--tilt-lift))
    scale(var(--tilt-scale));
}

.expense-tilt::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at var(--tilt-pointer-x) var(--tilt-pointer-y), rgba(255, 255, 255, 0.12), transparent 34%),
    radial-gradient(circle at var(--tilt-pointer-x) var(--tilt-pointer-y), rgba(245, 158, 11, 0.08), transparent 54%);
  opacity: 0;
  transition: opacity 0.22s ease;
  pointer-events: none;
}

.expense-tilt--interactive:hover {
  border-color: rgba(245, 158, 11, 0.18);
  box-shadow:
    0 34px 100px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 0 0 1px rgba(245, 158, 11, 0.05);
}

.expense-tilt--interactive:hover::after {
  opacity: 1;
}

.expense-tilt__inner {
  position: relative;
  z-index: 1;
  transform: translate3d(var(--tilt-inner-x), var(--tilt-inner-y), 18px);
  transition: transform 0.22s ease;
}

@supports not ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {
  .expense-panel,
  .expense-command-bar,
  .expense-metric,
  .expense-ledger,
  .expense-mobile-card,
  .expense-modal {
    background: rgba(12, 13, 16, 0.94);
  }
}

@media (max-width: 1023px) {
  .expense-frame {
    display: none;
  }

  .expense-hero {
    grid-template-columns: 1fr;
  }

  .expense-metrics--primary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .expense-metric--featured {
    grid-column: span 2;
  }

  .expense-command-bar {
    margin-bottom: 1rem;
  }

  .expense-command-bar__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 640px) {
  .expense-metrics--desktop-only {
    display: grid;
  }
}

@media (max-width: 639px) {
  .expense-shell {
    padding-inline: 0.9rem;
  }

  .expense-title {
    font-size: 2.95rem;
  }

  .expense-subtitle {
    font-size: 0.95rem;
  }

  .expense-hero-copy,
  .expense-hero-spotlight {
    min-height: auto;
    padding: 1.1rem;
  }

  .expense-spotlight-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .expense-metrics--primary {
    grid-template-columns: 1fr;
  }

  .expense-metric--featured {
    grid-column: span 1;
  }

  .expense-command-bar {
    display: none;
  }

  .expense-mobile-actions {
    display: grid;
    gap: 0.85rem;
    margin-bottom: 1rem;
  }

  .expense-mobile-list {
    display: grid;
    gap: 1rem;
  }

  .expense-ledger {
    display: none;
  }

  .expense-section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .expense-mobile-card__actions {
    flex-direction: column;
  }

  .expense-modal__actions {
    flex-direction: column-reverse;
  }

  .expense-modal__actions .expense-button {
    width: 100%;
  }
}
`

const categories = ["Electricity", "Maintenance", "Salary", "Cleaning", "Misc"]
const paymentModes = ["Cash", "UPI", "Bank"]
const RUPEE = "\u20B9"
const formatter = new Intl.NumberFormat("en-IN")

const initialForm = {
  date: "",
  category: "Electricity",
  description: "",
  amount: "",
  paymentMode: "Cash",
  addedBy: "Admin",
}

const formatCurrency = (value) => `${RUPEE}${formatter.format(Number(value || 0))}`

const formatDateLabel = (value) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value || "-"
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const normalizeText = (value) => String(value || "").toLowerCase()

function TiltPanel({ enabled, className = "", children, strength = 10, ...props }) {
  const panelRef = useRef(null)
  const frameRef = useRef(0)
  const stateRef = useRef({
    rotateX: 0,
    rotateY: 0,
    innerX: 0,
    innerY: 0,
    pointerX: 50,
    pointerY: 50,
    scale: 1,
    lift: 0,
  })

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const flushFrame = () => {
    const node = panelRef.current
    if (!node) {
      frameRef.current = 0
      return
    }

    const current = stateRef.current
    node.style.setProperty("--tilt-rx", `${current.rotateX}deg`)
    node.style.setProperty("--tilt-ry", `${current.rotateY}deg`)
    node.style.setProperty("--tilt-inner-x", `${current.innerX}px`)
    node.style.setProperty("--tilt-inner-y", `${current.innerY}px`)
    node.style.setProperty("--tilt-pointer-x", `${current.pointerX}%`)
    node.style.setProperty("--tilt-pointer-y", `${current.pointerY}%`)
    node.style.setProperty("--tilt-scale", `${current.scale}`)
    node.style.setProperty("--tilt-lift", `${current.lift}px`)
    frameRef.current = 0
  }

  const scheduleFrame = () => {
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(flushFrame)
    }
  }

  const handleMove = (event) => {
    if (!enabled) return

    const node = panelRef.current
    if (!node) return

    const rect = node.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * 100
    const py = ((event.clientY - rect.top) / rect.height) * 100
    const centeredX = (px - 50) / 50
    const centeredY = (py - 50) / 50

    stateRef.current = {
      rotateX: centeredY * -strength,
      rotateY: centeredX * strength,
      innerX: centeredX * strength * 0.6,
      innerY: centeredY * strength * 0.6,
      pointerX: px,
      pointerY: py,
      scale: 1.008,
      lift: -3,
    }

    scheduleFrame()
  }

  const handleLeave = () => {
    stateRef.current = {
      rotateX: 0,
      rotateY: 0,
      innerX: 0,
      innerY: 0,
      pointerX: 50,
      pointerY: 50,
      scale: 1,
      lift: 0,
    }

    scheduleFrame()
  }

  return (
    <div
      ref={panelRef}
      className={`expense-tilt ${enabled ? "expense-tilt--interactive" : ""} ${className}`}
      onMouseMove={enabled ? handleMove : undefined}
      onMouseLeave={enabled ? handleLeave : undefined}
      {...props}
    >
      <div className="expense-tilt__inner">{children}</div>
    </div>
  )
}

export default function Expenses() {
  const [data, setData] = useState([])
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [openCard, setOpenCard] = useState(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [tiltEnabled, setTiltEnabled] = useState(false)

  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (typeof window === "undefined") return

    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)")
    const motionQuery = window.matchMedia("(prefers-reduced-motion: no-preference)")

    const updateMotion = () => {
      setTiltEnabled(pointerQuery.matches && motionQuery.matches)
    }

    updateMotion()

    if (typeof pointerQuery.addEventListener === "function") {
      pointerQuery.addEventListener("change", updateMotion)
      motionQuery.addEventListener("change", updateMotion)
    } else {
      pointerQuery.addListener(updateMotion)
      motionQuery.addListener(updateMotion)
    }

    return () => {
      if (typeof pointerQuery.removeEventListener === "function") {
        pointerQuery.removeEventListener("change", updateMotion)
        motionQuery.removeEventListener("change", updateMotion)
      } else {
        pointerQuery.removeListener(updateMotion)
        motionQuery.removeListener(updateMotion)
      }
    }
  }, [])

  const load = async () => {
    const res = await getExpenses()
    setData(res)
  }

  useEffect(() => {
    load()
  }, [])

  const closeEditor = () => {
    setOpen(false)
    setEditId(null)
    setForm(initialForm)
  }

  const openNewExpense = () => {
    setEditId(null)
    setForm(initialForm)
    setOpen(true)
  }

  const openEditExpense = (entry) => {
    setForm({
      date: entry.date || "",
      category: entry.category || "Electricity",
      description: entry.description || "",
      amount: entry.amount || "",
      paymentMode: entry.paymentMode || "Cash",
      addedBy: entry.addedBy || "Admin",
    })
    setEditId(entry._id)
    setOpen(true)
  }

  const saveExpense = async () => {
    if (editId) {
      await updateExpense(editId, form)
    } else {
      await addExpense(form)
    }

    closeEditor()
    await load()
  }

  const removeExpense = async (id) => {
    await deleteExpense(id)
    await load()
  }

  const filteredData = data.filter((entry) => {
    const description = normalizeText(entry.description)
    const matchesSearch = !search || description.includes(normalizeText(search))
    const matchesCategory = !category || entry.category === category
    const matchesDate = !dateFilter || entry.date === dateFilter

    return matchesSearch && matchesCategory && matchesDate
  })

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let todayTotal = 0
  let weekTotal = 0
  let monthTotal = 0
  let grandTotal = 0

  filteredData.forEach((entry) => {
    const parsed = new Date(entry.date)
    const amount = Number(entry.amount || 0)

    grandTotal += amount

    if (parsed.toDateString() === today.toDateString()) {
      todayTotal += amount
    }

    const diffDays = (today - parsed) / (1000 * 60 * 60 * 24)
    if (diffDays >= 0 && diffDays <= 7) {
      weekTotal += amount
    }

    if (parsed.getMonth() === currentMonth && parsed.getFullYear() === currentYear) {
      monthTotal += amount
    }
  })

  const generateExpensePDF = () => {
    const reportRows = data.filter((entry) => {
      const parsed = new Date(entry.date)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(`${toDate}T23:59:59`) : null

      return (
        (!from || parsed >= from) &&
        (!to || parsed <= to) &&
        (!category || entry.category === category)
      )
    })

    if (reportRows.length === 0) {
      alert("No expense data found for this report")
      return false
    }

    let total = 0
    reportRows.forEach((entry) => {
      total += Number(entry.amount || 0)
    })

    const doc = new jsPDF()

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("Aastha Enterprises", 14, 18)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text("Expense Report", 14, 26)

    doc.setFontSize(10)
    doc.text(`From: ${fromDate || "All"}   To: ${toDate || "All"}`, 14, 36)
    doc.text(`Total Records: ${reportRows.length}`, 14, 42)

    if (category) {
      doc.text(`Category: ${category}`, 14, 48)
    }

    doc.setDrawColor(200)
    doc.line(14, category ? 52 : 46, 196, category ? 52 : 46)

    doc.setFont("helvetica", "bold")
    doc.text("Summary", 14, category ? 60 : 54)

    doc.setFont("helvetica", "normal")
    doc.text(`Total Expense: Rs. ${total}`, 14, category ? 68 : 62)

    autoTable(doc, {
      startY: category ? 76 : 70,
      head: [["Date", "Category", "Description", "Amount", "Mode", "Added By"]],
      body: reportRows.map((entry) => [
        formatDateLabel(entry.date),
        entry.category,
        entry.description,
        `Rs. ${entry.amount}`,
        entry.paymentMode,
        entry.addedBy,
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [217, 119, 6],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    })

    doc.save("Expense_Report.pdf")
    return true
  }

  const activeFilterCount = [search, category, dateFilter].filter(Boolean).length

  const summaryCards = [
    {
      label: "Total Expense",
      value: formatCurrency(grandTotal),
      meta: `${filteredData.length} visible expenses`,
      accent: "expense-metric--gold",
      featured: true,
    },
    {
      label: "Today",
      value: formatCurrency(todayTotal),
      meta: "Current day burn",
      accent: "expense-metric--violet",
    },
    {
      label: "Week",
      value: formatCurrency(weekTotal),
      meta: "Last 7 days",
      accent: "expense-metric--blue",
    },
    {
      label: "Month",
      value: formatCurrency(monthTotal),
      meta: "Current month total",
      accent: "expense-metric--green",
    },
  ]

  return (
    <>
      <style>{pageStyles}</style>

      <div className="expense-page">
        <div className="expense-orb expense-orb--gold" />
        <div className="expense-orb expense-orb--violet" />
        <div className="expense-orb expense-orb--blue" />

        <div className="expense-shell">
          <div className="expense-frame" />

          <div className="expense-hero">
            <TiltPanel enabled={tiltEnabled} strength={8} className="expense-panel expense-hero-copy">
              <p className="expense-overline">Expense Intelligence</p>
              <h1 className="expense-title">Expenses Dashboard</h1>
              <p className="expense-subtitle">
                A premium operational view of outgoing cash flow, category distribution, and payment behavior,
                styled with a noir glass finish and live motion response.
              </p>

              <div className="expense-hero-tags">
                <span className="expense-chip expense-chip--gold">Filtered total {formatCurrency(grandTotal)}</span>
                <span className="expense-chip expense-chip--soft">
                  {activeFilterCount ? `${activeFilterCount} filters active` : "All expenses in view"}
                </span>
                <span className="expense-chip expense-chip--soft">{filteredData.length} records</span>
              </div>
            </TiltPanel>

            <TiltPanel enabled={tiltEnabled} strength={10} className="expense-panel expense-hero-spotlight">
              <div>
                <span className="expense-spotlight-label">Total Outflow</span>
                <strong className="expense-spotlight-value">{formatCurrency(grandTotal)}</strong>
                <p className="expense-spotlight-note">
                  A clean view of your filtered spend position with supporting operational snapshots.
                </p>
              </div>

              <div className="expense-spotlight-grid">
                <div className="expense-spotlight-card">
                  <span>Today</span>
                  <strong>{formatCurrency(todayTotal)}</strong>
                </div>
                <div className="expense-spotlight-card">
                  <span>Week</span>
                  <strong>{formatCurrency(weekTotal)}</strong>
                </div>
                <div className="expense-spotlight-card">
                  <span>Month</span>
                  <strong>{formatCurrency(monthTotal)}</strong>
                </div>
                <div className="expense-spotlight-card">
                  <span>Records</span>
                  <strong>{filteredData.length}</strong>
                </div>
              </div>
            </TiltPanel>
          </div>

          <div className="expense-section-head expense-section-head--desktop-only">
            <div>
              <p className="expense-overline">Summary</p>
              <h2 className="expense-section-title">Luxury spend overview</h2>
            </div>
            <div className="expense-section-badge">Live calculations</div>
          </div>

          <div className="expense-metrics expense-metrics--primary expense-metrics--desktop-only">
            {summaryCards.map((card, index) => (
              <TiltPanel
                key={card.label}
                enabled={tiltEnabled}
                strength={index === 0 ? 8 : 11}
                className={`expense-metric ${card.accent} ${card.featured ? "expense-metric--featured" : ""}`}
              >
                <span className="expense-metric-label">{card.label}</span>
                <strong className="expense-metric-value">{card.value}</strong>
                <span className="expense-metric-meta">{card.meta}</span>
              </TiltPanel>
            ))}
          </div>

          <div className="expense-section-head">
            <div>
              <p className="expense-overline">Command Deck</p>
              <h2 className="expense-section-title">Search, filter, and take action</h2>
            </div>
            <div className="expense-section-badge">Premium controls</div>
          </div>

          <TiltPanel enabled={tiltEnabled} strength={6} className="expense-command-bar">
            <div className="expense-command-bar__grid">
              <input
                placeholder="Search description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="expense-input"
              />

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="expense-input"
              >
                <option value="">All Category</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="expense-input"
              />

              <button onClick={() => setReportOpen(true)} className="expense-button expense-button--violet">
                Generate Report
              </button>

              <button onClick={openNewExpense} className="expense-button expense-button--gold">
                + Add Expense
              </button>
            </div>
          </TiltPanel>

          <div className="expense-mobile-actions">
            <TiltPanel enabled={tiltEnabled} strength={6} className="expense-panel">
              <button
                onClick={() => setMobileFiltersOpen((value) => !value)}
                className="expense-button expense-button--ghost w-full"
              >
                {mobileFiltersOpen ? "Hide Filters" : "Open Filters"}
              </button>
            </TiltPanel>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setReportOpen(true)} className="expense-button expense-button--violet">
                Report
              </button>

              <button onClick={openNewExpense} className="expense-button expense-button--gold">
                + Add
              </button>
            </div>

            {mobileFiltersOpen && (
              <TiltPanel enabled={tiltEnabled} strength={6} className="expense-panel p-4">
                <div className="space-y-3">
                  <input
                    placeholder="Search description..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="expense-input"
                  />

                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="expense-input"
                  >
                    <option value="">All Category</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    className="expense-input"
                  />
                </div>
              </TiltPanel>
            )}
          </div>

          <div className="expense-section-head expense-section-head--table">
            <div>
              <p className="expense-overline">Ledger</p>
              <h2 className="expense-section-title">Expense activity</h2>
            </div>
            <div className="expense-section-badge">{filteredData.length} rows</div>
          </div>

          <TiltPanel enabled={false} strength={5} className="expense-ledger">
            <div className="expense-ledger__scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Added By</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((entry) => (
                    <tr key={entry._id}>
                      <td>{formatDateLabel(entry.date)}</td>
                      <td>
                        <span className="expense-ledger__chip expense-ledger__chip--category">{entry.category}</span>
                      </td>
                      <td>{entry.description}</td>
                      <td className="expense-ledger__amount">{formatCurrency(entry.amount)}</td>
                      <td>
                        <span className="expense-ledger__chip expense-ledger__chip--mode">{entry.paymentMode}</span>
                      </td>
                      <td>{entry.addedBy}</td>
                      <td>
                        <div className="expense-ledger__actions">
                          <button
                            onClick={() => openEditExpense(entry)}
                            className="expense-button expense-button--ghost expense-button--row"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => removeExpense(entry._id)}
                            className="expense-button expense-button--danger expense-button--row"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && <div className="expense-empty">No expense entries match the current filters.</div>}
          </TiltPanel>

          <div className="expense-mobile-list">
            {filteredData.map((entry) => {
              const isOpen = openCard === entry._id

              return (
                <TiltPanel
                  key={entry._id}
                  enabled={tiltEnabled}
                  strength={9}
                  className="expense-mobile-card"
                  onClick={() => setOpenCard(isOpen ? null : entry._id)}
                >
                  <div className="expense-mobile-card__top">
                    <div>
                      <span className="expense-mobile-card__category">{entry.category}</span>
                      <p className="expense-mobile-card__date">{formatDateLabel(entry.date)}</p>
                    </div>

                    <p className="expense-mobile-card__amount">{formatCurrency(entry.amount)}</p>
                  </div>

                  <p className="expense-mobile-card__description">{entry.description}</p>

                  <div className={`expense-mobile-card__extra ${isOpen ? "expense-mobile-card__extra--open" : ""}`}>
                    <div className="expense-mobile-card__extra-wrap">
                      <div className="expense-mobile-card__extra-inner">
                        <div className="expense-mobile-card__meta">
                          <p>
                            Payment Mode: <strong>{entry.paymentMode}</strong>
                          </p>
                          <p>
                            Added By: <strong>{entry.addedBy}</strong>
                          </p>
                        </div>

                        <div className="expense-mobile-card__actions">
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              openEditExpense(entry)
                            }}
                            className="expense-button expense-button--ghost expense-button--row"
                          >
                            Edit
                          </button>

                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              removeExpense(entry._id)
                            }}
                            className="expense-button expense-button--danger expense-button--row"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltPanel>
              )
            })}

            {filteredData.length === 0 && <div className="expense-empty">No expense entries match the current filters.</div>}
          </div>
        </div>

        {open && (
          <div className="expense-modal-backdrop">
            <TiltPanel enabled={tiltEnabled} strength={5} className="expense-modal expense-modal--wide">
              <div className="expense-modal__head">
                <h2 className="expense-modal__title">{editId ? "Edit Expense" : "Add Expense"}</h2>
                <p className="expense-modal__copy">
                  Capture an outgoing transaction with the same premium register styling.
                </p>
              </div>

              <div className="expense-modal__body">
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="expense-input"
                />

                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="expense-input"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="expense-input"
                />

                <input
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  className="expense-input"
                />

                <select
                  value={form.paymentMode}
                  onChange={(event) => setForm({ ...form, paymentMode: event.target.value })}
                  className="expense-input"
                >
                  {paymentModes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Added By"
                  value={form.addedBy}
                  onChange={(event) => setForm({ ...form, addedBy: event.target.value })}
                  className="expense-input"
                />
              </div>

              <div className="expense-modal__actions">
                <button onClick={closeEditor} className="expense-button expense-button--ghost">
                  Cancel
                </button>

                <button onClick={saveExpense} className="expense-button expense-button--gold">
                  Save
                </button>
              </div>
            </TiltPanel>
          </div>
        )}

        {reportOpen && (
          <div className="expense-modal-backdrop">
            <TiltPanel enabled={tiltEnabled} strength={5} className="expense-modal">
              <div className="expense-modal__head">
                <h2 className="expense-modal__title">Generate Expense Report</h2>
                <p className="expense-modal__copy">
                  Export a PDF for the selected date range. The current category filter will also be applied.
                </p>
              </div>

              <div className="expense-modal__body">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="expense-input"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="expense-input"
                />
              </div>

              <div className="expense-modal__actions">
                <button onClick={() => setReportOpen(false)} className="expense-button expense-button--ghost">
                  Cancel
                </button>

                <button
                  onClick={() => {
                    const created = generateExpensePDF()
                    if (created) {
                      setReportOpen(false)
                    }
                  }}
                  className="expense-button expense-button--violet"
                >
                  Download
                </button>
              </div>
            </TiltPanel>
          </div>
        )}
      </div>
    </>
  )
}