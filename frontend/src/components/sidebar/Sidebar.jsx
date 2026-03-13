// import {
// LayoutDashboard,
// Fuel,
// Database,
// Gauge,
// Activity,
// Truck,
// Users,
// CreditCard,
// FileText,
// Bell,
// Settings,
// } from "lucide-react"
// import { Link } from "react-router-dom"

// export default function Sidebar(){

// return(

// <div className="w-[240px] bg-[#04060B] border-r border-[#1A1D26] flex flex-col">

// <div className="pt-6 pl-6">

// <div className="flex items-center gap-3">

//   <div className="w-9 h-9 rounded-lg bg-lime-500 flex items-center justify-center flex-shrink-0">
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       className="w-5 h-5 text-white"
//     >
//       <line x1="3" x2="15" y1="22" y2="22"></line>
//       <line x1="4" x2="14" y1="9" y2="9"></line>
//       <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path>
//       <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path>
//     </svg>
//   </div>

//   <div className="flex flex-col">
//     <h1 className="text-lg font-semibold text-white">
//       Jio-bp Station
//     </h1>

//     <p className="text-xs text-gray-400">
//       Fuel Management ERP
//     </p>
//   </div>

// </div>

// </div>

// <nav className="flex-1 px-3 py-4 space-y-2">

// <p className="text-xs text-gray-500 px-3 mb-2">
// OPERATIONS
// </p>

// <Link to="/">
//   <SidebarItem icon={<LayoutDashboard size={18}/>} text="Dashboard" active/>
// </Link>

// {/* <SidebarItem icon={<Fuel size={18}/>} text="Fuel Sales"/>

// <SidebarItem icon={<Database size={18}/>} text="Tank Stock"/>

// <SidebarItem icon={<Gauge size={18}/>} text="Nozzles"/> */}

// <Link to="/meter-readings">
//   <SidebarItem icon={<Activity size={18}/>} text="Meter Readings"/>
// </Link>

// <Link to="/tanker-deliveries">
//   <SidebarItem icon={<Truck size={18}/>} text="Tanker Deliveries"/>
// </Link>

// <p className="text-xs text-gray-500 px-3 mt-6 mb-2">
// MANAGEMENT
// </p>

// <Link to="/employees">
//   <SidebarItem icon={<Users size={18}/>} text="Employees"/>
// </Link>


// <Link to="/credit-customers">
//   <SidebarItem icon={<CreditCard size={18}/>} text="Credit Customers"/>
// </Link>


// <Link to="/expenses">
// <SidebarItem icon={<FileText size={18}/>} text="Expenses"/>
// </Link>

// <Link to="/lubricants">
// <SidebarItem icon={<FileText size={18}/>} text="lubricants"/>
// </Link>

// <Link to="/mobileDispenser">
// <SidebarItem icon={<FileText size={18}/>} text="mobileDispenser"/>
// </Link>

// <Link to="/cardSwipe">
// <SidebarItem icon={<FileText size={18}/>} text="cardSwipe"/>
// </Link>

// <p className="text-xs text-gray-500 px-3 mt-6 mb-2">
// SYSTEM
// </p>

// <SidebarItem icon={<FileText size={18}/>} text="Reports"/>

// <Link to="/reminder">
// <SidebarItem icon={<Bell size={18}/>} text="Reminder"/>
// </Link>

// <Link to="/setting">
// <SidebarItem icon={<Settings size={18}/>} text="Settings"/>
// </Link>


// </nav>

// </div>

// )

// }



// function SidebarItem({icon,text,active}){

// return(

// <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition
// ${active
// ? "bg-[#1A1D26] text-red-500"
// : "text-gray-400 hover:bg-[#0A0D14] hover:text-white"
// }`}>

// {icon}

// <span className="text-sm">
// {text}
// </span>

// </div>

// )

// }


import {
LayoutDashboard,
Fuel,
Database,
Gauge,
Activity,
Truck,
Users,
CreditCard,
FileText,
Bell,
Settings,
} from "lucide-react"

import { Link, useLocation } from "react-router-dom"

