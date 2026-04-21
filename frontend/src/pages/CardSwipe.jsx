import { useEffect, useRef, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { getEntries, deleteEntry, deleteMonth } from "../services/cardSwipeApi"
import AddCardSwipeModal from "../components/AddCardSwipeModal"

const glassStyles = String.raw`
:root {
  --glass-bg: rgba(7, 12, 24, 0.58);
  --glass-bg-strong: rgba(7, 12, 24, 0.82);
  --glass-border: rgba(255, 255, 255, 0.14);
  --glass-border-strong: rgba(255, 255, 255, 0.22);
  --glass-text: rgba(246, 248, 255, 0.98);
  --glass-muted: rgba(182, 196, 229, 0.76);
  --glass-shadow: 0 32px 90px rgba(0, 0, 0, 0.5);
  --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  --glass-primary: linear-gradient(135deg, rgba(34, 211, 238, 0.98), rgba(110, 91, 255, 0.98) 48%, rgba(244, 114, 182, 0.96));
  --glass-info: linear-gradient(135deg, rgba(56, 189, 248, 0.96), rgba(37, 99, 235, 0.92));
  --glass-surface: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03));
}

.glass-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(45, 212, 191, 0.14), transparent 26%),
    radial-gradient(circle at top right, rgba(244, 114, 182, 0.14), transparent 22%),
    radial-gradient(circle at bottom, rgba(99, 102, 241, 0.1), transparent 30%),
    linear-gradient(180deg, #02040b 0%, #050915 38%, #02030a 100%);
  color: var(--glass-text);
}

.glass-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.04), transparent 28%),
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.04), transparent 18%),
    radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.035), transparent 18%);
  opacity: 0.75;
  pointer-events: none;
}

.glass-page::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 120px 120px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 90%);
  opacity: 0.2;
  pointer-events: none;
}

.glass-page__bg {
  position: absolute;
  border-radius: 9999px;
  filter: blur(110px);
  opacity: 0.9;
  pointer-events: none;
}

.glass-page__bg--pink {
  top: -3rem;
  right: -4rem;
  width: 18rem;
  height: 18rem;
  background: rgba(244, 114, 182, 0.32);
}

.glass-page__bg--cyan {
  left: -4rem;
  top: 20rem;
  width: 22rem;
  height: 22rem;
  background: rgba(34, 211, 238, 0.2);
}

.glass-page__bg--violet {
  right: 12%;
  bottom: 8rem;
  width: 20rem;
  height: 20rem;
  background: rgba(139, 92, 246, 0.22);
}

.glass-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
}

.glass-hero {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: space-between;
  gap: 1.2rem;
  margin-bottom: 1.6rem;
  padding: 1.25rem;
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.035)),
    rgba(7, 12, 24, 0.72);
  box-shadow:
    0 36px 100px rgba(0, 0, 0, 0.52),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -20px 50px rgba(99, 102, 241, 0.08);
  backdrop-filter: blur(22px) saturate(145%);
  -webkit-backdrop-filter: blur(22px) saturate(145%);
  overflow: hidden;
  isolation: isolate;
}

.glass-hero::before {
  content: "";
  position: absolute;
  inset: auto auto -4rem -4rem;
  width: 14rem;
  height: 14rem;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.3), transparent 72%);
  filter: blur(20px);
  pointer-events: none;
}

.glass-hero::after {
  content: "";
  position: absolute;
  inset: -5rem -2rem auto auto;
  width: 16rem;
  height: 16rem;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(244, 114, 182, 0.18), transparent 70%);
  filter: blur(26px);
  pointer-events: none;
}

.glass-hero__content,
.glass-hero__spotlight {
  position: relative;
  z-index: 1;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.glass-hero__content {
  flex: 1 1 32rem;
  padding: 0.4rem;
}

.glass-overline {
  margin: 0 0 0.7rem;
  color: rgba(143, 214, 255, 0.82);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.glass-overline--muted {
  color: rgba(214, 220, 255, 0.64);
}

.glass-title {
  margin: 0;
  font-size: clamp(2.35rem, 5vw, 4.25rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.05em;
  text-shadow: 0 8px 34px rgba(0, 0, 0, 0.35);
}

.glass-subtitle {
  max-width: 34rem;
  margin: 0.95rem 0 0;
  color: rgba(222, 230, 248, 0.78);
  font-size: 1rem;
  line-height: 1.7;
}

.glass-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.glass-hero__spotlight {
  width: min(100%, 25rem);
  padding: 1.15rem;
  border-radius: 1.6rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03)),
    rgba(8, 14, 28, 0.64);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 24px 60px rgba(1, 8, 20, 0.42);
}

.glass-hero__amount {
  display: block;
  margin-top: 0.25rem;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.05em;
  color: #ffffff;
}

.glass-hero__mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1.1rem;
}

.glass-hero__mini-card {
  padding: 0.9rem 0.95rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.glass-hero__mini-card span {
  display: block;
  color: rgba(195, 205, 226, 0.72);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.glass-hero__mini-card strong {
  display: block;
  margin-top: 0.4rem;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
}

.glass-panel,
.glass-control-bar,
.glass-table,
.glass-mobile-card,
.glass-modal-panel,
.glass-metric {
  background:
    var(--glass-surface),
    var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-highlight);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
}

.glass-panel--strong,
.glass-mobile-card,
.glass-table,
.glass-modal-panel {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.04)),
    var(--glass-bg-strong);
}

.glass-control-bar {
  gap: 0.9rem;
  padding: 1rem;
  margin-bottom: 1.75rem;
  border-radius: 1.6rem;
}

.glass-control-bar__grid {
  display: grid;
  gap: 0.9rem;
}

.glass-mobile-filter {
  margin-bottom: 1.5rem;
}

.glass-mobile-filter__panel {
  display: grid;
  gap: 0.85rem;
  margin-top: 0.9rem;
  padding: 1rem;
  border-radius: 1.4rem;
}

.glass-mobile-filter__actions {
  display: grid;
  gap: 0.7rem;
}

.glass-input,
.input {
  width: 100%;
  min-height: 3rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 14, 30, 0.7);
  color: var(--glass-text);
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09);
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.glass-input:focus,
.input:focus {
  border-color: rgba(103, 232, 249, 0.45);
  background: rgba(7, 17, 35, 0.84);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 0 0 3px rgba(59, 130, 246, 0.14);
}

.glass-input::placeholder,
.input::placeholder {
  color: rgba(214, 224, 255, 0.46);
}

.glass-input::-webkit-calendar-picker-indicator,
.input::-webkit-calendar-picker-indicator {
  filter: invert(1) opacity(0.74);
}

.glass-input option,
.input option {
  background: #09101d;
  color: #f4f7ff;
}

.glass-input--compact {
  min-width: 8rem;
}

.glass-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.85rem 1.2rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  color: white;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
  overflow: hidden;
}

.glass-button::before {
  content: "";
  position: absolute;
  inset: 1px 1px auto 1px;
  height: 52%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), transparent);
  opacity: 0.65;
  pointer-events: none;
}

.glass-button:hover {
  transform: translateY(-1px);
}

.glass-button--full {
  width: 100%;
}

.glass-button--primary {
  background: var(--glass-primary);
  box-shadow:
    0 16px 36px rgba(168, 85, 247, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.glass-button--info {
  background: var(--glass-info);
  box-shadow:
    0 14px 30px rgba(14, 165, 233, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.glass-button--secondary {
  background: rgba(15, 24, 46, 0.78);
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.13),
    0 16px 30px rgba(0, 0, 0, 0.28);
}

.glass-button--danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.78), rgba(190, 24, 93, 0.85));
  box-shadow:
    0 14px 28px rgba(190, 24, 93, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.glass-button--ghost,
.glass-button--ghost-danger {
  min-height: 2.35rem;
  padding: 0.55rem 0.95rem;
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.glass-button--ghost-danger {
  color: #fecdd3;
  border-color: rgba(251, 113, 133, 0.24);
  background: rgba(190, 24, 93, 0.12);
}

.glass-metrics {
  display: grid;
  gap: 1rem;
}

.glass-metrics--primary {
  grid-template-columns: repeat(1, minmax(0, 1fr));
  margin-bottom: 1rem;
}

.glass-metrics--secondary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 1.5rem;
}

.glass-metric {
  position: relative;
  overflow: hidden;
  padding: 1.25rem 1.3rem;
  border-radius: 1.55rem;
}

.glass-metric::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 42%);
  pointer-events: none;
}

.glass-metric::after {
  content: "";
  position: absolute;
  inset: auto 1.2rem 1rem auto;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.16), transparent 70%);
  filter: blur(8px);
  opacity: 0.7;
  pointer-events: none;
}

.glass-metric__label {
  display: block;
  margin-bottom: 0.55rem;
  color: var(--glass-muted);
  font-size: 0.9rem;
}

.glass-metric__value {
  display: block;
  font-size: clamp(1.15rem, 2.5vw, 1.8rem);
  font-weight: 700;
  color: #ffffff;
}

.glass-metric__meta {
  display: block;
  margin-top: 0.7rem;
  color: rgba(214, 223, 242, 0.66);
  font-size: 0.82rem;
  line-height: 1.5;
}

.glass-metric--compact .glass-metric__value {
  font-size: 1.15rem;
}

.glass-metric--featured {
  display: flex;
  flex-direction: column;
  min-height: 13rem;
  justify-content: flex-end;
}

.glass-metric--featured .glass-metric__value {
  font-size: clamp(2rem, 4vw, 3rem);
}

.glass-accent-cyan {
  box-shadow:
    0 26px 60px rgba(8, 145, 178, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.glass-accent-pink {
  box-shadow:
    0 26px 60px rgba(219, 39, 119, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.glass-accent-violet {
  box-shadow:
    0 26px 60px rgba(124, 58, 237, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.glass-accent-green {
  box-shadow:
    0 24px 52px rgba(22, 163, 74, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.glass-accent-blue {
  box-shadow:
    0 24px 52px rgba(37, 99, 235, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.glass-accent-amber {
  box-shadow:
    0 24px 52px rgba(217, 119, 6, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.glass-divider {
  height: 1px;
  margin: 1rem 0 1.45rem;
  background: linear-gradient(90deg, transparent, rgba(108, 126, 166, 0.55), transparent);
}

.glass-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.glass-section-head--table {
  margin-top: 0.35rem;
}

.glass-section-title {
  margin: 0.2rem 0 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.03em;
}

.glass-section-badge {
  padding: 0.55rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(230, 236, 249, 0.78);
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}

.glass-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.glass-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.38rem 0.8rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(245, 248, 255, 0.92);
  font-size: 0.78rem;
  font-weight: 600;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.glass-chip--neutral {
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(125, 211, 252, 0.2);
}

.glass-chip--soft {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(226, 234, 248, 0.8);
}

.glass-chip--cash {
  background: rgba(16, 185, 129, 0.14);
  border-color: rgba(52, 211, 153, 0.24);
  color: #bbf7d0;
}

.glass-chip--online {
  background: rgba(59, 130, 246, 0.14);
  border-color: rgba(96, 165, 250, 0.24);
  color: #bfdbfe;
}

.glass-table {
  overflow: hidden;
  border-radius: 1.7rem;
  margin-bottom: 1rem;
}

.glass-table__scroller {
  overflow-x: auto;
}

.glass-table__head {
  background: linear-gradient(180deg, rgba(20, 28, 54, 0.96), rgba(10, 16, 34, 0.86));
  color: rgba(188, 201, 230, 0.84);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.glass-table__row {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(232, 239, 255, 0.88);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.glass-table__row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.glass-row-actions {
  display: flex;
  gap: 0.6rem;
}

.glass-mobile-card {
  border-radius: 1.55rem;
  padding: 1rem;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.glass-mobile-card:active {
  transform: scale(0.985);
}

.glass-mobile-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
}

.glass-mobile-card__amount {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffffff;
}

.glass-mobile-card__date {
  margin: 0.25rem 0 0;
  color: var(--glass-muted);
  font-size: 0.82rem;
}

.glass-mobile-card__basic {
  margin-top: 1rem;
  display: grid;
  gap: 0.35rem;
  color: rgba(234, 240, 255, 0.88);
}

.glass-mobile-card__details {
  margin-top: 0.9rem;
  padding-top: 0.95rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-mobile-card__remark {
  margin: 0 0 0.95rem;
  color: rgba(203, 213, 235, 0.82);
}

.glass-mobile-card__actions {
  display: flex;
  gap: 0.75rem;
}

.glass-mobile-card__actions .glass-button {
  flex: 1;
}

.glass-empty {
  margin-top: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 1.4rem;
  color: rgba(203, 213, 225, 0.82);
  text-align: center;
}

.glass-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(2, 4, 11, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.glass-modal-panel {
  width: min(100%, 26rem);
  padding: 1.4rem;
  border-radius: 1.8rem;
}

.glass-modal-panel__header {
  margin-bottom: 1rem;
}

.glass-modal-panel__title {
  margin: 0 0 0.35rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.glass-modal-panel__body {
  display: grid;
  gap: 0.85rem;
}

.glass-modal-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.glass-tilt {
  --glass-tilt-rx: 0deg;
  --glass-tilt-ry: 0deg;
  --glass-tilt-inner-x: 0px;
  --glass-tilt-inner-y: 0px;
  --glass-tilt-scale: 1;
  --glass-tilt-lift: 0px;
  transform-style: preserve-3d;
  transition: transform 0.22s ease, filter 0.22s ease;
  transform:
    perspective(1500px)
    rotateX(var(--glass-tilt-rx))
    rotateY(var(--glass-tilt-ry))
    translateY(var(--glass-tilt-lift))
    scale(var(--glass-tilt-scale));
}

.glass-tilt--interactive:hover {
  will-change: transform;
  filter: drop-shadow(0 22px 34px rgba(0, 0, 0, 0.22));
}

.glass-tilt__inner {
  position: relative;
  z-index: 1;
  height: 100%;
  transform: translate(var(--glass-tilt-inner-x), var(--glass-tilt-inner-y));
  transition: transform 0.22s ease;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

@supports not ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {
  .glass-panel,
  .glass-control-bar,
  .glass-table,
  .glass-mobile-card,
  .glass-modal-panel,
  .glass-metric,
  .glass-chip {
    background: rgba(10, 16, 28, 0.92);
  }
}

@media (min-width: 640px) {
  .glass-control-bar__grid {
    grid-template-columns: repeat(5, minmax(0, 1fr)) auto auto auto;
  }

  .glass-shell {
    padding: 2.5rem 1.5rem 4rem;
  }

  .glass-metrics--primary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .glass-metric--featured {
    grid-column: span 2;
  }

  .glass-metrics--secondary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .glass-shell {
    padding-inline: 0.9rem;
  }

  .glass-title {
    font-size: 2.7rem;
  }

  .glass-subtitle {
    font-size: 0.95rem;
  }

  .glass-hero {
    padding: 1rem;
    border-radius: 1.7rem;
  }

  .glass-hero__spotlight {
    width: 100%;
  }

  .glass-hero__mini-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .glass-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .glass-section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .glass-modal-panel__actions {
    flex-direction: column-reverse;
  }

  .glass-modal-panel__actions .glass-button {
    width: 100%;
  }
}
`

const RUPEE = "\u20B9"
const MID_DOT = "\u2022"
const currencyFormatter = new Intl.NumberFormat("en-IN")

const formatCurrency = (value) => `${RUPEE}${currencyFormatter.format(Number(value || 0))}`

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })

