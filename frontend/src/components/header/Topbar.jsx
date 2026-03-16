import { Menu, Bell } from "lucide-react"
import { Link } from "react-router-dom"

export default function Topbar({toggleSidebar}){

return(

<div className="flex items-center justify-between p-3 bg-[#04060B] border-b border-[#1A1D26]">

{/* LEFT SIDE */}

<div className="flex items-center gap-3 w-full">

<button
onClick={toggleSidebar}
className="lg:hidden text-white"
>
<Menu size={22}/>
</button>

<input
placeholder="Search..."
className="bg-[#0A0D14] border border-[#1A1D26] text-sm px-3 py-2 rounded-lg w-full max-w-[250px]"
/>

</div>


{/* RIGHT SIDE */}

<div className="flex items-center gap-3">

<Link to="/reminder">
<Bell size={18} text="Reminder" />
</Link>
<div className="flex items-center gap-2">

<div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-xs">
bp
</div>

<div className="text-xs hidden sm:block">
Owner
</div>

</div>

</div>

</div>

)

}