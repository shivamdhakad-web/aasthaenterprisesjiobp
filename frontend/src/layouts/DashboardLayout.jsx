import { useState } from "react"
import Sidebar from "../components/sidebar/Sidebar"
import Topbar from "../components/header/Topbar"
import { Outlet } from "react-router-dom"
export default function DashboardLayout(){

const [open,setOpen] = useState(false)

return(

<div className="flex h-screen bg-[#04060B] text-white">

{/* SIDEBAR */}

<Sidebar open={open} setOpen={setOpen}/>


{/* MAIN AREA */}

<div className="flex-1 flex flex-col">

<Topbar toggleSidebar={()=>setOpen(!open)}/>

<main className="flex-1 overflow-y-auto lg:p-6">

<Outlet/>

</main>

</div>

</div>

)

}