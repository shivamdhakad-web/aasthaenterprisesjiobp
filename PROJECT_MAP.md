# Jio-bp Station Management System - Project Map

## Project Location
`E:\project\jio bp mangment system`

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Roles: Admin, Manager, Employee

## Main Folders
- `frontend/src/pages`: Main route pages
- `frontend/src/components`: Reusable UI components and modals
- `frontend/src/services`: Frontend API call files
- `frontend/src/config/navigation.js`: Sidebar/menu navigation
- `frontend/src/layouts/DashboardLayout.jsx`: Dashboard layout wrapper
- `frontend/src/contexts`: Auth and theme contexts
- `backend/src/controllers`: Backend business logic
- `backend/src/models`: MongoDB/Mongoose models
- `backend/src/routes`: Backend API routes
- `backend/src/app.js`: Express app route mounting

## Important Frontend Files

### Layout / Navigation / Auth
- `frontend/src/App.jsx`: Main app routes
- `frontend/src/layouts/DashboardLayout.jsx`: Admin/Manager/Employee dashboard layout
- `frontend/src/config/navigation.js`: Sidebar page list for roles
- `frontend/src/components/sidebar/Sidebar.jsx`: Sidebar UI
- `frontend/src/components/header/Topbar.jsx`: Topbar, search, notifications, profile
- `frontend/src/contexts/AuthContext.jsx`: Login session/user state
- `frontend/src/contexts/ThemeContext.jsx`: Day/night theme

### Admin / Manager Shared Pages
- `frontend/src/pages/Employees.jsx`: Employees & Attendance page
- `frontend/src/pages/finance/Expenses.jsx`: Expenses page
- `frontend/src/pages/Lubricants.jsx`: Lubricant Sales page
- `frontend/src/pages/CardSwipe.jsx`: Card Swipe Register
- `frontend/src/pages/tanker/TankerDeliveries.jsx`: Tanker Deliveries
- `frontend/src/pages/CustomerDrivers.jsx`: Customer Driver Details
- `frontend/src/pages/TTDrivers.jsx`: TT Drivers
- `frontend/src/pages/MobileDispenser.jsx`: Mobile Dispenser
- `frontend/src/pages/CreditCustomers.jsx`: Credit Customers / Ledger
- `frontend/src/pages/SecureNotes.jsx`: Secure Notes Vault
- `frontend/src/pages/Settings.jsx`: Admin settings, passwords, contact numbers
- `frontend/src/pages/admin/AdminOverview.jsx`: Admin dashboard overview
- `frontend/src/pages/manager/ManagerOverview.jsx`: Manager dashboard overview
- `frontend/src/pages/admin/StorageOverview.jsx`: Storage/RAM page

### New Operational Pages
- `frontend/src/pages/shared/LeaveManagementPage.jsx`: Leave management for admin/manager
- `frontend/src/pages/shared/ShiftSchedulePage.jsx`: Shift/Duty schedule
- `frontend/src/pages/shared/TasksPage.jsx`: Task assignments
- `frontend/src/pages/shared/DailyReportsPage.jsx`: Employee daily reports admin/manager view
- `frontend/src/pages/shared/ApprovalsPage.jsx`: Approval status/center
- `frontend/src/pages/shared/NotificationsPage.jsx`: Notifications
- `frontend/src/pages/SmartCalculator.jsx` or similar: Smart Calculator page if present
- `frontend/src/pages/DensityCalculatorPage.jsx` or similar: Density Calculator page if present
- `frontend/src/pages/FinanceDashboard.jsx` or similar: Finance Dashboard
- `frontend/src/pages/MDU.jsx` or similar: M.D.U page
- `frontend/src/pages/DCD.jsx` or similar: D.C.D page
- `frontend/src/pages/DailySales.jsx` or similar: Daily Sales page
- `frontend/src/pages/InvoiceDetails.jsx` or similar: Invoice Details page
- `frontend/src/pages/BillGenerator.jsx` or similar: Bill Generator page

### Employee Dashboard Pages
- `frontend/src/pages/employee/EmployeeOverview.jsx`: Employee overview
- `frontend/src/pages/employee/EmployeeInfo.jsx`: Employee information
- `frontend/src/pages/employee/EmployeeAttendance.jsx`: My Attendance
- `frontend/src/pages/employee/EmployeeLeave.jsx`: Leave Management
- `frontend/src/pages/employee/EmployeeTasks.jsx`: My Tasks
- `frontend/src/pages/employee/EmployeeExpenses.jsx`: My Expenses
- `frontend/src/pages/employee/EmployeeLubricants.jsx`: My Lubricants
- `frontend/src/pages/employee/EmployeePerformance.jsx`: Performance
- `frontend/src/pages/employee/EmployeeSalary.jsx`: My Salary
- `frontend/src/pages/employee/EmployeeDailyReport.jsx`: My Daily Sheet
- `frontend/src/pages/employee/EmployeeShiftSchedule.jsx`: Shift Schedule

