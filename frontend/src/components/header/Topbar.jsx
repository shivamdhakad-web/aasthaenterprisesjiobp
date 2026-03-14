import {Search,Bell} from "lucide-react"
import { Link } from "react-router-dom"

export default function Topbar(){

return(

<div className="h-[65px] border-b border-[#1A1D26] flex items-center justify-between px-6">

<div className="flex items-center gap-4">

<div className="relative">

<Search size={16} className="absolute left-3 top-3 text-gray-400"/>

<input
placeholder="Search..."
className="bg-[#0A0D14] border border-[#1A1D26] rounded-lg pl-8 pr-4 py-2 text-sm w-[260px]"
/>

</div>

</div>


<div className="flex items-center gap-6">

{/* <Bell size={18} className="text-gray-400"/> */}

<Link to="/reminder">
<Bell size={18} text="Reminder" />
</Link>


<div className="flex items-center gap-3">

<div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">

<span className="text-sm font-bold">bp</span>

</div>

<div className="text-sm">

<p className="text-white">Owner</p>

<p className="text-gray-400 text-xs">Admin</p>

</div>

</div>

</div>

</div>

)

}