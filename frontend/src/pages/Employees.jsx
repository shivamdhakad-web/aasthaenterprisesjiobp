import { useEffect, useMemo, useState } from "react"
import {
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  Filter,
  Home,
  LayoutGrid,
  MoreVertical,
  Phone,
  Pencil,
  Search,
  Trash2,
  Users as UsersIcon,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import EmployeeModal from "../components/EmployeeModal"
import AttendanceModal from "../components/AttendanceModal"
import MobileActionFab from "../components/MobileActionFab"
import { useAuth } from "../contexts/AuthContext"
import useManagerDashboardSettings from "../hooks/useManagerDashboardSettings"
import {
  addAttendance,
  deleteAttendance,
  deleteMonth as deleteAttendanceMonth,
  getAttendance,
  updateAttendance,
} from "../services/attendanceApi"
import {
  addEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "../services/employeeApi"

const formatCurrency = (value) =>
  `Rs. ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`

const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

const getPreviousMonth = (month = getCurrentMonth()) => {
  const [year, monthNumber] = String(month).split("-").map(Number)
  const date = year && monthNumber
    ? new Date(year, monthNumber - 2, 1)
    : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

const getDaysInMonth = (value) => {
  const dateKey = value ? String(value).slice(0, 10) : getCurrentMonth()
  const [year, month] = dateKey.split("-").map(Number)

  if (!year || !month) {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  }

  return new Date(year, month, 0).getDate()
}

const statusMeta = {
  present: {
    label: "Present",
    numberClass: "text-emerald-500",
    cardClass: "border-emerald-200 bg-emerald-50/80",
  },
  present_half: {
    label: "Present + Half Shift",
    numberClass: "text-teal-500",
    cardClass: "border-teal-200 bg-teal-50/80",
  },
  half: {
    label: "Half Shift",
    numberClass: "text-amber-500",
    cardClass: "border-amber-200 bg-amber-50/80",
  },
  absent: {
    label: "Absent",
    numberClass: "text-rose-500",
    cardClass: "border-rose-200 bg-rose-50/80",
  },
  double: {
    label: "Double Shift",
    numberClass: "text-sky-500",
    cardClass: "border-sky-200 bg-sky-50/80",
  },
  bonus: {
    label: "Bonus",
    numberClass: "text-violet-500",
    cardClass: "border-violet-200 bg-violet-50/80",
  },
}

const getReportEntries = (entries, fromDate, toDate) => {
  return entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate) : null

    if (to) {
      to.setHours(23, 59, 59, 999)
    }

    return (!from || entryDate >= from) && (!to || entryDate <= to)
  })
}

const calculateAttendanceSummary = (employee, entries) => {
  const baseSalary = Number(employee?.salary || 0)

  let present = 0
  let presentHalf = 0
  let half = 0
  let absent = 0
  let doubleShift = 0
  let shortage = 0
  let advance = 0
  let bonus = 0
  let earned = 0

  entries.forEach((entry) => {
    const perDay = baseSalary / getDaysInMonth(entry.date)

    if (entry.status === "present") {
      present += 1
    }
    if (entry.status === "present_half") {
      presentHalf += 1
    }
    if (entry.status === "half") {
      half += 1
    }
    if (entry.status === "absent") {
      absent += 1
    }
    if (entry.status === "double") {
      doubleShift += 1
    }
    if (entry.status === "bonus") {
      bonus += Number(entry.bonusAmount || 0)
    }

    shortage += Number(entry.shortage || 0)
    advance += Number(entry.advanceCash || 0) + Number(entry.advancePetrol || 0)

    if (entry.status === "present") {
      earned += perDay
    }
    if (entry.status === "present_half") {
      earned += perDay * 1.5
    }
    if (entry.status === "half") {
      earned += perDay / 2
    }
    if (entry.status === "double") {
      earned += perDay * 2
    }
  })

  earned = Math.round(earned)
  const final = Math.round(earned + bonus + shortage - advance)

  return {
    present,
    presentHalf,
    half,
    absent,
    doubleShift,
    earned,
    shortage,
    advance,
    bonus,
    final,
  }
}