const formatDateTimeLabel = (value) => value || "All"

function TiltPanel({ enabled, className = "", innerClassName = "", children, strength = 10, ...props }) {
  const panelRef = useRef(null)
  const frameRef = useRef(0)
  const stateRef = useRef({
    rotateX: 0,
    rotateY: 0,
    innerX: 0,
    innerY: 0,
    scale: 1,
    lift: 0,
  })

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const flushFrame = () => {
    const node = panelRef.current
    if (!node) {
      frameRef.current = 0
      return
    }

    const current = stateRef.current
    node.style.setProperty("--glass-tilt-rx", `${current.rotateX}deg`)
    node.style.setProperty("--glass-tilt-ry", `${current.rotateY}deg`)
    node.style.setProperty("--glass-tilt-inner-x", `${current.innerX}px`)
    node.style.setProperty("--glass-tilt-inner-y", `${current.innerY}px`)
    node.style.setProperty("--glass-tilt-scale", `${current.scale}`)
    node.style.setProperty("--glass-tilt-lift", `${current.lift}px`)
    frameRef.current = 0
  }

  const scheduleFrame = () => {
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(flushFrame)
    }
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
      innerX: centeredX * strength * 0.55,
      innerY: centeredY * strength * 0.55,
      scale: 1.008,
      lift: -3,
    }

    scheduleFrame()
  }

  const handleLeave = () => {
    stateRef.current = {
      rotateX: 0,
      rotateY: 0,
      innerX: 0,
      innerY: 0,
      scale: 1,
      lift: 0,
    }

    scheduleFrame()
  }

  return (
    <div
      ref={panelRef}
      className={`glass-tilt ${enabled ? "glass-tilt--interactive" : ""} ${className}`}
      onMouseMove={enabled ? handleMove : undefined}
      onMouseLeave={enabled ? handleLeave : undefined}
      {...props}
    >
      <div className={`glass-tilt__inner ${innerClassName}`}>{children}</div>
    </div>
  )
}