### Modals / Components
- `frontend/src/components/AttendanceModal.jsx`: Add/edit attendance modal, single/multiple entry
- `frontend/src/components/EmployeeModal.jsx`: Add/edit employee modal
- `frontend/src/components/MobileActionFab.jsx`: Mobile floating action button
- `frontend/src/components/AddCardSwipeModal.jsx`: Add card swipe modal
- `frontend/src/components/AddCustomerDriverModal.jsx`: Add customer driver modal
- `frontend/src/components/AddDispenserModal.jsx`: Add dispenser modal
- `frontend/src/components/AddTTDriverModal.jsx`: Add TT driver modal
- `frontend/src/components/SecureNoteModal.jsx`: Secure note modal
- `frontend/src/components/DispenserSettingsModal.jsx`: Mobile dispenser settings

### Frontend API Services
- `frontend/src/services/api.js`: Axios base client/interceptors
- `frontend/src/services/authApi.js`: Auth/login/password APIs
- `frontend/src/services/employeeApi.js`: Admin employee APIs
- `frontend/src/services/employeeSelfApi.js`: Employee self-service APIs
- `frontend/src/services/attendanceApi.js`: Attendance APIs
- `frontend/src/services/expenseApi.js`: Expenses APIs
- `frontend/src/services/lubricantApi.js`: Lubricants APIs
- `frontend/src/services/cardSwipeApi.js`: Card swipe APIs
- `frontend/src/services/tankerApi.js`: Tanker delivery APIs
- `frontend/src/services/customerDriverApi.js`: Customer driver APIs
- `frontend/src/services/customerApi.js`: Credit customer APIs
- `frontend/src/services/approvalApi.js`: Approval APIs
- `frontend/src/services/notificationApi.js`: Notification APIs
- `frontend/src/services/leaveApi.js`: Leave APIs
- `frontend/src/services/shiftApi.js`: Shift schedule APIs
- `frontend/src/services/taskApi.js`: Task assignment APIs
- `frontend/src/services/storageApi.js`: Storage/RAM APIs
- `frontend/src/services/settingsApi.js`: Settings APIs

## Important Backend Files

### Backend Entry
- `backend/src/app.js`: Express app and route mounting
- `backend/src/server.js`: Server start
- `backend/src/config/db.js`: MongoDB connection
- `backend/src/middleware/auth.js`: Auth/JWT middleware
- `backend/src/middleware/accessControl.js`: Role/access middleware

### Backend Controllers
- `backend/src/controllers/authController.js`: Login/password/session
- `backend/src/controllers/employeeController.js`: Admin employee CRUD/attendance related
- `backend/src/controllers/employeeSelfController.js`: Employee self-service
- `backend/src/controllers/employeeAttendanceController.js`: Attendance logic
- `backend/src/controllers/expenseController.js`: Expenses
- `backend/src/controllers/lubricantController.js`: Lubricants/products/sales
- `backend/src/controllers/cardSwipeController.js`: Card swipe entries
- `backend/src/controllers/tankerController.js`: Tanker deliveries
- `backend/src/controllers/customerDriverController.js`: Customer drivers
- `backend/src/controllers/customerController.js`: Credit customers/ledger
- `backend/src/controllers/approvalController.js`: Approval requests
- `backend/src/controllers/notificationController.js`: Notifications
- `backend/src/controllers/leaveController.js`: Employee leave
- `backend/src/controllers/shiftController.js`: Shift schedule
- `backend/src/controllers/taskController.js`: Tasks/work assignments
- `backend/src/controllers/storageController.js`: Storage/RAM stats
- `backend/src/controllers/settingsController.js`: Settings/passwords/contact/security
- `backend/src/controllers/secureNoteController.js`: Secure notes
- `backend/src/controllers/mobileDispenserController.js`: Mobile dispenser
- `backend/src/controllers/ttDriverController.js`: TT drivers
- `backend/src/controllers/meterController.js`: Meter readings

### Backend Models
- `backend/src/models/User.js`: Login users
- `backend/src/models/Employee.js`: Employee records
- `backend/src/models/EmployeeAttendance.js`: Attendance entries
- `backend/src/models/EmployeeDailyReport.js`: Daily sheet/report
- `backend/src/models/EmployeeLeave.js`: Leave records
- `backend/src/models/Expense.js`: Expense entries
- `backend/src/models/LubricantProduct.js`: Lubricant products/stock
- `backend/src/models/LubricantSale.js`: Lubricant sales
- `backend/src/models/CardSwipe.js`: Card swipe entries
- `backend/src/models/TankerDelivery.js`: Tanker delivery entries
- `backend/src/models/Customer.js`: Credit customers
- `backend/src/models/CustomerTransaction.js`: Customer ledger transactions
- `backend/src/models/CustomerDriver.js`: Customer driver entries
- `backend/src/models/TaskAssignment.js`: Tasks
- `backend/src/models/ShiftSchedule.js`: Shift schedules
- `backend/src/models/Notification.js`: Notifications
- `backend/src/models/ApprovalRequest.js`: Approval system
- `backend/src/models/SecureNote.js`: Secure notes
- `backend/src/models/Settings.js`: App settings/passwords/security
- `backend/src/models/MobileDispenser.js`: Mobile dispenser entries
- `backend/src/models/TTDriver.js`: TT drivers

