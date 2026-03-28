import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login(){

const [password,setPassword] = useState("")
const navigate = useNavigate()

const handleLogin = () => {

  const now = new Date()

  // 🔹 24 HOUR FORMAT
  const password24 =
    String(now.getHours()).padStart(2,"0") +
    String(now.getMinutes()).padStart(2,"0")

  // 🔹 12 HOUR FORMAT
  let hours12 = now.getHours() % 12
  hours12 = hours12 === 0 ? 12 : hours12

  const password12 =
    String(hours12).padStart(2,"0") +
    String(now.getMinutes()).padStart(2,"0")

  // 🔥 MATCH CHECK
  if(password === password24 || password === password12){

    navigate("/dashboard")

  } else {

    alert("Wrong Password")

  }

}

return(

<div className="h-screen flex items-center justify-center bg-[#04060B]">

<div className="bg-[#0B0F17] border border-[#1F2937] p-8 rounded-xl w-[350px] text-center">

<h2 className="text-white text-xl mb-4">
Enter Dashboard Password
</h2>

<input
type="password"
placeholder="Enter Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
className="w-full p-3 bg-[#111827] rounded text-white mb-4"
/>

<button
onClick={handleLogin}
className="bg-green-500 px-5 py-2 rounded text-white w-full"
>

Login

</button>

</div>

</div>

)

}