export default function Sidebar(){

const location = useLocation()

return(

<div className="w-[240px] bg-[#04060B] border-r border-[#1A1D26] flex flex-col">

<div className="pt-6 pl-6">

<div className="flex items-center gap-3">

<div className="w-9 h-9 rounded-lg bg-lime-500 flex items-center justify-center flex-shrink-0">

<svg
xmlns="http://www.w3.org/2000/svg"
width="24"
height="24"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
strokeWidth="2"
strokeLinecap="round"
strokeLinejoin="round"
className="w-5 h-5 text-white"
>
<line x1="3" x2="15" y1="22" y2="22"></line>
<line x1="4" x2="14" y1="9" y2="9"></line>
<path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path>
<path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path>
</svg>

</div>

<div className="flex flex-col">
<h1 className="text-lg font-semibold text-white">
Jio-bp Station
</h1>

<p className="text-xs text-gray-400">
Fuel Management ERP
</p>
</div>

</div>

</div>

<nav className="flex-1 px-3 py-4 space-y-2 p-">

<p className="text-xs text-gray-500 px-3 mb-2">
OPERATIONS
</p>

<Link to="/dashboard">
<SidebarItem
icon={<LayoutDashboard size={18}/>}
text="Dashboard"
active={location.pathname === "/"}
/>
</Link>

<Link to="/meter-readings">
<SidebarItem
icon={<Activity size={18}/>}
text="Meter Readings"
active={location.pathname === "/meter-readings"}
/>
</Link>

<Link to="/tanker-deliveries">
<SidebarItem
icon={<Truck size={18}/>}
text="Tanker Deliveries"
active={location.pathname === "/tanker-deliveries"}
/>
</Link>

<p className="text-xs text-gray-500 px-3 mt-6 mb-2">
MANAGEMENT
</p>

<Link to="/employees">
<SidebarItem
icon={<Users size={18}/>}
text="Employees"
active={location.pathname === "/employees"}
/>
</Link>

<Link to="/credit-customers">
<SidebarItem
icon={<CreditCard size={18}/>}
text="Credit Customers"
active={location.pathname === "/credit-customers"}
/>
</Link>

<Link to="/expenses">
<SidebarItem
icon={<FileText size={18}/>}
text="Expenses"
active={location.pathname === "/expenses"}
/>
</Link>

<Link to="/lubricants">
<SidebarItem
icon={<FileText size={18}/>}
text="Lubricants"
active={location.pathname === "/lubricants"}
/>
</Link>

<Link to="/mobileDispenser">
<SidebarItem
icon={<FileText size={18}/>}
text="Mobile Dispenser"
active={location.pathname === "/mobileDispenser"}
/>
</Link>

<Link to="/cardSwipe">
<SidebarItem
icon={<FileText size={18}/>}
text="Card Swipe"
active={location.pathname === "/cardSwipe"}
/>
</Link>

<p className="text-xs text-gray-500 px-3 mt-6 mb-2">
SYSTEM
</p>

{/* <SidebarItem icon={<FileText size={18}/>} text="Reports"/> */}

<Link to="/reminder">
<SidebarItem
icon={<Bell size={18}/>}
text="Reminder"
active={location.pathname === "/reminder"}
/>
</Link>

<Link to="/setting">
<SidebarItem
icon={<Settings size={18}/>}
text="Settings"
active={location.pathname === "/setting"}
/>
</Link>





</nav>
<div className="mx-3 mb-4 pb-4 pr-4 pl-4 pt-3 rounded-2xl bg-gradient-to-br from-[#0B0F17] to-[#111827] border border-[#1A1D26] text-center shadow-lg">

  <p className="text-xs text-gray-400 mb-1">
    Developed by
  </p>

  <p className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
    Deepak Nagar
  </p>

</div>

</div>

)
}

function SidebarItem({icon,text,active}){

return(

<div
className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition
${active
? "bg-[#1A1D26] text-red-500"
: "text-gray-400 hover:bg-[#0A0D14] hover:text-white"
}`}
>

{icon}

<span className="text-sm">
{text}
</span>

</div>

)
}