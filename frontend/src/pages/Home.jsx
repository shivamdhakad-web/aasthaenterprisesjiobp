import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function Home(){

const navigate = useNavigate()
const { isAuthenticated, defaultRoute } = useAuth()

return(

<div
className="h-screen w-full bg-cover bg-center relative"
style={{
backgroundImage:"url('/locate-station-fuel.jpeg')"
}}
>

{/* DARK OVERLAY */}

<div
className="absolute inset-0"
style={{
background:"var(--theme-home-overlay)"
}}
></div>


{/* CONTENT */}

<div className="relative z-10 flex flex-col items-center justify-center h-full text-center">

<h1 className="mb-6 text-5xl font-bold text-[color:var(--text-strong)] drop-shadow-sm">

Jio-BP Fuel Station

</h1>

<p className="mb-8 text-lg text-[color:var(--text-secondary)]">

Fuel Management System

</p>

<button
onClick={()=>navigate(isAuthenticated ? defaultRoute : "/login")}
className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transition"
>

{isAuthenticated ? "Open Dashboard" : "Go to Dashboard"}

</button>

</div>

</div>

)

}