const buildAttendanceReportPdf = ({ employee, entries, fromDate, toDate }) => {
  const summary = calculateAttendanceSummary(employee, entries)
  const doc = new jsPDF()

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Aastha Enterprises", 14, 18)
  doc.setFontSize(12)
  doc.text("Employee Attendance Report", 14, 26)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Employee: ${employee.name}`, 14, 36)
  doc.text(`Role: ${employee.role || "-"}`, 14, 42)
  doc.text(`Shift: ${employee.shift || "-"}`, 14, 48)
  doc.text(`From: ${fromDate || "All Dates"}`, 14, 54)
  doc.text(`To: ${toDate || "All Dates"}`, 108, 54)
  doc.line(14, 59, 196, 59)

  doc.setFont("helvetica", "bold")
  doc.text("Summary", 14, 68)
  doc.setFont("helvetica", "normal")
  doc.text(`Present: ${summary.present}`, 14, 76)
  doc.text(`Present + Half: ${summary.presentHalf}`, 52, 76)
  doc.text(`Half Shift: ${summary.half}`, 124, 76)
  doc.text(`Absent: ${summary.absent}`, 14, 84)
  doc.text(`Double Shift: ${summary.doubleShift}`, 62, 84)
  doc.text(`Earned: ${formatCurrency(summary.earned)}`, 14, 84)
  doc.text(`Bonus: ${formatCurrency(summary.bonus)}`, 78, 84)
  doc.text(`Shortage: ${formatCurrency(summary.shortage)}`, 140, 84)
  doc.text(`Advance: ${formatCurrency(summary.advance)}`, 14, 92)
  doc.setFont("helvetica", "bold")
  doc.text(`Final Balance: ${formatCurrency(summary.final)}`, 78, 92)

  autoTable(doc, {
    startY: 100,
    head: [["Date", "Status", "Bonus", "Shortage", "Cash", "Petrol", "Remark"]],
    body: entries.map((entry) => [
      entry.date ? String(entry.date).slice(0, 10) : "-",
      statusMeta[entry.status]?.label || entry.status,
      entry.bonusAmount || 0,
      entry.shortage || 0,
      entry.advanceCash || 0,
      entry.advancePetrol || 0,
      entry.remark || "-",
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  doc.save(`${employee.name}_attendance_report.pdf`)
}

const buildAttendanceReportExcel = ({ employee, entries, fromDate, toDate }) => {
  const summary = calculateAttendanceSummary(employee, entries)
  const workbook = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.json_to_sheet([
    {
      Employee: employee.name,
      Role: employee.role || "-",
      Shift: employee.shift || "-",
      From: fromDate || "All Dates",
      To: toDate || "All Dates",
      Present: summary.present,
      PresentHalfShift: summary.presentHalf,
      HalfShift: summary.half,
      Absent: summary.absent,
      DoubleShift: summary.doubleShift,
      Earned: summary.earned,
      Bonus: summary.bonus,
      Shortage: summary.shortage,
      Advance: summary.advance,
      FinalBalance: summary.final,
    },
  ])

  const dataSheet = XLSX.utils.json_to_sheet(
    entries.map((entry) => ({
      Date: entry.date ? String(entry.date).slice(0, 10) : "-",
      Status: statusMeta[entry.status]?.label || entry.status,
      Bonus: entry.bonusAmount || 0,
      Shortage: entry.shortage || 0,
      AdvanceCash: entry.advanceCash || 0,
      AdvancePetrol: entry.advancePetrol || 0,
      Remark: entry.remark || "-",
    })),
  )

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Attendance")
  XLSX.writeFile(workbook, `${employee.name}_attendance_report.xlsx`)
}

const buildEmployeesDirectoryPdf = (employees, getAllFinalBalance = () => 0) => {
  const doc = new jsPDF({ orientation: "landscape" })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Aastha Enterprises", 14, 18)
  doc.setFontSize(12)
  doc.text("Employee Directory", 14, 26)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 34)
  doc.text(`Total Employees: ${employees.length}`, 14, 40)

  autoTable(doc, {
    startY: 48,
    head: [["Name", "Role", "Shift", "Phone", "Salary", "All Final Balance", "Tshirt", "Pant", "Shoes"]],
    body: employees.map((employee) => [
      employee.name || "-",
      employee.role || "-",
      employee.shift || "-",
      employee.phone || "-",
      formatCurrency(employee.salary),
      formatCurrency(getAllFinalBalance(employee)),
      employee.tshirt || "-",
      employee.pant || "-",
      employee.shoes || "-",
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  doc.save("employees_directory.pdf")
}

export default function Employees() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isManager = user?.role === "Manager"
  const { canUse, canShowCard } = useManagerDashboardSettings("employees", isManager)
  const canManagerUse = (buttonKey) => !isManager || canUse(buttonKey)
  const canManagerShowCard = (cardKey) => !isManager || canShowCard(cardKey)
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [allAttendanceByEmployee, setAllAttendanceByEmployee] = useState({})
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [editAttendance, setEditAttendance] = useState(null)
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [openCard, setOpenCard] = useState(null)
  const [expandedAttendanceId, setExpandedAttendanceId] = useState(null)
  const [notice, setNotice] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [attendanceContext, setAttendanceContext] = useState({
    employeeId: "",
    allowEmployeeSelect: false,
  })
  const [attendanceEntryMode, setAttendanceEntryMode] = useState("single")
  const [attendanceModePrompt, setAttendanceModePrompt] = useState(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportEmployeeId, setReportEmployeeId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reportFormat, setReportFormat] = useState("pdf")
  const [bonusModalOpen, setBonusModalOpen] = useState(false)
  const [bonusSaving, setBonusSaving] = useState(false)
  const [showAllMobileSummary, setShowAllMobileSummary] = useState(false)
  const [bonusForm, setBonusForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    employeeTarget: "selected",
    employeeId: "",
    payment: "",
    remark: "",
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const timer = window.setTimeout(() => setNotice(null), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees()
      const employeeList = Array.isArray(data) ? data : []
      setEmployees(employeeList)

      const attendancePairs = await Promise.all(
        employeeList.map(async (employee) => {
          try {
            const records = await getAttendance(employee._id)
            return [employee._id, Array.isArray(records) ? records : []]
          } catch {
            return [employee._id, []]
          }
        }),
      )

      setAllAttendanceByEmployee(Object.fromEntries(attendancePairs))
    } catch (error) {
      setAllAttendanceByEmployee({})
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Unable to load employees.",
      })
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) =>
      employee.name.toLowerCase().includes(search.toLowerCase()),
    )
  }, [employees, search])

  const sortedAttendance = useMemo(() => {
    return [...attendance]
      .filter((entry) => {
        if (!selectedMonth) {
          return true
        }

        const entryMonth = new Date(entry.date).toISOString().slice(0, 7)
        return entryMonth === selectedMonth
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [attendance, selectedMonth])

  const summary = useMemo(
    () => calculateAttendanceSummary(selectedEmployee, sortedAttendance),
    [selectedEmployee, sortedAttendance],
  )

  const allTimeSummary = useMemo(
    () => calculateAttendanceSummary(selectedEmployee, attendance),
    [selectedEmployee, attendance],
  )

  const searchFinalSummary = useMemo(() => {
    const records = attendance.filter((entry) => {
      if (!selectedMonth) {
        return true
      }

      const entryMonth = entry.date ? new Date(entry.date).toISOString().slice(0, 7) : ""
      return entryMonth && entryMonth <= selectedMonth
    })

    return calculateAttendanceSummary(selectedEmployee, records)
  }, [attendance, selectedEmployee, selectedMonth])

  const lastMonthAdvance = useMemo(() => {
    const previousMonth = getPreviousMonth(selectedMonth)
    return attendance.reduce((total, entry) => {
      const entryMonth = entry.date ? new Date(entry.date).toISOString().slice(0, 7) : ""
      if (entryMonth !== previousMonth) {
        return total
      }
      return total + Number(entry.advanceCash || 0) + Number(entry.advancePetrol || 0)
    }, 0)
  }, [attendance, selectedMonth])

  const allEmployeeSalarySummary = useMemo(() => {
    return employees.reduce(
      (totals, employee) => {
        const records = (allAttendanceByEmployee[employee._id] || []).filter((entry) => {
          if (!selectedMonth) {
            return true
          }

          const entryMonth = entry.date ? new Date(entry.date).toISOString().slice(0, 7) : ""
          return entryMonth === selectedMonth
        })
        const employeeSummary = calculateAttendanceSummary(employee, records)

        const allRecords = allAttendanceByEmployee[employee._id] || []
        const employeeAllSummary = calculateAttendanceSummary(employee, allRecords)

        totals.earned += employeeSummary.earned
        totals.bonus += employeeSummary.bonus
        totals.final += employeeAllSummary.final
        if (employeeAllSummary.final > 0) {
          totals.positiveFinal += employeeAllSummary.final
        }
        if (employeeAllSummary.final < 0) {
          totals.negativeFinal += employeeAllSummary.final
        }
        return totals
      },
      { earned: 0, bonus: 0, final: 0, positiveFinal: 0, negativeFinal: 0 },
    )
  }, [allAttendanceByEmployee, employees, selectedMonth])

  const allEmployeeSalaryCards = useMemo(
    () => [
      {
        key: "allTotalEarned",
        label: "All Employees Earned",
        value: formatCurrency(allEmployeeSalarySummary.earned),
        accent: "text-emerald-600",
        ring: "border-emerald-200 bg-emerald-50/80",
      },
      {
        key: "allTotalBonus",
        label: "All Employees Bonus",
        value: formatCurrency(allEmployeeSalarySummary.bonus),
        accent: "text-violet-600",
        ring: "border-violet-200 bg-violet-50/80",
      },
      {
        key: "allEarnedBonusTotal",
        label: "Earned + Bonus",
        value: formatCurrency(allEmployeeSalarySummary.earned + allEmployeeSalarySummary.bonus),
        accent: "text-blue-600",
        ring: "border-blue-200 bg-blue-50/80",
      },
      {
        key: "allPositiveFinalBalance",
        label: "Positive Final Balance",
        value: formatCurrency(allEmployeeSalarySummary.positiveFinal),
        accent: "text-emerald-600",
        ring: "border-emerald-200 bg-emerald-50/80",
      },
      {
        key: "allNegativeFinalBalance",
        label: "Negative Final Balance",
        value: formatCurrency(allEmployeeSalarySummary.negativeFinal),
        accent: "text-rose-600",
        ring: "border-rose-200 bg-rose-50/80",
      },
      {
        key: "allFinalBalance",
        label: "All Final Balance",
        value: formatCurrency(allEmployeeSalarySummary.final),
        accent: Number(allEmployeeSalarySummary.final) >= 0 ? "text-blue-600" : "text-rose-600",
        ring: Number(allEmployeeSalarySummary.final) >= 0
          ? "border-blue-200 bg-blue-50/80"
          : "border-rose-200 bg-rose-50/80",
      }
    ],
    [allEmployeeSalarySummary],
  )

  const getEmployeeAllFinalBalance = (employee) => {
    const records = allAttendanceByEmployee[employee._id] || []
    return calculateAttendanceSummary(employee, records).final
  }

  const getAttendanceDateKey = (value) => (value ? String(value).slice(0, 10) : "")

  const isNonBonusAttendance = (entry) => String(entry.status || "present").toLowerCase() !== "bonus"

  const hasDuplicateAttendance = ({ employeeId, date, excludeId = "" }) => {
    const dateKey = getAttendanceDateKey(date)

    if (!employeeId || !dateKey) {
      return false
    }

    return (allAttendanceByEmployee[employeeId] || []).some(
      (entry) =>
        entry._id !== excludeId &&
        isNonBonusAttendance(entry) &&
        getAttendanceDateKey(entry.date) === dateKey,
    )
  }
  const summaryCards = useMemo(
    () => [
      {
        key: "present",
        label: "Present",
        value: summary.present,
        accent: "text-emerald-500",
        ring: "border-emerald-200 bg-emerald-50/80",
      },
      {
        key: "presentHalf",
        label: "Present + Half Shift",
        value: summary.presentHalf,
        accent: "text-teal-500",
        ring: "border-teal-200 bg-teal-50/80",
      },
      {
        key: "half",
        label: "Half Shift",
        value: summary.half,
        accent: "text-amber-500",
        ring: "border-amber-200 bg-amber-50/80",
      },
      {
        key: "absent",
        label: "Absent",
        value: summary.absent,
        accent: "text-rose-500",
        ring: "border-rose-200 bg-rose-50/80",
      },
      {
        key: "double",
        label: "Double Shift",
        value: summary.doubleShift,
        accent: "text-sky-500",
        ring: "border-sky-200 bg-sky-50/80",
      },
      {
        key: "earned",
        label: "Earned",
        value: formatCurrency(summary.earned),
        accent: "text-emerald-600",
        ring: "border-emerald-200 bg-emerald-50/80",
      },
      {
        key: "shortage",
        label: "Shortage",
        value: formatCurrency(summary.shortage),
        accent: Number(summary.shortage) >= 0 ? "text-orange-500" : "text-rose-500",
        ring: Number(summary.shortage) >= 0
          ? "border-orange-200 bg-orange-50/80"
          : "border-rose-200 bg-rose-50/80",
      },
      {
        key: "advance",
        label: "Advance",
        value: formatCurrency(summary.advance),
        accent: "text-amber-600",
        ring: "border-amber-200 bg-amber-50/80",
      },
      {
        key: "lastMonthAdvance",
        label: "Last Month Advance",
        value: formatCurrency(lastMonthAdvance),
        accent: "text-orange-600",
        ring: "border-orange-200 bg-orange-50/80",
      },
      {
        key: "bonus",
        label: "Bonus",
        value: formatCurrency(summary.bonus),
        accent: "text-violet-600",
        ring: "border-violet-200 bg-violet-50/80",
      },
      {
        key: "searchFinalBalance",
        label: "Search Final Balance",
        value: formatCurrency(searchFinalSummary.final),
        accent: Number(searchFinalSummary.final) >= 0 ? "text-blue-600" : "text-rose-600",
        ring: Number(searchFinalSummary.final) >= 0
          ? "border-blue-200 bg-blue-50/80"
          : "border-rose-200 bg-rose-50/80",
      },
      {
        key: "searchMonthBalance",
        label: "Search Month Balance",
        value: formatCurrency(summary.final),
        accent: Number(summary.final) >= 0 ? "text-cyan-600" : "text-rose-600",
        ring: Number(summary.final) >= 0
          ? "border-cyan-200 bg-cyan-50/80"
          : "border-rose-200 bg-rose-50/80",
      },
      {
        key: "final",
        label: "Final Balance",
        value: formatCurrency(allTimeSummary.final),
        accent: Number(allTimeSummary.final) >= 0 ? "text-blue-600" : "text-rose-600",
        ring: Number(allTimeSummary.final) >= 0
          ? "border-blue-200 bg-blue-50/80"
          : "border-rose-200 bg-rose-50/80",
      },
    ],
    [allTimeSummary, lastMonthAdvance, searchFinalSummary, summary],
  )
  const visibleAllEmployeeSalaryCards = allEmployeeSalaryCards.filter((card) => canManagerShowCard(card.key))
  const visibleSummaryCards = summaryCards.filter((card) => canManagerShowCard(card.key))
  const mobileOverviewCards = [
    {
      key: "present",
      label: "Present",
      value: summary.present,
      accent: "text-emerald-600",
      barClass: "bg-emerald-500",
    },
    {
      key: "absent",
      label: "Absent",
      value: summary.absent,
      accent: "text-rose-600",
      barClass: "bg-rose-500",
    },
    {
      key: "earned",
      label: "Earned",
      value: formatCurrency(summary.earned + summary.bonus),
      accent: "text-blue-600",
      barClass: "bg-blue-500",
    },
  ].filter((card) => canManagerShowCard(card.key))
  const mobileSupplementalSummaryCards = visibleSummaryCards.filter(
    (card) => !mobileOverviewCards.some((overviewCard) => overviewCard.key === card.key),
  )

  const openLedger = async (employee, options = {}) => {
    if (options.toggle && selectedEmployee?._id === employee._id) {
      setSelectedEmployee(null)
      setAttendance([])
      setOpenCard(null)
      setExpandedAttendanceId(null)
      return
    }

    try {
      setSelectedEmployee(employee)
      setOpenCard(employee._id)
      setExpandedAttendanceId(null)
      setShowAllMobileSummary(false)
      const data = await getAttendance(employee._id)
      setAttendance(Array.isArray(data) ? data : [])
      window.requestAnimationFrame(() => {
        const scrollContainer = document.querySelector("main")
        scrollContainer?.scrollTo({ top: 0, behavior: "smooth" })
        window.scrollTo({ top: 0, behavior: "smooth" })
      })
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Unable to load attendance.",
      })
    }
  }

  const saveEmployee = async (data) => {
    if (editEmployee && !canManagerUse("editEmployee")) {
      setNotice({ type: "error", message: "You do not have access to edit employees." })
      return
    }

    if (!editEmployee && !canManagerUse("addEmployee")) {
      setNotice({ type: "error", message: "You do not have access to add employees." })
      return
    }

    try {
      if (editEmployee) {
        await updateEmployee(editEmployee._id, {
          ...data,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", message: "Employee updated successfully" })
      } else {
        await addEmployee(data)
        setNotice({ type: "success", message: "Employee added successfully" })
      }

      setModalOpen(false)
      setEditEmployee(null)
      await fetchEmployees()
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Unable to save employee.",
      })
    }
  }

  const openAttendanceModal = ({
    employeeId = "",
    allowEmployeeSelect = false,
    mode = "single",
  } = {}) => {
    if (!canManagerUse(editAttendance ? "editEntry" : "addEntry")) {
      setNotice({ type: "error", message: "You do not have access to this attendance action." })
      return
    }

    setEditAttendance(null)
    setAttendanceEntryMode(mode)
    setAttendanceContext({
      employeeId:
        mode === "multiple" && allowEmployeeSelect
          ? ""
          : employeeId || selectedEmployee?._id || filteredEmployees[0]?._id || "",
      allowEmployeeSelect,
    })
    setAttendanceModalOpen(true)
  }

  const openAttendanceModePrompt = ({
    employeeId = "",
    allowEmployeeSelect = false,
  } = {}) => {
    if (!canManagerUse("addEntry")) {
      setNotice({ type: "error", message: "You do not have access to add attendance entries." })
      return
    }

    setAttendanceModePrompt({
      employeeId: employeeId || selectedEmployee?._id || filteredEmployees[0]?._id || "",
      allowEmployeeSelect,
    })
  }

  const openBonusModal = (employeeId = "") => {
    if (!canManagerUse("addBonus")) {
      setNotice({ type: "error", message: "You do not have access to add bonus entries." })
      return
    }

    const defaultEmployeeId = employeeId || selectedEmployee?._id || employees[0]?._id || ""
    setBonusForm({
      date: new Date().toISOString().slice(0, 10),
      employeeTarget: employeeId || selectedEmployee?._id ? "selected" : "single",
      employeeId: defaultEmployeeId,
      payment: "",
      remark: "",
    })
    setBonusModalOpen(true)
  }

  const saveBonus = async () => {
    if (!bonusForm.date || !bonusForm.payment) {
      setNotice({ type: "error", message: "Please enter bonus date and payment amount." })
      return
    }

    const amount = Number(bonusForm.payment || 0)

    if (amount <= 0) {
      setNotice({ type: "error", message: "Bonus payment must be greater than zero." })
      return
    }

    const targetEmployees =
      bonusForm.employeeTarget === "all"
        ? employees
        : employees.filter((employee) => employee._id === bonusForm.employeeId)

    if (!targetEmployees.length) {
      setNotice({ type: "error", message: "Please select an employee for bonus entry." })
      return
    }

    setBonusSaving(true)

    try {
      for (const employee of targetEmployees) {
        await addAttendance(employee._id, {
          date: bonusForm.date,
          status: "bonus",
          shortage: 0,
          advanceCash: 0,
          advancePetrol: 0,
          bonusAmount: amount,
          remark: bonusForm.remark || "Bonus",
          createdByRole: user?.role || "Admin",
        })
      }

      setNotice({
        type: "success",
        message: `Bonus entry saved for ${targetEmployees.length} employee${targetEmployees.length === 1 ? "" : "s"}.`,
      })
      setBonusModalOpen(false)

      if (selectedEmployee && targetEmployees.some((employee) => employee._id === selectedEmployee._id)) {
        await openLedger(selectedEmployee)
      }
      await fetchEmployees()
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Unable to save bonus entry.",
      })
    } finally {
      setBonusSaving(false)
    }
  }

  const confirmAttendanceMode = (mode) => {
    if (!attendanceModePrompt) {
      return
    }

    openAttendanceModal({
      employeeId: attendanceModePrompt.employeeId,
      allowEmployeeSelect: attendanceModePrompt.allowEmployeeSelect,
      mode,
    })
    setAttendanceModePrompt(null)
  }

  const saveAttendance = async (formData) => {
    if (editAttendance && !canManagerUse("editEntry")) {
      setNotice({ type: "error", message: "You do not have access to edit attendance entries." })
      return
    }

    if (!editAttendance && !canManagerUse("addEntry")) {
      setNotice({ type: "error", message: "You do not have access to add attendance entries." })
      return
    }

    const { mode, employeeId, entries = [], ...payload } = formData
    const targetEmployeeId =
      editAttendance
        ? selectedEmployee?._id
        : employeeId || attendanceContext.employeeId || selectedEmployee?._id

    if (!targetEmployeeId) {
      setNotice({ type: "error", message: "Please select an employee." })
      return
    }

    if (
      mode !== "multiple" &&
      isNonBonusAttendance(payload) &&
      hasDuplicateAttendance({
        employeeId: targetEmployeeId,
        date: payload.date,
        excludeId: editAttendance?._id || "",
      })
    ) {
      setNotice({
        type: "error",
        message: "Attendance entry already exists for this employee on this date.",
      })
      return
    }

    setAttendanceSaving(true)

    try {
      if (editAttendance) {
        await updateAttendance(editAttendance._id, {
          ...payload,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user?.name || "Admin",
          lastEditedByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", message: "Attendance updated successfully" })
      } else if (mode === "multiple") {
        const validEntries = entries.filter((entry) => entry.date)

        if (!validEntries.length) {
          setNotice({ type: "error", message: "Please add at least one dated attendance row." })
          setAttendanceSaving(false)
          return
        }

        const missingEmployee = validEntries.some((entry) => !entry.employeeId && !targetEmployeeId)

        if (missingEmployee) {
          setNotice({ type: "error", message: "Please select an employee for every attendance row." })
          setAttendanceSaving(false)
          return
        }

        const seenAttendanceKeys = new Set()
        const hasDuplicateRow = validEntries.some((entry) => {
          if (!isNonBonusAttendance(entry)) {
            return false
          }

          const rowEmployeeId = entry.employeeId || targetEmployeeId
          const dateKey = getAttendanceDateKey(entry.date)
          const rowKey = `${rowEmployeeId}-${dateKey}`

          if (seenAttendanceKeys.has(rowKey) || hasDuplicateAttendance({ employeeId: rowEmployeeId, date: entry.date })) {
            return true
          }

          seenAttendanceKeys.add(rowKey)
          return false
        })

        if (hasDuplicateRow) {
          setNotice({
            type: "error",
            message: "Attendance entry already exists for this employee on this date.",
          })
          setAttendanceSaving(false)
          return
        }

        const touchedEmployeeIds = new Set()

        for (const entry of validEntries) {
          const rowEmployeeId = entry.employeeId || targetEmployeeId
          const { employeeId: _employeeId, ...entryPayload } = entry

          await addAttendance(rowEmployeeId, {
            ...entryPayload,
            createdByRole: user?.role || "Admin",
          })
          touchedEmployeeIds.add(rowEmployeeId)
        }

        setNotice({ type: "success", message: `${validEntries.length} attendance entries saved successfully.` })

        if (selectedEmployee?._id && touchedEmployeeIds.has(selectedEmployee._id)) {
          await openLedger(selectedEmployee)
        }
      } else {
        await addAttendance(targetEmployeeId, {
          ...payload,
          createdByRole: user?.role || "Admin",
        })
        setNotice({ type: "success", message: "Attendance added successfully" })
      }

      setAttendanceModalOpen(false)
      setEditAttendance(null)

      const targetEmployee = employees.find((employee) => employee._id === targetEmployeeId)
      if (targetEmployee && mode !== "multiple") {
        await openLedger(targetEmployee)
      }
      await fetchEmployees()
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Unable to save attendance.",
      })
    } finally {
      setAttendanceSaving(false)
    }
  }

  const requestDeleteEmployee = (employee) => {
    if (!canManagerUse("deleteEmployee")) {
      setNotice({ type: "error", message: "You do not have access to delete employees." })
      return
    }

    setConfirmModal({
      title: "Delete Employee",
      description: `Do you want to permanently delete ${employee.name}?`,
      confirmLabel: "Delete",
      tone: "danger",
      action: async () => {
        await deleteEmployee(employee._id)
        if (selectedEmployee?._id === employee._id) {
          setSelectedEmployee(null)
          setAttendance([])
          setOpenCard(null)
        }
        await fetchEmployees()
        setNotice({ type: "success", message: "Employee deleted successfully" })
      },
    })
  }

  const requestDeleteAttendance = (entry) => {
    if (!canManagerUse("deleteEntry")) {
      setNotice({ type: "error", message: "You do not have access to delete attendance entries." })
      return
    }

    setConfirmModal({
      title: "Delete Attendance Entry",
      description: `Do you want to delete the attendance entry dated ${String(entry.date).slice(0, 10)} for ${selectedEmployee?.name || "this employee"}?`,
      confirmLabel: "Delete",
      tone: "danger",
      action: async () => {
        await deleteAttendance(entry._id)
        if (selectedEmployee) {
          await openLedger(selectedEmployee)
        }
        await fetchEmployees()
        setNotice({ type: "success", message: "Attendance entry deleted successfully" })
      },
    })
  }

  const requestDeleteMonth = () => {
    if (!canManagerUse("deleteEntry")) {
      setNotice({ type: "error", message: "You do not have access to delete attendance entries." })
      return
    }

    if (!selectedEmployee) {
      setNotice({ type: "error", message: "Please select an employee first." })
      return
    }

    if (!selectedMonth) {
      setNotice({ type: "error", message: "Please select a month before deleting." })
      return
    }

    const [year, month] = selectedMonth.split("-")

    setConfirmModal({
      title: "Delete Month Entries",
      description: `Do you want to delete all attendance entries for ${selectedEmployee.name} in ${selectedMonth}?`,
      confirmLabel: "Delete Month",
      tone: "danger",
      action: async () => {
        await deleteAttendanceMonth(selectedEmployee._id, year, month)
        await openLedger(selectedEmployee)
        setNotice({ type: "success", message: "Month entries deleted successfully" })
      },
    })
  }

  const handleConfirm = async () => {
    if (!confirmModal?.action) {
      return
    }

    try {
      await confirmModal.action()
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Unable to complete this action.",
      })
    } finally {
      setConfirmModal(null)
    }
  }

  const openReportModal = (employeeId = "") => {
    if (!canManagerUse("exportPdf")) {
      setNotice({ type: "error", message: "You do not have access to export reports." })
      return
    }

    setReportEmployeeId(employeeId || selectedEmployee?._id || filteredEmployees[0]?._id || "")
    setReportModalOpen(true)
  }

  const generateReport = async () => {
    if (!reportEmployeeId) {
      setNotice({ type: "error", message: "Please select an employee for the report." })
      return
    }

    const employee = employees.find((item) => item._id === reportEmployeeId)
    if (!employee) {
      setNotice({ type: "error", message: "Selected employee was not found." })
      return
    }

    try {
      const sourceEntries =
        selectedEmployee?._id === employee._id ? attendance : await getAttendance(employee._id)
      const filteredEntries = getReportEntries(sourceEntries, fromDate, toDate)
        .sort((left, right) => new Date(left.date) - new Date(right.date))

      if (!filteredEntries.length) {
        setNotice({ type: "error", message: "No entries were found in the selected date range." })
        return
      }

      if (reportFormat === "excel") {
        buildAttendanceReportExcel({
          employee,
          entries: filteredEntries,
          fromDate,
          toDate,
        })
      } else {
        buildAttendanceReportPdf({
          employee,
          entries: filteredEntries,
          fromDate,
          toDate,
        })
      }

      setReportModalOpen(false)
      setNotice({ type: "success", message: "Report generated successfully" })
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || "Unable to generate the report.",
      })
    }
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-3 pb-24 text-[color:var(--text-primary)] sm:p-6 sm:pb-6">
      <div className={selectedEmployee ? "hidden" : "hidden flex-col gap-3 sm:flex sm:gap-4"}>

      <div className="mb-0 rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-3 shadow-[0_12px_28px_rgba(16,24,20,0.06)] sm:rounded-2xl sm:px-5">
        <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
            {/* SVG Icon */}
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6 text-emerald-600"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <h1 className="truncate text-lg font-extrabold tracking-tight text-[var(--text-strong)] sm:text-xl">
              Employees & Attendance
            </h1>

            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:px-3 sm:text-xs">
              {employees.length} Employees
            </span>
          </div>

          <div className="h-1 w-16 rounded-full bg-emerald-200"></div>
        </div>
      </div>

        {notice ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              notice.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-3 sm:gap-4">
          {visibleAllEmployeeSalaryCards.map((card) => (
            <SummaryCard
              key={card.key}
              label={card.label}
              value={card.value}
              accent={card.accent}
              ring={card.ring}
            />
          ))}
        </div>

        <div className="hidden flex-col gap-3 xl:flex xl:flex-row xl:items-center">
          <label className="relative block w-full xl:max-w-[420px]">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)]" />
            <input
              placeholder="Search employees"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input w-full pl-11"
            />
          </label>

          <div className="hidden flex-wrap gap-3 sm:flex xl:ml-auto">
            {!isManager ? (
              <button
                type="button"
                onClick={() => navigate("/admin/employee-attendance-dashboard")}
                className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 font-medium text-violet-700 shadow-sm"
              >
                <ChartNoAxesCombined size={18} />
                Workforce Dashboard
              </button>
            ) : null}
            {canManagerUse("addEmployee") ? (
              <button
                className="rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white shadow-sm"
                onClick={() => {
                  setEditEmployee(null)
                  setModalOpen(true)
                }}
              >
                + Add Employee
              </button>
            ) : null}

            {canManagerUse("exportPdf") ? (
              <button
                className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm"
                onClick={() =>
                  buildEmployeesDirectoryPdf(
                    filteredEmployees,
                    getEmployeeAllFinalBalance
                  )
                }
              >
                PDF
              </button>
            ) : null}

            {canManagerUse("addEntry") ? (
              <button
                className="rounded-2xl bg-green-600 px-5 py-3 font-medium text-white shadow-sm"
                onClick={() =>
                  openAttendanceModePrompt({ allowEmployeeSelect: true })
                }
              >
                + Add Entry
              </button>
            ) : null}

            {canManagerUse("addBonus") ? (
              <button
                className="rounded-2xl bg-violet-600 px-5 py-3 font-medium text-gray-50 shadow-sm"
                onClick={() => openBonusModal()}
              >
                + Add Bonus
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <section className={selectedEmployee ? "hidden" : "space-y-3 sm:hidden"}>
        <div className="flex items-center gap-4 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-emerald-500/10 text-emerald-600">
            <Home size={21} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-black tracking-tight text-[color:var(--text-strong)]">Employees</h1>
            <p className="text-[11px] font-semibold text-[color:var(--text-secondary)]">Attendance & workforce</p>
          </div>
          <div className="ml-auto h-1.5 w-14 rounded-full bg-emerald-400/70" />
        </div>

        <div className="relative min-h-[142px] overflow-hidden rounded-[26px] bg-gradient-to-br from-[#087b5a] via-[#079968] to-[#08c38b] px-5 pt-5 text-white shadow-xl shadow-emerald-900/10">
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-white/90">Total Employees</p>
              <p className="mt-1 text-[38px] font-black leading-none tracking-tight">{employees.length}</p>
              <p className="mt-2 text-xs font-semibold text-white/85">{filteredEmployees.length} showing in directory</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-black/15 text-white shadow-inner">
              <BriefcaseBusiness size={27} />
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-8 -right-4 h-28 w-52 rounded-full border-[3px] border-white/20" />
          <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-52 rounded-full border-[3px] border-white/10" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="min-h-[104px] rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><UsersIcon /></div>
            <p className="text-[10px] font-semibold text-[color:var(--text-secondary)]">Earned</p>
            <p className="mt-1 truncate text-[12px] font-extrabold text-emerald-600">{formatCurrency(allEmployeeSalarySummary.earned)}</p>
          </div>
          <div className="min-h-[104px] rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-violet-600"><CalendarDays size={18} /></div>
            <p className="text-[10px] font-semibold text-[color:var(--text-secondary)]">Bonus</p>
            <p className="mt-1 truncate text-[12px] font-extrabold text-violet-600">{formatCurrency(allEmployeeSalarySummary.bonus)}</p>
          </div>
          <div className="min-h-[104px] rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-600"><BriefcaseBusiness size={18} /></div>
            <p className="text-[10px] font-semibold text-[color:var(--text-secondary)]">Balance</p>
            <p className={`mt-1 truncate text-[12px] font-extrabold ${allEmployeeSalarySummary.final >= 0 ? "text-blue-600" : "text-rose-600"}`}>{formatCurrency(allEmployeeSalarySummary.final)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="relative min-w-0 flex-1">
            <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)]" />
            <input
              placeholder="Search employees..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-[45px] w-full rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] py-2 pl-11 pr-3 text-[14px] font-medium text-[color:var(--text-primary)] shadow-sm outline-none placeholder:text-[color:var(--text-secondary)] focus:border-emerald-500"
            />
          </label>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="inline-flex h-[45px] items-center gap-2 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 text-[13px] font-bold text-emerald-600 shadow-sm"
          >
            <Filter size={18} />
            <span>Clear</span>
          </button>
        </div>

        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-sm font-extrabold text-[color:var(--text-strong)]">Team Directory</p>
          <p className="text-xs font-semibold text-[color:var(--text-secondary)]">{filteredEmployees.length} members</p>
        </div>

        <div className="mb-24 space-y-3">
          {filteredEmployees.length === 0 ? (
            <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-center text-sm font-bold text-[color:var(--text-secondary)] shadow-sm">No employees found.</div>
          ) : filteredEmployees.map((employee) => (
            <div
              key={employee._id}
              role="button"
              tabIndex={0}
              onClick={() => openLedger(employee, { toggle: true })}
              onKeyDown={(event) => event.key === "Enter" && openLedger(employee, { toggle: true })}
              className="flex min-h-[70px] cursor-pointer items-center justify-between gap-2 rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 shadow-sm active:scale-[0.985]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600">{(employee.name || "E").slice(0, 1).toUpperCase()}</div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold text-[color:var(--text-strong)]">{employee.name}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-[color:var(--text-secondary)]">{employee.role || "Employee"} · Shift {employee.shift || "-"}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <div className="text-right">
                  <p className="text-[13px] font-extrabold text-blue-600">{formatCurrency(getEmployeeAllFinalBalance(employee))}</p>
                  <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-extrabold text-emerald-600">{employee.phone || "No phone"}</span>
                </div>
                <MoreVertical size={18} className="text-[color:var(--text-secondary)]" />
              </div>
            </div>
          ))}
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-40 mx-3 mb-2 flex h-[72px] items-center justify-around rounded-[25px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-2 shadow-lg">
          <button type="button" className="flex min-w-[58px] flex-col items-center gap-1 font-extrabold text-emerald-600"><Home size={21} /><span className="text-[10px]">Directory</span><span className="mt-0.5 h-[3px] w-8 rounded-full bg-emerald-600" /></button>
          <button type="button" onClick={() => document.querySelector('input[placeholder="Search employees..."]')?.focus()} className="flex min-w-[58px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"><UsersIcon /><span className="text-[10px]">Employees</span></button>
          <button type="button" onClick={() => openReportModal()} className="flex min-w-[58px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"><CalendarDays size={21} /><span className="text-[10px]">Reports</span></button>
          <button type="button" onClick={() => navigate("/admin/employee-attendance-dashboard")} className="flex min-w-[58px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"><LayoutGrid size={21} /><span className="text-[10px]">Overview</span></button>
        </nav>
      </section>

      <div className={selectedEmployee ? "hidden" : "mt-5 hidden overflow-x-auto sm:block"}>
        <table className="table min-w-[980px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Shift</th>
              <th>Phone</th>
              <th>Salary</th>
              <th>All Final Balance</th>
              <th>Tshirt</th>
              <th>Pant</th>
              <th>Shoes</th>
              <th>Audit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr
                key={employee._id}
                className="cursor-pointer transition"
                onClick={() => openLedger(employee, { toggle: true })}
              >
                <td>{employee.name}</td>
                <td>{employee.role}</td>
                <td>{employee.shift}</td>
                <td>{employee.phone}</td>
                <td>{formatCurrency(employee.salary)}</td>
                <td>
                  <span className={getEmployeeAllFinalBalance(employee) >= 0 ? "font-semibold text-blue-600" : "font-semibold text-rose-600"}>
                    {formatCurrency(getEmployeeAllFinalBalance(employee))}
                  </span>
                </td>
                <td>{employee.tshirt}</td>
                <td>{employee.pant}</td>
                <td>{employee.shoes}</td>
                <td>
                  <div className="text-xs leading-5 text-[color:var(--text-secondary)]">
                    <div>{employee.lastEditedAt ? new Date(employee.lastEditedAt).toLocaleString("en-IN") : "Not edited yet"}</div>
                    <div>
                      {employee.lastEditedBy || "-"} {employee.lastEditedByRole ? `(${employee.lastEditedByRole})` : ""}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    {canManagerUse("editEmployee") ? (
                      <button
                        className="text-blue-500"
                        onClick={(event) => {
                          event.stopPropagation()
                          setEditEmployee(employee)
                          setModalOpen(true)
                        }}
                      >
                        Edit
                      </button>
                    ) : null}
                    {canManagerUse("deleteEmployee") ? (
                      <button
                        className="text-red-500"
                        onClick={(event) => {
                          event.stopPropagation()
                          requestDeleteEmployee(employee)
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        {filteredEmployees.map((employee) => {
          const isOpen = openCard === employee._id
          const isSelected = selectedEmployee?._id === employee._id

          return (
            <div
              key={employee._id}
              className="rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-[0_14px_28px_rgba(16,24,20,0.07)]"
            >
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (isSelected) {
                    setSelectedEmployee(null)
                    setOpenCard(null)
                    setAttendance([])
                  } else {
                    openLedger(employee, { toggle: true })
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-base font-extrabold text-emerald-600">
                    {(employee.name || "E").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-[color:var(--text-strong)]">
                      {employee.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-[color:var(--text-secondary)]">
                      <BriefcaseBusiness size={13} /> {employee.role || "Employee"} · Shift {employee.shift || "-"}
                    </p>
                  </div>
                  <ChevronRight size={19} className="shrink-0 text-[color:var(--text-secondary)]" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-[var(--bg-soft)] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Salary</p>
                    <p className="mt-1 text-sm font-bold text-emerald-600">{formatCurrency(employee.salary)}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--bg-soft)] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Balance</p>
                    <p className={`mt-1 text-sm font-bold ${getEmployeeAllFinalBalance(employee) >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                      {formatCurrency(getEmployeeAllFinalBalance(employee))}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[color:var(--text-secondary)]">
                  <span className="flex min-w-0 items-center gap-1 truncate"><Phone size={13} /> {employee.phone || "No phone"}</span>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">View details</span>
                </div>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "mt-4 max-h-[220px]" : "max-h-0"
                }`}
              >
                <div className="space-y-3 border-t border-[var(--border-color)] pt-3">
                  {canManagerUse("editEmployee") || canManagerUse("deleteEmployee") ? (
                    <div className="flex gap-3">
                      {canManagerUse("editEmployee") ? (
                        <button
                          onClick={() => {
                            setEditEmployee(employee)
                            setModalOpen(true)
                          }}
                          className="flex-1 rounded-xl border border-blue-200 bg-blue-50 py-2 text-sm font-medium text-blue-600"
                        >
                          Edit
                        </button>
                      ) : null}
                      {canManagerUse("deleteEmployee") ? (
                        <button
                          onClick={() => requestDeleteEmployee(employee)}
                          className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {canManagerUse("exportPdf") || canManagerUse("addEntry") ? (
                    <div className="flex gap-3">
                      {canManagerUse("exportPdf") ? (
                        <button
                          onClick={() => openReportModal(employee._id)}
                          className="flex-1 rounded-xl border border-blue-200 bg-blue-50 py-2 text-sm font-medium text-blue-600"
                        >
                          Generate Report
                        </button>
                      ) : null}
                      {canManagerUse("addEntry") ? (
                        <button
                          onClick={() =>
                            openAttendanceModePrompt({
                              employeeId: employee._id,
                              allowEmployeeSelect: false,
                            })
                          }
                          className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-600"
                        >
                          + Add
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {canManagerUse("addBonus") ? (
                    <button
                      onClick={() => openBonusModal(employee._id)}
                      className="w-full rounded-xl border border-violet-200 bg-violet-50 py-2 text-sm font-medium text-violet-600"
                    >
                      + Add Bonus
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedEmployee ? (
        <>
        <section className="pb-24 sm:hidden">
          <div className="mb-2 flex items-center gap-3 rounded-[15px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setSelectedEmployee(null)
                setOpenCard(null)
                setAttendance([])
                setExpandedAttendanceId(null)
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[color:var(--text-secondary)]"
              title="Back to employees"
            >
              <ChevronRight size={19} className="rotate-180" />
            </button>
            <div className="min-w-0"><h1 className="truncate text-[20px] font-black tracking-tight text-[color:var(--text-strong)]">Employee Attendance</h1></div>
            <div className="ml-auto h-1.5 w-20 rounded-full bg-emerald-400/60" />
          </div>

          <div className="relative mb-2 min-h-[132px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#087b5a] via-[#069f70] to-[#08c38b] px-4 py-4 text-white shadow-xl shadow-emerald-900/10">
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="truncate text-[17px] font-extrabold text-white">{selectedEmployee.name}</p><p className="mt-1 truncate text-[11px] font-semibold text-white/80">{selectedEmployee.role || "Employee"} · {selectedEmployee.phone || "No phone"}</p><div className="mt-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">Final balance</p><p className="mt-1 text-[28px] font-black leading-none tracking-tight">{formatCurrency(allTimeSummary.final)}</p></div></div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-black text-white">{(selectedEmployee.name || "E").slice(0, 1).toUpperCase()}</div>
            </div>
            <div className="pointer-events-none absolute -bottom-10 -right-9 h-32 w-32 rounded-full border-[18px] border-white/10" />
          </div>

          <div className="mb-2 grid grid-cols-3 gap-2">
            {mobileOverviewCards.map((card) => (
              <div key={card.key} className="relative flex min-h-[76px] flex-col justify-between overflow-hidden rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 shadow-sm">
                <div><p className="text-[10px] font-semibold text-[color:var(--text-secondary)]">{card.label}</p><p className={`mt-2 truncate text-[13px] font-extrabold ${card.accent}`}>{card.value}</p></div>
                <span className={`h-1 w-full rounded-full ${card.barClass}`} />
              </div>
            ))}
          </div>

          {mobileSupplementalSummaryCards.length > 0 ? <button type="button" onClick={() => setShowAllMobileSummary((current) => !current)} className="mb-2 flex h-10 w-full items-center justify-center gap-2 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] text-xs font-extrabold text-emerald-600 shadow-sm"><LayoutGrid size={15} />{showAllMobileSummary ? "Hide month totals" : "View full month totals"}<ChevronDown size={15} className={showAllMobileSummary ? "rotate-180" : ""} /></button> : null}

          {showAllMobileSummary ? <div className="mb-2 grid grid-cols-3 gap-2">{mobileSupplementalSummaryCards.map((card) => <SummaryCard key={card.key} label={card.label} value={card.value} accent={card.accent} ring={card.ring} compact />)}</div> : null}

          <div className="mb-2 flex items-center gap-2.5"><input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="h-[45px] min-w-0 flex-1 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 text-[13px] font-semibold text-[color:var(--text-primary)] shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" /><span className="inline-flex h-[45px] items-center rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 text-[11px] font-extrabold text-emerald-600 shadow-sm">{sortedAttendance.length} records</span></div>

          <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-sm font-extrabold text-[color:var(--text-strong)]">Attendance history</h2><span className="text-[11px] font-semibold text-[color:var(--text-secondary)]">Newest first</span></div>

          <div className="mb-24 space-y-3">
            {sortedAttendance.length === 0 ? <div className="rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-center text-sm font-bold text-[color:var(--text-secondary)]">No attendance records for this month.</div> : sortedAttendance.map((entry) => {
              const isExpanded = expandedAttendanceId === entry._id
              const entryStatus = statusMeta[entry.status] || {}
              const statusTone = {
                present: "bg-emerald-50 text-emerald-700 ring-emerald-200",
                present_half: "bg-teal-50 text-teal-700 ring-teal-200",
                half: "bg-amber-50 text-amber-700 ring-amber-200",
                absent: "bg-rose-50 text-rose-700 ring-rose-200",
                double: "bg-sky-50 text-sky-700 ring-sky-200",
                bonus: "bg-violet-50 text-violet-700 ring-violet-200",
              }[entry.status] || "bg-slate-50 text-slate-700 ring-slate-200"
              return (
                <div key={entry._id} className="overflow-hidden rounded-[22px] border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-sm">
                  <button type="button" onClick={() => setExpandedAttendanceId(isExpanded ? null : entry._id)} className="flex h-[58px] w-full items-center justify-between gap-2 px-3 text-left active:scale-[0.985]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[17px] border ${statusTone}`}><CalendarDays size={19} /></span>
                      <div className="min-w-0"><p className="truncate text-[13px] font-extrabold leading-tight text-[color:var(--text-strong)]">{entryStatus.label || entry.status || "Attendance"}</p><div className="mt-1 flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-emerald-500" /><p className="truncate text-[11px] font-semibold text-[color:var(--text-secondary)]">{entry.date ? String(entry.date).slice(0, 10) : "-"}</p></div></div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1"><div className="text-right"><p className={`text-[13px] font-extrabold tracking-tight ${entryStatus.numberClass || "text-[color:var(--text-strong)]"}`}>{formatCurrency(entry.shortage)}</p><span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-extrabold text-emerald-600">Cash {formatCurrency(entry.advanceCash)}</span></div><ChevronDown size={17} className={`text-[color:var(--text-secondary)] transition-transform ${isExpanded ? "rotate-180" : ""}`} /></div>
                  </button>
                  {isExpanded ? <div className="mx-3 mb-3 space-y-2 rounded-[14px] bg-[var(--bg-soft)] p-2.5 text-[11px] text-[color:var(--text-secondary)]"><p className="leading-5">Remark: <span className="font-semibold text-[color:var(--text-primary)]">{entry.remark || "No remark added"}</span></p><p>Edited by: <span className="font-semibold text-[color:var(--text-primary)]">{entry.lastEditedBy || "Not edited yet"}</span></p><div className="flex gap-2 pt-0.5">{canManagerUse("editEntry") ? <button type="button" title="Edit attendance" onClick={() => { setAttendanceEntryMode("single"); setEditAttendance(entry); setAttendanceContext({ employeeId: selectedEmployee._id, allowEmployeeSelect: false }); setAttendanceModalOpen(true) }} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[11px] bg-blue-600 text-[11px] font-extrabold text-white"><Pencil size={14} /> Edit</button> : null}{canManagerUse("deleteEntry") ? <button type="button" title="Delete attendance" onClick={() => requestDeleteAttendance(entry)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[11px] bg-rose-50 text-[11px] font-extrabold text-rose-600"><Trash2 size={14} /> Delete</button> : null}</div></div> : null}
                </div>
              )
            })}
          </div>

          <nav className="fixed bottom-0 left-0 right-0 z-40 mx-3 mb-2 flex h-[68px] items-center justify-around rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)] px-2 shadow-lg sm:hidden">
            <button type="button" onClick={() => { setSelectedEmployee(null); setAttendance([]); setOpenCard(null) }} className="flex min-w-[58px] flex-col items-center gap-1 font-extrabold text-emerald-600"><Home size={20} /><span className="text-[10px]">Employees</span><span className="h-[3px] w-7 rounded-full bg-emerald-600" /></button>
            <button type="button" onClick={() => setExpandedAttendanceId(null)} className="flex min-w-[58px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"><CalendarDays size={20} /><span className="text-[10px]">Attendance</span></button>
            <button type="button" onClick={() => openReportModal(selectedEmployee._id)} className="flex min-w-[58px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"><LayoutGrid size={20} /><span className="text-[10px]">Reports</span></button>
            <button type="button" onClick={() => document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" })} className="flex min-w-[58px] flex-col items-center gap-1 text-[color:var(--text-secondary)]"><BriefcaseBusiness size={20} /><span className="text-[10px]">Profile</span></button>
          </nav>
        </section>

        <div className="hidden rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_16px_32px_rgba(16,24,20,0.05)] sm:block">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedEmployee(null)
                setOpenCard(null)
                setAttendance([])
                setExpandedAttendanceId(null)
              }}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] text-gray-50 px-4 py-2 text-sm font-semibold text-[color:var(--text-primary)] shadow-sm transition hover:border-blue-300 hover:text-blue-600"
            >
              Back to Employees
            </button>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Employee Detail View
            </span>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">
                Attendance: {selectedEmployee.name}
              </h2>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                The newest entries stay visible first. Older records remain available by scroll.
              </p>
            </div>

            {/* <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--text-primary)]">
              Final Balance:{" "}
              <span className={Number(summary.final) >= 0 ? "text-blue-600" : "text-rose-500"}>
                {formatCurrency(summary.final)}
              </span>
            </div> */}

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-11 w-[150px] flex-none rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 text-sm font-semibold text-[color:var(--text-primary)] shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              
              {canManagerUse("addEntry") ? (
                <button
                  className="rounded-2xl bg-green-600 px-5 py-3 font-medium text-white shadow-sm"
                  onClick={() =>
                    openAttendanceModePrompt({
                      employeeId: selectedEmployee._id,
                      allowEmployeeSelect: false,
                    })
                  }
                >
                  + Add
                </button>
              ) : null}
              {canManagerUse("addBonus") ? (
                <button
                  className="rounded-2xl bg-violet-600 px-5 py-3 font-medium  text-gray-50 shadow-sm"
                  onClick={() => openBonusModal(selectedEmployee._id)}
                >
                  + Bonus
                </button>
              ) : null}
              {canManagerUse("exportPdf") ? (
                <button
                  className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm"
                  onClick={() => openReportModal(selectedEmployee._id)}
                >
                  Generate Report
                </button>
              ) : null}
              {canManagerUse("deleteEntry") ? (
                <button
                  className="rounded-2xl bg-red-50 px-5 py-3 font-medium text-red-500 shadow-sm ring-1 ring-red-200"
                  onClick={requestDeleteMonth}
                >
                  Delete Month
                </button>
              ) : null}
            </div>
          </div>
{/* 
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {salaryTopCards.map((card) => (
              <SummaryCard
                key={card.key}
                label={card.label}
                value={card.value}
                accent={card.accent}
                ring={card.ring}
              />
            ))}
          </div> */}

        <div className="mt-5 hidden gap-4 lg:grid sm:grid-cols-2 xl:grid-cols-4">
          {visibleSummaryCards.map((card) => (
            <SummaryCard
              key={card.key}
              label={card.label}
              value={card.value}
              accent={card.accent}
              ring={card.ring}
            />
          ))}
        </div>

          <div className="mt-6 hidden max-h-[620px] overflow-x-auto overflow-y-auto rounded-[24px] border border-[var(--border-strong)] sm:block">
            <table className="table min-w-[900px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Short</th>
                  <th>Cash</th>
                  <th>Petrol</th>
                  <th>Bonus</th>
                  <th>Remark</th>
                  <th>Audit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedAttendance.map((entry) => (
                  <tr key={entry._id}>
                    <td>{entry.date ? String(entry.date).slice(0, 10) : "-"}</td>
                    <td>
                      <span className={statusMeta[entry.status]?.numberClass || "text-[color:var(--text-primary)]"}>
                        {statusMeta[entry.status]?.label || entry.status}
                      </span>
                    </td>
                    <td className={Number(entry.shortage) >= 0 ? "text-emerald-500" : "text-rose-500"}>
                      {entry.shortage || 0}
                    </td>
                    <td>{entry.advanceCash || 0}</td>
                    <td>{entry.advancePetrol || 0}</td>
                    <td className="text-violet-500">{entry.bonusAmount || 0}</td>
                    <td>{entry.remark || "-"}</td>
                    <td className="text-left text-xs leading-6 text-[color:var(--text-secondary)]">
                      {entry.lastEditedAt ? (
                        <>
                          <div>{new Date(entry.lastEditedAt).toLocaleString("en-IN")}</div>
                          <div>
                            {entry.lastEditedBy || "-"} {entry.lastEditedByRole ? `(${entry.lastEditedByRole})` : ""}
                          </div>
                        </>
                      ) : (
                        <span>Not edited yet</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-3">
                        {canManagerUse("editEntry") ? (
                          <button
                            className="text-blue-500"
                            onClick={() => {
                              setAttendanceEntryMode("single")
                              setEditAttendance(entry)
                              setAttendanceContext({
                                employeeId: selectedEmployee._id,
                                allowEmployeeSelect: false,
                              })
                              setAttendanceModalOpen(true)
                            }}
                          >
                            Edit
                          </button>
                        ) : null}
                        {canManagerUse("deleteEntry") ? (
                          <button
                            className="text-red-500"
                            onClick={() => requestDeleteAttendance(entry)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-4 sm:hidden">
            <div className="grid grid-cols-2 gap-3">
              {visibleSummaryCards.map((card) => (
                <SummaryCard
                  key={card.key}
                  label={card.label}
                  value={card.value}
                  accent={card.accent}
                  ring={card.ring}
                  compact
                />
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-11 w-[150px] flex-none rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 text-sm font-semibold text-[color:var(--text-primary)] shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm"
                onClick={() => openReportModal(selectedEmployee._id)}
              >
                Generate Report
              </button>
            </div>

            <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
              {sortedAttendance.map((entry) => {
                const isExpanded = expandedAttendanceId === entry._id

                return (
                  <div
                    key={entry._id}
                    className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedAttendanceId(isExpanded ? null : entry._id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-[color:var(--text-secondary)]">
                            {entry.date ? String(entry.date).slice(0, 10) : "-"}
                          </p>
                          <p className={`mt-1 text-base font-semibold ${statusMeta[entry.status]?.numberClass || ""}`}>
                            {statusMeta[entry.status]?.label || entry.status}
                          </p>
                        </div>
                        <p className={Number(entry.shortage) >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {entry.shortage || 0}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                        Cash {entry.advanceCash || 0} | Petrol {entry.advancePetrol || 0} | Bonus {entry.bonusAmount || 0}
                      </p>
                    </div>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isExpanded ? "mt-4 max-h-[180px]" : "max-h-0"
                      }`}
                    >
                      <div className="space-y-3 border-t border-[var(--border-color)] pt-3">
                        <p className="text-sm text-[color:var(--text-secondary)]">
                          Remark:{" "}
                          <span className="text-[color:var(--text-strong)]">
                            {entry.remark || "-"}
                          </span>
                        </p>
                        <p className="text-sm text-[color:var(--text-secondary)]">
                          Last Edited:{" "}
                          <span className="text-[color:var(--text-strong)]">
                            {entry.lastEditedAt
                              ? new Date(entry.lastEditedAt).toLocaleString("en-IN")
                              : "Not edited yet"}
                          </span>
                        </p>
                        <p className="text-sm text-[color:var(--text-secondary)]">
                          Edited By:{" "}
                          <span className="text-[color:var(--text-strong)]">
                            {entry.lastEditedBy || "-"} {entry.lastEditedByRole ? `(${entry.lastEditedByRole})` : ""}
                          </span>
                        </p>
                        {canManagerUse("editEntry") || canManagerUse("deleteEntry") ? (
                          <div className="flex gap-3">
                            {canManagerUse("editEntry") ? (
                              <button
                                className="flex-1 rounded-xl border border-blue-200 bg-blue-50 py-2 text-sm font-medium text-blue-600"
                                onClick={() => {
                                  setAttendanceEntryMode("single")
                                  setEditAttendance(entry)
                                  setAttendanceContext({
                                    employeeId: selectedEmployee._id,
                                    allowEmployeeSelect: false,
                                  })
                                  setAttendanceModalOpen(true)
                                }}
                              >
                                Edit
                              </button>
                            ) : null}
                            {canManagerUse("deleteEntry") ? (
                              <button
                                className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600"
                                onClick={() => requestDeleteAttendance(entry)}
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        </>
      ) : null}

      {reportModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_24px_48px_rgba(15,23,42,0.24)]">
            <h3 className="text-xl font-semibold text-[color:var(--text-strong)]">
              Generate Attendance Report
            </h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              Select an employee, choose the date range, and export the report in PDF or Excel.
            </p>

            <div className="mt-5 grid gap-3">
              <select
                value={reportEmployeeId}
                onChange={(event) => setReportEmployeeId(event.target.value)}
                className="input"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="input"
              />

              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="input"
              />

              <select
                value={reportFormat}
                onChange={(event) => setReportFormat(event.target.value)}
                className="input"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]"
                onClick={() => setReportModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white shadow-sm"
                onClick={generateReport}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <EmployeeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditEmployee(null)
        }}
        onSave={saveEmployee}
        editData={editEmployee}
      />

      {bonusModalOpen ? (
        <BonusModal
          form={bonusForm}
          employees={employees}
          saving={bonusSaving}
          onChange={(patch) => setBonusForm((current) => ({ ...current, ...patch }))}
          onClose={() => {
            if (!bonusSaving) {
              setBonusModalOpen(false)
            }
          }}
          onSave={saveBonus}
        />
      ) : null}

      <AttendanceModal
        key={`${editAttendance?._id || "new"}-${attendanceContext.employeeId || "none"}-${
          attendanceModalOpen ? "open" : "closed"
        }`}
        open={attendanceModalOpen}
        onClose={() => {
          if (attendanceSaving) {
            return
          }
          setAttendanceModalOpen(false)
          setEditAttendance(null)
        }}
        onSave={saveAttendance}
        editData={editAttendance}
        employees={employees}
        selectedEmployeeId={attendanceContext.employeeId}
        showEmployeeSelector={attendanceContext.allowEmployeeSelect && !editAttendance}
        saving={attendanceSaving}
        entryMode={attendanceEntryMode}
      />

      {attendanceModePrompt ? (
        <ConfirmDialog
          title="Choose Attendance Entry Mode"
          description="Select whether you want to create a single attendance entry or save multiple entries at once."
          confirmLabel="Single Entry"
          secondaryLabel="Multiple Entry"
          tone="primary"
          onCancel={() => setAttendanceModePrompt(null)}
          onConfirm={() => confirmAttendanceMode("single")}
          onSecondaryAction={() => confirmAttendanceMode("multiple")}
        />
      ) : null}

      {confirmModal ? (
        <ConfirmDialog
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          tone={confirmModal.tone}
          onCancel={() => setConfirmModal(null)}
          onConfirm={handleConfirm}
        />
      ) : null}

      <MobileActionFab
        actions={[
          selectedEmployee && canManagerUse("exportPdf")
            ? {
                label: "Generate Report",
                className: "bg-blue-700",
                onClick: () => openReportModal(selectedEmployee._id),
              }
            : null,
          selectedEmployee && canManagerUse("addEntry")
            ? {
                label: "Add Attendance",
                className: "bg-green-600",
                onClick: () => openAttendanceModePrompt({ employeeId: selectedEmployee._id, allowEmployeeSelect: false }),
              }
            : null,
          selectedEmployee && canManagerUse("addBonus")
            ? {
                label: "Add Bonus",
                className: "bg-violet-600",
                onClick: () => openBonusModal(selectedEmployee._id),
              }
            : null,
          selectedEmployee && canManagerUse("deleteEntry")
            ? {
                label: "Delete Month",
                className: "bg-red-600",
                onClick: requestDeleteMonth,
              }
            : null,
          !selectedEmployee && canManagerUse("addEmployee")
            ? {
                label: "Add Employee",
                className: "bg-blue-600",
                onClick: () => {
                  setEditEmployee(null)
                  setModalOpen(true)
                },
              }
            : null,
          !selectedEmployee && canManagerUse("exportPdf")
            ? {
                label: "Employees PDF",
                className: "bg-blue-700",
                onClick: () => buildEmployeesDirectoryPdf(filteredEmployees, getEmployeeAllFinalBalance),
              }
            : null,
          !selectedEmployee && canManagerUse("exportPdf")
            ? {
                label: "Generate Report",
                className: "bg-blue-700",
                onClick: () => openReportModal(),
              }
            : null,
          !selectedEmployee && canManagerUse("addEntry")
            ? {
                label: "Add Attendance",
                className: "bg-green-600",
                onClick: () => openAttendanceModePrompt({ allowEmployeeSelect: true }),
              }
            : null,
          !selectedEmployee && canManagerUse("addBonus")
            ? {
                label: "Add Bonus",
                className: "bg-violet-600",
                onClick: () => openBonusModal(),
              }
            : null,
        ].filter(Boolean)}
      />
    </div>
  )
}

function SummaryCard({ label, value, accent, ring, compact = false }) {
  if (compact) {
    return (
      <div className={`flex min-h-[76px] flex-col justify-between rounded-[20px] border p-3 shadow-sm ${ring}`}>
        <div className="min-w-0">
          <p className="line-clamp-2 text-[9px] font-semibold leading-3 text-[color:var(--text-secondary)]">
            {label}
          </p>
          <p className={`mt-2 truncate text-[12px] font-extrabold leading-none ${accent}`}>
            {value}
          </p>
        </div>
        <span className={`h-1 w-full rounded-full ${accent.replace("text-", "bg-")}`} />
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${ring}`}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]"
      >
        {label}
      </p>
      <p
        className={`mt-3 text-2xl font-bold ${accent}`}
      >
        {value}
      </p>
    </div>
  )
}

function BonusModal({ form, employees, saving, onChange, onClose, onSave }) {
  const isAllEmployees = form.employeeTarget === "all"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_24px_48px_rgba(15,23,42,0.24)] sm:p-6">
        <div>
          <h3 className="text-xl font-semibold text-[color:var(--text-strong)]">Add Bonus</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            Save an extra payment entry and include it in the selected employee salary.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
              Bonus Target
            </span>
            <select
              value={form.employeeTarget}
              onChange={(event) => onChange({ employeeTarget: event.target.value })}
              className="input"
            >
              <option value="single">Selected Employee</option>
              <option value="all">All Employees</option>
            </select>
          </label>

          {!isAllEmployees ? (
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
                Employee
              </span>
              <select
                value={form.employeeId}
                onChange={(event) => onChange({ employeeId: event.target.value })}
                className="input"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
              Date
            </span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => onChange({ date: event.target.value })}
              className="input"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
              Payment
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={form.payment}
              onChange={(event) => onChange({ payment: event.target.value })}
              placeholder="Enter bonus amount"
              className="input"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
              Remark
            </span>
            <input
              value={form.remark}
              onChange={(event) => onChange({ remark: event.target.value })}
              placeholder="Bonus remark"
              className="input"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-2xl bg-violet-600 px-4 py-3 font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Bonus"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = "danger",
  secondaryLabel = "",
  onCancel,
  onConfirm,
  onSecondaryAction,
}) {
  const confirmButtonClass =
    tone === "danger"
      ? "bg-red-600 text-white"
      : "bg-blue-600 text-white"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_24px_48px_rgba(15,23,42,0.24)]">
        <h3 className="text-xl font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 font-medium text-[color:var(--text-primary)]"
          >
            Cancel
          </button>
          {secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-medium text-emerald-600 shadow-sm"
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-2xl px-4 py-3 font-medium shadow-sm ${confirmButtonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
