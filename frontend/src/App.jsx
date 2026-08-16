import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom"

import DashboardLayout from "./layouts/DashboardLayout"
import Home from "./pages/Home"
import MeterReadings from "./pages/meter/MeterReadings"
import TankerDeliveries from "./pages/tanker/TankerDeliveries"
import CreditCustomers from "./pages/CreditCustomers"
import Expenses from "./pages/finance/Expenses"
import ReminderBox from "./components/dashboard/ReminderBox"
import SettingsPage from "./pages/Settings"
import Lubricants from "./pages/Lubricants"
import Employees from "./pages/Employees"
import MobileDispenser from "./pages/MobileDispenser"
import CardSwipe from "./pages/CardSwipe"
import Login from "./pages/Login"
import TTDrivers from "./pages/TTDrivers"
import CustomerDrivers from "./pages/CustomerDrivers"
import SecureNotes from "./pages/SecureNotes"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import RoleRedirect from "./components/auth/RoleRedirect"
import ManagerPageAccessGate from "./components/auth/ManagerPageAccessGate"
import AdminOverview from "./pages/admin/AdminOverview"
import ManagerOverview from "./pages/manager/ManagerOverview"
import EmployeeOverview from "./pages/employee/EmployeeOverview"
import EmployeeInfo from "./pages/employee/EmployeeInfo"
import EmployeeAttendance from "./pages/employee/EmployeeAttendance"
import EmployeeLeave from "./pages/employee/EmployeeLeave"
import EmployeeShiftSchedule from "./pages/employee/EmployeeShiftSchedule"
import EmployeeTasks from "./pages/employee/EmployeeTasks"
import EmployeeExpenses from "./pages/employee/EmployeeExpenses"
import EmployeeLubricants from "./pages/employee/EmployeeLubricants"
import EmployeePerformance from "./pages/employee/EmployeePerformance"
import EmployeeSalary from "./pages/employee/EmployeeSalary"
import EmployeeDailyReport from "./pages/employee/EmployeeDailyReport"
import ApprovalsPage from "./pages/shared/ApprovalsPage"
import NotificationsPage from "./pages/shared/NotificationsPage"
import DailyReportsPage from "./pages/shared/DailyReportsPage"
import ApprovalWrappedPage from "./components/approvals/ApprovalWrappedPage"
import LeaveManagementPage from "./pages/shared/LeaveManagementPage"
import ShiftSchedulePage from "./pages/shared/ShiftSchedulePage"
import TasksPage from "./pages/shared/TasksPage"
import StorageOverview from "./pages/admin/StorageOverview"
import EmployeeDashboardEditor from "./pages/admin/EmployeeDashboardEditor"
import ManagerDashboardEditor from "./pages/admin/ManagerDashboardEditor"
import AdminDashboardEditor from "./pages/admin/AdminDashboardEditor"
import BillGeneratorPage from "./pages/admin/BillGeneratorPage"
import AiChatPage from "./pages/admin/AiChatPage"
import SmartCalculatorPage from "./pages/shared/SmartCalculatorPage"
import DensityCalculatorPage from "./pages/shared/DensityCalculatorPage"
import DcdPage from "./pages/shared/DcdPage"
import MduPage from "./pages/shared/MduPage"
import InvoiceDetailsPage from "./pages/shared/InvoiceDetailsPage"
import DailySalesPage from "./pages/shared/DailySalesPage"
import FinanceDashboardPage from "./pages/shared/FinanceDashboardPage"
import ExpenseDashboardPage from "./pages/finance/ExpenseDashboardPage"
import CardSwipeDashboardPage from "./pages/finance/CardSwipeDashboardPage"
import EmployeeAttendanceDashboardPage from "./pages/finance/EmployeeAttendanceDashboardPage"

