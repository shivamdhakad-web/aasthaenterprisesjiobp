import { useEffect, useRef, useState } from "react"
import { getCustomerDrivers, deleteCustomerDriver } from "../services/customerDriverApi"
import AddCustomerDriverModal from "../components/AddCustomerDriverModal"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

const pageStyles = String.raw`
:root {
  --driver-bg: #040608;
  --driver-surface: rgba(7, 13, 18, 0.78);
  --driver-strong: rgba(7, 13, 18, 0.92);
  --driver-border: rgba(255, 255, 255, 0.1);
  --driver-text: rgba(248, 250, 252, 0.98);
  --driver-muted: rgba(181, 194, 204, 0.74);
  --driver-cyan: #0ea5e9;
  --driver-sky: #38bdf8;
  --driver-pink: #ec4899;
  --driver-green: #22c55e;
  --driver-amber: #f59e0b;
  --driver-red: #ef4444;
  --driver-shadow: 0 28px 90px rgba(0, 0, 0, 0.56);
  --driver-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.driver-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--driver-text);
  background:
    radial-gradient(circle at 16% 16%, rgba(14, 165, 233, 0.13), transparent 24%),
    radial-gradient(circle at 82% 22%, rgba(56, 189, 248, 0.11), transparent 20%),
    radial-gradient(circle at 78% 78%, rgba(236, 72, 153, 0.08), transparent 22%),
    linear-gradient(180deg, #020306 0%, #04070a 35%, #040608 100%);
}

.driver-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(118deg, rgba(255, 255, 255, 0.03), transparent 24%),
    radial-gradient(circle at 74% 0%, rgba(56, 189, 248, 0.04), transparent 16%);
  pointer-events: none;
}

.driver-page::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 148px 148px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.54), transparent 95%);
  opacity: 0.2;
  pointer-events: none;
}

.driver-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(120px);
  opacity: 0.72;
  pointer-events: none;
}

.driver-orb--cyan {
  left: -6rem;
  top: 25rem;
  width: 23rem;
  height: 23rem;
  background: rgba(14, 165, 233, 0.18);
}

.driver-orb--pink {
  right: -6rem;
  top: 12rem;
  width: 22rem;
  height: 22rem;
  background: rgba(236, 72, 153, 0.12);
}

.driver-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

.driver-frame {
  position: absolute;
  inset: 6rem -0.5rem auto -0.5rem;
  height: clamp(24rem, 44vw, 39rem);
  border: 1px solid rgba(14, 165, 233, 0.86);
  border-radius: 2.9rem;
  transform: rotate(1.15deg);
  box-shadow:
    0 0 0 1px rgba(14, 165, 233, 0.08),
    0 0 120px rgba(14, 165, 233, 0.08);
  pointer-events: none;
}

.driver-frame::before {
  content: "";
  position: absolute;
  inset: 32% -9% -18% 42%;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.16), transparent 70%);
  filter: blur(32px);
}

.driver-frame-node {
  position: absolute;
  top: 5.15rem;
  left: 1.7rem;
  width: 6rem;
  height: 6rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(14, 165, 233, 0.9);
  background:
    radial-gradient(circle at 50% 42%, rgba(14, 165, 233, 0.1), transparent 68%),
    rgba(6, 14, 20, 0.9);
  color: #7dd3fc;
  font-weight: 900;
  letter-spacing: 0.08em;
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  pointer-events: none;
}

.driver-panel,
.driver-command,
.driver-metric,
.driver-table,
.driver-card,
.driver-modal {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    var(--driver-surface);
  border: 1px solid var(--driver-border);
  border-radius: 1.8rem;
  box-shadow: var(--driver-shadow), var(--driver-highlight);
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);
  isolation: isolate;
}

.driver-panel--strong,
.driver-table,
.driver-card,
.driver-modal {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02)),
    var(--driver-strong);
}

.driver-overline {
  margin: 0 0 0.75rem;
  color: rgba(56, 189, 248, 0.95);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.driver-title {
  margin: 0;
  color: white;
  font-size: clamp(2.55rem, 5vw, 4.75rem);
  font-weight: 700;
  line-height: 0.94;
  letter-spacing: -0.055em;
  text-shadow: 0 10px 34px rgba(0, 0, 0, 0.42);
}

.driver-copy {
  max-width: 41rem;
  margin: 1rem 0 0;
  color: rgba(224, 232, 238, 0.78);
  line-height: 1.75;
}

.driver-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.98fr) minmax(22rem, 1.02fr);
  gap: 1.15rem;
  margin-bottom: 1.5rem;
}

.driver-hero-main,
.driver-hero-visual {
  min-height: 22rem;
  padding: 1.7rem;
}

.driver-tags,
.driver-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.35rem;
}

.driver-chip {
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

.driver-chip--cyan {
  border-color: rgba(14, 165, 233, 0.24);
  background: rgba(14, 165, 233, 0.12);
  color: #bae6fd;
}

.driver-chip--pink {
  border-color: rgba(236, 72, 153, 0.24);
  background: rgba(236, 72, 153, 0.12);
  color: #fbcfe8;
}

.driver-chip--green {
  border-color: rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.12);
  color: #bbf7d0;
}

.driver-feature-list {
  display: grid;
  gap: 1.4rem;
}

.driver-feature {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.driver-feature:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.driver-feature-icon {
  width: 4rem;
  height: 4rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.035);
  color: #7dd3fc;
  font-weight: 900;
}

.driver-feature-icon--pink {
  color: #f9a8d4;
}

.driver-feature-title {
  margin: 0;
  color: white;
  font-size: 1.22rem;
  font-weight: 800;
}

.driver-feature-copy {
  margin: 0.55rem 0 0;
  color: rgba(205, 215, 222, 0.72);
  line-height: 1.65;
}

.driver-route-visual {
  position: relative;
  min-height: 8rem;
  margin-top: 1.2rem;
}

.driver-route-visual::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 54%;
  height: 0.26rem;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.9), rgba(236, 72, 153, 0.52));
  transform: skewY(-5deg);
  box-shadow: 0 0 18px rgba(14, 165, 233, 0.18);
}

.driver-route-node {
  position: absolute;
  right: 18%;
  top: 14%;
  width: 4.2rem;
  height: 4.2rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.96), rgba(236, 72, 153, 0.72));
  color: white;
  font-weight: 900;
}

.driver-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.driver-section-title {
  margin: 0.15rem 0 0;
  color: white;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.driver-badge {
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

.driver-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.4rem;
}

.driver-metric {
  padding: 1.25rem;
}

.driver-metric--featured {
  grid-column: span 2;
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.driver-metric-label {
  color: var(--driver-muted);
  font-size: 0.88rem;
}

.driver-metric-value {
  display: block;
  margin-top: 0.45rem;
  color: white;
  font-size: clamp(1.25rem, 2.5vw, 1.8rem);
  font-weight: 700;
}

.driver-metric--featured .driver-metric-value {
  font-size: clamp(2rem, 3.5vw, 2.9rem);
}

.driver-metric-meta {
  display: block;
  margin-top: 0.75rem;
  color: rgba(212, 219, 230, 0.66);
  font-size: 0.82rem;
  line-height: 1.55;
}

.driver-command {
  padding: 1rem;
  margin-bottom: 1.35rem;
}

.driver-command-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.85rem;
}

.driver-input {
  width: 100%;
  min-height: 3rem;
  padding: 0.88rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--driver-text);
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.driver-input:focus {
  border-color: rgba(14, 165, 233, 0.34);
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 0 3px rgba(14, 165, 233, 0.1);
}

.driver-input::placeholder {
  color: rgba(198, 207, 216, 0.5);
}

.driver-input::-webkit-calendar-picker-indicator {
  filter: invert(1) opacity(0.74);
}

.driver-input option {
  background: #071018;
  color: white;
}

.driver-button {
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

.driver-button::before {
  content: "";
  position: absolute;
  inset: 1px 1px auto 1px;
  height: 52%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent);
  opacity: 0.6;
  pointer-events: none;
}

.driver-button--cyan {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.96), rgba(56, 189, 248, 0.88));
  box-shadow: 0 18px 36px rgba(14, 165, 233, 0.18);
}

.driver-button--pink {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.96), rgba(190, 24, 93, 0.88));
  box-shadow: 0 18px 36px rgba(236, 72, 153, 0.18);
}

.driver-button--green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.94), rgba(16, 185, 129, 0.9));
}

.driver-button--ghost {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.driver-button--danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(225, 29, 72, 0.2));
  border-color: rgba(248, 113, 113, 0.2);
  color: #fecaca;
}

.driver-button--row {
  min-height: 2.35rem;
  padding: 0.55rem 0.95rem;
}

.driver-table {
  overflow: hidden;
  margin-bottom: 1.4rem;
}

.driver-table-scroll {
  overflow-x: auto;
}

.driver-table table {
  width: 100%;
  border-collapse: collapse;
}

.driver-table thead {
  background: linear-gradient(180deg, rgba(8, 20, 30, 0.96), rgba(7, 13, 18, 0.92));
}

.driver-table th,
.driver-table td {
  padding: 1rem;
  text-align: left;
}

.driver-table th {
  color: rgba(221, 229, 235, 0.78);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.driver-table td {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(237, 241, 245, 0.88);
}

.driver-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.035);
}

.driver-row-actions {
  display: flex;
  gap: 0.65rem;
}

.driver-row-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.36rem 0.76rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.78rem;
  font-weight: 600;
}

.driver-row-chip--route {
  background: rgba(14, 165, 233, 0.12);
  color: #bae6fd;
}

.driver-row-chip--carrier {
  background: rgba(236, 72, 153, 0.12);
  color: #fbcfe8;
}

.driver-mobile-list {
  display: none;
}

.driver-card {
  padding: 1rem;
}

.driver-card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.85rem;
}

.driver-card-title {
  margin: 0;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
}

.driver-card-meta {
  margin: 0.3rem 0 0;
  color: var(--driver-muted);
  font-size: 0.84rem;
}

.driver-card-copy {
  margin: 0.9rem 0 0;
  color: rgba(227, 234, 238, 0.82);
  line-height: 1.62;
}

.driver-card-extra {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease, margin-top 0.28s ease;
}

.driver-card-extra-open {
  grid-template-rows: 1fr;
  margin-top: 0.95rem;
}

.driver-card-extra-wrap {
  overflow: hidden;
}

.driver-card-extra-inner {
  padding-top: 0.95rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.driver-card-actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 1rem;
}

.driver-card-actions .driver-button {
  flex: 1;
}

.driver-modal-backdrop {
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

.driver-modal {
  width: min(100%, 27rem);
  padding: 1.35rem;
}

.driver-modal-title {
  margin: 0;
  color: white;
  font-size: 1.28rem;
  font-weight: 700;
}

.driver-modal-copy {
  margin: 0.45rem 0 1rem;
  color: rgba(214, 220, 226, 0.68);
}

.driver-modal-body {
  display: grid;
  gap: 0.85rem;
}

.driver-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.driver-toast {
  position: fixed;
  top: 1rem;
  left: 50%;
  z-index: 60;
  transform: translateX(-50%);
  padding: 0.65rem 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(14, 165, 233, 0.22);
  background: rgba(5, 13, 20, 0.9);
  color: white;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(14px);
}

.driver-tilt {
  --tilt-rx: 0deg;
  --tilt-ry: 0deg;
  --tilt-scale: 1;
  --tilt-lift: 0px;
  --tilt-inner-x: 0px;
  --tilt-inner-y: 0px;
  --tilt-pointer-x: 50%;
  --tilt-pointer-y: 50%;
  transform-style: preserve-3d;
  transition: transform 0.22s ease, border-color 0.22s ease;
  transform:
    perspective(1500px)
    rotateX(var(--tilt-rx))
    rotateY(var(--tilt-ry))
    translateY(var(--tilt-lift))
    scale(var(--tilt-scale));
}

.driver-tilt::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at var(--tilt-pointer-x) var(--tilt-pointer-y), rgba(255, 255, 255, 0.07), transparent 36%),
    radial-gradient(circle at var(--tilt-pointer-x) var(--tilt-pointer-y), rgba(14, 165, 233, 0.055), transparent 56%);
  opacity: 0;
  transition: opacity 0.22s ease;
  pointer-events: none;
}

.driver-tilt--interactive:hover {
  will-change: transform;
  border-color: rgba(14, 165, 233, 0.18);
}

.driver-tilt--interactive:hover::after {
  opacity: 1;
}

.driver-tilt-inner {
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
  .driver-frame,
  .driver-frame-node {
    display: none;
  }

  .driver-hero {
    grid-template-columns: 1fr;
  }

  .driver-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .driver-metric--featured {
    grid-column: span 2;
  }
}

@media (max-width: 639px) {
  .driver-shell {
    padding-inline: 0.9rem;
  }

  .driver-title {
    font-size: 3rem;
  }

  .driver-hero-main,
  .driver-hero-visual {
    min-height: auto;
    padding: 1.15rem;
  }

  .driver-command-grid,
  .driver-metrics {
    grid-template-columns: 1fr;
  }

  .driver-metric--featured {
    grid-column: span 1;
  }

  .driver-section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .driver-table {
    display: none;
  }

  .driver-mobile-list {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.35rem;
  }

  .driver-card-actions,
  .driver-modal-actions {
    flex-direction: column;
  }
}
`