### Backend Routes
- `backend/src/routes/authRoutes.js`
- `backend/src/routes/employeeRoutes.js`
- `backend/src/routes/employeeSelfRoutes.js`
- `backend/src/routes/employeeAttendanceRoutes.js`
- `backend/src/routes/expenseRoutes.js`
- `backend/src/routes/lubricantRoutes.js`
- `backend/src/routes/cardSwipeRoutes.js`
- `backend/src/routes/tankerRoutes.js`
- `backend/src/routes/customerRoutes.js`
- `backend/src/routes/customerDriverRoutes.js`
- `backend/src/routes/approvalRoutes.js`
- `backend/src/routes/notificationRoutes.js`
- `backend/src/routes/leaveRoutes.js`
- `backend/src/routes/shiftRoutes.js`
- `backend/src/routes/taskRoutes.js`
- `backend/src/routes/storageRoutes.js`
- `backend/src/routes/settingsRoutes.js`
- `backend/src/routes/secureNoteRoutes.js`

## Feature To File Guide

### Employee attendance changes
Read:
- `frontend/src/pages/Employees.jsx`
- `frontend/src/components/AttendanceModal.jsx`
- `frontend/src/services/attendanceApi.js`
- `backend/src/controllers/employeeAttendanceController.js`
- `backend/src/models/EmployeeAttendance.js`

### Employee salary page changes
Read:
- `frontend/src/pages/employee/EmployeeSalary.jsx`
- `frontend/src/services/employeeSelfApi.js`
- `backend/src/controllers/employeeSelfController.js`
- `backend/src/models/EmployeeAttendance.js`
- `backend/src/models/Employee.js`

### Employee dashboard sidebar/order/access changes
Read:
- `frontend/src/config/navigation.js`
- `frontend/src/components/sidebar/Sidebar.jsx`
- `frontend/src/layouts/DashboardLayout.jsx`
- employee/manager/admin dashboard editor pages if present
- backend settings/access model/controller if present

### Expenses changes
Read:
- `frontend/src/pages/finance/Expenses.jsx`
- `frontend/src/services/expenseApi.js`
- `backend/src/controllers/expenseController.js`
- `backend/src/models/Expense.js`

### Lubricants changes
Read:
- `frontend/src/pages/Lubricants.jsx`
- `frontend/src/services/lubricantApi.js`
- `backend/src/controllers/lubricantController.js`
- `backend/src/models/LubricantProduct.js`
- `backend/src/models/LubricantSale.js`

### Card Swipe changes
Read:
- `frontend/src/pages/CardSwipe.jsx`
- `frontend/src/components/AddCardSwipeModal.jsx`
- `frontend/src/services/cardSwipeApi.js`
- `backend/src/controllers/cardSwipeController.js`
- `backend/src/models/CardSwipe.js`

### Finance Dashboard changes
Read:
- Finance dashboard page file
- `frontend/src/services/cardSwipeApi.js`
- `frontend/src/services/lubricantApi.js`
- relevant M.D.U, D.C.D, Daily Sales, Invoice Details services/pages
- `frontend/src/services/expenseApi.js`
- employee attendance/salary APIs if needed

### Tanker Deliveries changes
Read:
- `frontend/src/pages/tanker/TankerDeliveries.jsx`
- `frontend/src/services/tankerApi.js`
- `backend/src/controllers/tankerController.js`
- `backend/src/models/TankerDelivery.js`

### Customer Driver changes
Read:
- `frontend/src/pages/CustomerDrivers.jsx`
- `frontend/src/components/AddCustomerDriverModal.jsx`
- `frontend/src/services/customerDriverApi.js`
- `backend/src/controllers/customerDriverController.js`
- `backend/src/models/CustomerDriver.js`

### Settings/password/security changes
Read:
- `frontend/src/pages/Settings.jsx`
- `frontend/src/services/settingsApi.js`
- `frontend/src/services/authApi.js`
- `backend/src/controllers/settingsController.js`
- `backend/src/controllers/authController.js`
- `backend/src/models/Settings.js`
- `backend/src/models/User.js`

## Current Pending Request Example

If asked:
“Employee page multiple entry me top date selector add karo”

Read only:
- `frontend/src/components/AttendanceModal.jsx`
- `frontend/src/pages/Employees.jsx`

Expected behavior:
- In multiple entry modal, add top/common Date selector near Select Employee.
- Changing common date fills all multiple rows with that date.
- New rows default to selected common date.
- Single entry flow should remain unchanged.
- Build after changes.