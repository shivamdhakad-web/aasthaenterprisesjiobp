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
import SmartCalculatorPage from "./pages/shared/SmartCalculatorPage"
import DensityCalculatorPage from "./pages/shared/DensityCalculatorPage"

export default function App() {
  const AppRouter =
    typeof window !== "undefined" && window.location.protocol === "file:"
      ? HashRouter
      : BrowserRouter

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
            <Route path="employee-dashboard-editor" element={<EmployeeDashboardEditor />} />
            <Route path="leaves" element={<LeaveManagementPage />} />
            <Route path="shifts" element={<ShiftSchedulePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="credit-customers" element={<CreditCustomers />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reminder" element={<ReminderBox />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="storage" element={<StorageOverview />} />
            <Route path="lubricants" element={<Lubricants />} />
            <Route path="mobile-dispenser" element={<MobileDispenser />} />
            <Route path="card-swipe" element={<CardSwipe />} />
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
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="daily-reports" element={<DailyReportsPage />} />
            <Route path="shifts" element={<ShiftSchedulePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route
              path="meter-readings"
              element={
                <ApprovalWrappedPage moduleKey="meter-readings" title="Meter Readings">
                  <MeterReadings />
                </ApprovalWrappedPage>
              }
            />
            <Route
              path="tanker-deliveries"
              element={
                <ApprovalWrappedPage moduleKey="tanker-deliveries" title="Tanker Deliveries">
                  <TankerDeliveries />
                </ApprovalWrappedPage>
              }
            />
            <Route
              path="employees"
              element={
                <ApprovalWrappedPage moduleKey="employees" title="Employees">
                  <Employees />
                </ApprovalWrappedPage>
              }
            />
            <Route
              path="credit-customers"
              element={
                <ApprovalWrappedPage moduleKey="customers" title="Credit Customers">
                  <CreditCustomers />
                </ApprovalWrappedPage>
              }
            />
            <Route
              path="expenses"
              element={
                <ApprovalWrappedPage moduleKey="expenses" title="Expenses">
                  <Expenses />
                </ApprovalWrappedPage>
              }
            />
            <Route path="reminder" element={<ReminderBox />} />
            <Route
              path="settings"
              element={
                <ApprovalWrappedPage moduleKey="settings" title="Station Settings">
                  <SettingsPage />
                </ApprovalWrappedPage>
              }
            />
            <Route
              path="lubricants"
              element={
                <ApprovalWrappedPage moduleKey="lubricant-sales" title="Lubricant Sales">
                  <Lubricants />
                </ApprovalWrappedPage>
              }
            />
            <Route
              path="mobile-dispenser"
              element={
                <ApprovalWrappedPage
                  moduleKey="mobile-dispenser-entries"
                  title="Mobile Dispenser"
                >
                  <MobileDispenser />
                </ApprovalWrappedPage>
              }
            />
            <Route
              path="card-swipe"
              element={
                <ApprovalWrappedPage moduleKey="card-swipe" title="Card Swipe">
                  <CardSwipe />
                </ApprovalWrappedPage>
              }
            />
            <Route path="smart-calculator" element={<SmartCalculatorPage />} />
            <Route path="density-calculator" element={<DensityCalculatorPage />} />
            <Route
              path="ttdrivers"
              element={
                <ApprovalWrappedPage moduleKey="tt-drivers" title="TT Drivers">
                  <TTDrivers />
                </ApprovalWrappedPage>
              }
            />
            <Route
              path="customerdrivers"
              element={
                <ApprovalWrappedPage moduleKey="customer-drivers" title="Customer Drivers">
                  <CustomerDrivers />
                </ApprovalWrappedPage>
              }
            />
            <Route
              path="secure-notes"
              element={
                <ApprovalWrappedPage moduleKey="secure-notes" title="Secure Notes">
                  <SecureNotes />
                </ApprovalWrappedPage>
              }
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["Employee"]} />}>
          <Route path="/employee" element={<DashboardLayout />}>
            <Route index element={<Navigate to="salary" replace />} />
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