const normalizeText = (value) => String(value || "").toLowerCase()

const formatDateLabel = (value) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function TiltPanel({ enabled, className = "", children, strength = 7, ...props }) {
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
      innerX: centeredX * strength * 0.42,
      innerY: centeredY * strength * 0.42,
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
      className={`driver-tilt ${enabled ? "driver-tilt--interactive" : ""} ${className}`}
      onMouseMove={enabled ? handleMove : undefined}
      onMouseLeave={enabled ? handleLeave : undefined}
      {...props}
    >
      <div className="driver-tilt-inner">{children}</div>
    </div>
  )
}

export default function CustomerDrivers() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [format, setFormat] = useState("pdf")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [openCard, setOpenCard] = useState(null)
  const [copied, setCopied] = useState(false)
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

  const loadDrivers = async () => {
    const res = await getCustomerDrivers()
    setData(res)
  }

  useEffect(() => {
    loadDrivers()
  }, [])

  const handleDelete = async (id) => {
    await deleteCustomerDriver(id)
    await loadDrivers()
  }

  const filtered = data.filter((driver) =>
    Object.values(driver).join(" ").toLowerCase().includes(search.toLowerCase())
  )

  const getFilteredByDate = () =>
    filtered.filter((driver) => {
      const createdDate = new Date(driver.createdAt)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(`${toDate}T23:59:59`) : null

      return (!from || createdDate >= from) && (!to || createdDate <= to)
    })

  const copyText = async (text) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text || "")
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const uniqueRoutes = new Set(data.map((driver) => driver.route).filter(Boolean)).size
  const uniqueTransports = new Set(data.map((driver) => driver.transportName).filter(Boolean)).size
  const uniqueCarriers = new Set(data.map((driver) => driver.carrierId).filter(Boolean)).size
  const withRemarks = data.filter((driver) => driver.remark).length

  const generatePDF = (filteredData) => {
    const doc = new jsPDF()

    try {
      doc.addImage("/logo.png", "PNG", 14, 10, 20, 20)
    } catch {}

    doc.setFontSize(18)
    doc.text("Aastha Enterprises", 40, 18)

    doc.setFontSize(12)
    doc.text("Customer Drivers Report", 40, 26)

    doc.setFontSize(10)
    doc.text(`From: ${fromDate || "All"}  To: ${toDate || "All"}`, 14, 38)
    doc.text(`Total Records: ${filteredData.length}`, 14, 45)
    doc.text(`Routes: ${uniqueRoutes}  Transports: ${uniqueTransports}`, 100, 45)

    autoTable(doc, {
      startY: 50,
      head: [["Name", "Number", "Gadi", "Transport", "Route", "Carrier", "Remark"]],
      body: filteredData.map((driver) => [
        driver.name,
        driver.number,
        driver.gadiNumber,
        driver.transportName,
        driver.route,
        driver.carrierId,
        driver.remark,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [14, 165, 233], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 247, 250] },
    })

    doc.save("CustomerDrivers_Report.pdf")
  }

  const generateExcel = (filteredData) => {
    const formatted = filteredData.map((driver, index) => ({
      ID: index + 1,
      Name: driver.name,
      Number: driver.number,
      Gadi: driver.gadiNumber,
      Transport: driver.transportName,
      Route: driver.route,
      Carrier: driver.carrierId,
      Remark: driver.remark,
    }))

    const summary = [
      {
        Total_Drivers: filteredData.length,
        Unique_Routes: uniqueRoutes,
        Unique_Transports: uniqueTransports,
        Unique_Carriers: uniqueCarriers,
        From: fromDate || "All",
        To: toDate || "All",
      },
    ]

    const ws = XLSX.utils.json_to_sheet(formatted)
    ws["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 22 },
      { wch: 18 },
      { wch: 15 },
      { wch: 24 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Drivers Report")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Summary")
    XLSX.writeFile(wb, "CustomerDrivers_Report.xlsx")
  }

  const handleGenerate = () => {
    const filteredData = getFilteredByDate()

    if (filteredData.length === 0) {
      alert("No data found")
      return
    }

    if (format === "pdf") {
      generatePDF(filteredData)
    } else {
      generateExcel(filteredData)
    }

    setReportOpen(false)
  }

  const metricCards = [
    {
      label: "Driver Network",
      value: filtered.length,
      meta: `${data.length} total customer driver records`,
      featured: true,
    },
    {
      label: "Routes",
      value: uniqueRoutes,
      meta: "Distinct running lanes",
    },
    {
      label: "Transports",
      value: uniqueTransports,
      meta: "Transport names mapped",
    },
    {
      label: "Carrier IDs",
      value: uniqueCarriers,
      meta: `${withRemarks} records with notes`,
    },
  ]

  return (
    <>
      <style>{pageStyles}</style>

      <div className="driver-page">
        <div className="driver-orb driver-orb--cyan" />
        <div className="driver-orb driver-orb--pink" />

        <div className="driver-shell">
          <div className="driver-frame" />
          <div className="driver-frame-node">GO</div>

          <div className="driver-hero">
            <TiltPanel enabled={tiltEnabled} strength={6} className="driver-panel driver-hero-main">
              <p className="driver-overline">Driver Intelligence</p>
              <h1 className="driver-title">Customer Driver Details</h1>
              <p className="driver-copy">
                A premium control room for driver contacts, vehicle numbers, route intelligence, carrier IDs, and
                report exports with crisp cyan-noir motion.
              </p>

              <div className="driver-tags">
                <span className="driver-chip driver-chip--cyan">{filtered.length} drivers in view</span>
                <span className="driver-chip driver-chip--green">{uniqueRoutes} active routes</span>
                <span className="driver-chip driver-chip--pink">{uniqueCarriers} carrier references</span>
              </div>

              <div className="driver-actions">
                <button
                  className="driver-button driver-button--cyan"
                  onClick={() => {
                    setEditData(null)
                    setModalOpen(true)
                  }}
                >
                  + Add Driver
                </button>
                <button className="driver-button driver-button--pink" onClick={() => setReportOpen(true)}>
                  Generate Report
                </button>
                <button className="driver-button driver-button--ghost" onClick={() => setSearch("")}>
                  Clear Search
                </button>
              </div>
            </TiltPanel>

            <TiltPanel enabled={tiltEnabled} strength={5} className="driver-panel driver-hero-visual">
              <div className="driver-feature-list">
                <div className="driver-feature">
                  <div className="driver-feature-icon">ID</div>
                  <div>
                    <p className="driver-feature-title">Hands-on driver registry</p>
                    <p className="driver-feature-copy">
                      Search any driver, route, gadi number, transport name, carrier ID, or remark instantly.
                    </p>
                  </div>
                </div>

                <div className="driver-feature">
                  <div className="driver-feature-icon driver-feature-icon--pink">RT</div>
                  <div>
                    <p className="driver-feature-title">Route, carrier, contact</p>
                    <p className="driver-feature-copy">
                      Keep driver phone numbers copy-ready while preserving a clean operational ledger.
                    </p>
                  </div>
                </div>
              </div>

              <div className="driver-route-visual">
              </div>
            </TiltPanel>
          </div>

          <div className="driver-section-head">
            <div>
              <p className="driver-overline">Snapshot</p>
              <h2 className="driver-section-title">Premium driver network overview</h2>
            </div>
            <div className="driver-badge">{filtered.length} rows in view</div>
          </div>

          <div className="driver-metrics">
            {metricCards.map((card, index) => (
              <TiltPanel
                key={card.label}
                enabled={tiltEnabled}
                strength={index === 0 ? 6 : 4}
                className={`driver-metric ${card.featured ? "driver-metric--featured" : ""}`}
              >
                <span className="driver-metric-label">{card.label}</span>
                <strong className="driver-metric-value">{card.value}</strong>
                <span className="driver-metric-meta">{card.meta}</span>
              </TiltPanel>
            ))}
          </div>

          <div className="driver-section-head">
            <div>
              <p className="driver-overline">Command Deck</p>
              <h2 className="driver-section-title">Search, add, and export drivers</h2>
            </div>
            <div className="driver-badge">Report: PDF / Excel</div>
          </div>

          <TiltPanel enabled={tiltEnabled} strength={4} className="driver-command">
            <div className="driver-command-grid">
              <input
                placeholder="Search driver, number, route, transport..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="driver-input"
              />

              <button
                className="driver-button driver-button--cyan"
                onClick={() => {
                  setEditData(null)
                  setModalOpen(true)
                }}
              >
                + Add Driver
              </button>

              <button className="driver-button driver-button--pink" onClick={() => setReportOpen(true)}>
                Generate Report
              </button>
            </div>
          </TiltPanel>

          <div className="driver-section-head">
            <div>
              <p className="driver-overline">Ledger</p>
              <h2 className="driver-section-title">Customer driver activity</h2>
            </div>
            <div className="driver-badge">Static table for clear text</div>
          </div>

          <div className="driver-table">
            <div className="driver-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Number</th>
                    <th>Gadi</th>
                    <th>Transport</th>
                    <th>Route</th>
                    <th>Carrier</th>
                    <th>Remark</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((driver, index) => (
                    <tr key={driver._id}>
                      <td>{index + 1}</td>
                      <td>{driver.name}</td>
                      <td>
                        <button
                          className="driver-button driver-button--ghost driver-button--row"
                          onClick={() => copyText(driver.number)}
                        >
                          {driver.number}
                        </button>
                      </td>
                      <td>{driver.gadiNumber}</td>
                      <td>{driver.transportName}</td>
                      <td>
                        <span className="driver-row-chip driver-row-chip--route">{driver.route || "-"}</span>
                      </td>
                      <td>
                        <span className="driver-row-chip driver-row-chip--carrier">{driver.carrierId || "-"}</span>
                      </td>
                      <td>{driver.remark || "-"}</td>
                      <td>
                        <div className="driver-row-actions">
                          <button
                            className="driver-button driver-button--ghost driver-button--row"
                            onClick={() => {
                              setEditData(driver)
                              setModalOpen(true)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="driver-button driver-button--danger driver-button--row"
                            onClick={() => handleDelete(driver._id)}
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

          <div className="driver-mobile-list">
            {filtered.map((driver) => {
              const isOpen = openCard === driver._id

              return (
                <div
                  key={driver._id}
                  className="driver-card"
                  onClick={() => setOpenCard(isOpen ? null : driver._id)}
                >
                  <div className="driver-card-top">
                    <div>
                      <p className="driver-card-title">{driver.name}</p>
                      <p className="driver-card-meta">{driver.number}</p>
                    </div>
                    <button
                      className="driver-button driver-button--ghost driver-button--row"
                      onClick={(event) => {
                        event.stopPropagation()
                        copyText(driver.number)
                      }}
                    >
                      Copy
                    </button>
                  </div>

                  <p className="driver-card-copy">
                    Gadi {driver.gadiNumber || "-"} - Transport {driver.transportName || "-"} - Route{" "}
                    {driver.route || "-"}
                  </p>

                  <div className={`driver-card-extra ${isOpen ? "driver-card-extra-open" : ""}`}>
                    <div className="driver-card-extra-wrap">
                      <div className="driver-card-extra-inner">
                        <p className="driver-card-meta">Carrier {driver.carrierId || "-"}</p>
                        <p className="driver-card-meta">Remark {driver.remark || "-"}</p>

                        <div className="driver-card-actions">
                          <button
                            className="driver-button driver-button--ghost driver-button--row"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditData(driver)
                              setModalOpen(true)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="driver-button driver-button--danger driver-button--row"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDelete(driver._id)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="driver-panel driver-panel--strong driver-card">
              No customer drivers matched the current search.
            </div>
          )}
        </div>

        {reportOpen && (
          <div className="driver-modal-backdrop">
            <div className="driver-modal">
              <h2 className="driver-modal-title">Generate report</h2>
              <p className="driver-modal-copy">Select date range and export format for customer drivers.</p>

              <div className="driver-modal-body">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="driver-input"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="driver-input"
                />
                <select value={format} onChange={(event) => setFormat(event.target.value)} className="driver-input">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              <div className="driver-modal-actions">
                <button className="driver-button driver-button--ghost" onClick={() => setReportOpen(false)}>
                  Cancel
                </button>
                <button className="driver-button driver-button--cyan" onClick={handleGenerate}>
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {copied && <div className="driver-toast">Number copied</div>}

        <AddCustomerDriverModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditData(null)
          }}
          onSave={async () => {
            await loadDrivers()
            setModalOpen(false)
            setEditData(null)
          }}
          editData={editData}
        />
      </div>
    </>
  )
}














// import { useEffect, useState } from "react"
// import {
//   getCustomerDrivers,
//   deleteCustomerDriver
// } from "../services/customerDriverApi"
// import AddCustomerDriverModal from "../components/AddCustomerDriverModal"
// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"
// import * as XLSX from "xlsx"

// export default function CustomerDrivers(){

// const [data,setData] = useState([])
// const [search,setSearch] = useState("")

// const [reportOpen,setReportOpen] = useState(false)
// const [fromDate,setFromDate] = useState("")
// const [toDate,setToDate] = useState("")
// const [format,setFormat] = useState("pdf")
// const [modalOpen,setModalOpen] = useState(false)
// const [editData,setEditData] = useState(null)
// const [openCard,setOpenCard] = useState(null)
// const [copied,setCopied] = useState(false)

// useEffect(()=>{
// loadDrivers()
// },[])

// const loadDrivers = async()=>{
// const res = await getCustomerDrivers()
// setData(res)
// }

// const handleDelete = async(id)=>{
// await deleteCustomerDriver(id)
// loadDrivers()
// }

// // SEARCH FILTER
// const filtered = data.filter(d=>
// Object.values(d).join(" ").toLowerCase().includes(search.toLowerCase())
// )

// // DATE FILTER
// const getFilteredByDate = ()=>{
// return filtered.filter(d=>{
// const dDate = new Date(d.createdAt)
// return (
// (!fromDate || dDate >= new Date(fromDate)) &&
// (!toDate || dDate <= new Date(toDate))
// )
// })
// }

// const copyText = (text)=>{
// navigator.clipboard.writeText(text)

// setCopied(true)

// setTimeout(()=>{
// setCopied(false)
// },2000)
// }

// // PDF GENERATE (PRO)
// const generatePDF = (filteredData)=>{

// const doc = new jsPDF()

// // LOGO (Make sure logo.png exists in public folder)
// try{
// doc.addImage("/logo.png", "PNG", 14, 10, 20, 20)
// }catch{}

// // TITLE
// doc.setFontSize(18)
// doc.text("Aastha Enterprises", 40, 18)

// doc.setFontSize(12)
// doc.text("Customer Drivers Report", 40, 26)

// // DATE
// doc.setFontSize(10)
// doc.text(`From: ${fromDate || "All"}  To: ${toDate || "All"}`,14,38)

// // SUMMARY
// doc.text(`Total Records: ${filteredData.length}`,14,45)

// autoTable(doc,{
// startY:50,
// head:[[
// "Name","Number","Gadi","Transport","Route","Carrier","Remark"
// ]],
// body:filteredData.map(d=>[
// d.name,
// d.number,
// d.gadiNumber,
// d.transportName,
// d.route,
// d.carrierId,
// d.remark
// ]),
// styles:{
// fontSize:8,
// cellPadding:3
// },
// headStyles:{
// fillColor:[0,102,204],
// textColor:255
// },
// alternateRowStyles:{
// fillColor:[240,240,240]
// }
// })

// doc.save("CustomerDrivers_Report.pdf")

// }

// // EXCEL GENERATE (PRO)
// const generateExcel = (filteredData)=>{

// const formatted = filteredData.map((d,i)=>({
// ID:i+1,
// Name:d.name,
// Number:d.number,
// Gadi:d.gadiNumber,
// Transport:d.transportName,
// Route:d.route,
// Carrier:d.carrierId,
// Remark:d.remark
// }))

// const ws = XLSX.utils.json_to_sheet(formatted)

// // column width
// ws["!cols"] = [
// { wch:5 },
// { wch:20 },
// { wch:15 },
// { wch:15 },
// { wch:20 },
// { wch:15 },
// { wch:15 },
// { wch:20 }
// ]

// const wb = XLSX.utils.book_new()

// XLSX.utils.book_append_sheet(wb,ws,"Drivers Report")

// XLSX.writeFile(wb,"CustomerDrivers_Report.xlsx")

// }

// // FINAL GENERATE HANDLER
// const handleGenerate = ()=>{

// const filteredData = getFilteredByDate()

// if(format==="pdf"){
// generatePDF(filteredData)
// }else{
// generateExcel(filteredData)
// }

// setReportOpen(false)

// }

// return(

// <div className="p-3 sm:p-6">

// <h1 className="text-xl font-bold mb-4">
// Customer Driver Details
// </h1>

// <div className="flex flex-col sm:flex-row gap-3 mb-4">

// <input
// placeholder="Search..."
// value={search}
// onChange={(e)=>setSearch(e.target.value)}
// className="border p-2 w-full sm:w-60"
// />

// <button
// className="bg-blue-500 px-4 py-2 rounded text-white"
// onClick={()=>{

// setEditData(null)
// setModalOpen(true)

// }}
// >
// + Add Driver
// </button>

// <button
// onClick={()=>setReportOpen(true)}
// className="bg-blue-600 text-white px-4 py-2 rounded"
// >
// Generate Report
// </button>

// </div>

// {/* TABLE */}


// <div className="hidden sm:block overflow-x-auto">
// <table className="table text-sm text-gray-300">

// <thead className="bg-[#0F172A] text-gray-400">

// <tr>

// <th className="px-4 py-2">ID</th>
// <th className="px-4 py-2">Name</th>
// <th className="px-4 py-2">Number</th>
// <th className="px-4 py-2">Gadi Number</th>
// <th className="px-4 py-2">Transport Name</th>
// <th className="px-4 py-2">Route</th>
// <th className="px-4 py-2">Carrier ID</th>
// <th className="px-4 py-2">Remark</th>
// <th className="px-4 py-2">Action</th>

// </tr>

// </thead>

// <tbody>

// {filtered.map((d,i)=>(

// <tr
// key={d._id}
// className="border-b border-[#1E293B] hover:bg-[#0F172A]"
// >

// <td className="px-6 py-2">{i+1}</td>
// <td className="px-4 py-2">{d.name}</td>
// <td className="px-4 py-2">{d.number}</td>
// <td className="px-4 py-2">{d.gadiNumber}</td>
// <td className="px-4 py-2">{d.transportName}</td>
// <td className="px-4 py-2">{d.route}</td>
// <td className="px-4 py-2">{d.carrierId}</td>
// <td className="px-4 py-2">{d.remark}</td>

// <td className="px-4 py-2">

// <button
// className="text-blue-400"
// onClick={()=>{

// setEditData(d)
// setModalOpen(true)

// }}
// >
// Edit
// </button>

// <button
// onClick={()=>handleDelete(d._id)}
// className="text-red-500 ml-3"
// >
// Delete
// </button>

// </td>

// </tr>

// ))}

// </tbody>

// </table>

// </div>

// <div className="grid grid-cols-1 gap-4 sm:hidden">

// {filtered.map((d)=>{

// const isOpen = openCard === d._id

// return(

// <div
// key={d._id}
// onClick={()=>setOpenCard(isOpen ? null : d._id)}
// className="p-4 rounded-2xl border border-[#1A1F2E] bg-[#0B0F17] shadow-lg active:scale-95 transition-all duration-300"
// >

// {/* HEADER */}
// <div className="flex justify-between items-start">

// <div className="space-y-1">

// <p className="text-sm">
// <span className="text-gray-400">👤 Name :</span>{" "}
// <span className="text-white font-semibold">{d.name}</span>
// </p>

// <p className="text-sm">
// <span className="text-gray-400">📞 Number :</span>{" "}
// <span className="text-white">{d.number}</span>
// </p>

// </div>

// <button
// onClick={(e)=>{
// e.stopPropagation()
// copyText(d.number)
// }}
// className="bg-white/10 px-2 py-1 rounded text-xs hover:bg-white/20"
// >
// 📋
// </button>

// </div>


// {/* BASIC */}
// <div className="mt-1 space-y-1">

// <p className="text-sm">
// <span className="text-gray-400">🚛 Gadi :</span>{" "}
// <span className="text-white">{d.gadiNumber}</span>
// </p>

// <p className="text-sm">
// <span className="text-gray-400">🏢 Transport :</span>{" "}
// <span className="text-white">{d.transportName}</span>
// </p>

// <p className="text-sm">
// <span className="text-gray-400">🛣 Route :</span>{" "}
// <span className="text-white">{d.route}</span>
// </p>

// </div>


// {/* EXPAND */}
// <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 mt-3" : "max-h-0"}`}>

// <div className="border-t border-white/10 pt-3 space-y-2">

// <p className="text-sm">
// <span className="text-gray-400">🆔 Carrier :</span>{" "}
// <span className="text-white">{d.carrierId}</span>
// </p>

// <p className="text-sm">
// <span className="text-gray-400">📝 Remark :</span>{" "}
// <span className="text-white">{d.remark}</span>
// </p>

// {/* ACTIONS */}
// <div className="flex gap-3 mt-3">

// <button
// onClick={(e)=>{
// e.stopPropagation()
// setEditData(d)
// setModalOpen(true)
// }}
// className="flex-1 flex items-center justify-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 py-2 rounded-lg text-sm active:scale-95 transition"
// >
// ✏️ Edit
// </button>

// <button
// onClick={(e)=>{
// e.stopPropagation()
// handleDelete(d._id)
// }}
// className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 text-red-400 border border-red-500/30 py-2 rounded-lg text-sm active:scale-95 transition"
// >
// 🗑 Delete
// </button>

// </div>

// </div>

// </div>

// </div>

// )

// })}

// </div>

// {/* REPORT MODAL */}

// {reportOpen && (

// <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

// <div className="bg-[#0B0F17] p-6 rounded-xl w-[350px] text-white">

// <h2 className="text-lg font-semibold mb-4">
// Generate Report
// </h2>

// <p className="text-sm text-gray-400 mb-2">
// Select date range & format
// </p>

// <div className="flex flex-col gap-3">

// <input
// type="date"
// value={fromDate}
// onChange={(e)=>setFromDate(e.target.value)}
// className="border p-2 bg-transparent  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <input
// type="date"
// value={toDate}
// onChange={(e)=>setToDate(e.target.value)}
// className="border p-2 bg-transparent  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <select
// value={format}
// onChange={(e)=>setFormat(e.target.value)}
// className="border p-2 bg-[#0B0F17]"
// >
// <option value="pdf">PDF</option>
// <option value="excel">Excel</option>
// </select>

// </div>

// <div className="flex justify-end gap-3 mt-4">

// <button
// onClick={()=>setReportOpen(false)}
// className="bg-gray-600 px-3 py-1 rounded"
// >
// Cancel
// </button>

// <button
// onClick={handleGenerate}
// className="bg-green-600 px-3 py-1 rounded"
// >
// Download
// </button>

// </div>

// </div>

// </div>

// )}

// {copied && (
// <div className="fixed top-3 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm shadow-lg">
// Copied
// </div>
// )}

// <AddCustomerDriverModal
// open={modalOpen}
// onClose={()=>{

// setModalOpen(false)
// setEditData(null)

// }}
// onSave={loadDrivers}
// editData={editData}
// />

// </div>

// )

// }