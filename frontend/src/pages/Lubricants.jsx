import { useEffect, useRef, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import {
  getLubricants,
  getProducts,
  addLubricant,
  updateLubricant,
  deleteLubricant,
  addProduct,
  deleteProduct,
  deleteMonth,
} from "../services/lubricantApi"
const pageStyles = String.raw`
:root {
  --lube-bg: #040507;
  --lube-surface: rgba(9, 13, 14, 0.74);
  --lube-surface-strong: rgba(9, 13, 14, 0.9);
  --lube-surface-soft: rgba(16, 21, 21, 0.72);
  --lube-border: rgba(255, 255, 255, 0.1);
  --lube-border-strong: rgba(34, 197, 94, 0.22);
  --lube-text: rgba(248, 250, 252, 0.98);
  --lube-muted: rgba(176, 189, 197, 0.74);
  --lube-green: #22c55e;
  --lube-green-soft: rgba(34, 197, 94, 0.12);
  --lube-blue: #2563eb;
  --lube-amber: #eab308;
  --lube-red: #ef4444;
  --lube-sky: #38bdf8;
  --lube-shadow: 0 28px 90px rgba(0, 0, 0, 0.56);
  --lube-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.16);
}
.lube-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 16% 16%, rgba(34, 197, 94, 0.12), transparent 24%),
    radial-gradient(circle at 84% 18%, rgba(16, 185, 129, 0.08), transparent 18%),
    radial-gradient(circle at 82% 78%, rgba(56, 189, 248, 0.08), transparent 20%),
    linear-gradient(180deg, #020304 0%, #050607 32%, #040507 100%);
  color: var(--lube-text);
}
.lube-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(118deg, rgba(255, 255, 255, 0.03), transparent 24%),
    radial-gradient(circle at 74% 0%, rgba(34, 197, 94, 0.04), transparent 16%);
  opacity: 0.88;
  pointer-events: none;
}
.lube-page::after {
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
.lube-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(120px);
  opacity: 0.75;
  pointer-events: none;
}
.lube-orb--green {
  left: -5rem;
  top: 24rem;
  width: 22rem;
  height: 22rem;
  background: rgba(34, 197, 94, 0.18);
}
.lube-orb--teal {
  right: -4rem;
  top: 10rem;
  width: 18rem;
  height: 18rem;
  background: rgba(16, 185, 129, 0.14);
}
.lube-orb--sky {
  right: 18%;
  bottom: 5rem;
  width: 18rem;
  height: 18rem;
  background: rgba(56, 189, 248, 0.1);
}
.lube-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}
.lube-frame {
  position: absolute;
  inset: 6rem -0.5rem auto -0.5rem;
  height: clamp(24rem, 44vw, 39rem);
  border: 1px solid rgba(34, 197, 94, 0.82);
  border-radius: 2.9rem;
  transform: rotate(-1.45deg);
  box-shadow:
    0 0 0 1px rgba(34, 197, 94, 0.08),
    0 0 120px rgba(34, 197, 94, 0.08);
  opacity: 0.92;
  pointer-events: none;
}
.lube-frame::before {
  content: "";
  position: absolute;
  inset: 28% 42% -18% -8%;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.14), transparent 70%);
  filter: blur(32px);
}
.lube-frame__node {
  position: absolute;
  top: 5.35rem;
  right: 2rem;
  width: 6rem;
  height: 6rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(34, 197, 94, 0.88);
  background:
    radial-gradient(circle at 50% 42%, rgba(34, 197, 94, 0.08), transparent 68%),
    rgba(7, 12, 14, 0.86);
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  color: rgba(74, 222, 128, 0.96);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  z-index: 2;
  pointer-events: none;
}
.lube-overline {
  margin: 0 0 0.75rem;
  color: rgba(74, 222, 128, 0.92);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.lube-overline--muted {
  color: rgba(194, 206, 214, 0.62);
}
.lube-title {
  margin: 0;
  font-size: clamp(2.6rem, 5vw, 4.8rem);
  line-height: 0.94;
  letter-spacing: -0.055em;
  font-weight: 700;
  color: white;
  text-shadow: 0 10px 34px rgba(0, 0, 0, 0.42);
}
.lube-subtitle {
  max-width: 40rem;
  margin: 1rem 0 0;
  color: rgba(221, 229, 234, 0.78);
  font-size: 1rem;
  line-height: 1.75;
}
.lube-copy {
  color: rgba(214, 223, 228, 0.72);
  line-height: 1.68;
}
.lube-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(19rem, 0.82fr);
  gap: 1.15rem;
  margin-bottom: 1.5rem;
}
.lube-panel,
.lube-command-bar,
.lube-metric,
.lube-ledger,
.lube-mobile-card,
.lube-modal {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    var(--lube-surface);
  border: 1px solid var(--lube-border);
  border-radius: 1.8rem;
  box-shadow: var(--lube-shadow), var(--lube-highlight);
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);
  isolation: isolate;
}
.lube-panel--strong,
.lube-ledger,
.lube-mobile-card,
.lube-modal {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02)),
    var(--lube-surface-strong);
}
.lube-hero-copy {
  min-height: 22rem;
  padding: 1.7rem;
}
.lube-hero-copy::after {
  content: "";
  position: absolute;
  inset: auto auto -7rem -6rem;
  width: 18rem;
  height: 18rem;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.2), transparent 72%);
  filter: blur(28px);
  pointer-events: none;
}
.lube-hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.35rem;
}
.lube-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.35rem;
}
.lube-hero-side {
  display: grid;
  gap: 1rem;
  min-height: 22rem;
  padding: 1.35rem;
}
.lube-spotlight {
  display: grid;
  gap: 0.45rem;
}
.lube-spotlight__label {
  color: rgba(74, 222, 128, 0.9);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.lube-spotlight__value {
  font-size: clamp(2.3rem, 4vw, 3.35rem);
  line-height: 0.96;
  letter-spacing: -0.05em;
  font-weight: 700;
  color: white;
}
.lube-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}
.lube-mini-card {
  padding: 0.9rem 0.95rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}
.lube-mini-card__label {
  display: block;
  color: rgba(189, 202, 209, 0.7);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.lube-mini-card__value {
  display: block;
  margin-top: 0.45rem;
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
}
.lube-cadence {
  display: grid;
  gap: 0.75rem;
}
.lube-cadence__row {
  display: grid;
  grid-template-columns: 3.9rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}
.lube-cadence__label {
  color: rgba(210, 219, 224, 0.68);
  font-size: 0.82rem;
}
.lube-cadence__bar {
  height: 0.42rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}
.lube-cadence__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.96), rgba(52, 211, 153, 0.96), rgba(56, 189, 248, 0.9));
  box-shadow: 0 0 18px rgba(34, 197, 94, 0.22);
}
.lube-cadence__value {
  color: rgba(239, 242, 245, 0.9);
  font-size: 0.84rem;
  font-weight: 600;
}
.lube-signal-list {
  display: grid;
  gap: 0.95rem;
}
.lube-signal {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.9rem;
  padding-top: 0.95rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.lube-signal:first-child {
  padding-top: 0;
  border-top: none;
}
.lube-signal__badge {
  width: 3rem;
  height: 3rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(74, 222, 128, 0.92);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.lube-signal__title {
  margin: 0;
  color: white;
  font-size: 1.12rem;
  font-weight: 700;
}
.lube-signal__copy {
  margin: 0.35rem 0 0;
  color: rgba(205, 214, 220, 0.68);
  line-height: 1.6;
}
.lube-chip {
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
.lube-chip--green {
  border-color: rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.12);
  color: #bbf7d0;
}
.lube-chip--blue {
  border-color: rgba(59, 130, 246, 0.22);
  background: rgba(37, 99, 235, 0.14);
  color: #bfdbfe;
}
.lube-chip--amber {
  border-color: rgba(234, 179, 8, 0.24);
  background: rgba(234, 179, 8, 0.12);
  color: #fde68a;
}
.lube-chip--soft {
  color: rgba(220, 226, 231, 0.78);
}
.lube-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.lube-section-title {
  margin: 0.15rem 0 0;
  color: white;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.lube-section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
.lube-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.4rem;
}
.lube-metric {
  padding: 1.25rem 1.25rem 1.15rem;
}
.lube-metric::after {
  content: "";
  position: absolute;
  inset: auto -1.2rem -1.4rem auto;
  width: 7rem;
  height: 7rem;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12), transparent 70%);
  filter: blur(8px);
  opacity: 0.64;
  pointer-events: none;
}
.lube-metric--featured {
  grid-column: span 2;
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.lube-metric__label {
  display: block;
  color: var(--lube-muted);
  font-size: 0.88rem;
}
.lube-metric__value {
  display: block;
  margin-top: 0.45rem;
  color: white;
  font-size: clamp(1.24rem, 2.5vw, 1.8rem);
  font-weight: 700;
}
.lube-metric--featured .lube-metric__value {
  font-size: clamp(2rem, 3.5vw, 2.9rem);
}
.lube-metric__meta {
  display: block;
  margin-top: 0.75rem;
  color: rgba(212, 221, 226, 0.66);
  font-size: 0.82rem;
  line-height: 1.55;
}
.lube-metric--green {
  box-shadow:
    0 28px 72px rgba(34, 197, 94, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}
.lube-metric--blue {
  box-shadow:
    0 28px 72px rgba(37, 99, 235, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}
.lube-metric--amber {
  box-shadow:
    0 28px 72px rgba(234, 179, 8, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}
.lube-metric--red {
  box-shadow:
    0 28px 72px rgba(239, 68, 68, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}
.lube-command-bar {
  margin-bottom: 1.35rem;
  padding: 1rem;
}
.lube-command-bar__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(11rem, 0.9fr) minmax(10rem, 0.9fr) auto auto;
  gap: 0.85rem;
}
.lube-mobile-tools {
  display: none;
}
.lube-mobile-filter {
  display: grid;
  gap: 0.85rem;
  margin-top: 0.85rem;
  padding: 1rem;
}
.lube-input {
  width: 100%;
  min-height: 3rem;
  padding: 0.88rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--lube-text);
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.lube-input:focus {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 0 3px rgba(34, 197, 94, 0.12);
}
.lube-input::placeholder {
  color: rgba(197, 207, 213, 0.48);
}
.lube-input option {
  background: #081011;
  color: white;
}
.lube-input::-webkit-calendar-picker-indicator {
  filter: invert(1) opacity(0.74);
}
.lube-button {
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
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
  overflow: hidden;
}
.lube-button::before {
  content: "";
  position: absolute;
  inset: 1px 1px auto 1px;
  height: 52%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent);
  opacity: 0.62;
  pointer-events: none;
}
.lube-button:hover {
  transform: translateY(-1px);
}
.lube-button--green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.96), rgba(16, 185, 129, 0.95));
  box-shadow:
    0 18px 36px rgba(34, 197, 94, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
.lube-button--blue {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.96), rgba(56, 189, 248, 0.95));
  box-shadow:
    0 18px 36px rgba(37, 99, 235, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}
.lube-button--amber {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.96), rgba(217, 119, 6, 0.95));
  box-shadow:
    0 18px 36px rgba(234, 179, 8, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}
.lube-button--red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.96), rgba(225, 29, 72, 0.95));
  box-shadow:
    0 18px 36px rgba(239, 68, 68, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}
.lube-button--ghost {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 12px 24px rgba(0, 0, 0, 0.22);
}
.lube-button--danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(225, 29, 72, 0.2));
  border-color: rgba(248, 113, 113, 0.2);
  color: #fecaca;
}
.lube-button--row {
  min-height: 2.35rem;
  padding: 0.55rem 0.95rem;
}
.lube-button--full {
  width: 100%;
}
.lube-ledger {
  overflow: hidden;
  margin-bottom: 1.4rem;
}
.lube-ledger__scroll {
  overflow-x: auto;
}
.lube-ledger table {
  width: 100%;
  border-collapse: collapse;
}
.lube-ledger thead {
  background: linear-gradient(180deg, rgba(12, 21, 17, 0.96), rgba(8, 13, 14, 0.92));
}
.lube-ledger th {
  padding: 1rem;
  color: rgba(212, 224, 230, 0.78);
  font-size: 0.8rem;
  font-weight: 700;
  text-align: left;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.lube-ledger td {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(237, 241, 244, 0.88);
}
.lube-ledger tbody tr {
  transition: background-color 0.2s ease;
}
.lube-ledger tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}
.lube-ledger__money {
  color: #bbf7d0;
  font-weight: 700;
}
.lube-ledger__total {
  color: #86efac;
  font-weight: 700;
}
.lube-ledger__actions {
  display: flex;
  gap: 0.65rem;
}
.lube-ledger__chip {
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
.lube-ledger__chip--product {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.18);
  color: #bbf7d0;
}
.lube-ledger__chip--stock {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.18);
  color: #bbf7d0;
}
.lube-ledger__chip--low {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}
.lube-ledger__chip--seller {
  background: rgba(37, 99, 235, 0.12);
  border-color: rgba(37, 99, 235, 0.18);
  color: #bfdbfe;
}
.lube-mobile-list,
.lube-mobile-stock {
  display: none;
}
.lube-mobile-card {
  padding: 1rem;
}
.lube-mobile-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}
.lube-mobile-card__title {
  margin: 0;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
}
.lube-mobile-card__value {
  margin: 0;
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
}
.lube-mobile-card__date {
  margin: 0.3rem 0 0;
  color: var(--lube-muted);
  font-size: 0.82rem;
}
.lube-mobile-card__copy {
  margin: 0.9rem 0 0;
  color: rgba(227, 234, 238, 0.82);
  line-height: 1.62;
}
.lube-mobile-card__extra {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease, margin-top 0.28s ease;
}
.lube-mobile-card__extra--open {
  grid-template-rows: 1fr;
  margin-top: 0.95rem;
}
.lube-mobile-card__extra-wrap {
  overflow: hidden;
}
.lube-mobile-card__extra-inner {
  padding-top: 0.95rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.lube-mobile-card__meta {
  display: grid;
  gap: 0.55rem;
  color: rgba(216, 224, 230, 0.78);
  font-size: 0.92rem;
}
.lube-mobile-card__meta strong {
  color: white;
}
.lube-mobile-card__actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 1rem;
}
.lube-mobile-card__actions .lube-button {
  flex: 1;
}
.lube-empty {
  padding: 1.15rem 1.2rem;
  text-align: center;
  color: rgba(201, 209, 214, 0.74);
}
.lube-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.lube-modal {
  width: min(100%, 27rem);
  padding: 1.35rem;
}
.lube-modal--wide {
  width: min(100%, 28rem);
}
.lube-modal__head {
  margin-bottom: 1rem;
}
.lube-modal__title {
  margin: 0;
  color: white;
  font-size: 1.28rem;
  font-weight: 700;
}
.lube-modal__copy {
  margin: 0.45rem 0 0;
  color: rgba(214, 220, 226, 0.68);
  line-height: 1.64;
}
.lube-modal__body {
  display: grid;
  gap: 0.85rem;
}
.lube-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
.lube-total-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(34, 197, 94, 0.12);
  background: rgba(34, 197, 94, 0.08);
}
.lube-total-preview__label {
  color: rgba(214, 223, 229, 0.74);
  font-size: 0.86rem;
}
.lube-total-preview__value {
  color: white;
  font-size: 1.15rem;
  font-weight: 700;
}
.lube-fab {
  position: fixed;
  right: 1.1rem;
  bottom: 1.1rem;
  z-index: 45;
  display: none;
}
.lube-fab__trigger {
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(34, 197, 94, 0.22);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.98), rgba(16, 185, 129, 0.96));
  box-shadow: 0 18px 32px rgba(34, 197, 94, 0.22);
  color: white;
  font-size: 1.7rem;
  font-weight: 600;
}
.lube-fab__menu {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
}
.lube-tilt {
  --tilt-rx: 0deg;
  --tilt-ry: 0deg;
  --tilt-scale: 1;
  --tilt-lift: 0px;
  --tilt-inner-x: 0px;
  --tilt-inner-y: 0px;
  --tilt-pointer-x: 50%;
  --tilt-pointer-y: 50%;
  transform-style: preserve-3d;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease, filter 0.22s ease;
  transform:
    perspective(1500px)
    rotateX(var(--tilt-rx))
    rotateY(var(--tilt-ry))
    translateY(var(--tilt-lift))
    scale(var(--tilt-scale));
}
.lube-tilt::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at var(--tilt-pointer-x) var(--tilt-pointer-y), rgba(255, 255, 255, 0.09), transparent 36%),
    radial-gradient(circle at var(--tilt-pointer-x) var(--tilt-pointer-y), rgba(34, 197, 94, 0.08), transparent 56%);
  opacity: 0;
  transition: opacity 0.22s ease;
  pointer-events: none;
}
.lube-tilt--interactive:hover {
  will-change: transform;
  border-color: rgba(34, 197, 94, 0.18);
  box-shadow:
    0 34px 100px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 0 0 1px rgba(34, 197, 94, 0.06);
  filter: drop-shadow(0 22px 34px rgba(0, 0, 0, 0.18));
}
.lube-tilt--interactive:hover::after {
  opacity: 1;
}
.lube-tilt__inner {
  position: relative;
  z-index: 1;
  height: 100%;
  transform: translate(var(--tilt-inner-x), var(--tilt-inner-y));
  transition: transform 0.22s ease;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
@supports not ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {
  .lube-panel,
  .lube-command-bar,
  .lube-metric,
  .lube-ledger,
  .lube-mobile-card,
  .lube-modal {
    background: rgba(11, 15, 16, 0.94);
  }
}
@media (max-width: 1120px) {
  .lube-frame,
  .lube-frame__node {
    display: none;
  }
  .lube-hero {
    grid-template-columns: 1fr;
  }
  .lube-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lube-metric--featured {
    grid-column: span 2;
  }
  .lube-command-bar__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 639px) {
  .lube-shell {
    padding-inline: 0.9rem;
  }
  .lube-title {
    font-size: 3rem;
  }
  .lube-subtitle {
    font-size: 0.96rem;
  }
  .lube-hero-copy,
  .lube-hero-side {
    min-height: auto;
    padding: 1.15rem;
  }
  .lube-mini-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lube-cadence__row {
    grid-template-columns: 3.2rem minmax(0, 1fr);
  }
  .lube-cadence__value {
    display: none;
  }
  .lube-metrics {
    grid-template-columns: 1fr;
  }
  .lube-metric--featured {
    grid-column: span 1;
  }
  .lube-command-bar {
    display: none;
  }
  .lube-mobile-tools {
    display: grid;
    gap: 0.85rem;
    margin-bottom: 1.15rem;
  }
  .lube-section-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .lube-ledger {
    display: none;
  }
  .lube-mobile-stock,
  .lube-mobile-list {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.35rem;
  }
  .lube-mobile-card__actions {
    flex-direction: column;
  }
  .lube-modal__actions {
    flex-direction: column-reverse;
  }
  .lube-modal__actions .lube-button {
    width: 100%;
  }
  .lube-fab {
    display: block;
  }
}
`
const RUPEE = "\u20B9"
const formatter = new Intl.NumberFormat("en-IN")
const initialSaleForm = {
  date: "",
  product: "",
  price: "",
  quantity: "",
  soldBy: "Admin",
}
const initialProductForm = {
  name: "",
  price: "",
  stock: "",
}
const initialPurgeForm = {
  month: "",
  year: "",
}
const formatCurrency = (value) => `${RUPEE}${formatter.format(Number(value || 0))}`
const formatDateLabel = (value) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value || "-"
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
const normalizeText = (value) => String(value || "").toLowerCase()
const getLocalDateValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
function TiltPanel({ enabled, className = "", children, strength = 10, ...props }) {
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
      innerX: centeredX * strength * 0.52,
      innerY: centeredY * strength * 0.52,
      pointerX: px,
      pointerY: py,
      scale: 1.006,
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
      className={`lube-tilt ${enabled ? "lube-tilt--interactive" : ""} ${className}`}
      onMouseMove={enabled ? handleMove : undefined}
      onMouseLeave={enabled ? handleLeave : undefined}
      {...props}
    >
      <div className="lube-tilt__inner">{children}</div>
    </div>
  )
}
export default function Lubricants() {
  const [data, setData] = useState([])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [open, setOpen] = useState(false)
  const [productModal, setProductModal] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [purgeOpen, setPurgeOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [openCard, setOpenCard] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const [tiltEnabled, setTiltEnabled] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reportProduct, setReportProduct] = useState("")
  const [format, setFormat] = useState("pdf")
  const [form, setForm] = useState(initialSaleForm)
  const [productForm, setProductForm] = useState(initialProductForm)
  const [purgeForm, setPurgeForm] = useState(initialPurgeForm)
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
  const loadSales = async () => {
    const res = await getLubricants()
    setData(res)
  }
  const loadProducts = async () => {
    const res = await getProducts()
    setProducts(res)
  }
  useEffect(() => {
    loadSales()
    loadProducts()
  }, [])
  const closeSaleModal = () => {
    setOpen(false)
    setEdit(null)
    setForm(initialSaleForm)
  }
  const closeProductModal = () => {
    setProductModal(false)
    setProductForm(initialProductForm)
  }
  const closePurgeModal = () => {
    setPurgeOpen(false)
    setPurgeForm(initialPurgeForm)
  }
  const openNewSale = () => {
    setEdit(null)
    setForm(initialSaleForm)
    setOpen(true)
    setFabOpen(false)
  }
  const openEditSale = (entry) => {
    setEdit(entry)
    setForm({
      date: entry.date || "",
      product: entry.product || "",
      price: entry.price ?? "",
      quantity: entry.quantity ?? "",
      soldBy: entry.soldBy || "Admin",
    })
    setOpen(true)
  }
  const changeProduct = (name) => {
    const selectedProduct = products.find((product) => product.name === name)
    setForm((current) => ({
      ...current,
      product: name,
      price: selectedProduct?.price ?? "",
    }))
  }
  const save = async () => {
    if (!form.date || !form.product || !form.quantity) {
      alert("Please fill all required sale fields")
      return
    }
    const total = Number(form.price || 0) * Number(form.quantity || 0)
    const payload = {
      ...form,
      price: Number(form.price || 0),
      quantity: Number(form.quantity || 0),
      total,
    }
    if (edit) {
      await updateLubricant(edit._id, payload)
    } else {
      await addLubricant(payload)
    }
    closeSaleModal()
    await Promise.all([loadSales(), loadProducts()])
  }
  const removeSale = async (id) => {
    await deleteLubricant(id)
    await Promise.all([loadSales(), loadProducts()])
  }
  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      alert("Enter product details")
      return
    }
    await addProduct({
      ...productForm,
      price: Number(productForm.price || 0),
      stock: Number(productForm.stock || 0),
    })
    closeProductModal()
    await loadProducts()
  }
  const removeProduct = async (id) => {
    await deleteProduct(id)
    await loadProducts()
  }
  const handleDeleteMonth = async () => {
    if (!purgeForm.month || !purgeForm.year) {
      alert("Enter both month and year")
      return
    }
    await deleteMonth({
      month: purgeForm.month,
      year: purgeForm.year,
    })
    closePurgeModal()
    await Promise.all([loadSales(), loadProducts()])
  }
  const filtered = data.filter((entry) => {
    const productText = normalizeText(entry.product)
    const sellerText = normalizeText(entry.soldBy)
    const query = normalizeText(search)
    return (
      (!query || productText.includes(query) || sellerText.includes(query)) &&
      (!productFilter || entry.product === productFilter) &&
      (!dateFilter || entry.date === dateFilter)
    )
  })
  const today = new Date()
  const todayStr = getLocalDateValue(today)
  let todayTotal = 0
  let weekTotal = 0
  let monthTotal = 0
  let totalAll = 0
  let unitsMoved = 0
  const productRollup = {}
  filtered.forEach((entry) => {
    const parsed = new Date(entry.date)
    const total = Number(entry.total || 0)
    const quantity = Number(entry.quantity || 0)
    totalAll += total
    unitsMoved += quantity
    if (!productRollup[entry.product]) {
      productRollup[entry.product] = { units: 0, revenue: 0 }
    }
    productRollup[entry.product].units += quantity
    productRollup[entry.product].revenue += total
    if (entry.date === todayStr) {
      todayTotal += total
    }
    const diffDays = (today - parsed) / (1000 * 60 * 60 * 24)
    if (diffDays >= 0 && diffDays <= 7) {
      weekTotal += total
    }
    if (parsed.getMonth() === today.getMonth() && parsed.getFullYear() === today.getFullYear()) {
      monthTotal += total
    }
  })
  const productLeaders = Object.entries(productRollup)
  const bestSeller = [...productLeaders].sort((left, right) => right[1].units - left[1].units)[0]
  const topRevenue = [...productLeaders].sort((left, right) => right[1].revenue - left[1].revenue)[0]
  const lowStockProducts = products.filter((product) => Number(product.stock || 0) <= 5)
  const averageTicket = filtered.length ? totalAll / filtered.length : 0
  const activeFilterCount = [search, productFilter, dateFilter].filter(Boolean).length
  const saleTotal = Number(form.price || 0) * Number(form.quantity || 0)
  const paceBase = Math.max(totalAll, todayTotal, weekTotal, monthTotal, 1)
  const summaryCards = [
    {
      label: "Revenue",
      value: formatCurrency(totalAll),
      meta: `${filtered.length} visible sales`,
      accent: "lube-metric--green",
      featured: true,
    },
    {
      label: "Today",
      value: formatCurrency(todayTotal),
      meta: "Current day sales",
      accent: "lube-metric--blue",
    },
    {
      label: "Week",
      value: formatCurrency(weekTotal),
      meta: "Last 7 days",
      accent: "lube-metric--amber",
    },
    {
      label: "Month",
      value: formatCurrency(monthTotal),
      meta: "Current month pace",
      accent: "lube-metric--red",
    },
  ]
  const cadenceRows = [
    { label: "Today", value: todayTotal },
    { label: "Week", value: weekTotal },
    { label: "Month", value: monthTotal },
  ]
  const signalItems = [
    {
      code: "BS",
      title: bestSeller ? bestSeller[0] : "No best seller yet",
      copy: bestSeller
        ? `${bestSeller[1].units} units moved in the filtered view.`
        : "Start recording lubricant sales to surface your top mover.",
    },
    {
      code: "RV",
      title: topRevenue ? formatCurrency(topRevenue[1].revenue) : formatCurrency(0),
      copy: topRevenue
        ? `${topRevenue[0]} is the highest revenue SKU right now.`
        : "Revenue intelligence will appear once sales start flowing in.",
    },
    {
      code: "AL",
      title: `${lowStockProducts.length} low stock SKU${lowStockProducts.length === 1 ? "" : "s"}`,
      copy:
        lowStockProducts.length > 0
          ? lowStockProducts.map((product) => product.name).slice(0, 2).join(", ")
          : "Inventory levels are healthy across all listed products.",
    },
  ]
  const getReportData = () =>
    data.filter((entry) => {
      const parsed = new Date(entry.date)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(`${toDate}T23:59:59`) : null
      return (!from || parsed >= from) && (!to || parsed <= to) && (!reportProduct || entry.product === reportProduct)
    })
  const generatePDF = (reportRows) => {
    const totalRevenue = reportRows.reduce((sum, row) => sum + Number(row.total || 0), 0)
    const totalQuantity = reportRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0)
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Lubricant Sales Report", 14, 16)
    doc.setFontSize(10)
    doc.text(`From: ${fromDate || "All"}   To: ${toDate || "All"}`, 14, 24)
    doc.text(`Product: ${reportProduct || "All"}`, 14, 30)
    doc.text(`Total Records: ${reportRows.length}`, 14, 36)
    doc.text(`Revenue: Rs. ${totalRevenue}`, 120, 24)
    doc.text(`Units Sold: ${totalQuantity}`, 120, 30)
    autoTable(doc, {
      startY: 44,
      head: [["Date", "Product", "Qty", "Price", "Total", "Sold By"]],
      body: reportRows.map((entry) => [
        formatDateLabel(entry.date),
        entry.product,
        entry.quantity,
        entry.price,
        entry.total,
        entry.soldBy,
      ]),
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [244, 247, 245],
      },
    })
    doc.save("Lubricant_Report.pdf")
  }
  const generateExcel = (reportRows) => {
    const reportRevenue = reportRows.reduce((sum, row) => sum + Number(row.total || 0), 0)
    const reportUnits = reportRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0)
    const reportSkuCount = new Set(reportRows.map((row) => row.product)).size
    const summarySheetRows = [
      {
        Revenue: reportRevenue,
        Units_Moved: reportUnits,
        Active_SKUs: reportSkuCount,
        Low_Stock_SKUs: lowStockProducts.length,
        Report_Product_Filter: reportProduct || "All",
        Report_From: fromDate || "All",
        Report_To: toDate || "All",
      },
    ]
    const formatted = reportRows.map((entry, index) => ({
      ID: index + 1,
      Date: entry.date,
      Product: entry.product,
      Quantity: entry.quantity,
      Price: entry.price,
      Total: entry.total,
      Sold_By: entry.soldBy,
    }))
    const workbook = XLSX.utils.book_new()
    const reportSheet = XLSX.utils.json_to_sheet(formatted)
    const summarySheet = XLSX.utils.json_to_sheet(summarySheetRows)
    XLSX.utils.book_append_sheet(workbook, reportSheet, "Sales")
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")
    XLSX.writeFile(workbook, "Lubricant_Report.xlsx")
  }
  const handleGenerate = () => {
    const reportRows = getReportData()
    if (reportRows.length === 0) {
      alert("No data found")
      return
    }
    if (format === "pdf") {
      generatePDF(reportRows)
    } else {
      generateExcel(reportRows)
    }
    setReportOpen(false)
  }
  return (
    <>
      <style>{pageStyles}</style>
      <div className="lube-page">
        <div className="lube-orb lube-orb--green" />
        <div className="lube-orb lube-orb--teal" />
        <div className="lube-orb lube-orb--sky" />
        <div className="lube-shell">
          <div className="lube-frame" />
          {/* <div className="lube-frame__node">UP</div> */}
          <div className="lube-hero">
            <TiltPanel enabled={tiltEnabled} strength={7} className="lube-panel lube-hero-copy">
              <p className="lube-overline">Lubricant Intelligence</p>
              <h1 className="lube-title">Lubricant Sales</h1>
              <p className="lube-subtitle">
                A sharper control room for lubricant revenue, SKU movement, and shelf pressure with the same
                premium motion language as your Expenses dashboard, tuned in a darker green performance palette.
              </p>
              <div className="lube-hero-tags">
                <span className="lube-chip lube-chip--green">Revenue {formatCurrency(totalAll)}</span>
                <span className="lube-chip lube-chip--blue">{unitsMoved} units moved</span>
                <span className="lube-chip lube-chip--soft">
                  {activeFilterCount ? `${activeFilterCount} filters active` : "All lubricant sales live"}
                </span>
                <span className="lube-chip lube-chip--amber">
                  {bestSeller ? `${bestSeller[0]} leading` : "Best seller waiting"}
                </span>
              </div>
              <div className="lube-hero-actions">
                <button className="lube-button lube-button--green" onClick={openNewSale}>
                  + Add Sale
                </button>
                <button
                  className="lube-button lube-button--blue"
                  onClick={() => {
                    setProductModal(true)
                    setFabOpen(false)
                  }}
                >
                  + Add Product
                </button>
                <button
                  className="lube-button lube-button--amber"
                  onClick={() => {
                    setPurgeOpen(true)
                    setFabOpen(false)
                  }}
                >
                  Delete Month
                </button>
              </div>
            </TiltPanel>
            <TiltPanel enabled={tiltEnabled} strength={9} className="lube-panel lube-hero-side">
              <div className="lube-spotlight">
                <span className="lube-overline lube-overline--muted">Revenue Pulse</span>
                <strong className="lube-spotlight__value">{formatCurrency(totalAll)}</strong>
                <p className="lube-copy">
                  Filtered lubricant revenue with inventory pressure and product momentum in one premium rail.
                </p>
              </div>
              <div className="lube-mini-grid">
                <div className="lube-mini-card">
                  <span className="lube-mini-card__label">Today</span>
                  <strong className="lube-mini-card__value">{formatCurrency(todayTotal)}</strong>
                </div>
                <div className="lube-mini-card">
                  <span className="lube-mini-card__label">Month</span>
                  <strong className="lube-mini-card__value">{formatCurrency(monthTotal)}</strong>
                </div>
                <div className="lube-mini-card">
                  <span className="lube-mini-card__label">Active SKU</span>
                  <strong className="lube-mini-card__value">{products.length}</strong>
                </div>
                <div className="lube-mini-card">
                  <span className="lube-mini-card__label">Low Stock</span>
                  <strong className="lube-mini-card__value">{lowStockProducts.length}</strong>
                </div>
              </div>
              <div className="lube-cadence">
                {cadenceRows.map((row) => (
                  <div key={row.label} className="lube-cadence__row">
                    <span className="lube-cadence__label">{row.label}</span>
                    <div className="lube-cadence__bar">
                      <div
                        className="lube-cadence__fill"
                        style={{ width: `${row.value > 0 ? Math.max(10, (row.value / paceBase) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="lube-cadence__value">{formatCurrency(row.value)}</span>
                  </div>
                ))}
              </div>
              <div className="lube-signal-list">
                {signalItems.map((signal) => (
                  <div key={signal.code} className="lube-signal">
                    <div className="lube-signal__badge">{signal.code}</div>
                    <div>
                      <p className="lube-signal__title">{signal.title}</p>
                      <p className="lube-signal__copy">{signal.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TiltPanel>
          </div>
          <div className="lube-section-head">
            <div>
              <p className="lube-overline">Snapshot</p>
              <h2 className="lube-section-title">Premium lubricant overview</h2>
            </div>
            <div className="lube-section-badge">Average ticket {formatCurrency(averageTicket)}</div>
          </div>
          <div className="lube-metrics">
            {summaryCards.map((card, index) => (
              <TiltPanel
                key={card.label}
                enabled={tiltEnabled}
                strength={index === 0 ? 7 : 5}
                className={`lube-metric ${card.accent} ${card.featured ? "lube-metric--featured" : ""}`}
              >
                <span className="lube-metric__label">{card.label}</span>
                <strong className="lube-metric__value">{card.value}</strong>
                <span className="lube-metric__meta">{card.meta}</span>
              </TiltPanel>
            ))}
          </div>
          <div className="lube-section-head">
            <div>
              <p className="lube-overline">Inventory Shelf</p>
              <h2 className="lube-section-title">Product stock intelligence</h2>
            </div>
            <div className="lube-section-badge">{products.length} active products</div>
          </div>
          <div className="lube-ledger">
            <div className="lube-ledger__scroll">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const isLowStock = Number(product.stock || 0) <= 5
                    return (
                      <tr key={product._id}>
                        <td>
                          <span className="lube-ledger__chip lube-ledger__chip--product">{product.name}</span>
                        </td>
                        <td className="lube-ledger__money">{formatCurrency(product.price)}</td>
                        <td>
                          <span
                            className={`lube-ledger__chip ${
                              isLowStock ? "lube-ledger__chip--low" : "lube-ledger__chip--stock"
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td>
                          <div className="lube-ledger__actions">
                            <button
                              className="lube-button lube-button--danger lube-button--row"
                              onClick={() => removeProduct(product._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="lube-mobile-stock">
            {products.map((product) => {
              const isLowStock = Number(product.stock || 0) <= 5
              return (
                <div key={product._id} className="lube-mobile-card">
                  <div className="lube-mobile-card__top">
                    <div>
                      <p className="lube-mobile-card__title">{product.name}</p>
                      <p className="lube-mobile-card__date">{formatCurrency(product.price)}</p>
                    </div>
                    <span
                      className={`lube-ledger__chip ${isLowStock ? "lube-ledger__chip--low" : "lube-ledger__chip--stock"}`}
                    >
                      Stock {product.stock}
                    </span>
                  </div>
                  <p className="lube-mobile-card__copy">
                    {isLowStock
                      ? "Inventory pressure is building on this SKU. Consider replenishing stock soon."
                      : "Healthy shelf coverage with stable available stock."}
                  </p>
                  <div className="lube-mobile-card__actions">
                    <button
                      className="lube-button lube-button--danger lube-button--row"
                      onClick={() => removeProduct(product._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="lube-section-head">
            <div>
              <p className="lube-overline">Command Deck</p>
              <h2 className="lube-section-title">Search, filter, and export sales</h2>
            </div>
            <div className="lube-section-badge">{activeFilterCount || 0} active filters</div>
          </div>
          <TiltPanel enabled={tiltEnabled} strength={5} className="lube-command-bar">
            <div className="lube-command-bar__grid">
              <input
                placeholder="Search product or seller..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="lube-input"
              />
              <select
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value)}
                className="lube-input"
              >
                <option value="">All Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product.name}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="lube-input"
              />
              <button
                className="lube-button lube-button--ghost"
                onClick={() => {
                  setSearch("")
                  setProductFilter("")
                  setDateFilter("")
                }}
              >
                Clear
              </button>
              <button className="lube-button lube-button--blue" onClick={() => setReportOpen(true)}>
                Generate Report
              </button>
            </div>
          </TiltPanel>
          <div className="lube-mobile-tools">
            <input
              placeholder="Search product or seller..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="lube-input"
            />
            <div className="lube-mobile-card__actions" style={{ marginTop: 0 }}>
              <button className="lube-button lube-button--ghost" onClick={() => setShowFilter((value) => !value)}>
                {showFilter ? "Hide Filters" : "Filters"}
              </button>
              <button className="lube-button lube-button--blue" onClick={() => setReportOpen(true)}>
                Report
              </button>
            </div>
            {showFilter && (
              <div className="lube-panel lube-mobile-filter">
                <select
                  value={productFilter}
                  onChange={(event) => setProductFilter(event.target.value)}
                  className="lube-input"
                >
                  <option value="">All Product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="lube-input"
                />
                <button
                  className="lube-button lube-button--ghost"
                  onClick={() => {
                    setSearch("")
                    setProductFilter("")
                    setDateFilter("")
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
          <div className="lube-section-head">
            <div>
              <p className="lube-overline">Ledger</p>
              <h2 className="lube-section-title">Lubricant sales activity</h2>
            </div>
            <div className="lube-section-badge">{filtered.length} rows in view</div>
          </div>
          <div className="lube-ledger">
            <div className="lube-ledger__scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Sold By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry._id}>
                      <td>{formatDateLabel(entry.date)}</td>
                      <td>
                        <span className="lube-ledger__chip lube-ledger__chip--product">{entry.product}</span>
                      </td>
                      <td>{entry.quantity}</td>
                      <td className="lube-ledger__money">{formatCurrency(entry.price)}</td>
                      <td className="lube-ledger__total">{formatCurrency(entry.total)}</td>
                      <td>
                        <span className="lube-ledger__chip lube-ledger__chip--seller">{entry.soldBy}</span>
                      </td>
                      <td>
                        <div className="lube-ledger__actions">
                          <button
                            className="lube-button lube-button--ghost lube-button--row"
                            onClick={() => openEditSale(entry)}
                          >
                            Edit
                          </button>
                          <button
                            className="lube-button lube-button--danger lube-button--row"
                            onClick={() => removeSale(entry._id)}
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
          <div className="lube-mobile-list">
            {filtered.map((entry) => {
              const isOpen = openCard === entry._id
              return (
                <div key={entry._id} className="lube-mobile-card" onClick={() => setOpenCard(isOpen ? null : entry._id)}>
                  <div className="lube-mobile-card__top">
                    <div>
                      <p className="lube-mobile-card__title">{entry.product}</p>
                      <p className="lube-mobile-card__date">{formatDateLabel(entry.date)}</p>
                    </div>
                    <p className="lube-mobile-card__value">{formatCurrency(entry.total)}</p>
                  </div>
                  <p className="lube-mobile-card__copy">
                    {entry.quantity} units sold at {formatCurrency(entry.price)} each.
                  </p>
                  <div className={`lube-mobile-card__extra ${isOpen ? "lube-mobile-card__extra--open" : ""}`}>
                    <div className="lube-mobile-card__extra-wrap">
                      <div className="lube-mobile-card__extra-inner">
                        <div className="lube-mobile-card__meta">
                          <span>
                            Sold By: <strong>{entry.soldBy}</strong>
                          </span>
                          <span>
                            Product: <strong>{entry.product}</strong>
                          </span>
                        </div>
                        <div className="lube-mobile-card__actions">
                          <button
                            className="lube-button lube-button--ghost lube-button--row"
                            onClick={(event) => {
                              event.stopPropagation()
                              openEditSale(entry)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="lube-button lube-button--danger lube-button--row"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeSale(entry._id)
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
            <div className="lube-panel lube-empty">
              No lubricant sales matched the current filters.
            </div>
          )}
        </div>
        {open && (
          <div className="lube-modal-backdrop">
            <TiltPanel enabled={tiltEnabled} strength={5} className="lube-modal lube-modal--wide">
              <div className="lube-modal__head">
                <h2 className="lube-modal__title">{edit ? "Edit lubricant sale" : "Add lubricant sale"}</h2>
                <p className="lube-modal__copy">
                  Build a cleaner sale record with live total preview and auto-filled pricing from the selected
                  product.
                </p>
              </div>
              <div className="lube-modal__body">
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  className="lube-input"
                />
                <select value={form.product} onChange={(event) => changeProduct(event.target.value)} className="lube-input">
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Price"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  className="lube-input"
                />
                <input
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                  className="lube-input"
                />
                <select
                  value={form.soldBy}
                  onChange={(event) => setForm((current) => ({ ...current, soldBy: event.target.value }))}
                  className="lube-input"
                >
                  <option>Admin</option>
                  <option>Rohit</option>
                  <option>Manager</option>
                </select>
                <div className="lube-total-preview">
                  <span className="lube-total-preview__label">Projected total</span>
                  <strong className="lube-total-preview__value">{formatCurrency(saleTotal)}</strong>
                </div>
              </div>
              <div className="lube-modal__actions">
                <button className="lube-button lube-button--ghost" onClick={closeSaleModal}>
                  Cancel
                </button>
                <button className="lube-button lube-button--green" onClick={save}>
                  Save Sale
                </button>
              </div>
            </TiltPanel>
          </div>
        )}
        {productModal && (
          <div className="lube-modal-backdrop">
            <TiltPanel enabled={tiltEnabled} strength={5} className="lube-modal">
              <div className="lube-modal__head">
                <h2 className="lube-modal__title">Add product</h2>
                <p className="lube-modal__copy">
                  Create a fresh lubricant SKU with pricing and available stock ready for immediate sale entry.
                </p>
              </div>
              <div className="lube-modal__body">
                <input
                  placeholder="Product Name"
                  value={productForm.name}
                  onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                  className="lube-input"
                />
                <input
                  placeholder="Price"
                  value={productForm.price}
                  onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                  className="lube-input"
                />
                <input
                  placeholder="Stock"
                  value={productForm.stock}
                  onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
                  className="lube-input"
                />
              </div>
              <div className="lube-modal__actions">
                <button className="lube-button lube-button--ghost" onClick={closeProductModal}>
                  Cancel
                </button>
                <button className="lube-button lube-button--blue" onClick={saveProduct}>
                  Save Product
                </button>
              </div>
            </TiltPanel>
          </div>
        )}
        {purgeOpen && (
          <div className="lube-modal-backdrop">
            <TiltPanel enabled={tiltEnabled} strength={5} className="lube-modal">
              <div className="lube-modal__head">
                <h2 className="lube-modal__title">Delete month data</h2>
                <p className="lube-modal__copy">
                  Remove a full month of lubricant sales by entering the month and year explicitly.
                </p>
              </div>
              <div className="lube-modal__body">
                <input
                  placeholder="Month (example 03)"
                  value={purgeForm.month}
                  onChange={(event) => setPurgeForm((current) => ({ ...current, month: event.target.value }))}
                  className="lube-input"
                />
                <input
                  placeholder="Year (example 2026)"
                  value={purgeForm.year}
                  onChange={(event) => setPurgeForm((current) => ({ ...current, year: event.target.value }))}
                  className="lube-input"
                />
              </div>
              <div className="lube-modal__actions">
                <button className="lube-button lube-button--ghost" onClick={closePurgeModal}>
                  Cancel
                </button>
                <button className="lube-button lube-button--amber" onClick={handleDeleteMonth}>
                  Delete Month
                </button>
              </div>
            </TiltPanel>
          </div>
        )}
        {reportOpen && (
          <div className="lube-modal-backdrop">
            <TiltPanel enabled={tiltEnabled} strength={5} className="lube-modal">
              <div className="lube-modal__head">
                <h2 className="lube-modal__title">Generate report</h2>
                <p className="lube-modal__copy">
                  Export filtered lubricant performance as PDF or Excel with the selected product window.
                </p>
              </div>
              <div className="lube-modal__body">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="lube-input"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="lube-input"
                />
                <select
                  value={reportProduct}
                  onChange={(event) => setReportProduct(event.target.value)}
                  className="lube-input"
                >
                  <option value="">All Products</option>
                  {products.map((product) => (
                    <option key={product._id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <select value={format} onChange={(event) => setFormat(event.target.value)} className="lube-input">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
              <div className="lube-modal__actions">
                <button className="lube-button lube-button--ghost" onClick={() => setReportOpen(false)}>
                  Cancel
                </button>
                <button className="lube-button lube-button--green" onClick={handleGenerate}>
                  Download
                </button>
              </div>
            </TiltPanel>
          </div>
        )}
        <div className="lube-fab">
          {fabOpen && (
            <div className="lube-fab__menu">
              <button className="lube-button lube-button--green" onClick={openNewSale}>
                + Sale
              </button>
              <button
                className="lube-button lube-button--blue"
                onClick={() => {
                  setProductModal(true)
                  setFabOpen(false)
                }}
              >
                + Product
              </button>
              <button
                className="lube-button lube-button--amber"
                onClick={() => {
                  setPurgeOpen(true)
                  setFabOpen(false)
                }}
              >
                Delete Month
              </button>
            </div>
          )}
          <button className="lube-fab__trigger" onClick={() => setFabOpen((value) => !value)}>
            +
          </button>
        </div>
      </div>
    </>
  )
}






















// import { useEffect, useState } from "react"
// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"
// import {
// getLubricants,
// getProducts,
// addLubricant,
// updateLubricant,
// deleteLubricant,
// addProduct,
// deleteProduct,
// deleteMonth
// } from "../services/lubricantApi"



// export default function Lubricants(){

// const [data,setData] = useState([])
// const [products,setProducts] = useState([])

// const [search,setSearch] = useState("")
// const [productFilter,setProductFilter] = useState("")
// const [dateFilter,setDateFilter] = useState("")

// const [open,setOpen] = useState(false)
// const [productModal,setProductModal] = useState(false)

// const [edit,setEdit] = useState(null)
// const [reportOpen,setReportOpen] = useState(false)
// const [fromDate,setFromDate] = useState("")
// const [toDate,setToDate] = useState("")
// const [reportProduct,setReportProduct] = useState("")
// const [format,setFormat] = useState("pdf")

// const [form,setForm] = useState({

// date:"",
// product:"",
// price:"",
// quantity:"",
// soldBy:"Admin"

// })

// const [productForm,setProductForm] = useState({

// name:"",
// price:"",
// stock:""

// })

// const [openCard,setOpenCard] = useState(null)
// const [showFilter,setShowFilter] = useState(false)
// const [fabOpen,setFabOpen] = useState(false)




// const getReportData = ()=>{

// return data.filter(e=>{

// const d = new Date(e.date)

// return (

// (!fromDate || d >= new Date(fromDate)) &&
// (!toDate || d <= new Date(toDate)) &&
// (!reportProduct || e.product === reportProduct)

// )

// })

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

// const generatePDF = (filteredData)=>{

// const doc = new jsPDF()

// doc.setFontSize(16)
// doc.text("Lubricant Sales Report",14,15)

// doc.setFontSize(10)
// doc.text(`From: ${fromDate || "All"} To: ${toDate || "All"}`,14,22)

// doc.text(`Product: ${reportProduct || "All"}`,14,28)

// doc.text(`Total Records: ${filteredData.length}`,14,34)

// autoTable(doc,{
// startY:40,
// head:[["Date","Product","Qty","Price","Total","Sold By"]],
// body:filteredData.map(e=>[
// e.date,
// e.product,
// e.quantity,
// e.price,
// e.total,
// e.soldBy
// ]),
// styles:{fontSize:8},
// headStyles:{fillColor:[22,163,74]}
// })

// doc.save("Lubricant_Report.pdf")

// }

// const generateExcel = (filteredData)=>{

// const formatted = filteredData.map((e,i)=>({
// ID:i+1,
// Date:e.date,
// Product:e.product,
// Qty:e.quantity,
// Price:e.price,
// Total:e.total,
// Sold_By:e.soldBy
// }))

// const ws = XLSX.utils.json_to_sheet(formatted)

// const wb = XLSX.utils.book_new()
// XLSX.utils.book_append_sheet(wb,ws,"Report")

// XLSX.writeFile(wb,"Lubricant_Report.xlsx")

// }

// /* LOAD SALES */

// const loadSales = async()=>{

// const res = await getLubricants()

// setData(res)

// }



// /* LOAD PRODUCTS */

// const loadProducts = async()=>{

// const res = await getProducts()

// setProducts(res)

// }



// useEffect(()=>{

// loadSales()
// loadProducts()

// },[])



// /* PRODUCT CHANGE */

// const changeProduct = (name)=>{

// const p = products.find(x=>x.name===name)

// setForm({

// ...form,
// product:name,
// price:p?.price || ""

// })

// }



// /* SAVE SALE */

// const save = async()=>{

// if(!form.date || !form.product || !form.quantity){

// alert("Please fill all fields")
// return

// }

// const total = Number(form.price) * Number(form.quantity)

// const payload = {

// ...form,
// price:Number(form.price),
// quantity:Number(form.quantity),
// total

// }

// if(edit){

// await updateLubricant(edit._id,payload)

// }else{

// await addLubricant(payload)

// }

// setOpen(false)
// setEdit(null)

// setForm({

// date:"",
// product:"",
// price:"",
// quantity:"",
// soldBy:"Admin"

// })

// loadSales()
// loadProducts()

// }



// /* DELETE SALE */

// const remove = async(id)=>{

// await deleteLubricant(id)

// loadSales()

// }



// /* ADD PRODUCT */

// const saveProduct = async()=>{

// if(!productForm.name || !productForm.price){

// alert("Enter product details")
// return

// }

// await addProduct({

// ...productForm,
// price:Number(productForm.price),
// stock:Number(productForm.stock)

// })

// setProductModal(false)

// setProductForm({

// name:"",
// price:"",
// stock:""

// })

// loadProducts()

// }



// /* DELETE PRODUCT */

// const removeProduct = async(id)=>{

// await deleteProduct(id)

// loadProducts()

// }



// /* DELETE MONTH DATA */

// const deleteMonthData = async()=>{

// const month = prompt("Enter Month (example 03)")
// const year = prompt("Enter Year (example 2026)")

// if(!month || !year) return

// await deleteMonth({month,year})

// loadSales()

// }



// /* FILTER */

// const filtered = data.filter((e)=>{

// return (

// (!search || e.product.toLowerCase().includes(search.toLowerCase())) &&
// (!productFilter || e.product===productFilter) &&
// (!dateFilter || e.date===dateFilter)

// )

// })


// /* STATS */

// const today = new Date()
// const todayStr = today.toISOString().slice(0,10)

// let todayTotal = 0
// let weekTotal = 0
// let monthTotal = 0
// let totalAll = 0

// filtered.forEach(e=>{

//  const d = new Date(e.date)

//  totalAll += Number(e.total || 0)

//  if(e.date === todayStr){
//   todayTotal += Number(e.total)
//  }

//  const diffDays = (today - d) / (1000*60*60*24)

//  if(diffDays <= 7){
//   weekTotal += Number(e.total)
//  }

//  if(
//   d.getMonth() === today.getMonth() &&
//   d.getFullYear() === today.getFullYear()
//  ){
//   monthTotal += Number(e.total)
//  }

// })


// const total = Number(form.price) * Number(form.quantity) || 0



// return(

// <div className="p-6 text-gray-300">


// {/* HEADER */}

// <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-6">
// <h1 className="text-white text-3xl font-bold">

// Lubricant Sales

// </h1>

// <div className="hidden gap-3 sm:block">

// <button
// onClick={()=>setProductModal(true)}
// className="bg-blue-600 px-4 py-2 rounded text-white mr-2"
// >

// + Add Product

// </button>

// <button
// onClick={deleteMonthData}
// className="bg-yellow-600 px-4 py-2 rounded text-white mr-2"
// >

// Delete Month

// </button>

// <button
// onClick={()=>setOpen(true)}
// className="bg-red-600 px-5 py-2 rounded text-white"
// >

// + Add Sale

// </button>

// </div>

// </div>



// {/* PRODUCT STOCK TABLE */}

// <div className="hidden sm:block bg-[#0B0F17] border border-[#1A1F2E] rounded-xl overflow-hidden mb-6">

// <table className="w-full text-sm">

// <thead className="border-b border-[#1F2937] text-gray-300 font-bold">

// <tr>

// <th className="p-3 text-left ">Product</th>
// <th className="p-3 text-left">Price</th>
// <th className="p-3 text-left">Stock</th>
// <th className="p-3 text-left">Action</th>

// </tr>

// </thead>

// <tbody>

// {products.map((p)=>(

// <tr key={p._id} className="border-b border-[#1F2937]">

// <td className="p-3">{p.name}</td>
// <td className="p-3">₹{p.price}</td>
// <td className="p-3 text-green-500 font-bold">{p.stock}</td>

// <td className="p-3">

// <button
// onClick={()=>removeProduct(p._id)}
// className="text-red-400"
// >

// Delete

// </button>

// </td>

// </tr>

// ))}

// </tbody>

// </table>

// </div>



// {/* STATS */}


// <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-bold">
// <div className="bg-[#0B0F17] border border-[#1A1F2E] p-4 rounded-xl font-bold">

// Today

// <div className="text-white text-xl">

// ₹{todayTotal}

// </div>

// </div>



// <div className="bg-[#0B0F17] border border-[#1A1F2E] p-4 rounded-xl font-bold">

// Week

// <div className="text-white text-xl">

// ₹{weekTotal}

// </div>

// </div>



// <div className="bg-[#0B0F17] border border-[#1A1F2E] p-4 rounded-xl font-bold">

// Month

// <div className="text-white text-xl">

// ₹{monthTotal}

// </div>

// </div>



// <div className="bg-[#0B0F17] border border-[#1A1F2E] p-4 rounded-xl font-bold">

// Total

// <div className="text-white text-xl">

// ₹{totalAll}

// </div>

// </div>

// </div>

// <div className="sm:hidden space-y-4 mb-5">

// {products.map(p=>(

// <div
// key={p._id}
// className="bg-[#0B0F17] border border-[#1A1F2E] rounded-2xl p-4 shadow-md active:scale-[0.98] transition"
// >

// {/* TOP ROW */}
// <div className="flex justify-between items-start">

// {/* LEFT */}
// <div>
// <p className="text-white font-semibold text-lg">
// {p.name}
// </p>

// <p className="text-gray-400 text-sm mt-1">
// ₹{p.price}
// </p>
// </div>

// {/* RIGHT */}
// <div className="flex flex-col items-end gap-2">

// <p className={`text-xs px-3 py-1 rounded-full font-semibold 
// ${p.stock < 5 
// ? "bg-red-500/10 text-red-400 border border-red-500/30" 
// : "bg-green-500/10 text-green-400 border border-green-500/30"
// }`}>
// Stock: {p.stock}
// </p>

// <button
// onClick={()=>removeProduct(p._id)}
// className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg text-xs transition"
// >
// Delete
// </button>

// </div>

// </div>


// </div>

// ))}

// </div>

// {/* FILTER */}

// <div className="flex flex-col gap-3 mb-6">

//   {/* 🔹 TOP ROW */}
//   <div className="flex flex-col sm:flex-row gap-3">

//     {/* SEARCH */}
//     <input
//       placeholder="Search..."
//       value={search}
//       onChange={(e)=>setSearch(e.target.value)}
//       className="bg-[#111827] p-2 rounded w-full sm:w-60 text-sm text-white"
//     />

//     {/* FILTER BUTTON */}
//     <button
//       onClick={()=>setShowFilter(!showFilter)}
//       className="bg-[#1A1F2E] px-3 py-2 rounded text-sm w-full sm:w-auto"
//     >
//       Filters
//     </button>

//     {/* REPORT BUTTON */}
//     <button
//       onClick={()=>setReportOpen(true)}
//       className="bg-purple-600 text-white px-4 py-2 rounded text-sm w-full sm:w-auto"
//     >
//       Generate Report
//     </button>

//   </div>


//   {/* 🔹 FILTER BOX */}
//   {showFilter && (
//     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0B0F17] p-3 rounded border border-[#1F2937]">

//       {/* PRODUCT */}
//       <select
//         value={productFilter}
//         onChange={(e)=>setProductFilter(e.target.value)}
//         className="bg-[#111827] p-2 rounded text-sm text-white"
//       >
//         <option value="">All Product</option>
//         {products.map(p=>(
//           <option key={p._id} value={p.name}>{p.name}</option>
//         ))}
//       </select>

//       {/* DATE */}
//       <input
//         type="date"
//         value={dateFilter}
//         onChange={(e)=>setDateFilter(e.target.value)}
//         className="bg-[#111827] p-2 rounded text-sm text-white 
//         [&::-webkit-calendar-picker-indicator]:invert"
//       />

//       {/* CLEAR BUTTON (NEW 🔥) */}
//       <button
//         onClick={()=>{
//           setProductFilter("")
//           setDateFilter("")
//         }}
//         className="bg-red-500/10 border border-red-500/30 text-red-400 rounded text-sm"
//       >
//         Clear
//       </button>

//     </div>
//   )}

// </div>



// {/* SALES TABLE */}

// <div className="hidden sm:block bg-[#0B0F17] border border-[#1A1F2E] rounded-xl overflow-hidden">

// <table className="w-full text-sm">

// <thead className="border-b border-[#1F2937] text-gray-400">

// <tr>

// <th className="p-3 text-left">Date</th>
// <th className="p-3 text-left">Product</th>
// <th className="p-3 text-left">Qty</th>
// <th className="p-3 text-left">Price</th>
// <th className="p-3 text-left">Total</th>
// <th className="p-3 text-left">Sold By</th>
// <th className="p-3 text-left">Action</th>

// </tr>

// </thead>

// <tbody>

// {filtered.map((e)=>(

// <tr
// key={e._id}
// className="border-b border-[#1F2937]"
// >

// <td className="p-3">{e.date}</td>

// <td className="p-3">{e.product}</td>

// <td className="p-3">{e.quantity}</td>

// <td className="p-3">₹{e.price}</td>

// <td className="p-3 text-red-400">₹{e.total}</td>

// <td className="p-3">{e.soldBy}</td>

// <td className="p-3 flex gap-3">

// <button
// onClick={()=>{
// setEdit(e)
// setForm(e)
// setOpen(true)
// }}
// className="text-blue-400"
// >
// Edit
// </button>

// <button
// onClick={()=>remove(e._id)}
// className="text-red-400"
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
// <p className="text-white font-semibold ml-3">Sales</p>

// {filtered.map(e=>{

// const isOpen = openCard === e._id

// return(

    

// <div
// key={e._id}
// onClick={()=>setOpenCard(isOpen ? null : e._id)}
// className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4 active:scale-95 transition"
// >
   

// {/* TOP */}
// <div className="flex justify-between items-center">

// <div>
// <p className="text-white font-semibold">{e.product}</p>
// <p className="text-xs text-gray-400">{e.date}</p>
// </div>

// <p className="text-red-400 font-bold">₹{e.total}</p>

// </div>

// {/* BASIC */}
// <div className="text-sm text-gray-300 mt-2">
// Qty: {e.quantity}
// </div>

// {/* EXPAND */}
// {isOpen && (

// <div className="mt-3 border-t border-[#1A1F2E] pt-3 space-y-2">

// <p className="text-sm">Price: ₹{e.price}</p>
// <p className="text-sm">Sold by: {e.soldBy}</p>

// <div className="flex gap-2">

// <button
// onClick={(ev)=>{
// ev.stopPropagation()
// setEdit(e)
// setForm(e)
// setOpen(true)
// }}
// className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded"
// >
// Edit
// </button>

// <button
// onClick={(ev)=>{
// ev.stopPropagation()
// remove(e._id)
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



// {/* ADD SALE MODAL */}

// {open &&(

// <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

// <div className="bg-[#0B0F17] border border-[#1A1F2E] p-6 rounded w-[400px]">

// <h2 className="text-white mb-4">

// {edit ? "Edit Lubricant Sale" : "Add Lubricant Sale"}

// </h2>



// <input
// type="date"
// value={form.date}
// onChange={(e)=>setForm({...form,date:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827] rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
// />



// <select
// value={form.product}
// onChange={(e)=>changeProduct(e.target.value)}
// className="w-full mb-3 p-2 bg-[#111827] rounded"
// >

// <option value="">Select Product</option>

// {products.map((p)=>(

// <option key={p._id} value={p.name}>
// {p.name}
// </option>

// ))}

// </select>



// <input
// placeholder="Price"
// value={form.price}
// onChange={(e)=>setForm({...form,price:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827] rounded"
// />



// <input
// placeholder="Quantity"
// value={form.quantity}
// onChange={(e)=>setForm({...form,quantity:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827] rounded"
// />



// <select
// value={form.soldBy}
// onChange={(e)=>setForm({...form,soldBy:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827] rounded"
// >

// <option>Admin</option>
// <option>Rohit</option>
// <option>Manager</option>

// </select>



// <div className="text-white mb-4">

// Total: ₹{total}

// </div>



// <div className="flex justify-end gap-3">

// <button
// onClick={()=>{
// setOpen(false)
// setEdit(null)
// }}
// className="bg-gray-700 px-4 py-2 rounded"
// >

// Cancel

// </button>

// <button
// onClick={save}
// className="bg-red-600 px-4 py-2 rounded text-white"
// >

// Save

// </button>

// </div>

// </div>

// </div>

// )}



// {/* ADD PRODUCT MODAL */}

// {productModal &&(

// <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

// <div className="bg-[#0B0F17] border border-[#1A1F2E] p-6 rounded w-[400px]">

// <h2 className="text-white mb-4">

// Add Product

// </h2>



// <input
// placeholder="Product Name"
// value={productForm.name}
// onChange={(e)=>setProductForm({...productForm,name:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827] rounded"
// />



// <input
// placeholder="Price"
// value={productForm.price}
// onChange={(e)=>setProductForm({...productForm,price:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827] rounded"
// />



// <input
// placeholder="Stock"
// value={productForm.stock}
// onChange={(e)=>setProductForm({...productForm,stock:e.target.value})}
// className="w-full mb-3 p-2 bg-[#111827] rounded"
// />



// <div className="flex justify-end gap-3">

// <button
// onClick={()=>setProductModal(false)}
// className="bg-gray-700 px-4 py-2 rounded"
// >

// Cancel

// </button>

// <button
// onClick={saveProduct}
// className="bg-blue-600 px-4 py-2 rounded text-white"
// >

// Save

// </button>

// </div>

// </div>

// </div>

// )}


// {/* FLOATING BUTTON */}

// <div className="fixed bottom-6 right-6 sm:hidden">

// <button
// onClick={()=>setFabOpen(!fabOpen)}
// className="bg-blue-600 w-14 h-14 rounded-full text-white text-2xl shadow-lg"
// >
// +
// </button>

// {fabOpen && (

// <div className="flex flex-col gap-2 mt-3">

// <button
// onClick={()=>setOpen(true)}
// className="bg-red-600 px-4 py-2 rounded text-white text-sm"
// >
// + Sale
// </button>

// <button
// onClick={()=>setProductModal(true)}
// className="bg-blue-600 px-4 py-2 rounded text-white text-sm"
// >
// + Product
// </button>

// </div>

// )}

// </div>

// {reportOpen && (

// <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

// <div className="bg-[#0B0F17] p-6 rounded-xl w-[340px] text-white">

// <h2 className="text-lg font-semibold mb-4">
// Generate Report
// </h2>

// <div className="flex flex-col gap-3">

// {/* FROM */}
// <input
// type="date"
// value={fromDate}
// onChange={(e)=>setFromDate(e.target.value)}
// className="border p-2 bg-transparent rounded  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// {/* TO */}
// <input
// type="date"
// value={toDate}
// onChange={(e)=>setToDate(e.target.value)}
// className="border p-2 bg-transparent rounded  text-white [&::-webkit-calendar-picker-indicator]:invert"
// />

// {/* PRODUCT FILTER */}
// <select
// value={reportProduct}
// onChange={(e)=>setReportProduct(e.target.value)}
// className="border p-2 rounded bg-[#0B0F17]"
// >
// <option value="">All Products</option>

// {products.map(p=>(
// <option key={p._id} value={p.name}>
// {p.name}
// </option>
// ))}

// </select>

// {/* FORMAT */}
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

// )

// }