export default function CardSwipe() {
  const [entries, setEntries] = useState([])

  const [month, setMonth] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [machine, setMachine] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [openCard, setOpenCard] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const [fromDateTime, setFromDateTime] = useState("")
  const [toDateTime, setToDateTime] = useState("")

  const [reportMachine, setReportMachine] = useState("")
  const [reportPayment, setReportPayment] = useState("")

  const [format, setFormat] = useState("pdf")
  const [tiltEnabled, setTiltEnabled] = useState(false)

  const getReportData = () => {
    return entries.filter((entry) => {
      const entryDateTime = new Date(entry.date)

      if (entry.time) {
        const [hours, minutes] = entry.time.split(":")
        entryDateTime.setHours(Number(hours))
        entryDateTime.setMinutes(Number(minutes))
      }

      const from = fromDateTime ? new Date(fromDateTime) : null
      const to = toDateTime ? new Date(toDateTime) : null

      if (to) {
        to.setSeconds(59)
      }

      return (
        (!from || entryDateTime >= from) &&
        (!to || entryDateTime <= to) &&
        (!reportMachine || entry.machine === reportMachine) &&
        (!reportPayment || entry.paymentMethod === reportPayment)
      )
    })
  }

  const getSummary = (data) => {
    let totalAmount = 0
    let totalCharges = 0

    let cash = 0
    let online = 0

    let self = 0
    let dsm = 0

    data.forEach((entry) => {
      const amount = Number(entry.amount || 0)
      const charges = Number(entry.charges || 0)

      totalAmount += amount
      totalCharges += charges

      if (entry.paymentMethod === "Cash") cash += amount
      if (entry.paymentMethod === "Online") online += amount

      if (entry.machine === "Self") self += amount
      if (entry.machine === "DSM") dsm += amount
    })

    return {
      totalAmount,
      totalCharges,
      net: totalAmount - totalCharges,
      cash,
      online,
      self,
      dsm,
      count: data.length,
    }
  }

  const generatePDF = (data) => {
    const summary = getSummary(data)
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("Card Swipe Report", 14, 15)

    doc.setFontSize(10)
    doc.text(`From: ${formatDateTimeLabel(fromDateTime)}`, 14, 22)
    doc.text(`To: ${formatDateTimeLabel(toDateTime)}`, 14, 28)
    doc.text(`Machine: ${reportMachine || "All"}`, 120, 22)
    doc.text(`Payment: ${reportPayment || "All"}`, 120, 28)

    doc.setFontSize(12)
    doc.text("Summary", 14, 40)

    doc.setFontSize(10)
    doc.text(`Total Swipe: Rs.${summary.totalAmount}`, 14, 48)
    doc.text(`Total Charges: Rs.${summary.totalCharges}`, 14, 54)
    doc.text(`Cash: Rs.${summary.cash}`, 120, 48)
    doc.text(`Online: Rs.${summary.online}`, 120, 54)
    doc.text(`Self: Rs.${summary.self}`, 120, 60)
    doc.text(`DSM: Rs.${summary.dsm}`, 120, 66)
    doc.text(`Transactions: ${summary.count}`, 14, 68)

    autoTable(doc, {
      startY: 75,
      head: [["Date", "Time", "Amount", "Charges", "Machine", "Payment"]],
      body: data.map((entry) => [
        formatDate(entry.date),
        entry.time,
        entry.amount,
        entry.charges,
        entry.machine,
        entry.paymentMethod,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [45, 212, 191] },
    })

    doc.save("CardSwipe_Report.pdf")
  }

  const generateExcel = (data) => {
    const summary = getSummary(data)

    const formatted = data.map((entry, index) => ({
      ID: index + 1,
      Date: formatDate(entry.date),
      Time: entry.time,
      Amount: entry.amount,
      Charges: entry.charges,
      Machine: entry.machine,
      Payment: entry.paymentMethod,
    }))

    const ws = XLSX.utils.json_to_sheet(formatted)
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, "Data")

    const summarySheet = XLSX.utils.json_to_sheet([summary])
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary")

    XLSX.writeFile(wb, "CardSwipe_Report.xlsx")
  }

  const handleGenerate = () => {
    const filteredData = getReportData()

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

  const fetchEntries = async () => {
    const data = await getEntries({
      month,
      startDate,
      endDate,
      machine,
      paymentMethod,
    })

    setEntries(data)
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)")
    const motionQuery = window.matchMedia("(prefers-reduced-motion: no-preference)")

    const updateMotion = () => {
      setTiltEnabled(pointerQuery.matches && motionQuery.matches)
    }

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
  
  const handleSearch = async () => {
    const params = {}

    if (month) params.month = month
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (machine) params.machine = machine
    if (paymentMethod) params.paymentMethod = paymentMethod

    const data = await getEntries(params)
    setEntries(data)
  }

  const clearFilters = () => {
    setMonth("")
    setStartDate("")
    setEndDate("")
    setMachine("")
    setPaymentMethod("")
    getEntries({}).then(setEntries)
  }

  const removeEntry = async (id) => {
    await deleteEntry(id)
    await fetchEntries()
  }

  const removeMonth = async () => {
    if (!month) {
      alert("Select month")
      return
    }

    const [year, currentMonth] = month.split("-")
    await deleteMonth(year, currentMonth)
    await fetchEntries()
  }

  const summary = getSummary(entries)
  const activeFilterCount = [month, startDate, endDate, machine, paymentMethod].filter(Boolean).length

  const primaryMetrics = [
    {
      label: "Total Swipe",
      value: formatCurrency(summary.totalAmount),
      meta: `${summary.count} recorded transactions`,
      accent: "glass-accent-cyan",
      featured: true,
    },
    {
      label: "Total Charges",
      value: formatCurrency(summary.totalCharges),
      meta: "Processing fees booked",
      accent: "glass-accent-pink",
    }
  ]

  const secondaryMetrics = [
    {
      label: "Cash",
      value: formatCurrency(summary.cash),
      meta: "Payment split",
      accent: "glass-accent-green",
    },
    {
      label: "Online",
      value: formatCurrency(summary.online),
      meta: "Digital collections",
      accent: "glass-accent-blue",
    },
    {
      label: "Self",
      value: formatCurrency(summary.self),
      meta: "Machine channel",
      accent: "glass-accent-amber",
    },
    {
      label: "DSM",
      value: formatCurrency(summary.dsm),
      meta: "Machine channel",
      accent: "glass-accent-cyan",
    },
  ]

  return (
    <>
      <style>{glassStyles}</style>

      <div className="glass-page">
        <div className="glass-page__bg glass-page__bg--pink" />
        <div className="glass-page__bg glass-page__bg--cyan" />
        <div className="glass-page__bg glass-page__bg--violet" />

        <div className="glass-shell">
           <TiltPanel enabled={tiltEnabled} strength={8} innerClassName="glass-hero">
            <div className="glass-hero__content">
              <p className="glass-overline">Premium Settlement View</p>
              <h1 className="glass-title">Card Swipe Register</h1>
              <p className="glass-subtitle">
                Real-time register with a sharper view of gross volume, fees, and machine performance.
              </p>

              <div className="glass-hero__chips">
                <div className="glass-chip glass-chip--neutral">Net {formatCurrency(summary.net)}</div>
                <div className="glass-chip glass-chip--soft">
                  {activeFilterCount ? `${activeFilterCount} filters active` : "All entries live"}
                </div>
                <div className="glass-chip glass-chip--soft">{summary.count} transactions</div>
              </div>
            </div>

            <div className="glass-hero__spotlight">
              <span className="glass-overline glass-overline--muted">Settlement Spotlight</span>
              <strong className="glass-hero__amount">{formatCurrency(summary.net)}</strong>
              <div className="glass-hero__mini-grid">
                <div className="glass-hero__mini-card">
                  <span>Cash</span>
                  <strong>{formatCurrency(summary.cash)}</strong>
                </div>
                <div className="glass-hero__mini-card">
                  <span>Online</span>
                  <strong>{formatCurrency(summary.online)}</strong>
                </div>
                <div className="glass-hero__mini-card">
                  <span>Self</span>
                  <strong>{formatCurrency(summary.self)}</strong>
                </div>
                <div className="glass-hero__mini-card">
                  <span>DSM</span>
                  <strong>{formatCurrency(summary.dsm)}</strong>
                </div>
              </div>
            </div>
          </TiltPanel>

          <TiltPanel enabled={tiltEnabled} strength={6} className="hidden sm:block" innerClassName="glass-control-bar glass-control-bar__grid">
            <input
              type="datetime-local"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="glass-input"
            />

            <input
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="glass-input"
            />

            <select
              value={machine}
              onChange={(event) => setMachine(event.target.value)}
              className="glass-input"
            >
              <option value="">Both Machine</option>
              <option value="Self">Self</option>
              <option value="DSM">DSM</option>
            </select>

            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="glass-input"
            >
              <option value="">Both Payment</option>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
            </select>

            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="glass-input glass-input--compact"
            />

            <button className="glass-button glass-button--primary" onClick={handleSearch}>
              Search
            </button>

            <button className="glass-button glass-button--secondary" onClick={clearFilters}>
              Clear
            </button>

            <button className="glass-button glass-button--danger" onClick={removeMonth}>
              Delete Month
            </button>
           </TiltPanel>

          <div className="glass-mobile-filter sm:hidden">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="glass-button glass-button--secondary glass-button--full"
            >
              {showFilter ? "Hide Filters" : "Filters"}
            </button>

            {showFilter && (
              <div className="glass-panel glass-panel--strong glass-mobile-filter__panel">
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="glass-input"
                />

                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="glass-input"
                />

                <select
                  value={machine}
                  onChange={(event) => setMachine(event.target.value)}
                  className="glass-input"
                >
                  <option value="">Both Machine</option>
                  <option value="Self">Self</option>
                  <option value="DSM">DSM</option>
                </select>

                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="glass-input"
                >
                  <option value="">Both Payment</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>

                <input
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="glass-input"
                />

                <div className="glass-mobile-filter__actions">
                  <button className="glass-button glass-button--primary" onClick={handleSearch}>
                    Apply
                  </button>
                  <button className="glass-button glass-button--secondary" onClick={clearFilters}>
                    Clear
                  </button>
                  <button className="glass-button glass-button--danger" onClick={removeMonth}>
                    Delete Month
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="glass-section-head">
            <div>
              <p className="glass-overline">Snapshot</p>
              <h2 className="glass-section-title">Premium register summary</h2>
            </div>
            <div className="glass-section-badge">Live totals</div>
          </div>

          <div className="glass-metrics glass-metrics--primary">
            {primaryMetrics.map((metric) => (
              <TiltPanel
                key={metric.label}
                enabled={tiltEnabled}
                strength={metric.featured ? 8 : 11}
                innerClassName={`glass-metric ${metric.accent} ${metric.featured ? "glass-metric--featured" : ""}`}
              >
                <span className="glass-metric__label">{metric.label}</span>
                <strong className="glass-metric__value">{metric.value}</strong>
                <span className="glass-metric__meta">{metric.meta}</span>
              </TiltPanel>
            ))}
          </div>

          <div className="glass-divider" />

          {/* <div className="glass-metrics glass-metrics--secondary">
            {secondaryMetrics.map((metric) => (
              <div key={metric.label} className={`glass-metric glass-metric--compact ${metric.accent}`}>
                <span className="glass-metric__label">{metric.label}</span>
                <strong className="glass-metric__value">{metric.value}</strong>
                <span className="glass-metric__meta">{metric.meta}</span>
              </div>
            ))}
          </div> */}

          <div className="glass-actions">
            <button onClick={() => setReportOpen(true)} className="glass-button glass-button--primary">
              Generate Report
            </button>

            <button
              className="glass-button glass-button--info"
              onClick={() => {
                setEditData(null)
                setModalOpen(true)
              }}
            >
              + Add Entry
            </button>
          </div>

          <div className="glass-section-head glass-section-head--table">
            <div>
              <p className="glass-overline">Ledger</p>
              <h2 className="glass-section-title">Transaction activity</h2>
            </div>
            <div className="glass-section-badge">{summary.count} rows</div>
          </div>

          <div className="hidden sm:block glass-table">
            <div className="glass-table__scroller">
              <table className="w-full">
                <thead className="glass-table__head">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Time</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Charges</th>
                    <th className="p-4 text-left">Machine</th>
                    <th className="p-4 text-left">Payment</th>
                    <th className="p-4 text-left">Remark</th>
                    <th className="p-4 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry._id} className="glass-table__row">
                      <td className="p-4">{formatDate(entry.date)}</td>
                      <td className="p-4">{entry.time}</td>
                      <td className="p-4 font-semibold text-white">{formatCurrency(entry.amount)}</td>
                      <td className="p-4 text-pink-200">{formatCurrency(entry.charges)}</td>
                      <td className="p-4">
                        <span className="glass-chip glass-chip--neutral">{entry.machine}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`glass-chip ${
                            entry.paymentMethod === "Cash" ? "glass-chip--cash" : "glass-chip--online"
                          }`}
                        >
                          {entry.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-slate-200/85">{entry.remark || "-"}</td>
                      <td className="p-4">
                        <div className="glass-row-actions">
                          <button
                            className="glass-button glass-button--ghost"
                            onClick={() => {
                              setEditData(entry)
                              setModalOpen(true)
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="glass-button glass-button--ghost-danger"
                            onClick={() => removeEntry(entry._id)}
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

          <div className="sm:hidden space-y-4">
            {entries.map((entry) => {
              const isOpen = openCard === entry._id

              return (
                <div
                  key={entry._id}
                  onClick={() => setOpenCard(isOpen ? null : entry._id)}
                  className="glass-mobile-card"
                >
                  <div className="glass-mobile-card__top">
                    <div>
                      <p className="glass-mobile-card__amount">{formatCurrency(entry.amount)}</p>
                      <p className="glass-mobile-card__date">
                        {formatDate(entry.date)} {entry.time ? `${MID_DOT} ${entry.time}` : ""}
                      </p>
                    </div>

                    <p
                      className={`glass-chip ${
                        entry.paymentMethod === "Cash" ? "glass-chip--cash" : "glass-chip--online"
                      }`}
                    >
                      {entry.paymentMethod}
                    </p>
                  </div>

                  <div className="glass-mobile-card__basic">
                    <p>Machine: {entry.machine}</p>
                    <p className="text-pink-200">Charges: {formatCurrency(entry.charges)}</p>
                  </div>

                  {isOpen && (
                    <div className="glass-mobile-card__details">
                      <p className="glass-mobile-card__remark">Remark: {entry.remark || "-"}</p>

                      <div className="glass-mobile-card__actions">
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            setEditData(entry)
                            setModalOpen(true)
                          }}
                          className="glass-button glass-button--ghost"
                        >
                          Edit
                        </button>

                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            removeEntry(entry._id)
                          }}
                          className="glass-button glass-button--ghost-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {entries.length === 0 && (
            <div className="glass-panel glass-empty">
              <p>No card swipe entries found for the current filters.</p>
            </div>
          )}
        </div>

        {reportOpen && (
          <div className="glass-modal-backdrop">
            <div className="glass-modal-panel">
              <div className="glass-modal-panel__header">
                <h2 className="glass-modal-panel__title">Generate Report</h2>
              </div>

              <div className="glass-modal-panel__body">
                <input
                  type="datetime-local"
                  value={fromDateTime}
                  onChange={(event) => setFromDateTime(event.target.value)}
                  className="glass-input"
                />

                <input
                  type="datetime-local"
                  value={toDateTime}
                  onChange={(event) => setToDateTime(event.target.value)}
                  className="glass-input"
                />

                <select
                  value={reportMachine}
                  onChange={(event) => setReportMachine(event.target.value)}
                  className="glass-input"
                >
                  <option value="">All Machine</option>
                  <option value="Self">Self</option>
                  <option value="DSM">DSM</option>
                </select>

                <select
                  value={reportPayment}
                  onChange={(event) => setReportPayment(event.target.value)}
                  className="glass-input"
                >
                  <option value="">All Payment</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>

                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  className="glass-input"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              <div className="glass-modal-panel__actions">
                <button onClick={() => setReportOpen(false)} className="glass-button glass-button--secondary">
                  Cancel
                </button>

                <button onClick={handleGenerate} className="glass-button glass-button--primary">
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        <AddCardSwipeModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditData(null)
          }}
          onSave={() => {
            fetchEntries()
            setModalOpen(false)
            setEditData(null)
          }}
          editData={editData}
        />
      </div>
    </>
  )
}













// import { useEffect,useState } from "react"
// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"
// import {

// getEntries,
// deleteEntry,
// deleteMonth

// } from "../services/cardSwipeApi"
// import AddCardSwipeModal from "../components/AddCardSwipeModal"


// export default function CardSwipe(){

// const [entries,setEntries] = useState([])

// const [month,setMonth] = useState("")
// const [startDate,setStartDate] = useState("")
// const [endDate,setEndDate] = useState("")
// const [machine,setMachine] = useState("")
// const [paymentMethod,setPaymentMethod] = useState("")
// const [modalOpen,setModalOpen] = useState(false)
// const [editData,setEditData] = useState(null)
// const [openCard,setOpenCard] = useState(null)
// const [showFilter,setShowFilter] = useState(false)
// const [reportOpen,setReportOpen] = useState(false)

// const [fromDateTime,setFromDateTime] = useState("")
// const [toDateTime,setToDateTime] = useState("")

// const [reportMachine,setReportMachine] = useState("")
// const [reportPayment,setReportPayment] = useState("")

// const [format,setFormat] = useState("pdf")

// const getReportData = () => {

// return entries.filter(e => {

// const entryDateTime = new Date(e.date)

// if(e.time){
//   const [hours, minutes] = e.time.split(":")
//   entryDateTime.setHours(hours)
//   entryDateTime.setMinutes(minutes)
// }

// const from = fromDateTime ? new Date(fromDateTime) : null
// const to = toDateTime ? new Date(toDateTime) : null

// if(to) to.setSeconds(59)

// // DEBUG (optional)
// console.log("ENTRY FIXED:", entryDateTime)

// return (

// (!from || entryDateTime >= from) &&
// (!to || entryDateTime <= to) &&
// (!reportMachine || e.machine === reportMachine) &&
// (!reportPayment || e.paymentMethod === reportPayment)

// )

// })

// }


// const getSummary = (data)=>{

// let totalAmount = 0
// let totalCharges = 0

// let cash = 0
// let online = 0

// let self = 0
// let dsm = 0

// data.forEach(e=>{

// totalAmount += Number(e.amount || 0)
// totalCharges += Number(e.charges || 0)

// if(e.paymentMethod === "Cash") cash += e.amount
// if(e.paymentMethod === "Online") online += e.amount

// if(e.machine === "Self") self += e.amount
// if(e.machine === "DSM") dsm += e.amount

// })

// return {
// totalAmount,
// totalCharges,
// net: totalAmount - totalCharges,
// cash,
// online,
// self,
// dsm,
// count: data.length
// }

// }


// const handleGenerate = ()=>{

// const filteredData = getReportData()

// if(filteredData.length === 0){
// alert("No data found")
// return
// }

// if(format === "pdf"){
// generatePDF(filteredData)
// }else{
// generateExcel(filteredData)
// }

// setReportOpen(false)

// }

// const generatePDF = (data)=>{

// const summary = getSummary(data)

// const doc = new jsPDF()

// doc.setFontSize(16)
// doc.text("Card Swipe Report",14,15)

// doc.setFontSize(10)
// doc.text(`From: ${fromDateTime || "All"}`,14,22)
// doc.text(`To: ${toDateTime || "All"}`,14,28)

// doc.text(`Machine: ${reportMachine || "All"}`,120,22)
// doc.text(`Payment: ${reportPayment || "All"}`,120,28)

// // 🔹 SUMMARY
// doc.setFontSize(12)
// doc.text("Summary",14,40)

// doc.setFontSize(10)

// doc.text(`Total Swipe: Rs.${summary.totalAmount}`,14,48)
// doc.text(`Total Charges: Rs.${summary.totalCharges}`,14,54) 

// doc.text(`Cash: Rs.${summary.cash}`,120,48)
// doc.text(`Online: Rs.${summary.online}`,120,54)

// doc.text(`Self: Rs.${summary.self}`,120,60)
// doc.text(`DSM: Rs.${summary.dsm}`,120,66)

// doc.text(`Transactions: ${summary.count}`,14,68)

// // 🔹 TABLE
// autoTable(doc,{
// startY:75,
// head:[["Date","Time","Amount","Charges","Machine","Payment"]],
// body:data.map(e=>[
// new Date(e.date).toLocaleDateString(),
// e.time,
// e.amount,
// e.charges,
// e.machine,
// e.paymentMethod
// ]),
// styles:{fontSize:8},
// headStyles:{fillColor:[22,163,74]}
// })

// doc.save("CardSwipe_Report.pdf")

// }

// const generateExcel = (data)=>{

// const summary = getSummary(data)

// const formatted = data.map((e,i)=>({
// ID:i+1,
// Date:new Date(e.date).toLocaleDateString(),
// Time:e.time,
// Amount:e.amount,
// Charges:e.charges,
// Machine:e.machine,
// Payment:e.paymentMethod
// }))

// const ws = XLSX.utils.json_to_sheet(formatted)

// const wb = XLSX.utils.book_new()

// // DATA SHEET
// XLSX.utils.book_append_sheet(wb,ws,"Data")

// // SUMMARY SHEET
// const summarySheet = XLSX.utils.json_to_sheet([summary])
// XLSX.utils.book_append_sheet(wb,summarySheet,"Summary")

// XLSX.writeFile(wb,"CardSwipe_Report.xlsx")

// }


// const fetchEntries = async()=>{

// const data = await getEntries({

// month,
// startDate,
// endDate,
// machine,
// paymentMethod

// })

// setEntries(data)

// }



// useEffect(()=>{

// fetchEntries()

// },[])

// const handleSearch = async()=>{

// const params = {}

// if(month) params.month = month

// if(startDate) params.startDate = startDate

// if(endDate) params.endDate = endDate

// if(machine) params.machine = machine

// if(paymentMethod) params.paymentMethod = paymentMethod

// const data = await getEntries(params)

// setEntries(data)

// }



// // DELETE ENTRY

// const removeEntry = async(id)=>{

// await deleteEntry(id)

// fetchEntries()

// }



// // DELETE MONTH

// const removeMonth = async()=>{

// if(!month) return alert("Select month")

// const [year,mon] = month.split("-")

// await deleteMonth(year,mon)

// fetchEntries()

// }



// // SUMMARY

// let totalAmount = 0
// let totalCharges = 0
// let cashTotal = 0
// let onlineTotal = 0
// let selfTotal = 0
// let dsmTotal = 0


// entries.forEach(e=>{

// totalAmount += e.amount || 0
// totalCharges += e.charges || 0

// if(e.paymentMethod==="Cash") cashTotal += e.amount

// if(e.paymentMethod==="Online") onlineTotal += e.amount

// if(e.machine==="Self") selfTotal += e.amount

// if(e.machine==="DSM") dsmTotal += e.amount

// })


// const netAmount = totalAmount - totalCharges



// return(

// <div className="p-6 text-gray-300">

// <h1 className="text-2xl mb-6 font-bold">

// Card Swipe Register

// </h1>





// {/* FILTERS */}

// <div className="hidden sm:flex items-end gap-3 mb-6 overflow-x-auto">


// <input
// type="datetime-local"
// value={startDate}
// onChange={(e)=>setStartDate(e.target.value)}
// className="input text-white [&::-webkit-calendar-picker-indicator]:invert"
// />


// <input
// type="datetime-local"
// value={endDate}
// onChange={(e)=>setEndDate(e.target.value)}
// className="input text-white [&::-webkit-calendar-picker-indicator]:invert"
// />


// <select
// value={machine}
// onChange={(e)=>setMachine(e.target.value)}
// className="input"
// >

// <option value="">Both Machine</option>
// <option value="Self">Self</option>
// <option value="DSM">DSM</option>

// </select>


// <select
// value={paymentMethod}
// onChange={(e)=>setPaymentMethod(e.target.value)}
// className="input"
// >

// <option value="">Both Payment</option>
// <option value="Cash">Cash</option>
// <option value="Online">Online</option>

// </select>


// <button
// className="bg-green-500 px-4 py-2 rounded"
// onClick={handleSearch}
// >

// Search

// </button>

// <button
// className="bg-gray-600 px-4 py-2 rounded"
// onClick={()=>{

// setMonth("")
// setStartDate("")
// setEndDate("")
// setMachine("")
// setPaymentMethod("")

// fetchEntries()

// }}
// >

// Clear

// </button>

// <input
// type="month"
// value={month}
// onChange={(e)=>setMonth(e.target.value)}
// className="input  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <button
// className="bg-red-500 px-4 py-1 rounded "
// onClick={removeMonth}
// >
// Delete Month
// </button>

// </div>


// <div className="sm:hidden flex flex-col gap-3 mb-6 ">

// <button
// onClick={()=>setShowFilter(!showFilter)}
// className="bg-[#1A1F2E] px-3 py-2 rounded text-sm"
// >
// Filters
// </button>

// {showFilter && (

// <div className="flex flex-col gap-3 bg-[#0B0F17] p-3 rounded">

// <input
// type="datetime-local"
// value={startDate}
// onChange={(e)=>setStartDate(e.target.value)}
// className="input text-white"
// />

// <input
// type="datetime-local"
// value={endDate}
// onChange={(e)=>setEndDate(e.target.value)}
// className="input text-white"
// />

// <select
// value={machine}
// onChange={(e)=>setMachine(e.target.value)}
// className="input"
// >
// <option value="">Both Machine</option>
// <option value="Self">Self</option>
// <option value="DSM">DSM</option>
// </select>

// <select
// value={paymentMethod}
// onChange={(e)=>setPaymentMethod(e.target.value)}
// className="input"
// >
// <option value="">Both Payment</option>
// <option value="Cash">Cash</option>
// <option value="Online">Online</option>
// </select>

// <button
// className="bg-green-500 px-4 py-2 rounded"
// onClick={handleSearch}
// >
// Apply
// </button>

// </div>

// )}

// </div>






// {/* SUMMARY CARDS */}

// <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-bold">

// <div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

// <p className="text-gray-400">Total Swipe</p>

// <p className="text-lg">

// ₹{totalAmount}

// </p>

// </div>


// <div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

// <p className="text-gray-400">Total Charges</p>

// <p className="text-lg">

// ₹{totalCharges}

// </p>

// </div>


// <div className="col-span-2 bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

// <p className="text-gray-400">Transactions:  {entries.length}</p>

// <p className="text-lg">



// </p>

// </div>

// </div>

// <div className="mt-[-15px] mb-2 h-[1px] bg-gradient-to-r from-transparent via-[#20273a] to-transparent"></div>


// {/* EXTRA SUMMARY */}

// <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-bold">

// <div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

// Cash : ₹{cashTotal}

// </div>


// <div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

// Online : ₹{onlineTotal}

// </div>


// <div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

// Self : ₹{selfTotal}

// </div>


// <div className="bg-[#0B0F17] border border-[#1F2937] p-4 rounded">

// DSM : ₹{dsmTotal}

// </div>

// </div>

// <div className="flex justify-end mb-2 gap-1">
// <button
// onClick={()=>setReportOpen(true)}
// className="bg-purple-600 text-white px-4 py-2 rounded"
// >
// Generate Report
// </button>

// <button
// className="bg-blue-500 px-4 py-2 rounded"
// onClick={()=>setModalOpen(true)}
// >
// + Add Entry
// </button>

// </div>

// {/* TABLE */}

// <div className="hidden sm:block bg-[#0B0F17] border border-[#1F2937] rounded">

// <table className="w-full">

// <thead className="border-b border-[#1F2937] text-gray-400">

// <tr>

// <th className="p-3 text-left">Date</th>
// <th className="p-3 text-left">Time</th>
// <th className="p-3 text-left">Amount</th>
// <th className="p-3 text-left">Charges</th>
// <th className="p-3 text-left">Machine</th>
// <th className="p-3 text-left">Payment</th>
// <th className="p-3 text-left">Remark</th>
// <th className="p-3 text-left">Action</th>

// </tr>

// </thead>


// <tbody>

// {entries.map(e=>(

// <tr key={e._id} className="border-t border-[#1F2937]">

// <td className="p-3">

// {new Date(e.date).toLocaleDateString()}

// </td>


// <td className="p-3">

// {e.time}

// </td>


// <td className="p-3">

// ₹{e.amount}

// </td>


// <td className="p-3 text-green-500">

// ₹{e.charges}

// </td>


// <td className="p-3">

// {e.machine}

// </td>


// <td className="p-3">

// {e.paymentMethod}

// </td>


// <td className="p-3">

// {e.remark}

// </td>


// <td className="p-3 flex gap-3">

// <button
// className="text-blue-400"
// onClick={()=>{

// setEditData(e)
// setModalOpen(true)

// }}
// >
// Edit
// </button>

// <button
// className="text-red-400"
// onClick={()=>removeEntry(e._id)}
// >
// Delete
// </button>

// </td>

// </tr>

// ))}

// </tbody>

// </table>

// </div>

// <div className="sm:hidden space-y-4">

// {entries.map(e=>{

// const isOpen = openCard === e._id

// return(

// <div
// key={e._id}
// onClick={()=>setOpenCard(isOpen ? null : e._id)}
// className="bg-[#0B0F17] border border-[#1F2937] rounded-xl p-4 active:scale-[0.98] transition"
// >

// {/* TOP */}
// <div className="flex justify-between items-center">

// <div>
// <p className="text-white font-semibold text-lg">
// ₹{e.amount}
// </p>

// <p className="text-xs text-gray-400">
// {new Date(e.date).toLocaleDateString()} • {e.time}
// </p>
// </div>

// <p className={`text-xs px-3 py-1 rounded-full 
// ${e.paymentMethod==="Cash"
// ? "bg-green-500/10 text-green-400"
// : "bg-blue-500/10 text-blue-400"
// }`}>
// {e.paymentMethod}
// </p>

// </div>

// {/* BASIC */}
// <div className="mt-2 text-sm text-gray-300">

// <p>Machine: {e.machine}</p>

// <p className="text-red-400">
// Charges: ₹{e.charges}
// </p>

// </div>

// {/* EXPAND */}
// {isOpen && (

// <div className="mt-3 border-t border-[#1F2937] pt-3 space-y-2">

// <p className="text-sm text-gray-400">
// Remark: {e.remark || "-"}
// </p>

// <div className="flex gap-2">

// <button
// onClick={(ev)=>{
// ev.stopPropagation()
// setEditData(e)
// setModalOpen(true)
// }}
// className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded"
// >
// Edit
// </button>

// <button
// onClick={(ev)=>{
// ev.stopPropagation()
// removeEntry(e._id)
// }}
// className="flex-1 bg-red-500/20 text-red-400 py-2 rounded"
// >
// Delete
// </button>

// </div>

// </div>

// )}

// </div>

// )

// })}

// </div>
// <div>
//     {reportOpen && (

// <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

// <div className="bg-[#0B0F17] p-6 rounded-xl w-[350px] text-white">

// <h2 className="text-lg font-semibold mb-4">
// Generate Report
// </h2>

// <div className="flex flex-col gap-3">

// <input
// type="datetime-local"
// value={fromDateTime}
// onChange={(e)=>setFromDateTime(e.target.value)}
// className="border p-2 bg-transparent rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <input
// type="datetime-local"
// value={toDateTime}
// onChange={(e)=>setToDateTime(e.target.value)}
// className="border p-2 bg-transparent rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// <select
// value={reportMachine}
// onChange={(e)=>setReportMachine(e.target.value)}
// className="border p-2 bg-[#0B0F17] rounded"
// >
// <option value="">All Machine</option>
// <option value="Self">Self</option>
// <option value="DSM">DSM</option>
// </select>

// <select
// value={reportPayment}
// onChange={(e)=>setReportPayment(e.target.value)}
// className="border p-2 bg-[#0B0F17] rounded"
// >
// <option value="">All Payment</option>
// <option value="Cash">Cash</option>
// <option value="Online">Online</option>
// </select>

// <select
// value={format}
// onChange={(e)=>setFormat(e.target.value)}
// className="border p-2 bg-[#0B0F17] rounded"
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
// </div>
// <AddCardSwipeModal
// open={modalOpen}
// onClose={()=>{
// setModalOpen(false)
// setEditData(null)
// }}
// onSave={()=>{
// fetchEntries()
// setModalOpen(false)
// setEditData(null)
// }}
// editData={editData}
// />

// </div>

// )

// }


