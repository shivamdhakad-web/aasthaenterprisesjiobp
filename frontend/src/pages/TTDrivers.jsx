import { useEffect, useRef, useState } from "react"
import { getDrivers, deleteDriver } from "../services/ttDriverApi"
import AddTTDriverModal from "../components/AddTTDriverModal"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

const atlasStyles = String.raw`
:root {
  --atlas-bg: #030403;
  --atlas-ink: rgba(248, 250, 252, 0.98);
  --atlas-muted: rgba(209, 213, 219, 0.68);
  --atlas-soft: rgba(255, 255, 255, 0.08);
  --atlas-line: rgba(255, 255, 255, 0.12);
  --atlas-line-strong: rgba(255, 255, 255, 0.2);
  --atlas-panel: rgba(9, 10, 8, 0.8);
  --atlas-panel-solid: rgba(11, 12, 10, 0.94);
  --atlas-gold: #f8b84e;
  --atlas-amber: #f59e0b;
  --atlas-green: #38d978;
  --atlas-red: #fb7185;
  --atlas-lime: #a3e635;
  --atlas-shadow: 0 30px 100px rgba(0, 0, 0, 0.62);
}

.atlas-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--atlas-ink);
  background:
    radial-gradient(circle at 18% 14%, rgba(248, 184, 78, 0.16), transparent 20%),
    radial-gradient(circle at 86% 8%, rgba(56, 217, 120, 0.1), transparent 18%),
    radial-gradient(circle at 62% 82%, rgba(245, 158, 11, 0.1), transparent 26%),
    linear-gradient(180deg, #020302 0%, #050604 42%, #020302 100%);
  isolation: isolate;
}

.atlas-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: radial-gradient(circle at 50% 10%, black, transparent 82%);
  pointer-events: none;
  opacity: 0.42;
}

.atlas-page::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(118deg, transparent 0 44%, rgba(248, 184, 78, 0.07) 44.2%, transparent 44.6%),
    linear-gradient(64deg, transparent 0 64%, rgba(56, 217, 120, 0.045) 64.2%, transparent 64.55%);
  pointer-events: none;
}

.atlas-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(120px);
  pointer-events: none;
  opacity: 0.72;
}

.atlas-orb--left {
  left: -8rem;
  top: 21rem;
  width: 24rem;
  height: 24rem;
  background: rgba(248, 184, 78, 0.18);
}

.atlas-orb--right {
  right: -7rem;
  top: 9rem;
  width: 24rem;
  height: 24rem;
  background: rgba(56, 217, 120, 0.1);
}

.atlas-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1260px);
  margin: 0 auto;
  padding: 1.8rem 1rem 4rem;
}

.atlas-mouse {
  transform-style: preserve-3d;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.atlas-mouse:hover {
  will-change: transform;
}

.atlas-mouse-inner {
  position: relative;
  z-index: 1;
}

.atlas-frame {
  position: relative;
  min-height: 32rem;
  margin-bottom: 1.1rem;
  border: 1px solid rgba(248, 184, 78, 0.52);
  border-radius: 3rem;
  background:
    linear-gradient(112deg, rgba(248, 184, 78, 0.1), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015)),
    rgba(3, 4, 3, 0.72);
  box-shadow:
    0 0 0 1px rgba(248, 184, 78, 0.08),
    0 38px 120px rgba(0, 0, 0, 0.64),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  overflow: hidden;
}

.atlas-frame::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background:
    radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(248, 184, 78, 0.16), transparent 18rem),
    linear-gradient(90deg, rgba(248, 184, 78, 0.55), transparent 24%, transparent 76%, rgba(56, 217, 120, 0.34));
  opacity: 0.5;
  pointer-events: none;
  mask-image: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000);
  -webkit-mask-image: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000);
  padding: 1px;
  mask-composite: exclude;
  -webkit-mask-composite: xor;
}

.atlas-frame::after {
  content: "";
  position: absolute;
  right: -8rem;
  top: -7rem;
  width: 25rem;
  height: 25rem;
  border-radius: 9999px;
  border: 1px solid rgba(56, 217, 120, 0.22);
  box-shadow: inset 0 0 70px rgba(56, 217, 120, 0.08);
  pointer-events: none;
}

.atlas-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 0.78fr 1.22fr;
  min-height: inherit;
}

.atlas-rail {
  position: relative;
  padding: 2.2rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0)),
    rgba(0, 0, 0, 0.12);
}

.atlas-rail::after {
  content: "";
  position: absolute;
  right: -1px;
  top: 2.2rem;
  bottom: 2.2rem;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(248, 184, 78, 0.62), transparent);
}

.atlas-overline {
  margin: 0 0 0.8rem;
  color: rgba(248, 184, 78, 0.94);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.atlas-title {
  margin: 0;
  max-width: 31rem;
  color: white;
  font-size: clamp(2.45rem, 5.2vw, 5rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.065em;
  text-shadow: 0 12px 42px rgba(0, 0, 0, 0.5);
}

.atlas-copy {
  max-width: 30rem;
  margin: 1rem 0 0;
  color: rgba(233, 230, 221, 0.76);
  font-size: 0.98rem;
  line-height: 1.75;
}

.atlas-quick {
  display: grid;
  gap: 0.72rem;
  margin-top: 1.35rem;
}

.atlas-pill {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.65rem;
  padding: 0.62rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.045);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.atlas-pill strong {
  color: white;
  font-size: 1rem;
}

.atlas-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1.35rem;
}

.atlas-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.85rem 1.05rem;
  border: 1px solid transparent;
  border-radius: 9999px;
  color: white;
  font-weight: 800;
  letter-spacing: 0.01em;
  overflow: hidden;
  transition: transform 0.18s ease, filter 0.18s ease, border-color 0.18s ease;
}

.atlas-button::before {
  content: "";
  position: absolute;
  inset: 1px 1px auto;
  height: 52%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent);
  opacity: 0.62;
  pointer-events: none;
}

.atlas-button:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.atlas-button--gold {
  background: linear-gradient(135deg, #f8b84e, #d97706 58%, #7c2d12);
  box-shadow: 0 18px 38px rgba(245, 158, 11, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.26);
}

.atlas-button--green {
  background: linear-gradient(135deg, #31d47a, #15803d 58%, #064e3b);
  box-shadow: 0 18px 38px rgba(34, 197, 94, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.atlas-button--ghost {
  background: rgba(255, 255, 255, 0.055);
  border-color: rgba(255, 255, 255, 0.13);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 16px 32px rgba(0, 0, 0, 0.28);
}

.atlas-button--danger {
  background: rgba(251, 113, 133, 0.14);
  border-color: rgba(251, 113, 133, 0.32);
  color: #fecdd3;
}

.atlas-button--small {
  min-height: 2.4rem;
  padding: 0.58rem 0.9rem;
  font-size: 0.88rem;
}

.atlas-map {
  position: relative;
  min-height: 31rem;
  padding: 2.2rem;
  overflow: hidden;
}

.atlas-map::before {
  content: "";
  position: absolute;
  inset: 1.2rem;
  border-radius: 2.2rem;
  background:
    linear-gradient(115deg, transparent 0 43%, rgba(255, 255, 255, 0.05) 43.2%, transparent 43.7%),
    radial-gradient(circle at 58% 48%, rgba(56, 217, 120, 0.12), transparent 28%),
    radial-gradient(circle at 78% 24%, rgba(248, 184, 78, 0.14), transparent 20%);
  pointer-events: none;
}

.atlas-map-title {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.atlas-map-title h2 {
  margin: 0.2rem 0 0;
  max-width: 24rem;
  color: white;
  font-size: clamp(1.6rem, 3vw, 2.7rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.045em;
}

.atlas-live {
  display: inline-grid;
  place-items: center;
  width: 4.5rem;
  height: 4.5rem;
  flex: 0 0 auto;
  border-radius: 9999px;
  border: 1px solid rgba(56, 217, 120, 0.5);
  background: rgba(56, 217, 120, 0.08);
  color: #bbf7d0;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: 0 0 60px rgba(56, 217, 120, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.atlas-route {
  position: relative;
  z-index: 1;
  height: 12rem;
  margin: 2.8rem 0 1.8rem;
}

.atlas-route-line {
  position: absolute;
  left: 2%;
  right: 3%;
  top: 48%;
  height: 2px;
  background: linear-gradient(90deg, rgba(248, 184, 78, 0.2), rgba(248, 184, 78, 0.95), rgba(56, 217, 120, 0.8));
  transform: rotate(-5deg);
  box-shadow: 0 0 24px rgba(248, 184, 78, 0.28);
}

.atlas-route-line::before,
.atlas-route-line::after {
  content: "";
  position: absolute;
  inset: -5rem 15% auto auto;
  width: 15rem;
  height: 9rem;
  border-top: 2px solid rgba(56, 217, 120, 0.26);
  border-radius: 9999px 9999px 0 0;
  transform: rotate(8deg);
}

.atlas-route-line::after {
  left: 12%;
  right: auto;
  width: 18rem;
  border-color: rgba(248, 184, 78, 0.28);
  transform: rotate(-6deg);
}

.atlas-route-node {
  position: absolute;
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background:
    radial-gradient(circle at 45% 35%, rgba(255, 255, 255, 0.18), transparent 45%),
    rgba(10, 12, 9, 0.86);
  color: white;
  font-size: 0.78rem;
  font-weight: 900;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.atlas-route-node--start {
  left: 2%;
  top: 54%;
  color: #fde68a;
}

.atlas-route-node--mid {
  left: 43%;
  top: 18%;
  color: #bbf7d0;
}

.atlas-route-node--end {
  right: 4%;
  top: 35%;
  color: #fef3c7;
}

.atlas-route-label {
  position: absolute;
  min-width: 9rem;
  padding: 0.58rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.36);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.78rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.atlas-route-label--a {
  left: 9%;
  bottom: 0;
}

.atlas-route-label--b {
  right: 9%;
  top: 1rem;
}

.atlas-search-dock {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
  max-width: 42rem;
  margin-left: auto;
}

.atlas-input {
  width: 100%;
  min-height: 3rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 9999px;
  background: rgba(3, 4, 3, 0.72);
  color: white;
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.atlas-input:focus {
  border-color: rgba(248, 184, 78, 0.52);
  background: rgba(10, 10, 8, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 0 0 3px rgba(248, 184, 78, 0.12);
}

.atlas-input::placeholder {
  color: rgba(229, 231, 235, 0.46);
}

.atlas-input::-webkit-calendar-picker-indicator {
  filter: invert(1) opacity(0.75);
}

.atlas-input option {
  background: #090a08;
  color: white;
}

.atlas-section {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.5rem 0 0.9rem;
}

.atlas-section h2 {
  margin: 0.2rem 0 0;
  color: white;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.035em;
}

.atlas-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2.25rem;
  padding: 0.48rem 0.82rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.82rem;
  font-weight: 800;
}

.atlas-instruments {
  display: grid;
  grid-template-columns: minmax(18rem, 1.1fr) repeat(3, minmax(12.5rem, 0.8fr));
  gap: 1rem;
}

.atlas-dial {
  position: relative;
  min-height: 13rem;
  padding: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 1.75rem;
  background:
    radial-gradient(circle at 82% 18%, rgba(248, 184, 78, 0.16), transparent 35%),
    radial-gradient(circle at 18% 88%, rgba(56, 217, 120, 0.07), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.02)),
    rgba(9, 10, 8, 0.9);
  box-shadow: var(--atlas-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  overflow: hidden;
}

.atlas-dial::before {
  content: "";
  position: absolute;
  inset: 1.15rem 1.15rem auto;
  height: 7.5rem;
  border-radius: 9999px 9999px 0 0;
  border-top: 1px solid rgba(248, 184, 78, 0.48);
  border-left: 1px solid rgba(248, 184, 78, 0.2);
  border-right: 1px solid rgba(56, 217, 120, 0.2);
  right: 1rem;
  bottom: 1rem;
  width: 6.7rem;
  height: 6.7rem;
  border-radius: 9999px;
  border: 1px solid rgba(248, 184, 78, 0.24);
  box-shadow: inset 0 0 42px rgba(56, 217, 120, 0.08);
  opacity: 0.72;
  pointer-events: none;
}

.atlas-dial--featured {
  border-radius: 2rem;
  background:
    radial-gradient(circle at 18% 20%, rgba(248, 184, 78, 0.18), transparent 36%),
    radial-gradient(circle at 78% 24%, rgba(56, 217, 120, 0.1), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    rgba(9, 10, 8, 0.82);
}

.atlas-dial--featured::before {
  inset: auto 1.2rem 1rem auto;
  width: 8rem;
  height: 8rem;
  border: 1px solid rgba(56, 217, 120, 0.18);
  border-radius: 9999px;
  box-shadow: inset 0 0 45px rgba(56, 217, 120, 0.08);
}

.atlas-dial-label {
  position: relative;
  z-index: 1;
  display: block;
  color: var(--atlas-muted);
  font-size: 0.88rem;
  font-weight: 800;
}

.atlas-dial-value {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 1rem;
  color: white;
  font-size: clamp(2rem, 4vw, 3.15rem);
  font-weight: 900;
  letter-spacing: -0.055em;
}

.atlas-dial-meta {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 0.8rem;
  color: rgba(229, 231, 235, 0.62);
  font-size: 0.82rem;
  line-height: 1.55;
}

.atlas-dial:not(.atlas-dial--featured) .atlas-dial-value {
  font-size: 2rem;
}

.atlas-board {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 2rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.065), rgba(255, 255, 255, 0.018)),
    rgba(9, 10, 8, 0.92);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.atlas-board-scroll {
  overflow-x: auto;
}

.atlas-board table {
  width: 100%;
  min-width: 890px;
  border-collapse: collapse;
}

.atlas-board th {
  padding: 1rem 1.05rem;
  background: linear-gradient(180deg, rgba(28, 24, 16, 0.98), rgba(15, 13, 9, 0.96));
  color: rgba(248, 184, 78, 0.8);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-align: left;
  text-transform: uppercase;
}

.atlas-board td {
  padding: 1rem 1.05rem;
  color: rgba(248, 250, 252, 0.9);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  vertical-align: middle;
}

.atlas-board tr {
  transition: background-color 0.18s ease;
}

.atlas-board tbody tr:hover {
  background: rgba(248, 184, 78, 0.045);
}

.atlas-name {
  color: white;
  font-weight: 900;
}

.atlas-chip {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.72rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.052);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.82rem;
  font-weight: 800;
}

.atlas-chip--truck {
  border-color: rgba(248, 184, 78, 0.22);
  background: rgba(248, 184, 78, 0.1);
  color: #fde68a;
}

.atlas-chip--risk {
  border-color: rgba(251, 113, 133, 0.28);
  background: rgba(251, 113, 133, 0.1);
  color: #fecdd3;
}

.atlas-chip--good {
  border-color: rgba(56, 217, 120, 0.28);
  background: rgba(56, 217, 120, 0.1);
  color: #bbf7d0;
}

.atlas-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.atlas-mobile-list {
  display: none;
}

.atlas-card {
  position: relative;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 1.5rem;
  background:
    linear-gradient(145deg, rgba(248, 184, 78, 0.07), transparent 36%),
    rgba(9, 10, 8, 0.88);
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.atlas-card:active {
  transform: scale(0.986);
}

.atlas-card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.9rem;
}

.atlas-card-title {
  margin: 0;
  color: white;
  font-size: 1.15rem;
  font-weight: 900;
}

.atlas-card-meta {
  margin: 0.32rem 0 0;
  color: rgba(229, 231, 235, 0.66);
  font-size: 0.85rem;
}

.atlas-card-route {
  margin-top: 0.92rem;
  padding: 0.85rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.045);
  color: rgba(248, 250, 252, 0.86);
}

.atlas-card-extra {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease, margin-top 0.28s ease;
}

.atlas-card-extra--open {
  grid-template-rows: 1fr;
  margin-top: 0.9rem;
}

.atlas-card-extra-wrap {
  overflow: hidden;
}

.atlas-card-extra-inner {
  padding-top: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.atlas-card-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.9rem;
}

.atlas-empty {
  padding: 1.2rem;
  text-align: center;
  color: rgba(229, 231, 235, 0.76);
}

.atlas-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem;
  background: rgba(2, 3, 2, 0.78);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.atlas-modal {
  width: min(100%, 24rem);
  padding: 1.35rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.7rem;
  background:
    radial-gradient(circle at 12% 0%, rgba(248, 184, 78, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025)),
    rgba(9, 10, 8, 0.95);
  box-shadow: 0 34px 110px rgba(0, 0, 0, 0.68), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.atlas-modal h2 {
  margin: 0;
  color: white;
  font-size: 1.35rem;
  font-weight: 900;
}

.atlas-modal p {
  margin: 0.55rem 0 1rem;
  color: rgba(229, 231, 235, 0.68);
  line-height: 1.55;
}

.atlas-modal-body {
  display: grid;
  gap: 0.8rem;
}

.atlas-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1rem;
}

@supports not ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {
  .atlas-frame,
  .atlas-dial,
  .atlas-board,
  .atlas-card,
  .atlas-modal,
  .atlas-pill,
  .atlas-input {
    background-color: rgba(9, 10, 8, 0.96);
  }
}

@media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .atlas-mouse {
    transform: none !important;
  }
}

@media (max-width: 900px) {
  .atlas-grid {
    grid-template-columns: 1fr;
  }

  .atlas-rail {
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .atlas-rail::after {
    display: none;
  }

  .atlas-instruments {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .atlas-shell {
    padding: 1rem 0.85rem 5rem;
  }

  .atlas-frame {
    min-height: auto;
    border-radius: 2rem;
  }

  .atlas-rail,
  .atlas-map {
    padding: 1.1rem;
  }

  .atlas-title {
    font-size: 2.55rem;
  }

  .atlas-actions,
  .atlas-search-dock,
  .atlas-card-actions {
    grid-template-columns: 1fr;
  }

  .atlas-route {
    height: 10rem;
    margin: 2rem 0 1rem;
  }

  .atlas-route-label {
    display: none;
  }

  .atlas-live {
    width: 3.8rem;
    height: 3.8rem;
  }

  .atlas-section {
    align-items: flex-start;
    flex-direction: column;
  }

  .atlas-instruments {
    grid-template-columns: 1fr;
  }

  .atlas-dial {
    min-height: 10.5rem;
    border-radius: 1.45rem;
  }

  .atlas-board {
    display: none;
  }

  .atlas-mobile-list {
    display: grid;
    gap: 0.9rem;
  }

  .atlas-modal-actions {
    flex-direction: column-reverse;
  }

  .atlas-modal-actions .atlas-button {
    width: 100%;
  }
}
`

