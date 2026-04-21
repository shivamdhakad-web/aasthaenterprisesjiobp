import { useEffect, useRef, useState } from "react"
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from "../services/employeeApi"
import { getAttendance, addAttendance, updateAttendance, deleteAttendance } from "../services/attendanceApi"
import EmployeeModal from "../components/EmployeeModal"
import AttendanceModal from "../components/AttendanceModal"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const styles = String.raw`
:root {
  --emp-bg: #040407;
  --emp-surface: rgba(13, 10, 17, 0.78);
  --emp-strong: rgba(13, 10, 17, 0.92);
  --emp-border: rgba(255, 255, 255, 0.11);
  --emp-text: rgba(248, 250, 252, 0.98);
  --emp-muted: rgba(186, 190, 205, 0.74);
  --emp-pink: #ec4899;
  --emp-indigo: #6366f1;
  --emp-green: #22c55e;
  --emp-amber: #f59e0b;
  --emp-red: #ef4444;
  --emp-shadow: 0 28px 90px rgba(0, 0, 0, 0.56);
  --emp-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.emp-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--emp-text);
  background:
    radial-gradient(circle at 15% 16%, rgba(236, 72, 153, 0.12), transparent 24%),
    radial-gradient(circle at 82% 20%, rgba(99, 102, 241, 0.1), transparent 20%),
    radial-gradient(circle at 78% 78%, rgba(34, 197, 94, 0.07), transparent 22%),
    linear-gradient(180deg, #020205 0%, #050407 35%, #040407 100%);
}

.emp-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 148px 148px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.54), transparent 95%);
  pointer-events: none;
}

.emp-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(120px);
  opacity: 0.74;
  pointer-events: none;
}

.emp-orb--pink {
  right: -6rem;
  top: 11rem;
  width: 22rem;
  height: 22rem;
  background: rgba(236, 72, 153, 0.18);
}

.emp-orb--indigo {
  left: -7rem;
  top: 28rem;
  width: 23rem;
  height: 23rem;
  background: rgba(99, 102, 241, 0.15);
}

.emp-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

.emp-frame {
  position: absolute;
  inset: 6.2rem -0.5rem auto -0.5rem;
  height: clamp(24rem, 44vw, 38rem);
  border: 1px solid rgba(236, 72, 153, 0.82);
  border-radius: 2.9rem;
  transform: rotate(1.05deg);
  box-shadow: 0 0 120px rgba(236, 72, 153, 0.08);
  pointer-events: none;
}

.emp-frame-node {
  position: absolute;
  top: 5.2rem;
  right: 2rem;
  width: 6rem;
  height: 6rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(236, 72, 153, 0.88);
  background: rgba(12, 8, 14, 0.88);
  color: #fbcfe8;
  font-weight: 800;
  letter-spacing: 0.08em;
  pointer-events: none;
}

.emp-panel,
.emp-metric,
.emp-command,
.emp-table,
.emp-card,
.emp-modal {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    var(--emp-surface);
  border: 1px solid var(--emp-border);
  border-radius: 1.8rem;
  box-shadow: var(--emp-shadow), var(--emp-highlight);
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);
  isolation: isolate;
}

.emp-panel--strong,
.emp-table,
.emp-card,
.emp-modal {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02)),
    var(--emp-strong);
}

.emp-overline {
  margin: 0 0 0.75rem;
  color: rgba(244, 114, 182, 0.95);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.emp-title {
  margin: 0;
  color: white;
  font-size: clamp(2.55rem, 5vw, 4.75rem);
  font-weight: 700;
  line-height: 0.94;
  letter-spacing: -0.055em;
  text-shadow: 0 10px 34px rgba(0, 0, 0, 0.42);
}

.emp-copy {
  margin: 1rem 0 0;
  max-width: 41rem;
  color: rgba(224, 229, 238, 0.78);
  line-height: 1.75;
}

.emp-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(22rem, 0.98fr);
  gap: 1.15rem;
  margin-bottom: 1.5rem;
}

.emp-hero-main,
.emp-hero-visual {
  min-height: 22rem;
  padding: 1.7rem;
}

.emp-tags,
.emp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.35rem;
}

.emp-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.15rem;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(241, 245, 249, 0.9);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.emp-chip--pink {
  border-color: rgba(236, 72, 153, 0.24);
  background: rgba(236, 72, 153, 0.12);
  color: #fbcfe8;
}

.emp-chip--indigo {
  border-color: rgba(99, 102, 241, 0.24);
  background: rgba(99, 102, 241, 0.13);
  color: #c7d2fe;
}

.emp-chip--green {
  border-color: rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.12);
  color: #bbf7d0;
}

.emp-check-list {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.35rem;
}

.emp-check-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  color: rgba(239, 243, 247, 0.88);
  font-weight: 700;
}

.emp-check-dot {
  width: 1.65rem;
  height: 1.65rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  background: rgba(34, 197, 94, 0.96);
  color: #031006;
  font-size: 0.58rem;
  font-weight: 900;
}

.emp-chart {
  position: relative;
  min-height: 13rem;
  padding: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.36);
  border-bottom: 1px solid rgba(255, 255, 255, 0.36);
}

.emp-chart::before,
.emp-chart::after {
  content: "";
  position: absolute;
  left: 0;
  right: 1.2rem;
  height: 0.26rem;
  border-radius: 9999px;
  transform-origin: left center;
}

.emp-chart::before {
  bottom: 3.1rem;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.86), rgba(148, 163, 184, 0.35));
  transform: skewY(-4deg);
}

.emp-chart::after {
  bottom: 5.7rem;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.3), rgba(236, 72, 153, 0.95));
  transform: skewY(-9deg);
  box-shadow: 0 0 18px rgba(236, 72, 153, 0.18);
}

.emp-chart-node {
  position: absolute;
  right: 17%;
  top: 18%;
  width: 4.2rem;
  height: 4.2rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.96), rgba(236, 72, 153, 0.92));
  color: white;
  font-weight: 900;
}

.emp-chart-label {
  position: absolute;
  right: 14%;
  top: calc(18% + 4.5rem);
  color: rgba(245, 247, 250, 0.9);
  font-weight: 700;
}

.emp-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.emp-section-title {
  margin: 0.15rem 0 0;
  color: white;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.emp-badge {
  min-height: 2.3rem;
  padding: 0.45rem 0.95rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(221, 229, 234, 0.78);
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
}

.emp-command {
  padding: 1rem;
  margin-bottom: 1.35rem;
}

.emp-command-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.85rem;
}

.emp-input,
.input {
  width: 100%;
  min-height: 3rem;
  padding: 0.88rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--emp-text);
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.emp-input:focus,
.input:focus {
  border-color: rgba(236, 72, 153, 0.32);
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 0 3px rgba(236, 72, 153, 0.12);
}

.emp-input::placeholder,
.input::placeholder {
  color: rgba(198, 204, 216, 0.5);
}

.emp-input::-webkit-calendar-picker-indicator,
.input::-webkit-calendar-picker-indicator {
  filter: invert(1) opacity(0.74);
}

.emp-button,
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.88rem 1.2rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  color: white;
  font-weight: 600;
  letter-spacing: 0.01em;
  overflow: hidden;
}

.emp-button::before,
.btn::before {
  content: "";
  position: absolute;
  inset: 1px 1px auto 1px;
  height: 52%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent);
  opacity: 0.6;
  pointer-events: none;
}

.emp-button--pink,
.btn-purple {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.96), rgba(190, 24, 93, 0.95));
  box-shadow: 0 18px 36px rgba(236, 72, 153, 0.2);
}

.emp-button--green,
.btn-green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.94), rgba(16, 185, 129, 0.9));
  box-shadow: 0 18px 36px rgba(34, 197, 94, 0.16);
}

.emp-button--ghost {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.emp-button--danger,
.btn-red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(225, 29, 72, 0.2));
  border-color: rgba(248, 113, 113, 0.2);
  color: #fecaca;
}

.emp-button--row {
  min-height: 2.35rem;
  padding: 0.55rem 0.95rem;
}

.emp-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.4rem;
}

.emp-metric,
.card {
  padding: 1.25rem;
}

.emp-metric--featured {
  grid-column: span 2;
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.emp-metric-label {
  color: var(--emp-muted);
  font-size: 0.88rem;
}

.emp-metric-value {
  display: block;
  margin-top: 0.45rem;
  color: white;
  font-size: clamp(1.25rem, 2.5vw, 1.8rem);
  font-weight: 700;
}

.emp-metric--featured .emp-metric-value {
  font-size: clamp(2rem, 3.5vw, 2.9rem);
}

.emp-metric-meta {
  display: block;
  margin-top: 0.75rem;
  color: rgba(212, 219, 230, 0.66);
  font-size: 0.82rem;
  line-height: 1.55;
}

.emp-table {
  overflow: hidden;
  margin-bottom: 1.4rem;
}

.emp-table-scroll {
  overflow-x: auto;
}

.emp-table table,
.table {
  width: 100%;
  border-collapse: collapse;
}

.emp-table thead {
  background: linear-gradient(180deg, rgba(24, 12, 20, 0.96), rgba(13, 10, 17, 0.92));
}

.emp-table th,
.emp-table td,
.table th,
.table td {
  padding: 1rem;
  text-align: left;
}

.emp-table th {
  color: rgba(221, 224, 235, 0.78);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.emp-table td {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(237, 241, 245, 0.88);
}

.emp-table tbody tr {
  cursor: pointer;
}

.emp-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.035);
}

.emp-row-actions {
  display: flex;
  gap: 0.65rem;
}

.emp-ledger-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.36rem 0.76rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: capitalize;
}

.emp-chip-role {
  background: rgba(236, 72, 153, 0.12);
  color: #fbcfe8;
}

.emp-chip-shift {
  background: rgba(99, 102, 241, 0.13);
  color: #c7d2fe;
}

.emp-chip-present {
  background: rgba(34, 197, 94, 0.12);
  color: #bbf7d0;
}

.emp-chip-absent {
  background: rgba(239, 68, 68, 0.12);
  color: #fecaca;
}

.emp-chip-double {
  background: rgba(245, 158, 11, 0.12);
  color: #fde68a;
}

.emp-money {
  color: #fbcfe8;
  font-weight: 700;
}

.emp-mobile-list {
  display: none;
}

.emp-card {
  padding: 1rem;
}

.emp-card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.85rem;
}

.emp-card-title {
  margin: 0;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
}

.emp-card-meta {
  margin: 0.3rem 0 0;
  color: var(--emp-muted);
  font-size: 0.84rem;
}

.emp-card-value {
  margin: 0;
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
}

.emp-card-actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 1rem;
}

.emp-card-actions .emp-button {
  flex: 1;
}

.emp-card-extra {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease, margin-top 0.28s ease;
}

.emp-card-extra-open {
  grid-template-rows: 1fr;
  margin-top: 0.95rem;
}

.emp-card-extra-wrap {
  overflow: hidden;
}

.emp-card-extra-inner {
  padding-top: 0.95rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.emp-attendance {
  margin-top: 1.15rem;
}

.emp-attendance-panel {
  padding: 1.35rem;
  overflow: visible;
}

.emp-attendance-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.emp-attendance-title {
  margin: 0;
  color: white;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.emp-attendance-copy {
  margin: 0.45rem 0 0;
  max-width: 42rem;
  color: rgba(220, 226, 235, 0.72);
  line-height: 1.65;
}

.emp-attendance-actions {
  display: grid;
  grid-template-columns: 13rem auto auto auto;
  gap: 0.75rem;
}

.emp-attendance-actions .emp-input {
  min-width: 13rem;
}

.emp-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(18px);
}

.emp-modal {
  width: min(100%, 27rem);
  padding: 1.35rem;
}

.emp-modal-title {
  margin: 0;
  color: white;
  font-size: 1.28rem;
  font-weight: 700;
}

.emp-modal-copy {
  margin: 0.45rem 0 1rem;
  color: rgba(214, 220, 226, 0.68);
}

.emp-modal-body {
  display: grid;
  gap: 0.85rem;
}

.emp-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.emp-tilt {
  --tilt-rx: 0deg;
  --tilt-ry: 0deg;
  --tilt-scale: 1;
  --tilt-lift: 0px;
  --tilt-inner-x: 0px;
  --tilt-inner-y: 0px;
  --tilt-pointer-x: 50%;
  --tilt-pointer-y: 50%;
  transform-style: preserve-3d;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  transform:
    perspective(1500px)
    rotateX(var(--tilt-rx))
    rotateY(var(--tilt-ry))
    translateY(var(--tilt-lift))
    scale(var(--tilt-scale));
}

.emp-tilt::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at var(--tilt-pointer-x) var(--tilt-pointer-y), rgba(255, 255, 255, 0.08), transparent 36%),
    radial-gradient(circle at var(--tilt-pointer-x) var(--tilt-pointer-y), rgba(236, 72, 153, 0.08), transparent 56%);
  opacity: 0;
  transition: opacity 0.22s ease;
  pointer-events: none;
}

.emp-tilt--interactive:hover {
  will-change: transform;
  border-color: rgba(236, 72, 153, 0.18);
}

.emp-tilt--interactive:hover::after {
  opacity: 1;
}

.emp-tilt-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  transform: translate(var(--tilt-inner-x), var(--tilt-inner-y));
  transition: transform 0.22s ease;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@media (max-width: 1120px) {
  .emp-frame,
  .emp-frame-node {
    display: none;
  }

  .emp-hero {
    grid-template-columns: 1fr;
  }

  .emp-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .emp-metric--featured {
    grid-column: span 2;
  }

  .emp-attendance-head {
    grid-template-columns: 1fr;
  }

  .emp-attendance-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .emp-shell {
    padding-inline: 0.9rem;
  }

  .emp-title {
    font-size: 3rem;
  }

  .emp-hero-main,
  .emp-hero-visual {
    min-height: auto;
    padding: 1.15rem;
  }

  .emp-command-grid,
  .emp-metrics {
    grid-template-columns: 1fr;
  }

  .emp-metric--featured {
    grid-column: span 1;
  }

  .emp-section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .emp-table {
    display: none;
  }

  .emp-mobile-list {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.35rem;
  }

  .emp-card-actions,
  .emp-modal-actions {
    flex-direction: column;
  }

  .emp-attendance-actions {
    grid-template-columns: 1fr;
  }
}
`

