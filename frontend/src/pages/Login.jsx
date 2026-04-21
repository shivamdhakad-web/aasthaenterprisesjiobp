import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react"

const loginStyles = String.raw`
:root {
  --auth-ink: rgba(248, 250, 252, 0.98);
  --auth-muted: rgba(191, 203, 224, 0.74);
  --auth-violet: #a78bfa;
  --auth-cyan: #67e8f9;
  --auth-coral: #fb7185;
  --auth-blue: #2563eb;
}

.auth-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--auth-ink);
  background:
    radial-gradient(circle at 14% 14%, rgba(167, 139, 250, 0.16), transparent 22%),
    radial-gradient(circle at 86% 12%, rgba(103, 232, 249, 0.12), transparent 20%),
    radial-gradient(circle at 72% 86%, rgba(251, 113, 133, 0.09), transparent 22%),
    linear-gradient(180deg, #06070d 0%, #090b16 42%, #05060a 100%);
  isolation: isolate;
}

.auth-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px);
  background-size: 82px 82px;
  mask-image: radial-gradient(circle at 50% 14%, black, transparent 84%);
  opacity: 0.48;
  pointer-events: none;
}

.auth-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(120px);
  opacity: 0.8;
  pointer-events: none;
}

.auth-orb--violet {
  left: -8rem;
  top: 15rem;
  width: 24rem;
  height: 24rem;
  background: rgba(167, 139, 250, 0.16);
}

.auth-orb--cyan {
  right: -8rem;
  top: 9rem;
  width: 24rem;
  height: 24rem;
  background: rgba(103, 232, 249, 0.12);
}

.auth-orb--coral {
  right: 16%;
  bottom: -7rem;
  width: 20rem;
  height: 20rem;
  background: rgba(251, 113, 133, 0.1);
}

.auth-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.auth-motion {
  transform-style: preserve-3d;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.auth-motion:hover {
  will-change: transform;
}

.auth-motion__inner {
  position: relative;
  z-index: 1;
}

.auth-frame {
  position: relative;
  width: min(100%, 1080px);
  min-height: 38rem;
  display: grid;
  grid-template-columns: 1.02fr 0.98fr;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 2.4rem;
  background:
    radial-gradient(circle at 16% 16%, rgba(103, 232, 249, 0.1), transparent 24%),
    radial-gradient(circle at 84% 14%, rgba(167, 139, 250, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.018)),
    rgba(9, 12, 20, 0.84);
  box-shadow: 0 34px 120px rgba(0, 0, 0, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(22px) saturate(145%);
  -webkit-backdrop-filter: blur(22px) saturate(145%);
}

.auth-copy {
  position: relative;
  padding: 2.1rem;
}

.auth-overline {
  margin: 0 0 0.8rem;
  color: rgba(103, 232, 249, 0.94);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.auth-title {
  margin: 0;
  max-width: 30rem;
  color: white;
  font-size: clamp(2.7rem, 5.5vw, 5.6rem);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.075em;
  text-shadow: 0 16px 54px rgba(0, 0, 0, 0.46);
}

.auth-copy-text {
  max-width: 28rem;
  margin: 1rem 0 0;
  color: var(--auth-muted);
  line-height: 1.8;
}

.auth-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.72rem;
  margin-top: 1.2rem;
}

.auth-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.15rem;
  padding: 0.44rem 0.82rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(248, 250, 252, 0.9);
  font-size: 0.82rem;
  font-weight: 800;
}

.auth-chip--violet {
  border-color: rgba(167, 139, 250, 0.28);
  background: rgba(167, 139, 250, 0.1);
  color: #ede9fe;
}

.auth-chip--cyan {
  border-color: rgba(103, 232, 249, 0.28);
  background: rgba(103, 232, 249, 0.1);
  color: #cffafe;
}

.auth-chip--coral {
  border-color: rgba(251, 113, 133, 0.28);
  background: rgba(251, 113, 133, 0.1);
  color: #fecdd3;
}

.auth-showcase {
  display: grid;
  gap: 0.8rem;
  margin-top: 1.45rem;
}

.auth-tile {
  min-height: 7.5rem;
  padding: 0.95rem;
  border-radius: 1.3rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.045);
}

.auth-tile span {
  display: block;
  color: var(--auth-muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.auth-tile strong {
  display: block;
  margin-top: 0.8rem;
  color: white;
  font-size: 1.5rem;
  font-weight: 900;
}

.auth-panel {
  position: relative;
  padding: 2rem;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.auth-lock-card {
  position: relative;
  min-height: 100%;
  display: grid;
  place-items: center;
}

.auth-lock-ring {
  position: absolute;
  width: 21rem;
  height: 21rem;
  border-radius: 9999px;
  border: 1px solid rgba(103, 232, 249, 0.18);
  background:
    conic-gradient(from 0deg, rgba(103, 232, 249, 0.18), transparent 12%, rgba(167, 139, 250, 0.14), transparent 28%, rgba(251, 113, 133, 0.14), transparent 46%),
    radial-gradient(circle, rgba(255, 255, 255, 0.03), transparent 60%);
  box-shadow: inset 0 0 70px rgba(103, 232, 249, 0.06), 0 0 80px rgba(103, 232, 249, 0.08);
  animation: authSpin 24s linear infinite;
}

.auth-lock-ring::before,
.auth-lock-ring::after {
  content: "";
  position: absolute;
  inset: 3rem;
  border-radius: inherit;
  border: 1px dashed rgba(255, 255, 255, 0.14);
}

.auth-lock-ring::after {
  inset: 6rem;
  border-style: solid;
  border-color: rgba(251, 113, 133, 0.14);
}

.auth-form {
  position: relative;
  z-index: 1;
  width: min(100%, 22rem);
  padding: 1.3rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.7rem;
  background:
    radial-gradient(circle at 16% 0%, rgba(103, 232, 249, 0.09), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.02)),
    rgba(7, 10, 16, 0.84);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.auth-form-badge {
  width: 3rem;
  height: 3rem;
  display: grid;
  place-items: center;
  margin-bottom: 0.95rem;
  border-radius: 1rem;
  border: 1px solid rgba(103, 232, 249, 0.2);
  background: rgba(103, 232, 249, 0.08);
  color: #cffafe;
}

.auth-form h2 {
  margin: 0;
  color: white;
  font-size: 1.25rem;
  font-weight: 900;
}

.auth-form p {
  margin: 0.45rem 0 0;
  color: var(--auth-muted);
  line-height: 1.65;
}

.auth-input {
  width: 100%;
  min-height: 3rem;
  margin-top: 1rem;
  padding: 0.86rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 1rem;
  background: rgba(2, 4, 8, 0.72);
  color: white;
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.auth-input:focus {
  border-color: rgba(103, 232, 249, 0.48);
  background: rgba(7, 10, 16, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 3px rgba(103, 232, 249, 0.12);
}

.auth-input::placeholder {
  color: rgba(191, 203, 224, 0.45);
}

.auth-submit {
  position: relative;
  width: 100%;
  min-height: 3.1rem;
  margin-top: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  color: white;
  font-weight: 900;
  background: linear-gradient(135deg, #7dd3fc, #38bdf8 52%, #2563eb);
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.24);
  overflow: hidden;
  transition: transform 0.18s ease, filter 0.18s ease;
}

.auth-submit::before {
  content: "";
  position: absolute;
  inset: 1px 1px auto;
  height: 52%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), transparent);
  opacity: 0.6;
  pointer-events: none;
}

.auth-submit:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.auth-note {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 0.9rem;
  color: rgba(191, 203, 224, 0.74);
  font-size: 0.78rem;
}

@keyframes authSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .auth-motion {
    transform: none !important;
  }

  .auth-lock-ring {
    animation: none;
  }
}

@media (max-width: 980px) {
  .auth-frame {
    grid-template-columns: 1fr;
  }

  .auth-panel {
    border-left: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
}

@media (max-width: 640px) {
  .auth-shell {
    padding: 1rem 0.85rem;
  }

  .auth-frame {
    border-radius: 1.55rem;
  }

  .auth-copy,
  .auth-panel {
    padding: 1.1rem;
  }

  .auth-title {
    font-size: 3rem;
  }

  .auth-showcase {
    grid-template-columns: 1fr;
  }

  .auth-lock-ring {
    width: 17rem;
    height: 17rem;
  }
}
`