const RUPEE = "\u20B9"
const currencyFormatter = new Intl.NumberFormat("en-IN")

const formatCurrency = (value) => `${RUPEE}${currencyFormatter.format(Number(value || 0))}`

const safeText = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback
  return String(value)
}

const shortNumber = (value) => {
  const raw = safeText(value, "0").replace(/[^\d.-]/g, "")
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

const isNegativeShort = (value) => shortNumber(value) < 0 || safeText(value, "").trim().startsWith("-")

const formatDateLabel = (value) => {
  if (!value) return "All"

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function MotionSurface({ enabled, className = "", strength = 6, children }) {
  const ref = useRef(null)

  const handleMove = (event) => {
    if (!enabled || !ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    const rotateY = (x - 0.5) * strength
    const rotateX = (0.5 - y) * strength

    ref.current.style.setProperty("--mx", `${x * 100}%`)
    ref.current.style.setProperty("--my", `${y * 100}%`)
    ref.current.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const handleLeave = () => {
    if (!ref.current) return

    ref.current.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)"
    ref.current.style.setProperty("--mx", "50%")
    ref.current.style.setProperty("--my", "50%")
  }

  return (
    <div ref={ref} className={`atlas-mouse ${className}`} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div className="atlas-mouse-inner">{children}</div>
    </div>
  )
}

export default function TTDrivers() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [format, setFormat] = useState("pdf")
  const [openCard, setOpenCard] = useState(null)
  const [tiltEnabled, setTiltEnabled] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)")
    const sync = () => setTiltEnabled(media.matches)

    sync()
    media.addEventListener("change", sync)

    return () => media.removeEventListener("change", sync)
  }, [])

  const loadDrivers = async () => {
    const res = await getDrivers()
    setData(res)
  }

  useEffect(() => {
    loadDrivers()
  }, [])

  const handleDelete = async (id) => {
    await deleteDriver(id)
    loadDrivers()
  }

  const filtered = data.filter((driver) =>
    Object.values(driver).join(" ").toLowerCase().includes(search.toLowerCase())
  )

  const getFilteredByDate = () => {
    return filtered.filter((driver) => {
      const createdDate = new Date(driver.createdAt)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate) : null

      if (to) to.setHours(23, 59, 59, 999)

      return (!from || createdDate >= from) && (!to || createdDate <= to)
    })
  }

  const totals = filtered.reduce(
    (acc, driver) => {
      const short = shortNumber(driver.short)

      acc.short += short
      if (short < 0) acc.risk += 1
      if (driver.transportName && !acc.transports.includes(driver.transportName)) {
        acc.transports.push(driver.transportName)
      }

      return acc
    },
    { short: 0, risk: 0, transports: [] }
  )

  const generatePDF = (filteredData) => {
    const doc = new jsPDF()

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("Aastha Enterprises", 14, 16)

    doc.setFontSize(12)
    doc.text("T.T Drivers Dispatch Report", 14, 24)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`From: ${fromDate || "All"}  To: ${toDate || "All"}`, 14, 34)
    doc.text(`Total Records: ${filteredData.length}`, 14, 41)
    doc.text(`Short Balance: Rs.${filteredData.reduce((sum, driver) => sum + shortNumber(driver.short), 0)}`, 14, 48)

    autoTable(doc, {
      startY: 56,
      head: [["Name", "Number", "TT Number", "Transport", "Short", "Remark"]],
      body: filteredData.map((driver) => [
        driver.name,
        driver.number,
        driver.ttNumber,
        driver.transportName,
        driver.short,
        driver.remark,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [20, 83, 45], textColor: 255 },
      alternateRowStyles: { fillColor: [246, 246, 240] },
    })

    doc.save("TTDrivers_Report.pdf")
  }

  const generateExcel = (filteredData) => {
    const formatted = filteredData.map((driver, index) => ({
      ID: index + 1,
      Name: driver.name,
      Number: driver.number,
      TT_Number: driver.ttNumber,
      Transport: driver.transportName,
      Short: driver.short,
      Remark: driver.remark,
    }))

    const ws = XLSX.utils.json_to_sheet(formatted)
    ws["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 10 }, { wch: 28 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "TT Drivers")

    const summary = XLSX.utils.json_to_sheet([
      {
        Records: filteredData.length,
        Short_Balance: filteredData.reduce((sum, driver) => sum + shortNumber(driver.short), 0),
        From: fromDate || "All",
        To: toDate || "All",
      },
    ])
    XLSX.utils.book_append_sheet(wb, summary, "Summary")

    XLSX.writeFile(wb, "TTDrivers_Report.xlsx")
  }

  const handleGenerate = () => {
    const filteredData = getFilteredByDate()

    if (format === "pdf") {
      generatePDF(filteredData)
    } else {
      generateExcel(filteredData)
    }

    setReportOpen(false)
  }

  const instruments = [
    {
      label: "Fleet Records",
      value: filtered.length,
      meta: `${data.length} total saved drivers`,
      featured: true,
    },
    {
      label: "Short Balance",
      value: formatCurrency(totals.short),
      meta: "Live filtered shortage position",
    },
    {
      label: "Transports",
      value: totals.transports.length,
      meta: "Unique transport partners",
    },
    {
      label: "Risk Short",
      value: totals.risk,
      meta: "Negative short records",
    },
  ]

  return (
    <>
      <style>{atlasStyles}</style>

      <div className="atlas-page">
        <div className="atlas-orb atlas-orb--left" />
        <div className="atlas-orb atlas-orb--right" />

        <div className="atlas-shell">
          <MotionSurface enabled={tiltEnabled} strength={3.5} className="atlas-frame">
            <div className="atlas-grid">
              <aside className="atlas-rail">
                <p className="atlas-overline">Tanker Dispatch Atlas</p>
                <h1 className="atlas-title">T.T Driver Details</h1>
                <p className="atlas-copy">
                  A fresh command-map view for tanker drivers, transport partners, short balance, and export-ready
                  reporting.
                </p>

                <div className="atlas-quick">
                  <div className="atlas-pill">
                    <span>Visible drivers</span>
                    <strong>{filtered.length}</strong>
                  </div>
                  <div className="atlas-pill">
                    <span>Short balance</span>
                    <strong>{formatCurrency(totals.short)}</strong>
                  </div>
                  <div className="atlas-pill">
                    <span>Date window</span>
                    <strong>{fromDate || toDate ? `${formatDateLabel(fromDate)} to ${formatDateLabel(toDate)}` : "All"}</strong>
                  </div>
                </div>

                <div className="atlas-actions">
                  <button
                    className="atlas-button atlas-button--gold"
                    onClick={() => {
                      setEditData(null)
                      setModalOpen(true)
                    }}
                  >
                    + Add Driver
                  </button>

                  <button className="atlas-button atlas-button--green" onClick={() => setReportOpen(true)}>
                    Export Report
                  </button>
                </div>
              </aside>

              <section className="atlas-map">
                <div className="atlas-map-title">
                  <div>
                    <p className="atlas-overline">Route Intelligence</p>
                    <h2>Live manifest map with risk markers.</h2>
                  </div>
                  <div className="atlas-live">Live</div>
                </div>

                <div className="atlas-route">
                  <div className="atlas-route-line" />
                  <div className="atlas-route-node atlas-route-node--start">TT</div>
                  <div className="atlas-route-node atlas-route-node--mid">{totals.transports.length || 0}</div>
                  <div className="atlas-route-node atlas-route-node--end">{totals.risk}</div>
                  <div className="atlas-route-label atlas-route-label--a">Transport network tracked</div>
                  <div className="atlas-route-label atlas-route-label--b">Risk short records isolated</div>
                </div>

                <div className="atlas-search-dock">
                  <input
                    placeholder="Search name, number, TT number, transport, remark..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="atlas-input"
                  />
                  <button className="atlas-button atlas-button--ghost" onClick={() => setSearch("")}>
                    Clear
                  </button>
                </div>
              </section>
            </div>
          </MotionSurface>

          <div className="atlas-section">
            <div>
              <p className="atlas-overline">Instrument Cluster</p>
              <h2>Driver fleet pulse</h2>
            </div>
            <div className="atlas-badge">No blue motion glare</div>
          </div>

          <div className="atlas-instruments">
            {instruments.map((item) => (
              <MotionSurface
                key={item.label}
                enabled={tiltEnabled}
                strength={item.featured ? 4 : 3}
                className={`atlas-dial ${item.featured ? "atlas-dial--featured" : ""}`}
              >
                <span className="atlas-dial-label">{item.label}</span>
                <strong className="atlas-dial-value">{item.value}</strong>
                <span className="atlas-dial-meta">{item.meta}</span>
              </MotionSurface>
            ))}
          </div>

          <div className="atlas-section">
            <div>
              <p className="atlas-overline">Driver Manifest</p>
              <h2>Static ledger for clear scanning</h2>
            </div>
            <div className="atlas-badge">{filtered.length} rows</div>
          </div>

          <div className="atlas-board">
            <div className="atlas-board-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Number</th>
                    <th>T.T Number</th>
                    <th>Transport</th>
                    <th>Short</th>
                    <th>Remark</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((driver, index) => (
                    <tr key={driver._id}>
                      <td>{index + 1}</td>
                      <td className="atlas-name">{safeText(driver.name)}</td>
                      <td>{safeText(driver.number)}</td>
                      <td>
                        <span className="atlas-chip atlas-chip--truck">{safeText(driver.ttNumber)}</span>
                      </td>
                      <td>{safeText(driver.transportName)}</td>
                      <td>
                        <span className={`atlas-chip ${isNegativeShort(driver.short) ? "atlas-chip--risk" : "atlas-chip--good"}`}>
                          {safeText(driver.short, "0")}
                        </span>
                      </td>
                      <td>{safeText(driver.remark)}</td>
                      <td>
                        <div className="atlas-row-actions">
                          <button
                            className="atlas-button atlas-button--ghost atlas-button--small"
                            onClick={() => {
                              setEditData(driver)
                              setModalOpen(true)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="atlas-button atlas-button--danger atlas-button--small"
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

          <div className="atlas-mobile-list">
            {filtered.map((driver) => {
              const isOpen = openCard === driver._id

              return (
                <div key={driver._id} className="atlas-card" onClick={() => setOpenCard(isOpen ? null : driver._id)}>
                  <div className="atlas-card-top">
                    <div>
                      <p className="atlas-card-title">{safeText(driver.name)}</p>
                      <p className="atlas-card-meta">{safeText(driver.number)}</p>
                    </div>
                    <span className={`atlas-chip ${isNegativeShort(driver.short) ? "atlas-chip--risk" : "atlas-chip--good"}`}>
                      {safeText(driver.short, "0")}
                    </span>
                  </div>

                  <div className="atlas-card-route">
                    TT {safeText(driver.ttNumber)} / Transport {safeText(driver.transportName)}
                  </div>

                  <div className={`atlas-card-extra ${isOpen ? "atlas-card-extra--open" : ""}`}>
                    <div className="atlas-card-extra-wrap">
                      <div className="atlas-card-extra-inner">
                        <p className="atlas-card-meta">Remark: {safeText(driver.remark)}</p>

                        <div className="atlas-card-actions">
                          <button
                            className="atlas-button atlas-button--ghost atlas-button--small"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditData(driver)
                              setModalOpen(true)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="atlas-button atlas-button--danger atlas-button--small"
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

          {filtered.length === 0 && <div className="atlas-empty">No T.T drivers matched your current search.</div>}
        </div>

        <AddTTDriverModal
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

        {reportOpen && (
          <div className="atlas-modal-backdrop">
            <div className="atlas-modal">
              <h2>Export T.T report</h2>
              <p>Choose date range and file format for the dispatch manifest.</p>

              <div className="atlas-modal-body">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="atlas-input"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="atlas-input"
                />
                <select value={format} onChange={(event) => setFormat(event.target.value)} className="atlas-input">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              <div className="atlas-modal-actions">
                <button className="atlas-button atlas-button--ghost" onClick={() => setReportOpen(false)}>
                  Cancel
                </button>
                <button className="atlas-button atlas-button--gold" onClick={handleGenerate}>
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
























// import { useEffect, useState } from "react"
// import { getDrivers, deleteDriver } from "../services/ttDriverApi"
// import AddTTDriverModal from "../components/AddTTDriverModal"
// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"
// import * as XLSX from "xlsx"

// export default function TTDrivers(){

// const [data,setData] = useState([])
// const [search,setSearch] = useState("")
// const [modalOpen,setModalOpen] = useState(false)
// const [editData,setEditData] = useState(null)
// const [reportOpen,setReportOpen] = useState(false)
// const [fromDate,setFromDate] = useState("")
// const [toDate,setToDate] = useState("")
// const [format,setFormat] = useState("pdf")
// const [openCard,setOpenCard] = useState(null)

// useEffect(()=>{
// loadDrivers()
// },[])

// const loadDrivers = async()=>{
// const res = await getDrivers()
// setData(res)
// }

// const handleDelete = async(id)=>{
// await deleteDriver(id)
// loadDrivers()
// }

// const filtered = data.filter(d=>
// Object.values(d).join(" ").toLowerCase().includes(search.toLowerCase())
// )

// const generatePDF = (filteredData)=>{

// const doc = new jsPDF()

// doc.setFontSize(16)
// doc.text("T.T Drivers Report",14,15)

// doc.setFontSize(10)
// doc.text(`From: ${fromDate || "All"} To: ${toDate || "All"}`,14,22)

// doc.text(`Total Records: ${filteredData.length}`,14,30)

// autoTable(doc,{
// startY:35,
// head:[["Name","Number","TT Number","Transport","Short","Remark"]],
// body:filteredData.map(d=>[
// d.name,
// d.number,
// d.ttNumber,
// d.transportName,
// d.short,
// d.remark
// ]),
// styles:{fontSize:8},
// headStyles:{fillColor:[22,163,74]}
// })

// doc.save("TTDrivers_Report.pdf")

// }

// const generateExcel = (filteredData)=>{

// const formatted = filteredData.map((d,i)=>({
// ID:i+1,
// Name:d.name,
// Number:d.number,
// TT_Number:d.ttNumber,
// Transport:d.transportName,
// Short:d.short,
// Remark:d.remark
// }))

// const ws = XLSX.utils.json_to_sheet(formatted)

// ws["!cols"] = [
// {wch:5},
// {wch:20},
// {wch:15},
// {wch:15},
// {wch:20},
// {wch:10},
// {wch:20}
// ]

// const wb = XLSX.utils.book_new()
// XLSX.utils.book_append_sheet(wb,ws,"TT Drivers")

// XLSX.writeFile(wb,"TTDrivers_Report.xlsx")

// }

// const getFilteredByDate = ()=>{
// return filtered.filter(d=>{
// const dDate = new Date(d.createdAt)

// return (
// (!fromDate || dDate >= new Date(fromDate)) &&
// (!toDate || dDate <= new Date(toDate))
// )
// })
// }

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

// <div className="p-6">

// <h1 className="text-xl font-bold mb-4">
// T.T Driver Details
// </h1>

// <div className="flex flex-col sm:flex-row gap-3 mb-4">

// <input
// placeholder="Search..."
// value={search}
// onChange={(e)=>setSearch(e.target.value)}
// className="border p-2 w-60"
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
// className="bg-purple-600 text-white px-3 py-1 rounded"
// >
// Generate Report
// </button>

// </div>

// <div className="hidden sm:block overflow-x-auto">
// <table className="w-full text-sm text-gray-300">

// <thead className="bg-[#0F172A] text-gray-400">

// <tr>

// <th className="px-6 py-3 text-left">ID</th>
// <th className="px-6 py-3 text-left">Name</th>
// <th className="px-6 py-3 text-left">Number</th>
// <th className="px-6 py-3 text-left">T.T Number</th>
// <th className="px-6 py-3 text-left">Transport Name</th>
// <th className="px-6 py-3 text-left">Short</th>
// <th className="px-6 py-3 text-left">Remark</th>
// <th className="px-6 py-3 text-left">Action</th>

// </tr>

// </thead>


// <tbody>

// {filtered.map((d,i)=>(
// <tr
// key={d._id}
// className="border-b border-[#1E293B] hover:bg-[#0F172A]"
// >

// <td className="px-6 py-3">{i+1}</td>

// <td className="px-6 py-3">{d.name}</td>

// <td className="px-6 py-3">{d.number}</td>

// <td className="px-6 py-3">{d.ttNumber}</td>

// <td className="px-6 py-3">{d.transportName}</td>

// <td className={`px-6 py-3 ${d.short.includes("-") ? "text-red-500" : "text-green-400"}`}>
//   {d.short}
// </td>

// <td className="px-6 py-3">{d.remark}</td>

// <td className="px-6 py-3">

// <button
// className="text-blue-400 hover:text-blue-300"
// onClick={()=>{

// setEditData(d)
// setModalOpen(true)

// }}
// >
// Edit
// </button>

// <button
// onClick={()=>handleDelete(d._id)}
// className="text-red-500 ml-3 hover:text-red-400"
// >
// Delete
// </button>

// </td>

// </tr>
// ))}

// </tbody>

// </table>
// </div>

// {/* MOBILE VIEW */}

// <div className="sm:hidden space-y-4">

// {filtered.map((d)=>{

// const isOpen = openCard === d._id

// return(

// <div
// key={d._id}
// onClick={()=>setOpenCard(isOpen ? null : d._id)}
// className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4 active:scale-95 transition"
// >

// {/* TOP */}

// <div className="flex justify-between items-center">

// <div>
// <p className="text-xs text-gray-400">Driver</p>
// <p className="text-white font-semibold text-lg">{d.name}</p>
// </div>

// <p className={`text-sm font-bold ${d.short.includes("-") ? "text-red-400" : "text-green-400"}`}>
// {d.short}
// </p>

// </div>

// {/* BASIC INFO */}

// <div className="mt-3 text-sm text-gray-300 space-y-1">

// <p>📞 {d.number}</p>
// <p>🚛 {d.ttNumber}</p>

// </div>

// {/* EXPAND */}

// {isOpen && (

// <div className="mt-4 border-t border-[#1A1F2E] pt-3 space-y-2">

// <p className="text-sm text-gray-400">
// Transport : <span className="text-white">{d.transportName}</span>
// </p>

// <p className="text-sm text-gray-400">
// Remark : <span className="text-white">{d.remark || "-"}</span>
// </p>

// {/* ACTION BUTTONS */}

// <div className="flex gap-2 mt-3">

// <button
// onClick={(e)=>{
// e.stopPropagation()
// setEditData(d)
// setModalOpen(true)
// }}
// className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg text-sm"
// >
// Edit
// </button>

// <button
// onClick={(e)=>{
// e.stopPropagation()
// handleDelete(d._id)
// }}
// className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-lg text-sm"
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

// <AddTTDriverModal
// open={modalOpen}
// onClose={()=>{

// setModalOpen(false)
// setEditData(null)

// }}
// onSave={loadDrivers}
// editData={editData}
// />


// {reportOpen && (

// <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

// <div className="bg-[#0B0F17] p-6 rounded-xl w-[350px] text-white">

// <h2 className="text-lg font-semibold mb-4">
// Generate Report
// </h2>

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

// </div>



// )
// }