export default function App() {
  const AppRouter =
    typeof window !== "undefined" && window.location.protocol === "file:"
      ? HashRouter
      : BrowserRouter
  const managerPage = (pageKey, element) => (
    <ManagerPageAccessGate pageKey={pageKey}>{element}</ManagerPageAccessGate>
  )

  return (
    <AppRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RoleRedirect />} />

        <Route element={<ProtectedRoute roles={["Admin"]} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="daily-reports" element={<DailyReportsPage />} />
            <Route path="meter-readings" element={<MeterReadings />} />
            <Route path="tanker-deliveries" element={<TankerDeliveries />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employee-attendance-dashboard" element={<EmployeeAttendanceDashboardPage />} />
            <Route path="admin-dashboard-editor" element={<AdminDashboardEditor />} />
            <Route path="employee-dashboard-editor" element={<EmployeeDashboardEditor />} />
            <Route path="manager-dashboard-editor" element={<ManagerDashboardEditor />} />
            <Route path="leaves" element={<LeaveManagementPage />} />
            <Route path="shifts" element={<ShiftSchedulePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="credit-customers" element={<CreditCustomers />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="expense-dashboard" element={<ExpenseDashboardPage />} />
            <Route path="reminder" element={<ReminderBox />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="storage" element={<StorageOverview />} />
            <Route path="bill-generator" element={<BillGeneratorPage />} />
            <Route path="ai-chat" element={<AiChatPage />} />
            <Route path="lubricants" element={<Lubricants />} />
            <Route path="mobile-dispenser" element={<MobileDispenser />} />
            <Route path="card-swipe" element={<CardSwipe />} />
            <Route path="card-swipe-dashboard" element={<CardSwipeDashboardPage />} />
            <Route path="dcd" element={<DcdPage />} />
            <Route path="mdu" element={<MduPage />} />
            <Route path="invoice-details" element={<InvoiceDetailsPage />} />
            <Route path="daily-sales" element={<DailySalesPage />} />
            <Route path="finance-dashboard" element={<FinanceDashboardPage />} />
            <Route path="smart-calculator" element={<SmartCalculatorPage />} />
            <Route path="density-calculator" element={<DensityCalculatorPage />} />
            <Route path="ttdrivers" element={<TTDrivers />} />
            <Route path="customerdrivers" element={<CustomerDrivers />} />
            <Route path="secure-notes" element={<SecureNotes />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["Manager"]} />}>
          <Route path="/manager" element={<DashboardLayout />}>
            <Route index element={<ManagerOverview />} />
            <Route path="approvals" element={managerPage("approvals", <ApprovalsPage />)} />
            <Route path="notifications" element={managerPage("notifications", <NotificationsPage />)} />
            <Route path="daily-reports" element={managerPage("dailyReports", <DailyReportsPage />)} />
            <Route path="shifts" element={managerPage("shifts", <ShiftSchedulePage />)} />
            <Route path="tasks" element={managerPage("tasks", <TasksPage />)} />
            <Route
              path="meter-readings"
              element={managerPage(
                "meterReadings",
                <ApprovalWrappedPage moduleKey="meter-readings" title="Meter Readings">
                  <MeterReadings />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="tanker-deliveries"
              element={managerPage(
                "tankerDeliveries",
                <ApprovalWrappedPage moduleKey="tanker-deliveries" title="Tanker Deliveries">
                  <TankerDeliveries />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="employees"
              element={managerPage(
                "employees",
                <ApprovalWrappedPage moduleKey="employees" title="Employees">
                  <Employees />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="credit-customers"
              element={managerPage(
                "creditCustomers",
                <ApprovalWrappedPage moduleKey="customers" title="Credit Customers">
                  <CreditCustomers />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="expenses"
              element={managerPage(
                "expenses",
                <ApprovalWrappedPage moduleKey="expenses" title="Expenses">
                  <Expenses />
                </ApprovalWrappedPage>,
              )}
            />
            <Route path="reminder" element={managerPage("reminder", <ReminderBox />)} />
            <Route
              path="settings"
              element={managerPage(
                "settings",
                <ApprovalWrappedPage moduleKey="settings" title="Station Settings">
                  <SettingsPage />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="lubricants"
              element={managerPage(
                "lubricants",
                <ApprovalWrappedPage moduleKey="lubricant-sales" title="Lubricant Sales">
                  <Lubricants />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="mobile-dispenser"
              element={managerPage(
                "mobileDispenser",
                <ApprovalWrappedPage
                  moduleKey="mobile-dispenser-entries"
                  title="Mobile Dispenser"
                >
                  <MobileDispenser />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="card-swipe"
              element={managerPage(
                "cardSwipe",
                <ApprovalWrappedPage moduleKey="card-swipe" title="Card Swipe">
                  <CardSwipe />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="dcd"
              element={managerPage(
                "dcd",
                <ApprovalWrappedPage moduleKey="dcd" title="D.C.D">
                  <DcdPage />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="mdu"
              element={managerPage(
                "mdu",
                <ApprovalWrappedPage moduleKey="mdu" title="M.D.U">
                  <MduPage />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="invoice-details"
              element={managerPage(
                "invoiceDetails",
                <ApprovalWrappedPage moduleKey="invoice-details" title="Invoice Details">
                  <InvoiceDetailsPage />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="daily-sales"
              element={managerPage(
                "dailySales",
                <ApprovalWrappedPage moduleKey="daily-sales" title="Daily Sales">
                  <DailySalesPage />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="finance-dashboard"
              element={managerPage(
                "financeDashboard",
                <ApprovalWrappedPage moduleKey="finance-dashboard" title="Finance Dashboard">
                  <FinanceDashboardPage />
                </ApprovalWrappedPage>,
              )}
            />
            <Route path="smart-calculator" element={managerPage("smartCalculator", <SmartCalculatorPage />)} />
            <Route path="density-calculator" element={managerPage("densityCalculator", <DensityCalculatorPage />)} />
            <Route
              path="ttdrivers"
              element={managerPage(
                "ttDrivers",
                <ApprovalWrappedPage moduleKey="tt-drivers" title="TT Drivers">
                  <TTDrivers />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="customerdrivers"
              element={managerPage(
                "customerDrivers",
                <ApprovalWrappedPage moduleKey="customer-drivers" title="Customer Drivers">
                  <CustomerDrivers />
                </ApprovalWrappedPage>,
              )}
            />
            <Route
              path="secure-notes"
              element={managerPage(
                "secureNotes",
                <ApprovalWrappedPage moduleKey="secure-notes" title="Secure Notes">
                  <SecureNotes />
                </ApprovalWrappedPage>,
              )}
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["Employee"]} />}>
          <Route path="/employee" element={<DashboardLayout />}>
            <Route index element={<EmployeeOverview />} />
            <Route path="info" element={<EmployeeInfo />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="leaves" element={<EmployeeLeave />} />
            <Route path="shifts" element={<EmployeeShiftSchedule />} />
            <Route path="tasks" element={<EmployeeTasks />} />
            <Route path="expenses" element={<EmployeeExpenses />} />
            <Route path="smart-calculator" element={<SmartCalculatorPage />} />
            <Route path="density-calculator" element={<DensityCalculatorPage />} />
            <Route path="lubricants" element={<EmployeeLubricants />} />
            <Route path="performance" element={<EmployeePerformance />} />
            <Route path="salary" element={<EmployeeSalary />} />
            <Route path="daily-report" element={<EmployeeDailyReport />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppRouter>
  )
}




