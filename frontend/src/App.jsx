// import { BrowserRouter, Routes, Route } from "react-router-dom"

// import DashboardLayout from "./layouts/DashboardLayout"

// import Dashboard from "./pages/dashboard/Dashboard"
// import MeterReadings from "./pages/meter/MeterReadings"
// import TankerDeliveries from "./pages/tanker/TankerDeliveries"
// import CreditCustomers from "./pages/CreditCustomers"
// import Expenses from "./pages/finance/Expenses"
// import ReminderBox from "./components/dashboard/ReminderBox"
// import Setting from "./pages/Settings"
// import Lubricants from "./pages/Lubricants"
// import Employees from "./pages/Employees"
// import MobileDispenser from "./pages/MobileDispenser"
// import CardSwipe from "./pages/CardSwipe"

// export default function App(){

// return(

// <BrowserRouter>

// <DashboardLayout>

// <Routes>

// <Route path="/" element={<Dashboard/>} />

// <Route path="/meter-readings" element={<MeterReadings/>} />

// <Route path="/tanker-deliveries" element={<TankerDeliveries/>} />

// <Route path="/employees" element={<Employees/>}/>

// <Route path="/credit-customers" element={<CreditCustomers />} />

// <Route path="/expenses" element={<Expenses />} />

// <Route path="/reminder" element={<ReminderBox />} />

// <Route path="/setting" element={<Setting />} />

// <Route path="/lubricants" element={<Lubricants />} />

// <Route path="/mobileDispenser" element={<MobileDispenser />} />

// <Route path="/cardSwipe" element={<CardSwipe />} />


// </Routes>

// </DashboardLayout>

// </BrowserRouter>

// )

// }


import { BrowserRouter, Routes, Route } from "react-router-dom"

import DashboardLayout from "./layouts/DashboardLayout"
import Home from "./pages/Home"
import Dashboard from "./pages/dashboard/Dashboard"
import MeterReadings from "./pages/meter/MeterReadings"
import TankerDeliveries from "./pages/tanker/TankerDeliveries"
import CreditCustomers from "./pages/CreditCustomers"
import Expenses from "./pages/finance/Expenses"
import ReminderBox from "./components/dashboard/ReminderBox"
import Setting from "./pages/Settings"
import Lubricants from "./pages/Lubricants"
import Employees from "./pages/Employees"
import MobileDispenser from "./pages/MobileDispenser"
import CardSwipe from "./pages/CardSwipe"
import Login from "./pages/Login"

export default function App(){

return(

<BrowserRouter>

<Routes>

{/* HOME PAGE (NO SIDEBAR) */}

<Route path="/" element={<Home />} />

<Route path="/login" element={<Login/>} />


{/* DASHBOARD LAYOUT */}

<Route element={<DashboardLayout />}>

<Route path="/dashboard" element={<Dashboard/>} />

<Route path="/meter-readings" element={<MeterReadings/>} />

<Route path="/tanker-deliveries" element={<TankerDeliveries/>} />

<Route path="/employees" element={<Employees/>}/>

<Route path="/credit-customers" element={<CreditCustomers />} />

<Route path="/expenses" element={<Expenses />} />

<Route path="/reminder" element={<ReminderBox />} />

<Route path="/setting" element={<Setting />} />

<Route path="/lubricants" element={<Lubricants />} />

<Route path="/mobileDispenser" element={<MobileDispenser />} />

<Route path="/cardSwipe" element={<CardSwipe />} />

</Route>

</Routes>

</BrowserRouter>

)

}