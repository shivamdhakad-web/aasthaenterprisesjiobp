import { useNavigate } from "react-router-dom"

export default function Home(){

const navigate = useNavigate()

return(

<div
className="h-screen w-full bg-cover bg-center relative"
style={{
backgroundImage:"url('/locate-station-fuel.jpeg')"
}}
>

{/* DARK OVERLAY */}

<div className="absolute inset-0 bg-black/70"></div>


{/* CONTENT */}

<div className="relative z-10 flex flex-col items-center justify-center h-full text-center">

<h1 className="text-5xl font-bold text-white mb-6">

Jio-BP Fuel Station

</h1>

<p className="text-gray-300 mb-8 text-lg">

Fuel Management System

</p>

<button
onClick={()=>navigate("/login")}
className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transition"
>

Go to Dashboard

</button>

</div>

</div>

)

}