export default function Login() {
  const [password, setPassword] = useState("")
  const [motionEnabled, setMotionEnabled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)")
    const sync = () => setMotionEnabled(media.matches)

    sync()
    media.addEventListener("change", sync)

    return () => media.removeEventListener("change", sync)
  }, [])

  const handleLogin = () => {
    if (password === "5") {
      navigate("/dashboard")
    } else {
      alert("Wrong Password")
    }
  }

  return (
    <>
      <style>{loginStyles}</style>

      <div className="auth-page">
        <div className="auth-orb auth-orb--violet" />
        <div className="auth-orb auth-orb--cyan" />
        <div className="auth-orb auth-orb--coral" />

      <div className=" m-30"></div>
            <div className="auth-panel">
              <div className="auth-lock-card">
                <div className="auth-lock-ring" />

                <div className="auth-form">
                  <div className="auth-form-badge">
                    <LockKeyhole size={18} />
                  </div>

                  <h2>Enter Dashboard Password</h2>
                  <p>Continue into the Jio-bp operations system with your station access key.</p>

                  <input
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleLogin()
                    }}
                    className="auth-input"
                  />

                  <button onClick={handleLogin} className="auth-submit">
                    Login
                    <ArrowRight size={16} />
                  </button>

                  <div className="auth-note">
                    <ShieldCheck size={14} />
                    Premium station access channel
                  </div>
                </div>
              </div>
            </div>  
        </div>
    </>
  )
}

















// import { useState } from "react"
// import { useNavigate } from "react-router-dom"

// export default function Login(){

// const [password,setPassword] = useState("")
// const navigate = useNavigate()

// const handleLogin = () => {

//   const now = new Date()

//   // 🔹 24 HOUR FORMAT
//   const password24 =
//     String(now.getHours()).padStart(2,"0") +
//     String(now.getMinutes()).padStart(2,"0")

//   // 🔹 12 HOUR FORMAT
//   let hours12 = now.getHours() % 12
//   hours12 = hours12 === 0 ? 12 : hours12

//   const password12 =
//     String(hours12).padStart(2,"0") +
//     String(now.getMinutes()).padStart(2,"0")

//   // 🔥 MATCH CHECK
//   // if(password === password24 || password === password12)
//   if(password === "5"){

//     navigate("/dashboard")

//   } else {

//     alert("Wrong Password")

//   }

// }

// return(

// <div className="h-screen flex items-center justify-center bg-[#04060B]">

// <div className="bg-[#0B0F17] border border-[#1F2937] p-8 rounded-xl w-[350px] text-center">

// <h2 className="text-white text-xl mb-4">
// Enter Dashboard Password
// </h2>

// <input
// type="password"
// placeholder="Enter Password"
// value={password}
// onChange={(e)=>setPassword(e.target.value)}
// className="w-full p-3 bg-[#111827] rounded text-white mb-4"
// />

// <button
// onClick={handleLogin}
// className="bg-green-500 px-5 py-2 rounded text-white w-full"
// >

// Login

// </button>

// </div>

// </div>

// )

// }