const RUPEE = "\u20B9"
const formatter = new Intl.NumberFormat("en-IN")
const formatCurrency = (value) => `${RUPEE}${formatter.format(Number(value || 0))}`
const normalizeText = (value) => String(value || "").toLowerCase()

const formatDateLabel = (value) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value?.slice?.(0, 10) || "-"
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function TiltPanel({ enabled, className = "", children, strength = 8, ...props }) {
  const panelRef = useRef(null)
  const frameRef = useRef(0)
  const stateRef = useRef({
    rotateX: 0,
    rotateY: 0,
    innerX: 0,
    innerY: 0,
    pointerX: 50,
    pointerY: 50,
    scale: 1,
    lift: 0,
  })

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const flushFrame = () => {
    const node = panelRef.current
    if (!node) {
      frameRef.current = 0
      return
    }

    const current = stateRef.current
    node.style.setProperty("--tilt-rx", `${current.rotateX}deg`)
    node.style.setProperty("--tilt-ry", `${current.rotateY}deg`)
    node.style.setProperty("--tilt-inner-x", `${current.innerX}px`)
    node.style.setProperty("--tilt-inner-y", `${current.innerY}px`)
    node.style.setProperty("--tilt-pointer-x", `${current.pointerX}%`)
    node.style.setProperty("--tilt-pointer-y", `${current.pointerY}%`)
    node.style.setProperty("--tilt-scale", `${current.scale}`)
    node.style.setProperty("--tilt-lift", `${current.lift}px`)
    frameRef.current = 0
  }

  const scheduleFrame = () => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(flushFrame)
  }

  const handleMove = (event) => {
    if (!enabled) return
    const node = panelRef.current
    if (!node) return

    const rect = node.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * 100
    const py = ((event.clientY - rect.top) / rect.height) * 100
    const centeredX = (px - 50) / 50
    const centeredY = (py - 50) / 50

    stateRef.current = {
      rotateX: centeredY * -strength,
      rotateY: centeredX * strength,
      innerX: centeredX * strength * 0.45,
      innerY: centeredY * strength * 0.45,
      pointerX: px,
      pointerY: py,
      scale: 1.004,
      lift: -2,
    }
    scheduleFrame()
  }

  const handleLeave = () => {
    stateRef.current = {
      rotateX: 0,
      rotateY: 0,
      innerX: 0,
      innerY: 0,
      pointerX: 50,
      pointerY: 50,
      scale: 1,
      lift: 0,
    }
    scheduleFrame()
  }

  return (
    <div
      ref={panelRef}
      className={`emp-tilt ${enabled ? "emp-tilt--interactive" : ""} ${className}`}
      onMouseMove={enabled ? handleMove : undefined}
      onMouseLeave={enabled ? handleLeave : undefined}
      {...props}
    >
      <div className="emp-tilt-inner">{children}</div>
    </div>
  )
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [attendanceModal, setAttendanceModal] = useState(false)
  const [editAttendance, setEditAttendance] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [openCard, setOpenCard] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [tiltEnabled, setTiltEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)")
    const motionQuery = window.matchMedia("(prefers-reduced-motion: no-preference)")
    const updateMotion = () => setTiltEnabled(pointerQuery.matches && motionQuery.matches)
    updateMotion()

    if (typeof pointerQuery.addEventListener === "function") {
      pointerQuery.addEventListener("change", updateMotion)
      motionQuery.addEventListener("change", updateMotion)
    } else {
      pointerQuery.addListener(updateMotion)
      motionQuery.addListener(updateMotion)
    }

    return () => {
      if (typeof pointerQuery.removeEventListener === "function") {
        pointerQuery.removeEventListener("change", updateMotion)
        motionQuery.removeEventListener("change", updateMotion)
      } else {
        pointerQuery.removeListener(updateMotion)
        motionQuery.removeListener(updateMotion)
      }
    }
  }, [])

  const fetchEmployees = async () => {
    const data = await getEmployees()
    setEmployees(data)
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const openLedger = async (employee) => {
    setSelectedEmployee(employee)
    const data = await getAttendance(employee._id)
    setAttendance(data)
  }

  const closeLedger = () => {
    setSelectedEmployee(null)
    setAttendance([])
    setSelectedMonth("")
  }

  const toggleLedger = async (employee) => {
    if (selectedEmployee?._id === employee._id) {
      closeLedger()
      return
    }

    await openLedger(employee)
  }

  const saveEmployee = async (data) => {
    if (editEmployee) {
      await updateEmployee(editEmployee._id, data)
    } else {
      await addEmployee(data)
    }

    setModalOpen(false)
    setEditEmployee(null)
    await fetchEmployees()
  }

  const saveAttendance = async (data) => {
    if (!selectedEmployee) return

    if (editAttendance) {
      await updateAttendance(editAttendance._id, data)
    } else {
      await addAttendance(selectedEmployee._id, data)
    }

    setAttendanceModal(false)
    setEditAttendance(null)
    await openLedger(selectedEmployee)
  }

  const removeEmployee = async (id) => {
    await deleteEmployee(id)
    if (selectedEmployee?._id === id) closeLedger()
    await fetchEmployees()
  }

  const removeAttendance = async (id) => {
    if (!selectedEmployee) return
    await deleteAttendance(id)
    await openLedger(selectedEmployee)
  }

  const filteredEmployees = employees.filter((employee) =>
    normalizeText(employee.name).includes(normalizeText(search))
  )

  const filteredAttendance = attendance.filter((entry) => {
    if (!selectedMonth) return true
    return new Date(entry.date).toISOString().slice(0, 7) === selectedMonth
  })

  const getFilteredByDate = () =>
    filteredAttendance.filter((entry) => {
      const parsed = new Date(entry.date)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(`${toDate}T23:59:59`) : null
      return (!from || parsed >= from) && (!to || parsed <= to)
    })

  const calculateSalary = () => {
    if (!selectedEmployee) {
      return { present: 0, absent: 0, dbl: 0, earned: 0, shortage: 0, advance: 0, final: 0 }
    }

    const salary = Number(selectedEmployee.salary || 0)
    const perDay = salary / 30
    const doublePay = salary / 15
    let present = 0
    let absent = 0
    let dbl = 0
    let shortage = 0
    let advance = 0

    filteredAttendance.forEach((entry) => {
      if (entry.status === "present") present++
      if (entry.status === "absent") absent++
      if (entry.status === "double") dbl++
      shortage += Number(entry.shortage || 0)
      advance += Number(entry.advanceCash || 0)
      advance += Number(entry.advancePetrol || 0)
    })

    const earned = Math.round(present * perDay) + dbl * doublePay
    const final = earned + shortage - advance
    return { present, absent, dbl, earned, shortage, advance, final }
  }

  const deleteMonth = async () => {
    if (!selectedEmployee) return

    if (!selectedMonth) {
      alert("Select month first")
      return
    }

    if (!window.confirm("Delete this month attendance?")) return

    const toDelete = attendance.filter((entry) => new Date(entry.date).toISOString().slice(0, 7) === selectedMonth)
    for (const entry of toDelete) {
      await deleteAttendance(entry._id)
    }

    await openLedger(selectedEmployee)
  }

  const generateEmployeePDF = () => {
    if (!selectedEmployee) {
      alert("Select employee first")
      return false
    }

    const filteredData = getFilteredByDate()
    if (filteredData.length === 0) {
      alert("No attendance found for this report")
      return false
    }

    let present = 0
    let absent = 0
    let dbl = 0
    let shortage = 0
    let advance = 0

    filteredData.forEach((entry) => {
      if (entry.status === "present") present++
      if (entry.status === "absent") absent++
      if (entry.status === "double") dbl++
      shortage += Number(entry.shortage || 0)
      advance += Number(entry.advanceCash || 0)
      advance += Number(entry.advancePetrol || 0)
    })

    const salary = Number(selectedEmployee.salary || 0)
    const totalDays = filteredData.length || 1
    const perDay = salary / totalDays
    const doublePay = perDay * 2
    const earned = Math.round(present * perDay) + Math.round(dbl * doublePay)
    const final = earned + shortage - advance

    const doc = new jsPDF()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("Aastha Enterprises", 14, 18)
    doc.setFontSize(12)
    doc.text("Employee Attendance Report", 14, 26)

    doc.setFontSize(10)
    doc.text(`Name: ${selectedEmployee.name}`, 14, 36)
    doc.text(`Role: ${selectedEmployee.role}`, 14, 42)
    doc.text(`From: ${fromDate || "All"}  To: ${toDate || "All"}`, 14, 48)
    doc.line(14, 52, 196, 52)

    doc.setFontSize(13)
    doc.text("Summary", 14, 60)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setCharSpace(0)
    doc.text(`Present: ${present}`, 14, 70)
    doc.text(`Absent: ${absent}`, 80, 70)
    doc.text(`Double: ${dbl}`, 150, 70)
    doc.text(`Earned: Rs.${earned}`, 14, 75)
    doc.text(`Shortage: Rs.${shortage}`, 80, 75)
    doc.text(`Advance: Rs.${advance}`, 150, 75)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 150, 0)
    doc.text(`Final Balance: Rs.${final}`, 14, 80)
    doc.setTextColor(0, 0, 0)

    autoTable(doc, {
      startY: 85,
      head: [["Date", "Status", "Short", "Cash", "Petrol"]],
      body: filteredData.map((entry) => [
        entry.date?.slice(0, 10),
        entry.status,
        entry.shortage,
        entry.advanceCash,
        entry.advancePetrol,
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [190, 24, 93], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })

    doc.save(`${selectedEmployee.name}_Report.pdf`)
    return true
  }

  const summary = calculateSalary()
  const totalShortage = filteredAttendance.reduce((sum, entry) => sum + Number(entry.shortage || 0), 0)
  const totalPayroll = employees.reduce((sum, employee) => sum + Number(employee.salary || 0), 0)
  const presentRatio = filteredAttendance.length ? Math.round((summary.present / filteredAttendance.length) * 100) : 0
  const selectedName = selectedEmployee?.name || "No employee selected"

  const summaryCards = [
    {
      label: "Workforce",
      value: filteredEmployees.length,
      meta: `${employees.length} total employee records`,
      accent: "emp-metric--featured",
    },
    {
      label: "Monthly Payroll",
      value: formatCurrency(totalPayroll),
      meta: "Total salary exposure",
    },
    {
      label: "Selected Final",
      value: formatCurrency(Math.round(summary.final)),
      meta: selectedName,
    },
    {
      label: "Attendance Rows",
      value: attendance.length,
      meta: selectedEmployee ? `${filteredAttendance.length} in current filter` : "Open a ledger to view rows",
    },
  ]

  const statusClass = (status) => {
    if (status === "absent") return "emp-chip-absent"
    if (status === "double") return "emp-chip-double"
    return "emp-chip-present"
  }

  return (
    <>
      <style>{styles}</style>

      <div className="emp-page">
        <div className="emp-orb emp-orb--pink" />
        <div className="emp-orb emp-orb--indigo" />

        <div className="emp-shell">
          <div className="emp-frame" />
          <div className="emp-frame-node">HR</div>

          <div className="emp-hero">
            <TiltPanel enabled={tiltEnabled} strength={6} className="emp-panel emp-hero-main">
              <p className="emp-overline">People Intelligence</p>
              <h1 className="emp-title">Employees & Attendance</h1>
              <p className="emp-copy">
                A premium control room for employee records, attendance ledgers, payroll signals, shortages, advances,
                and PDF reporting with clean magenta-noir motion.
              </p>

              <div className="emp-tags">
                <span className="emp-chip emp-chip--pink">{filteredEmployees.length} employees in view</span>
                <span className="emp-chip emp-chip--indigo">Payroll {formatCurrency(totalPayroll)}</span>
                <span className="emp-chip emp-chip--green">{selectedName}</span>
                <span className="emp-chip emp-chip--pink">{presentRatio}% present signal</span>
              </div>

              <div className="emp-actions">
                <button
                  className="emp-button emp-button--pink"
                  onClick={() => {
                    setEditEmployee(null)
                    setModalOpen(true)
                  }}
                >
                  + Add Employee
                </button>
                <button
                  className="emp-button emp-button--ghost"
                  onClick={() => {
                    setSearch("")
                    closeLedger()
                  }}
                >
                  Clear View
                </button>
              </div>
            </TiltPanel>

            <TiltPanel enabled={tiltEnabled} strength={5} className="emp-panel emp-hero-visual">
              <div className="emp-check-list">
                <div className="emp-check-row"><span>Structured salary ledger</span><span className="emp-check-dot">✔️</span></div>
                <div className="emp-check-row"><span>Attendance report ready</span><span className="emp-check-dot">✔️</span></div>
                <div className="emp-check-row"><span>Advance + shortage tracking</span><span className="emp-check-dot">✔️</span></div>
                <div className="emp-check-row"><span>Mobile staff cards</span><span className="emp-check-dot">✔️</span></div>
              </div>
              <div className="emp-chart">
                <div className="emp-chart-node">AE</div>
              </div>
            </TiltPanel>
          </div>

          <div className="emp-section-head">
            <div>
              <p className="emp-overline">Snapshot</p>
              <h2 className="emp-section-title">Premium workforce overview</h2>
            </div>
            <div className="emp-badge">{selectedEmployee ? `Ledger: ${selectedEmployee.name}` : "Select a row"}</div>
          </div>

          <div className="emp-metrics">
            {summaryCards.map((card, index) => (
              <TiltPanel
                key={card.label}
                enabled={tiltEnabled}
                strength={index === 0 ? 6 : 4}
                className={`emp-metric ${card.accent || ""}`}
              >
                <span className="emp-metric-label">{card.label}</span>
                <strong className="emp-metric-value">{card.value}</strong>
                <span className="emp-metric-meta">{card.meta}</span>
              </TiltPanel>
            ))}
          </div>

          <div className="emp-section-head">
            <div>
              <p className="emp-overline">Command Deck</p>
              <h2 className="emp-section-title">Search and manage employees</h2>
            </div>
            <div className="emp-badge">{filteredEmployees.length} rows</div>
          </div>

          <TiltPanel enabled={tiltEnabled} strength={4} className="emp-command">
            <div className="emp-command-grid">
              <input
                placeholder="Search employee..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="emp-input"
              />
              <button
                className="emp-button emp-button--pink"
                onClick={() => {
                  setEditEmployee(null)
                  setModalOpen(true)
                }}
              >
                + Add Employee
              </button>
            </div>
          </TiltPanel>

          <div className="emp-section-head">
            <div>
              <p className="emp-overline">Directory</p>
              <h2 className="emp-section-title">Employee roster</h2>
            </div>
            <div className="emp-badge">Click once to open, click again to close</div>
          </div>

          <div className="emp-table">
            <div className="emp-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Shift</th>
                    <th>Phone</th>
                    <th>Salary</th>
                    <th>Tshirt</th>
                    <th>Pant</th>
                    <th>Shoes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id} onClick={() => toggleLedger(employee)}>
                      <td>{employee.name}</td>
                      <td><span className="emp-ledger-chip emp-chip-role">{employee.role}</span></td>
                      <td><span className="emp-ledger-chip emp-chip-shift">{employee.shift}</span></td>
                      <td>{employee.phone}</td>
                      <td className="emp-money">{formatCurrency(employee.salary)}</td>
                      <td>{employee.tshirt || "-"}</td>
                      <td>{employee.pant || "-"}</td>
                      <td>{employee.shoes || "-"}</td>
                      <td>
                        <div className="emp-row-actions">
                          <button
                            className="emp-button emp-button--ghost emp-button--row"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditEmployee(employee)
                              setModalOpen(true)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="emp-button emp-button--danger emp-button--row"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeEmployee(employee._id)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="emp-mobile-list">
            {filteredEmployees.map((employee) => {
              const isOpen = openCard === employee._id
              return (
                <div
                  key={employee._id}
                  className="emp-card"
                  onClick={() => setOpenCard(isOpen ? null : employee._id)}
                >
                  <div className="emp-card-top">
                    <div>
                      <p className="emp-card-title">{employee.name}</p>
                      <p className="emp-card-meta">{employee.role} - Shift {employee.shift}</p>
                    </div>
                    <p className="emp-card-value">{formatCurrency(employee.salary)}</p>
                  </div>
                  <p className="emp-card-meta">Phone {employee.phone || "-"}</p>

                  <div className={`emp-card-extra ${isOpen ? "emp-card-extra-open" : ""}`}>
                    <div className="emp-card-extra-wrap">
                      <div className="emp-card-extra-inner">
                        <p className="emp-card-meta">
                          Tshirt {employee.tshirt || "-"} - Pant {employee.pant || "-"} - Shoes {employee.shoes || "-"}
                        </p>
                        <div className="emp-card-actions">
                          <button
                            className="emp-button emp-button--ghost emp-button--row"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditEmployee(employee)
                              setModalOpen(true)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="emp-button emp-button--danger emp-button--row"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeEmployee(employee._id)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        <button
                          className="emp-button emp-button--green"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleLedger(employee)
                          }}
                        >
                          {selectedEmployee?._id === employee._id ? "Close Attendance" : "View Attendance"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedEmployee && (
            <div className="emp-attendance">
              <div className="emp-section-head">
                <div>
                  <p className="emp-overline">Attendance Ledger</p>
                  <h2 className="emp-section-title">{selectedEmployee.name}</h2>
                </div>
                <div className="emp-badge">Total shortage {formatCurrency(totalShortage)}</div>
              </div>

              <div className="emp-panel emp-panel--strong emp-attendance-panel">
                <div className="emp-attendance-head">
                  <div>
                    <h3 className="emp-attendance-title">Payroll balance command</h3>
                    <p className="emp-attendance-copy">
                      Month-wise attendance, shortage, advance cash, petrol advance, and final payable calculation.
                    </p>
                  </div>
                  <div className="emp-attendance-actions">
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(event.target.value)}
                      className="emp-input"
                    />
                    <button
                      className="emp-button emp-button--green"
                      onClick={() => {
                        setEditAttendance(null)
                        setAttendanceModal(true)
                      }}
                    >
                      + Add
                    </button>
                    <button className="emp-button emp-button--pink" onClick={() => setReportOpen(true)}>PDF</button>
                    <button className="emp-button emp-button--danger" onClick={deleteMonth}>Delete Month</button>
                  </div>
                </div>

                <div className="emp-metrics">
                  <div className="emp-metric">
                    <span className="emp-metric-label">Present</span>
                    <strong className="emp-metric-value">{summary.present}</strong>
                    <span className="emp-metric-meta">Regular days</span>
                  </div>
                  <div className="emp-metric">
                    <span className="emp-metric-label">Absent</span>
                    <strong className="emp-metric-value">{summary.absent}</strong>
                    <span className="emp-metric-meta">Missed days</span>
                  </div>
                  <div className="emp-metric">
                    <span className="emp-metric-label">Double</span>
                    <strong className="emp-metric-value">{summary.dbl}</strong>
                    <span className="emp-metric-meta">Double-pay shifts</span>
                  </div>
                  <div className="emp-metric">
                    <span className="emp-metric-label">Final Balance</span>
                    <strong className="emp-metric-value">{formatCurrency(Math.round(summary.final))}</strong>
                    <span className="emp-metric-meta">
                      Earned {formatCurrency(Math.round(summary.earned))} - Advance {formatCurrency(summary.advance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="emp-table">
                <div className="emp-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Short</th>
                        <th>Cash</th>
                        <th>Petrol</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.map((entry) => (
                        <tr key={entry._id}>
                          <td>{formatDateLabel(entry.date)}</td>
                          <td><span className={`emp-ledger-chip ${statusClass(entry.status)}`}>{entry.status}</span></td>
                          <td className={Number(entry.shortage) >= 0 ? "text-green-400" : "text-red-400"}>
                            {Number(entry.shortage) > 0 ? `+${entry.shortage}` : entry.shortage}
                          </td>
                          <td>{formatCurrency(entry.advanceCash)}</td>
                          <td>{formatCurrency(entry.advancePetrol)}</td>
                          <td>
                            <div className="emp-row-actions">
                              <button
                                className="emp-button emp-button--ghost emp-button--row"
                                onClick={() => {
                                  setEditAttendance(entry)
                                  setAttendanceModal(true)
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="emp-button emp-button--danger emp-button--row"
                                onClick={() => removeAttendance(entry._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="emp-mobile-list">
                {filteredAttendance.map((entry) => (
                  <div key={entry._id} className="emp-card">
                    <div className="emp-card-top">
                      <div>
                        <p className="emp-card-title">{formatDateLabel(entry.date)}</p>
                        <p className="emp-card-meta">Status {entry.status}</p>
                      </div>
                      <p className="emp-card-value">{formatCurrency(entry.shortage)}</p>
                    </div>
                    <p className="emp-card-meta">
                      Cash {formatCurrency(entry.advanceCash)} - Petrol {formatCurrency(entry.advancePetrol)}
                    </p>
                    <div className="emp-card-actions">
                      <button
                        className="emp-button emp-button--ghost emp-button--row"
                        onClick={() => {
                          setEditAttendance(entry)
                          setAttendanceModal(true)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="emp-button emp-button--danger emp-button--row"
                        onClick={() => removeAttendance(entry._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {reportOpen && (
          <div className="emp-modal-backdrop">
            <div className="emp-modal">
              <h2 className="emp-modal-title">Generate report</h2>
              <p className="emp-modal-copy">Export the selected employee attendance ledger using a precise date range.</p>
              <div className="emp-modal-body">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="emp-input"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="emp-input"
                />
              </div>
              <div className="emp-modal-actions">
                <button className="emp-button emp-button--ghost" onClick={() => setReportOpen(false)}>Cancel</button>
                <button
                  className="emp-button emp-button--pink"
                  onClick={() => {
                    if (generateEmployeePDF()) setReportOpen(false)
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        <EmployeeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={saveEmployee}
          editData={editEmployee}
        />

        <AttendanceModal
          open={attendanceModal}
          onClose={() => {
            setAttendanceModal(false)
            setEditAttendance(null)
          }}
          onSave={saveAttendance}
          editData={editAttendance}
        />
      </div>
    </>
  )
}







// import { useEffect,useState } from "react"

// import {
// getEmployees,
// addEmployee,
// updateEmployee,
// deleteEmployee
// } from "../services/employeeApi"

// import {
// getAttendance,
// addAttendance,
// updateAttendance,
// deleteAttendance
// } from "../services/attendanceApi"

// import EmployeeModal from "../components/EmployeeModal"
// import AttendanceModal from "../components/AttendanceModal"
// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"

// export default function Employees(){

// const [employees,setEmployees] = useState([])
// const [search,setSearch] = useState("")

// const [modalOpen,setModalOpen] = useState(false)
// const [editEmployee,setEditEmployee] = useState(null)

// const [attendance,setAttendance] = useState([])
// const [selectedEmployee,setSelectedEmployee] = useState(null)

// const [attendanceModal,setAttendanceModal] = useState(false)
// const [editAttendance,setEditAttendance] = useState(null)

// const [selectedMonth,setSelectedMonth] = useState("")

// const [openCard,setOpenCard] = useState(null)
// const [reportOpen,setReportOpen] = useState(false)
// const [fromDate,setFromDate] = useState("")
// const [toDate,setToDate] = useState("")

// const [view,setView] = useState(
// window.innerWidth < 640 ? "mobile" : "desktop"
// )


// const getFilteredByDate = () => {

// return filteredAttendance.filter(a => {

// const d = new Date(a.date)

// return (
// (!fromDate || d >= new Date(fromDate)) &&
// (!toDate || d <= new Date(toDate))
// )

// })

// }

// useEffect(()=>{
// const handleResize = ()=>{
// if(window.innerWidth < 640){
// setView("mobile")
// }else{
// setView("desktop")
// }
// }

// handleResize()
// window.addEventListener("resize",handleResize)
// return ()=>window.removeEventListener("resize",handleResize)
// },[])

// const fetchEmployees = async()=>{

// const data = await getEmployees()
// setEmployees(data)

// }

// useEffect(()=>{

// fetchEmployees()

// },[])


// const saveEmployee = async(data)=>{

// if(editEmployee){

// await updateEmployee(editEmployee._id,data)

// }else{

// await addEmployee(data)

// }

// setModalOpen(false)
// setEditEmployee(null)

// fetchEmployees()

// }


// const openLedger = async(emp)=>{

// setSelectedEmployee(emp)

// const data = await getAttendance(emp._id)

// setAttendance(data)

// }


// const saveAttendance = async(data)=>{

// if(editAttendance){

// await updateAttendance(editAttendance._id,data)

// }else{

// await addAttendance(selectedEmployee._id,data)

// }

// setAttendanceModal(false)
// setEditAttendance(null)

// openLedger(selectedEmployee)

// }


// const removeEmployee = async(id)=>{

// await deleteEmployee(id)

// fetchEmployees()

// }


// const removeAttendance = async(id)=>{

// await deleteAttendance(id)

// openLedger(selectedEmployee)

// }


// /* SALARY CALCULATION */

// const calculateSalary = ()=>{

// if(!selectedEmployee) return {}

// const salary = selectedEmployee.salary || 0

// const perDay = salary / 30
// const doublePay = salary / 15

// let present=0
// let absent=0
// let dbl=0

// let shortage=0
// let advance=0

// filteredAttendance.forEach(a=>{

// if(a.status==="present") present++
// if(a.status==="absent") absent++
// if(a.status==="double") dbl++

// shortage += Number(a.shortage || 0)

// advance += Number(a.advanceCash || 0)
// advance += Number(a.advancePetrol || 0)

// })

// const earned =
// Math.round(present*perDay)+(dbl*doublePay)

// const final =
// earned + shortage - advance

// return{
// present,
// absent,
// dbl,
// earned,
// shortage,
// advance,
// final
// }

// }

// const filteredAttendance = attendance.filter(a=>{

// if(!selectedMonth) return true

// const entryDate = new Date(a.date)

// const entryMonth =
// entryDate.toISOString().slice(0,7)

// return entryMonth === selectedMonth

// })

// const deleteMonth = async()=>{

// if(!selectedMonth){

// alert("Select month first")

// return

// }

// const confirmDelete =
// window.confirm("Delete this month attendance?")

// if(!confirmDelete) return

// const toDelete =
// attendance.filter(a=>{

// const d = new Date(a.date)

// return d.toISOString().slice(0,7) === selectedMonth

// })

// for(const a of toDelete){

// await deleteAttendance(a._id)

// }

// openLedger(selectedEmployee)

// }

// let totalShortage = 0

// filteredAttendance.forEach(a=>{

// totalShortage += Number(a.shortage || 0)

// })

// const generateEmployeePDF = () => {

// const filteredData = getFilteredByDate()

// // =====================
// // 🔹 SUMMARY CALCULATION
// // =====================
// let present=0, absent=0, dbl=0, shortage=0, advance=0

// filteredData.forEach(a=>{
// if(a.status==="present") present++
// if(a.status==="absent") absent++
// if(a.status==="double") dbl++

// shortage += Number(a.shortage || 0)
// advance += Number(a.advanceCash || 0)
// advance += Number(a.advancePetrol || 0)
// })

// // =====================
// // 🔹 DATE BASED SALARY
// // =====================
// const salary = selectedEmployee.salary || 0

// const totalDays = filteredData.length || 1
// const perDay = salary / totalDays
// const doublePay = perDay * 2

// const earned =
// Math.round(present * perDay) +
// Math.round(dbl * doublePay)

// const final = earned + shortage - advance


// // =====================
// // 🔹 PDF START
// // =====================
// const doc = new jsPDF()

// // HEADER
// doc.setFont("helvetica","bold")
// doc.setFontSize(18)
// doc.text("Aastha Enterprises", 14, 18)

// doc.setFontSize(12)
// doc.setFont("helvetica","bold")
// doc.text("Employee Attendance Report", 14, 26)


// // EMPLOYEE INFO
// doc.setFontSize(10)
// doc.text(`Name: ${selectedEmployee.name}`, 14, 36)
// doc.text(`Role: ${selectedEmployee.role}`, 14, 42)
// doc.text(`From: ${fromDate || "All"}  To: ${toDate || "All"}`, 14, 48)


// // LINE
// doc.setDrawColor(200)
// doc.line(14, 52, 196, 52)


// // SUMMARY TITLE
// doc.setFont("helvetica","bold")
// doc.setFontSize(13)
// doc.text("Summary", 14, 60)

// // RESET FONT (IMPORTANT FIX)
// doc.setFont("helvetica","normal")
// doc.setFontSize(10)
// doc.setCharSpace(0)

// // ROW 1
// doc.text("Present: " + present, 14, 70)
// doc.text("Absent: " + absent, 80, 70)
// doc.text("Double: " + dbl, 150, 70)

// // ROW 2 (NO SPACE BUG NOW)
// doc.text("Earned: Rs." + earned, 14, 75)
// doc.text("Shortage: Rs." + shortage, 80, 75)
// doc.text("Advance: Rs." + advance, 150, 75)

// // FINAL
// doc.setFont("helvetica","bold")
// doc.setTextColor(0,150,0)
// doc.text("Final Balance: Rs." + final, 14, 80)

// doc.setTextColor(0,0,0)


// // =====================
// // 🔹 TABLE
// // =====================
// autoTable(doc,{
// startY: 85,

// head:[["Date","Status","Short","Cash","Petrol"]],

// body: filteredData.map(a=>[
// a.date?.slice(0,10),
// a.status,
// a.shortage,
// a.advanceCash,
// a.advancePetrol
// ]),

// styles:{
// fontSize:9,
// cellPadding:4
// },

// headStyles:{
// fillColor:[0,102,204],
// textColor:255,
// fontStyle:"bold"
// },

// alternateRowStyles:{
// fillColor:[245,245,245]
// }

// })


// // =====================
// // 🔹 SAVE
// // =====================
// doc.save(`${selectedEmployee.name}_Report.pdf`)
// }



// const summary = calculateSalary()


// return(
// <div className="p-3 sm:p-4 text-gray-300 w-full max-w-[100vw] overflow-x-hidden">

// <h1 className="text-3xl mb-4 font-bold">Employees & Attendance</h1>


// <div className="flex flex-col sm:flex-row gap-3 mb-4">

// <input
// placeholder="Search employee"
// value={search}
// onChange={(e)=>setSearch(e.target.value)}
// className="input"
// />

// <button
// className="bg-blue-500 px-4 py-2 rounded w-full sm:w-auto"
// onClick={()=>{
// setEditEmployee(null)
// setModalOpen(true)
// }}
// >
// + Add Employee
// </button>

// </div>




// <div className="hidden sm:block overflow-x-auto">
// <table className="table">

// <thead>

// <tr className="text-gray-400 border-b border-[#1F2937] bg-[#111827]">

// <th>Name</th>
// <th>Role</th>
// <th>Shift</th>
// <th>Phone</th>
// <th>Salary</th>
// <th>Tshirt</th>
// <th>Pant</th>
// <th>Shoes</th>
// <th>Action</th>

// </tr>

// </thead>


// <tbody>

// {employees
// .filter(e=>e.name.toLowerCase().includes(search.toLowerCase()))
// .map(emp=>(

// <tr
// key={emp._id}
// className="border-t border-[#1F2937] hover:bg-[#111827] cursor-pointer"
// onClick={()=>openLedger(emp)}
// >

// <td>{emp.name}</td>
// <td>{emp.role}</td>
// <td>{emp.shift}</td>
// <td>{emp.phone}</td>
// <td>₹{emp.salary}</td>
// <td>{emp.tshirt}</td>
// <td>{emp.pant}</td>
// <td>{emp.shoes}</td>

// <td>

// <button
// className="text-blue-400 mr-2"
// onClick={(e)=>{
// e.stopPropagation()
// setEditEmployee(emp)
// setModalOpen(true)
// }}
// >
// Edit
// </button>

// <button
// className="text-red-400"
// onClick={(e)=>{
// e.stopPropagation()
// removeEmployee(emp._id)
// }}
// >
// Delete
// </button>

// </td>

// </tr>

// ))}
// </tbody>
// </table>
// </div>

// <div className="lg:hidden grid gap-4 w-full">
// {employees
// .filter(e=>e.name.toLowerCase().includes(search.toLowerCase()))
// .map(emp=>{

// const isOpen = openCard === emp._id

// return(

// <div
// key={emp._id}
// onClick={()=>{
// if(isOpen){
// setOpenCard(null)
// setSelectedEmployee(null)
// }else{
// setOpenCard(emp._id)
// }
// }}
// className="bg-[#0B0F17] border border-[#1F2937] rounded-2xl p-4 shadow-lg active:scale-95 transition"
// >

// {/* HEADER */}
// <div className="flex justify-between items-center">

// <div>
// <p className="text-white font-semibold text-lg">
// {emp.name}
// </p>

// <p className="text-gray-400 text-sm">
// {emp.role} • Shift {emp.shift}
// </p>
// </div>

// <p className="text-green-400 font-semibold">
// ₹{emp.salary}
// </p>

// </div>

// {/* PHONE */}
// <p className="text-gray-400 text-sm mt-2">
// 📞 {emp.phone}
// </p>

// {/* EXPAND */}
// <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[400px] mt-4" : "max-h-0"}`}>

// <div className="border-t border-[#1F2937] pt-3 space-y-3">

// <p className="text-sm text-gray-400">
// 👕 Tshirt: {emp.tshirt} | 👖 Pant: {emp.pant} | 👟 Shoes: {emp.shoes}
// </p>

// <div className="flex gap-3">

// <button
// onClick={(e)=>{
// e.stopPropagation()
// setEditEmployee(emp)
// setModalOpen(true)
// }}
// className="flex-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 py-2 rounded-lg text-sm"
// >
// Edit
// </button>

// <button
// onClick={(e)=>{
// e.stopPropagation()
// removeEmployee(emp._id)
// }}
// className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 py-2 rounded-lg text-sm"
// >
// Delete
// </button>

// </div>

// {/* OPEN ATTENDANCE */}
// <button
// onClick={(e)=>{
// e.stopPropagation()

// if(selectedEmployee?._id === emp._id){
// setSelectedEmployee(null) 
// }else{
// openLedger(emp)
// }

// }}
// className="w-full bg-green-500/10 border border-green-500/30 text-green-400 py-2 rounded-lg text-sm"
// >
// View Attendance
// </button>

// </div>

// </div>

// </div>

// )

// })}
// </div>

// {view === "desktop" && selectedEmployee &&(

// <div className="mt-6 bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

// <div className="flex justify-between items-center mb-3">

// <h2 className="text-lg">
// Attendance : {selectedEmployee.name}
// </h2>

// <div className="bg-[#0B0F17] border border-[#1F2937] p-3 rounded w-[200px]">

// Total Shortage : 

// <span className={totalShortage >= 0 ? "text-green-400":"text-red-400"}>

// ₹{totalShortage}

// </span>

// </div>

// <div className="flex gap-2">

// <input
// type="month"
// value={selectedMonth}
// onChange={(e)=>setSelectedMonth(e.target.value)}
// className="input w-[180px]  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <button
// className="btn btn-green"
// onClick={()=>{
// setEditAttendance(null)
// setAttendanceModal(true)
// }}
// >
// + Add
// </button>

// <button
// className="btn btn-purple"
// onClick={()=>setReportOpen(true)}
// >
// PDF
// </button>

// <button
// className="btn btn-red"
// onClick={deleteMonth}
// >
// Delete Month
// </button>

// </div>

// </div>



// <div className="grid grid-cols-3 gap-4 mb-4">

// <div className="card">
// Present : {summary.present}
// </div>

// <div className="card">
// Absent : {summary.absent}
// </div>

// <div className="card">
// Double : {summary.dbl}
// </div>

// <div className="card">
// Earned : ₹{Math.round(summary.earned)}
// </div>

// <div className="card">
// Shortage : ₹{summary.shortage}
// </div>

// <div className="card">
// Advance : ₹{summary.advance}
// </div>

// <div className="card col-span-3 text-lg">
// Final Balance : ₹{Math.round(summary.final)}
// </div>

// </div>


// <button
// className="bg-green-500 px-3 py-1 rounded mb-2"
// onClick={()=>{
// setEditAttendance(null)
// setAttendanceModal(true)
// }}
// >
// + Add
// </button>

// <table className="table">

// <thead>

// <tr className="text-gray-400 border-b border-[#1F2937]">

// <th>Date</th>
// <th>Status</th>
// <th>Short</th>
// <th>Cash</th>
// <th>Petrol</th>
// <th>Action</th>

// </tr>

// </thead>


// <tbody>

// {filteredAttendance.map(a=>(

// <tr key={a._id} className="border-t border-[#1F2937]">

// <td>{a.date?.slice(0,10)}</td>
// <td>{a.status}</td>
// <td
// className={
// Number(a.shortage) >= 0
// ? "text-green-400"
// : "text-red-400"
// }
// >
// {Number(a.shortage) > 0 ? `+${a.shortage}` : a.shortage}
// </td>
// <td>{a.advanceCash}</td>
// <td>{a.advancePetrol}</td>

// <td>

// <button
// className="text-blue-400 mr-2"
// onClick={()=>{
// setEditAttendance(a)
// setAttendanceModal(true)
// }}
// >
// Edit
// </button>

// <button
// className="text-red-400"
// onClick={()=>removeAttendance(a._id)}
// >
// Delete
// </button>

// </td>

// </tr>

// ))}

// </tbody>

// </table>

// </div>

// )}

// {view === "mobile" && selectedEmployee && (

// <div className="mt-6 space-y-4">

// <div className="bg-[#0B0F17] p-4 rounded-xl border border-[#1F2937]">

// <p className="text-white font-semibold text-lg">
// 👤 {selectedEmployee.name}
// </p>

// <p className="text-gray-400 text-sm">
// Attendance Summary
// </p>

// </div>


// <div className="grid grid-cols-2 gap-3">

// <div className="card">Present: {summary.present}</div>
// <div className="card">Absent: {summary.absent}</div>
// <div className="card">Double: {summary.dbl}</div>
// <div className="card">Earned: ₹{summary.earned}</div>
// <div className="card text-red-400">Short: ₹{summary.shortage}</div>
// <div className="card text-yellow-400">Advance: ₹{summary.advance}</div>

// <div className="col-span-2 bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-center text-lg font-semibold">
// Final Balance: ₹{summary.final}
// </div>

// </div>

// <div className="flex gap-2">

// <input
// type="month"
// value={selectedMonth}
// onChange={(e)=>setSelectedMonth(e.target.value)}
// className="input flex-1 text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <button
// onClick={()=>setAttendanceModal(true)}
// className="btn btn-green"
// >
// + Add
// </button>

// <button
// className="btn btn-purple"
// onClick={()=>setReportOpen(true)}
// >
// PDF
// </button>

// </div>

// <div className="space-y-3">

// {filteredAttendance.map(a=>(

// <div
// key={a._id}
// className="bg-[#0B0F17] border border-[#1F2937] rounded-xl p-3"
// >

// <p className="text-gray-400 text-sm">
// 📅 {a.date?.slice(0,10)}
// </p>

// <p className="text-white text-sm">
// Status: {a.status}
// </p>

// <p className={Number(a.shortage)>=0 ? "text-green-400":"text-red-400"}>
// Short: {a.shortage}
// </p>

// <p className="text-sm text-gray-400">
// Cash: {a.advanceCash} | Petrol: {a.advancePetrol}
// </p>

// <div className="flex gap-3 mt-2">

// <button
// onClick={()=>{
// setEditAttendance(a)
// setAttendanceModal(true)
// }}
// className="flex-1 bg-blue-500/10 text-blue-400 py-1 rounded"
// >
// Edit
// </button>

// <button
// onClick={()=>removeAttendance(a._id)}
// className="flex-1 bg-red-500/10 text-red-400 py-1 rounded"
// >
// Delete
// </button>

// </div>

// </div>

// ))}

// </div>

// </div>

// )}



// {reportOpen && (

// <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

// <div className="bg-[#0B0F17] border border-[#1F2937] p-6 rounded-xl w-[350px] text-white">

// <h2 className="text-lg font-semibold mb-4">
// Generate Report
// </h2>

// <p className="text-sm text-gray-400 mb-3">
// Select date range
// </p>

// <div className="flex flex-col gap-3">

// <input
// type="date"
// value={fromDate}
// onChange={(e)=>setFromDate(e.target.value)}
// className="bg-[#111827] border border-[#1F2937] p-2 rounded  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <input
// type="date"
// value={toDate}
// onChange={(e)=>setToDate(e.target.value)}
// className="bg-[#111827] border border-[#1F2937] p-2 rounded  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// </div>

// <div className="flex justify-end gap-3 mt-5">

// <button
// onClick={()=>setReportOpen(false)}
// className="bg-gray-600 px-3 py-1 rounded"
// >
// Cancel
// </button>

// <button
// onClick={()=>{
// generateEmployeePDF()
// setReportOpen(false)
// }}
// className="bg-green-600 px-3 py-1 rounded"
// >
// Download
// </button>

// </div>

// </div>

// </div>

// )}




// <EmployeeModal
// open={modalOpen}
// onClose={()=>setModalOpen(false)}
// onSave={saveEmployee}
// editData={editEmployee}
// />

// <AttendanceModal
// open={attendanceModal}
// onClose={()=>setAttendanceModal(false)}
// onSave={saveAttendance}
// editData={editAttendance}
// />

// </div>

// )

// }