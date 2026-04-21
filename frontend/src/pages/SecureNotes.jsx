import { useEffect, useMemo, useState } from "react"
import { getNotes, deleteNote } from "../services/secureNoteApi"
import SecureNoteModal from "../components/SecureNoteModal"

// const vaultStyles = String.raw`
// :root {
//   --vault-bg: #020303;
//   --vault-ink: rgba(250, 250, 249, 0.98);
//   --vault-muted: rgba(214, 211, 209, 0.66);
//   --vault-gold: #f5c56b;
//   --vault-amber: #d97706;
//   --vault-silver: #cbd5e1;
//   --vault-red: #fb7185;
//   --vault-green: #34d399;
//   --vault-panel: rgba(10, 12, 12, 0.84);
//   --vault-panel-strong: rgba(10, 12, 12, 0.94);
//   --vault-border: rgba(255, 255, 255, 0.11);
//   --vault-shadow: 0 34px 100px rgba(0, 0, 0, 0.64);
// }

// .vault-page {
//   position: relative;
//   min-height: 100vh;
//   overflow: hidden;
//   color: var(--vault-ink);
//   background:
//     radial-gradient(circle at 16% 12%, rgba(245, 197, 107, 0.13), transparent 21%),
//     radial-gradient(circle at 82% 10%, rgba(203, 213, 225, 0.09), transparent 20%),
//     radial-gradient(circle at 50% 90%, rgba(52, 211, 153, 0.07), transparent 27%),
//     linear-gradient(180deg, #010202 0%, #050707 48%, #020303 100%);
//   isolation: isolate;
// }

// .vault-page::before {
//   content: "";
//   position: absolute;
//   inset: 0;
//   background-image:
//     linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
//     linear-gradient(90deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px);
//   background-size: 82px 82px;
//   mask-image: radial-gradient(circle at 50% 20%, black, transparent 86%);
//   opacity: 0.52;
//   pointer-events: none;
// }

// .vault-page::after {
//   content: "";
//   position: absolute;
//   inset: 0;
//   background:
//     linear-gradient(125deg, transparent 0 47%, rgba(245, 197, 107, 0.055) 47.2%, transparent 47.6%),
//     linear-gradient(58deg, transparent 0 67%, rgba(203, 213, 225, 0.04) 67.2%, transparent 67.55%);
//   pointer-events: none;
// }

// .vault-orb {
//   position: absolute;
//   border-radius: 9999px;
//   filter: blur(120px);
//   opacity: 0.75;
//   pointer-events: none;
// }

// .vault-orb--gold {
//   left: -8rem;
//   top: 16rem;
//   width: 24rem;
//   height: 24rem;
//   background: rgba(245, 197, 107, 0.15);
// }

// .vault-orb--silver {
//   right: -8rem;
//   top: 7rem;
//   width: 24rem;
//   height: 24rem;
//   background: rgba(203, 213, 225, 0.09);
// }

// .vault-shell {
//   position: relative;
//   z-index: 1;
//   width: min(100%, 1240px);
//   margin: 0 auto;
//   padding: 2rem 1rem 4rem;
// }

// .vault-lock-screen {
//   min-height: 100vh;
//   display: grid;
//   place-items: center;
//   padding: 1rem;
// }

// .vault-lock-card {
//   position: relative;
//   width: min(100%, 58rem);
//   min-height: 32rem;
//   display: grid;
//   grid-template-columns: 1fr 0.86fr;
//   overflow: hidden;
//   border-radius: 2.4rem;
//   border: 1px solid rgba(245, 197, 107, 0.24);
//   background:
//     radial-gradient(circle at 15% 8%, rgba(245, 197, 107, 0.14), transparent 30%),
//     linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.018)),
//     rgba(8, 10, 10, 0.9);
//   box-shadow: var(--vault-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.12);
//   backdrop-filter: blur(22px) saturate(145%);
//   -webkit-backdrop-filter: blur(22px) saturate(145%);
// }

// .vault-lock-copy {
//   position: relative;
//   z-index: 1;
//   padding: 2.2rem;
// }

// .vault-overline {
//   margin: 0 0 0.8rem;
//   color: rgba(245, 197, 107, 0.95);
//   font-size: 0.74rem;
//   font-weight: 900;
//   letter-spacing: 0.24em;
//   text-transform: uppercase;
// }

// .vault-title {
//   margin: 0;
//   max-width: 34rem;
//   color: white;
//   font-size: clamp(2.5rem, 6vw, 5rem);
//   font-weight: 900;
//   line-height: 0.9;
//   letter-spacing: -0.07em;
//   text-shadow: 0 14px 46px rgba(0, 0, 0, 0.48);
// }

// .vault-copy {
//   max-width: 31rem;
//   margin: 1.1rem 0 0;
//   color: var(--vault-muted);
//   font-size: 1rem;
//   line-height: 1.75;
// }

// .vault-lock-hints {
//   display: grid;
//   gap: 0.72rem;
//   margin-top: 1.4rem;
// }

// .vault-lock-hint {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   gap: 0.8rem;
//   min-height: 2.75rem;
//   padding: 0.66rem 0.85rem;
//   border: 1px solid rgba(255, 255, 255, 0.1);
//   border-radius: 9999px;
//   background: rgba(255, 255, 255, 0.045);
//   color: rgba(255, 255, 255, 0.88);
// }

// .vault-lock-hint strong {
//   color: #fde68a;
// }

// .vault-lock-panel {
//   position: relative;
//   display: grid;
//   place-items: center;
//   padding: 2rem;
//   border-left: 1px solid rgba(255, 255, 255, 0.09);
// }

// .vault-dial {
//   position: absolute;
//   width: 22rem;
//   height: 22rem;
//   border-radius: 9999px;
//   border: 1px solid rgba(245, 197, 107, 0.22);
//   background:
//     conic-gradient(from 12deg, rgba(245, 197, 107, 0.16), transparent 12%, rgba(203, 213, 225, 0.1), transparent 32%, rgba(245, 197, 107, 0.16), transparent 56%),
//     radial-gradient(circle, rgba(255, 255, 255, 0.035), transparent 58%);
//   box-shadow: inset 0 0 70px rgba(245, 197, 107, 0.08), 0 0 70px rgba(245, 197, 107, 0.08);
//   animation: vaultDialSpin 28s linear infinite;
// }

// .vault-dial::before,
// .vault-dial::after {
//   content: "";
//   position: absolute;
//   inset: 3rem;
//   border-radius: inherit;
//   border: 1px dashed rgba(255, 255, 255, 0.16);
// }

// .vault-dial::after {
//   inset: 6.2rem;
//   border-style: solid;
//   border-color: rgba(52, 211, 153, 0.16);
// }

// .vault-unlock-form {
//   position: relative;
//   z-index: 1;
//   width: min(100%, 20rem);
//   padding: 1.2rem;
//   border: 1px solid rgba(255, 255, 255, 0.12);
//   border-radius: 1.6rem;
//   background: rgba(5, 7, 7, 0.72);
//   box-shadow: 0 22px 64px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1);
//   backdrop-filter: blur(18px);
//   -webkit-backdrop-filter: blur(18px);
// }

// .vault-form-title {
//   margin: 0 0 0.8rem;
//   color: white;
//   font-size: 1.05rem;
//   font-weight: 900;
// }

// .vault-input {
//   width: 100%;
//   min-height: 3rem;
//   padding: 0.84rem 1rem;
//   border: 1px solid rgba(255, 255, 255, 0.13);
//   border-radius: 1rem;
//   background: rgba(2, 3, 3, 0.72);
//   color: white;
//   outline: none;
//   box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09);
//   transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
// }

// .vault-input:focus {
//   border-color: rgba(245, 197, 107, 0.52);
//   background: rgba(8, 10, 10, 0.92);
//   box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 3px rgba(245, 197, 107, 0.12);
// }

// .vault-input::placeholder {
//   color: rgba(214, 211, 209, 0.46);
// }

// .vault-button {
//   position: relative;
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   min-height: 3rem;
//   padding: 0.84rem 1.05rem;
//   border: 1px solid transparent;
//   border-radius: 1rem;
//   color: white;
//   font-weight: 900;
//   overflow: hidden;
//   transition: transform 0.18s ease, filter 0.18s ease, border-color 0.18s ease;
// }

// .vault-button::before {
//   content: "";
//   position: absolute;
//   inset: 1px 1px auto;
//   height: 52%;
//   border-radius: inherit;
//   background: linear-gradient(180deg, rgba(255, 255, 255, 0.25), transparent);
//   opacity: 0.62;
//   pointer-events: none;
// }

// .vault-button:hover {
//   transform: translateY(-1px);
//   filter: brightness(1.04);
// }

// .vault-button--gold {
//   background: linear-gradient(135deg, #f5c56b, #d97706 58%, #78350f);
//   box-shadow: 0 18px 38px rgba(245, 197, 107, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.25);
// }

// .vault-button--green {
//   background: linear-gradient(135deg, #34d399, #15803d 58%, #064e3b);
//   box-shadow: 0 18px 38px rgba(52, 211, 153, 0.17), inset 0 1px 0 rgba(255, 255, 255, 0.22);
// }

// .vault-button--ghost {
//   background: rgba(255, 255, 255, 0.055);
//   border-color: rgba(255, 255, 255, 0.13);
//   color: rgba(255, 255, 255, 0.88);
// }

// .vault-button--danger {
//   background: rgba(251, 113, 133, 0.13);
//   border-color: rgba(251, 113, 133, 0.28);
//   color: #fecdd3;
// }

// .vault-button--small {
//   min-height: 2.35rem;
//   padding: 0.54rem 0.82rem;
//   border-radius: 9999px;
//   font-size: 0.82rem;
// }

// .vault-button--full {
//   width: 100%;
//   margin-top: 0.8rem;
// }

// .vault-top {
//   display: grid;
//   grid-template-columns: minmax(0, 1fr) minmax(20rem, 0.56fr);
//   gap: 1rem;
//   margin-bottom: 1.2rem;
// }

// .vault-hero,
// .vault-status,
// .vault-command,
// .vault-note-card,
// .vault-add-card {
//   position: relative;
//   overflow: hidden;
//   border: 1px solid var(--vault-border);
//   background:
//     linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.018)),
//     var(--vault-panel);
//   border-radius: 2rem;
//   box-shadow: var(--vault-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.1);
//   backdrop-filter: blur(20px) saturate(145%);
//   -webkit-backdrop-filter: blur(20px) saturate(145%);
// }

// .vault-hero {
//   min-height: 21rem;
//   padding: 1.7rem;
//   background:
//     radial-gradient(circle at 14% 20%, rgba(245, 197, 107, 0.13), transparent 36%),
//     linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.018)),
//     var(--vault-panel);
// }

// .vault-hero::after {
//   content: "";
//   position: absolute;
//   right: -4rem;
//   top: -5rem;
//   width: 18rem;
//   height: 18rem;
//   border-radius: 9999px;
//   border: 1px solid rgba(245, 197, 107, 0.18);
//   box-shadow: inset 0 0 56px rgba(245, 197, 107, 0.07);
//   pointer-events: none;
// }

// .vault-hero-actions {
//   display: flex;
//   flex-wrap: wrap;
//   gap: 0.75rem;
//   margin-top: 1.35rem;
// }

// .vault-chip-row {
//   display: flex;
//   flex-wrap: wrap;
//   gap: 0.72rem;
//   margin-top: 1.15rem;
// }

// .vault-chip {
//   display: inline-flex;
//   align-items: center;
//   min-height: 2.1rem;
//   padding: 0.42rem 0.82rem;
//   border-radius: 9999px;
//   border: 1px solid rgba(255, 255, 255, 0.1);
//   background: rgba(255, 255, 255, 0.052);
//   color: rgba(250, 250, 249, 0.88);
//   font-size: 0.82rem;
//   font-weight: 800;
// }

// .vault-chip--gold {
//   border-color: rgba(245, 197, 107, 0.28);
//   background: rgba(245, 197, 107, 0.11);
//   color: #fde68a;
// }

// .vault-chip--green {
//   border-color: rgba(52, 211, 153, 0.28);
//   background: rgba(52, 211, 153, 0.1);
//   color: #bbf7d0;
// }

// .vault-status {
//   padding: 1.35rem;
// }

// .vault-status-grid {
//   display: grid;
//   grid-template-columns: repeat(2, minmax(0, 1fr));
//   gap: 0.8rem;
//   margin-top: 1rem;
// }

// .vault-status-tile {
//   min-height: 6.6rem;
//   padding: 0.95rem;
//   border-radius: 1.3rem;
//   border: 1px solid rgba(255, 255, 255, 0.09);
//   background: rgba(255, 255, 255, 0.04);
// }

// .vault-status-label {
//   display: block;
//   color: var(--vault-muted);
//   font-size: 0.78rem;
//   font-weight: 800;
//   letter-spacing: 0.14em;
//   text-transform: uppercase;
// }

// .vault-status-value {
//   display: block;
//   margin-top: 0.8rem;
//   color: white;
//   font-size: 1.55rem;
//   font-weight: 900;
// }

// .vault-command {
//   display: grid;
//   grid-template-columns: minmax(0, 1fr) auto auto;
//   gap: 0.8rem;
//   align-items: center;
//   padding: 1rem;
//   margin-bottom: 1.35rem;
// }

// .vault-section {
//   display: flex;
//   align-items: flex-end;
//   justify-content: space-between;
//   gap: 1rem;
//   margin: 1.2rem 0 0.9rem;
// }

// .vault-section h2 {
//   margin: 0.2rem 0 0;
//   color: white;
//   font-size: 1.45rem;
//   font-weight: 900;
//   letter-spacing: -0.035em;
// }

// .vault-notes-grid {
//   display: grid;
//   grid-template-columns: repeat(3, minmax(0, 1fr));
//   gap: 1rem;
// }

// .vault-note-card {
//   min-height: 18rem;
//   padding: 1rem;
// }

// .vault-note-card::before {
//   content: "";
//   position: absolute;
//   inset: 0 0 auto;
//   height: 4px;
//   background: linear-gradient(90deg, #f5c56b, #34d399, #cbd5e1);
//   opacity: 0.72;
// }

// .vault-note-color {
//   position: absolute;
//   right: 1rem;
//   top: 1rem;
//   width: 1rem;
//   height: 1rem;
//   border-radius: 9999px;
//   border: 1px solid rgba(255, 255, 255, 0.25);
//   box-shadow: 0 0 30px rgba(255, 255, 255, 0.12);
// }

// .vault-note-head {
//   display: flex;
//   align-items: flex-start;
//   justify-content: space-between;
//   gap: 0.8rem;
//   padding-right: 1.7rem;
// }

// .vault-note-title {
//   margin: 0;
//   color: white;
//   font-size: 1.15rem;
//   font-weight: 900;
// }

// .vault-note-site {
//   margin: 0.3rem 0 0;
//   color: var(--vault-muted);
//   font-size: 0.86rem;
// }

// .vault-field-stack {
//   display: grid;
//   gap: 0.72rem;
//   margin-top: 1rem;
// }

// .vault-field {
//   display: grid;
//   gap: 0.35rem;
//   padding: 0.72rem;
//   border-radius: 1rem;
//   border: 1px solid rgba(255, 255, 255, 0.08);
//   background: rgba(255, 255, 255, 0.04);
// }

// .vault-field-label {
//   color: rgba(245, 197, 107, 0.76);
//   font-size: 0.72rem;
//   font-weight: 900;
//   letter-spacing: 0.15em;
//   text-transform: uppercase;
// }

// .vault-field-value {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   gap: 0.75rem;
//   color: rgba(250, 250, 249, 0.9);
//   font-size: 0.9rem;
//   word-break: break-word;
// }

// .vault-field-actions {
//   display: flex;
//   flex: 0 0 auto;
//   gap: 0.45rem;
// }

// .vault-mini-action {
//   min-width: 2.05rem;
//   min-height: 2.05rem;
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 9999px;
//   border: 1px solid rgba(255, 255, 255, 0.11);
//   background: rgba(255, 255, 255, 0.055);
//   color: rgba(255, 255, 255, 0.82);
//   font-size: 0.72rem;
//   font-weight: 900;
//   transition: transform 0.18s ease, border-color 0.18s ease;
// }

// .vault-mini-action:hover {
//   transform: translateY(-1px);
//   border-color: rgba(245, 197, 107, 0.36);
// }

// .vault-note-actions {
//   display: flex;
//   gap: 0.65rem;
//   margin-top: 1rem;
// }

// .vault-add-card {
//   min-height: 18rem;
//   display: grid;
//   place-items: center;
//   border-style: dashed;
//   border-color: rgba(245, 197, 107, 0.3);
//   color: rgba(250, 250, 249, 0.78);
//   cursor: pointer;
//   transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
// }

// .vault-add-card:hover {
//   transform: translateY(-2px);
//   border-color: rgba(245, 197, 107, 0.55);
//   background-color: rgba(245, 197, 107, 0.045);
// }

// .vault-add-content {
//   text-align: center;
// }

// .vault-add-plus {
//   width: 4.4rem;
//   height: 4.4rem;
//   display: grid;
//   place-items: center;
//   margin: 0 auto 0.8rem;
//   border-radius: 9999px;
//   border: 1px solid rgba(245, 197, 107, 0.32);
//   background: rgba(245, 197, 107, 0.08);
//   color: #fde68a;
//   font-size: 2rem;
//   font-weight: 900;
// }

// .vault-toast {
//   position: fixed;
//   top: 5rem;
//   left: 50%;
//   z-index: 80;
//   transform: translateX(-50%);
//   padding: 0.72rem 1rem;
//   border-radius: 9999px;
//   border: 1px solid rgba(52, 211, 153, 0.28);
//   background: rgba(6, 78, 59, 0.9);
//   color: #d1fae5;
//   font-size: 0.84rem;
//   font-weight: 900;
//   box-shadow: 0 18px 50px rgba(0, 0, 0, 0.42);
// }

// @keyframes vaultDialSpin {
//   from {
//     transform: rotate(0deg);
//   }
//   to {
//     transform: rotate(360deg);
//   }
// }

// @media (prefers-reduced-motion: reduce) {
//   .vault-dial {
//     animation: none;
//   }
// }

// @media (max-width: 1024px) {
//   .vault-top,
//   .vault-lock-card {
//     grid-template-columns: 1fr;
//   }

//   .vault-lock-panel {
//     min-height: 24rem;
//     border-left: 0;
//     border-top: 1px solid rgba(255, 255, 255, 0.09);
//   }

//   .vault-notes-grid {
//     grid-template-columns: repeat(2, minmax(0, 1fr));
//   }
// }

// @media (max-width: 640px) {
//   .vault-shell {
//     padding: 1rem 0.85rem 4rem;
//   }

//   .vault-lock-card,
//   .vault-hero,
//   .vault-status,
//   .vault-command,
//   .vault-note-card,
//   .vault-add-card {
//     border-radius: 1.45rem;
//   }

//   .vault-lock-copy,
//   .vault-lock-panel,
//   .vault-hero,
//   .vault-status {
//     padding: 1.1rem;
//   }

//   .vault-title {
//     font-size: 2.7rem;
//   }

//   .vault-dial {
//     width: 17rem;
//     height: 17rem;
//   }

//   .vault-status-grid,
//   .vault-command,
//   .vault-notes-grid {
//     grid-template-columns: 1fr;
//   }

//   .vault-section {
//     align-items: flex-start;
//     flex-direction: column;
//   }

//   .vault-note-actions {
//     flex-direction: column;
//   }
// }
// `

const vaultStyles = String.raw`
:root {
  --vault-bg: #020303;
  --vault-ink: rgba(250, 250, 249, 0.98);
  --vault-muted: rgba(214, 211, 209, 0.66);
  --vault-gold: #7dd3fc;
  --vault-amber: #38bdf8;
  --vault-silver: #cbd5e1;
  --vault-red: #fb7185;
  --vault-green: #34d399;
  --vault-panel: rgba(10, 12, 12, 0.84);
  --vault-panel-strong: rgba(10, 12, 12, 0.94);
  --vault-border: rgba(255, 255, 255, 0.11);
  --vault-shadow: 0 34px 100px rgba(0, 0, 0, 0.64);
}

.vault-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--vault-ink);
  background:
    radial-gradient(circle at 16% 12%, rgba(125, 211, 252, 0.13), transparent 21%),
    radial-gradient(circle at 82% 10%, rgba(203, 213, 225, 0.09), transparent 20%),
    radial-gradient(circle at 50% 90%, rgba(52, 211, 153, 0.07), transparent 27%),
    linear-gradient(180deg, #010202 0%, #050707 48%, #020303 100%);
  isolation: isolate;
}

.vault-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px);
  background-size: 82px 82px;
  mask-image: radial-gradient(circle at 50% 20%, black, transparent 86%);
  opacity: 0.52;
  pointer-events: none;
}

.vault-page::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(125deg, transparent 0 47%, rgba(125, 211, 252, 0.055) 47.2%, transparent 47.6%),
    linear-gradient(58deg, transparent 0 67%, rgba(203, 213, 225, 0.04) 67.2%, transparent 67.55%);
  pointer-events: none;
}

.vault-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(120px);
  opacity: 0.75;
  pointer-events: none;
}

.vault-orb--gold {
  left: -8rem;
  top: 16rem;
  width: 24rem;
  height: 24rem;
  background: rgba(125, 211, 252, 0.15);
}

.vault-orb--silver {
  right: -8rem;
  top: 7rem;
  width: 24rem;
  height: 24rem;
  background: rgba(203, 213, 225, 0.09);
}

.vault-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

.vault-lock-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.vault-lock-card {
  position: relative;
  width: min(100%, 58rem);
  min-height: 32rem;
  display: grid;
  grid-template-columns: 1fr 0.86fr;
  overflow: hidden;
  border-radius: 2.4rem;
  border: 1px solid rgba(125, 211, 252, 0.24);
  background:
    radial-gradient(circle at 15% 8%, rgba(125, 211, 252, 0.14), transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.018)),
    rgba(8, 10, 10, 0.9);
  box-shadow: var(--vault-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(22px) saturate(145%);
  -webkit-backdrop-filter: blur(22px) saturate(145%);
}

.vault-lock-copy {
  position: relative;
  z-index: 1;
  padding: 2.2rem;
}

.vault-overline {
  margin: 0 0 0.8rem;
  color: rgba(125, 211, 252, 0.95);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.vault-title {
  margin: 0;
  max-width: 34rem;
  color: white;
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.07em;
  text-shadow: 0 14px 46px rgba(0, 0, 0, 0.48);
}

.vault-copy {
  max-width: 31rem;
  margin: 1.1rem 0 0;
  color: var(--vault-muted);
  font-size: 1rem;
  line-height: 1.75;
}

.vault-lock-hints {
  display: grid;
  gap: 0.72rem;
  margin-top: 1.4rem;
}

.vault-lock-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  min-height: 2.75rem;
  padding: 0.66rem 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.045);
  color: rgba(255, 255, 255, 0.88);
}

.vault-lock-hint strong {
  color: #e0f2fe;
}

.vault-lock-panel {
  position: relative;
  display: grid;
  place-items: center;
  padding: 2rem;
  border-left: 1px solid rgba(255, 255, 255, 0.09);
}

.vault-dial {
  position: absolute;
  width: 22rem;
  height: 22rem;
  border-radius: 9999px;
  border: 1px solid rgba(125, 211, 252, 0.22);
  background:
    conic-gradient(from 12deg, rgba(125, 211, 252, 0.16), transparent 12%, rgba(203, 213, 225, 0.1), transparent 32%, rgba(125, 211, 252, 0.16), transparent 56%),
    radial-gradient(circle, rgba(255, 255, 255, 0.035), transparent 58%);
  box-shadow: inset 0 0 70px rgba(125, 211, 252, 0.08), 0 0 70px rgba(125, 211, 252, 0.08);
  animation: vaultDialSpin 28s linear infinite;
}

.vault-dial::before,
.vault-dial::after {
  content: "";
  position: absolute;
  inset: 3rem;
  border-radius: inherit;
  border: 1px dashed rgba(255, 255, 255, 0.16);
}

.vault-dial::after {
  inset: 6.2rem;
  border-style: solid;
  border-color: rgba(52, 211, 153, 0.16);
}

.vault-unlock-form {
  position: relative;
  z-index: 1;
  width: min(100%, 20rem);
  padding: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.6rem;
  background: rgba(5, 7, 7, 0.72);
  box-shadow: 0 22px 64px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.vault-form-title {
  margin: 0 0 0.8rem;
  color: white;
  font-size: 1.05rem;
  font-weight: 900;
}

.vault-input {
  width: 100%;
  min-height: 3rem;
  padding: 0.84rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 1rem;
  background: rgba(2, 3, 3, 0.72);
  color: white;
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.vault-input:focus {
  border-color: rgba(125, 211, 252, 0.52);
  background: rgba(8, 10, 10, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 3px rgba(125, 211, 252, 0.12);
}

.vault-input::placeholder {
  color: rgba(214, 211, 209, 0.46);
}

.vault-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.84rem 1.05rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  color: white;
  font-weight: 900;
  overflow: hidden;
  transition: transform 0.18s ease, filter 0.18s ease, border-color 0.18s ease;
}

.vault-button::before {
  content: "";
  position: absolute;
  inset: 1px 1px auto;
  height: 52%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.25), transparent);
  opacity: 0.62;
  pointer-events: none;
}

.vault-button:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.vault-button--gold {
  background: linear-gradient(135deg, #7dd3fc, #38bdf8 58%, #2563eb);
  box-shadow: 0 18px 38px rgba(56, 189, 248, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.vault-button--green {
  background: linear-gradient(135deg, #34d399, #15803d 58%, #064e3b);
  box-shadow: 0 18px 38px rgba(52, 211, 153, 0.17), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.vault-button--ghost {
  background: rgba(255, 255, 255, 0.055);
  border-color: rgba(255, 255, 255, 0.13);
  color: rgba(255, 255, 255, 0.88);
}

.vault-button--danger {
  background: rgba(251, 113, 133, 0.13);
  border-color: rgba(251, 113, 133, 0.28);
  color: #fecdd3;
}

.vault-button--small {
  min-height: 2.35rem;
  padding: 0.54rem 0.82rem;
  border-radius: 9999px;
  font-size: 0.82rem;
}

.vault-button--full {
  width: 100%;
  margin-top: 0.8rem;
}

.vault-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(20rem, 0.56fr);
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.vault-hero,
.vault-status,
.vault-command,
.vault-note-card,
.vault-add-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--vault-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.018)),
    var(--vault-panel);
  border-radius: 2rem;
  box-shadow: var(--vault-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);
}

.vault-hero {
  min-height: 21rem;
  padding: 1.7rem;
  background:
    radial-gradient(circle at 14% 20%, rgba(125, 211, 252, 0.13), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.018)),
    var(--vault-panel);
}

.vault-hero::after {
  content: "";
  position: absolute;
  right: -4rem;
  top: -5rem;
  width: 18rem;
  height: 18rem;
  border-radius: 9999px;
  border: 1px solid rgba(125, 211, 252, 0.18);
  box-shadow: inset 0 0 56px rgba(125, 211, 252, 0.07);
  pointer-events: none;
}

.vault-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.35rem;
}

.vault-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.72rem;
  margin-top: 1.15rem;
}

.vault-chip {
  display: inline-flex;
  align-items: center;
  min-height: 2.1rem;
  padding: 0.42rem 0.82rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.052);
  color: rgba(250, 250, 249, 0.88);
  font-size: 0.82rem;
  font-weight: 800;
}

.vault-chip--gold {
  border-color: rgba(125, 211, 252, 0.28);
  background: rgba(125, 211, 252, 0.11);
  color: #e0f2fe;
}

.vault-chip--green {
  border-color: rgba(52, 211, 153, 0.28);
  background: rgba(52, 211, 153, 0.1);
  color: #bbf7d0;
}

.vault-status {
  padding: 1.35rem;
}

.vault-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}

.vault-status-tile {
  min-height: 6.6rem;
  padding: 0.95rem;
  border-radius: 1.3rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.04);
}

.vault-status-label {
  display: block;
  color: var(--vault-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.vault-status-value {
  display: block;
  margin-top: 0.8rem;
  color: white;
  font-size: 1.55rem;
  font-weight: 900;
}

.vault-command {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.8rem;
  align-items: center;
  padding: 1rem;
  margin-bottom: 1.35rem;
}

.vault-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.2rem 0 0.9rem;
}

.vault-section h2 {
  margin: 0.2rem 0 0;
  color: white;
  font-size: 1.45rem;
  font-weight: 900;
  letter-spacing: -0.035em;
}

.vault-notes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.vault-note-card {
  min-height: 18rem;
  padding: 1rem;
}

.vault-note-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, #7dd3fc, #cbd5e1, #34d399);
  opacity: 0.72;
}

.vault-note-color {
  position: absolute;
  right: 1rem;
  top: 1rem;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.12);
}

.vault-note-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
  padding-right: 1.7rem;
}

.vault-note-title {
  margin: 0;
  color: white;
  font-size: 1.15rem;
  font-weight: 900;
}

.vault-note-site {
  margin: 0.3rem 0 0;
  color: var(--vault-muted);
  font-size: 0.86rem;
}

.vault-field-stack {
  display: grid;
  gap: 0.72rem;
  margin-top: 1rem;
}

.vault-field {
  display: grid;
  gap: 0.35rem;
  padding: 0.72rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.vault-field-label {
  color: rgba(125, 211, 252, 0.76);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.vault-field-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: rgba(250, 250, 249, 0.9);
  font-size: 0.9rem;
  word-break: break-word;
}

.vault-field-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 0.45rem;
}

.vault-mini-action {
  min-width: 2.05rem;
  min-height: 2.05rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.055);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.72rem;
  font-weight: 900;
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.vault-mini-action:hover {
  transform: translateY(-1px);
  border-color: rgba(125, 211, 252, 0.36);
}

.vault-note-actions {
  display: flex;
  gap: 0.65rem;
  margin-top: 1rem;
}

.vault-add-card {
  min-height: 18rem;
  display: grid;
  place-items: center;
  border-style: dashed;
  border-color: rgba(125, 211, 252, 0.3);
  color: rgba(250, 250, 249, 0.78);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.vault-add-card:hover {
  transform: translateY(-2px);
  border-color: rgba(125, 211, 252, 0.55);
  background-color: rgba(125, 211, 252, 0.045);
}

.vault-add-content {
  text-align: center;
}

.vault-add-plus {
  width: 4.4rem;
  height: 4.4rem;
  display: grid;
  place-items: center;
  margin: 0 auto 0.8rem;
  border-radius: 9999px;
  border: 1px solid rgba(125, 211, 252, 0.32);
  background: rgba(125, 211, 252, 0.08);
  color: #e0f2fe;
  font-size: 2rem;
  font-weight: 900;
}

.vault-toast {
  position: fixed;
  top: 5rem;
  left: 50%;
  z-index: 80;
  transform: translateX(-50%);
  padding: 0.72rem 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(52, 211, 153, 0.28);
  background: rgba(6, 78, 59, 0.9);
  color: #d1fae5;
  font-size: 0.84rem;
  font-weight: 900;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.42);
}

@keyframes vaultDialSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vault-dial {
    animation: none;
  }
}

@media (max-width: 1024px) {
  .vault-top,
  .vault-lock-card {
    grid-template-columns: 1fr;
  }

  .vault-lock-panel {
    min-height: 24rem;
    border-left: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.09);
  }

  .vault-notes-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .vault-shell {
    padding: 1rem 0.85rem 4rem;
  }

  .vault-lock-card,
  .vault-hero,
  .vault-status,
  .vault-command,
  .vault-note-card,
  .vault-add-card {
    border-radius: 1.45rem;
  }

  .vault-lock-copy,
  .vault-lock-panel,
  .vault-hero,
  .vault-status {
    padding: 1.1rem;
  }

  .vault-title {
    font-size: 2.7rem;
  }

  .vault-dial {
    width: 17rem;
    height: 17rem;
  }

  .vault-status-grid,
  .vault-command,
  .vault-notes-grid {
    grid-template-columns: 1fr;
  }

  .vault-section {
    align-items: flex-start;
    flex-direction: column;
  }

  .vault-note-actions {
    flex-direction: column;
  }
}
`


const maskPassword = "********"

const getDailyPassword = () => {
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, "0")
  const mm = String(today.getMonth() + 1).padStart(2, "0")
  const yy = String(today.getFullYear()).slice(-2)

  return dd + mm + yy
}

const safeText = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback
  return String(value)
}

const limitWords = (value, maxWords = 25) => {
  const words = safeText(value, "").trim().split(/\s+/).filter(Boolean)

  if (words.length <= maxWords) return safeText(value)

  return `${words.slice(0, maxWords).join(" ")}...`
}

export default function SecureNotes() {
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [showPassword, setShowPassword] = useState(null)

  const [vaultUnlocked, setVaultUnlocked] = useState(false)
  const [vaultPassword, setVaultPassword] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (vaultUnlocked) {
      loadNotes()
    }
  }, [vaultUnlocked])

  const loadNotes = async () => {
    const data = await getNotes()
    setNotes(data)
  }

  const handleDelete = async (id) => {
    await deleteNote(id)
    loadNotes()
  }

  const filtered = useMemo(() => {
    return notes.filter((note) => safeText(note.title, "").toLowerCase().includes(search.toLowerCase()))
  }, [notes, search])

  const copyText = (text) => {
    navigator.clipboard.writeText(safeText(text, ""))
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  useEffect(() => {
    let timer

    if (vaultUnlocked) {
      timer = setTimeout(() => {
        setVaultUnlocked(false)
        setShowPassword(null)
      }, 120000)
    }

    return () => clearTimeout(timer)
  }, [vaultUnlocked])

  const unlockVault = () => {
    if (vaultPassword === getDailyPassword()) {
      setVaultUnlocked(true)
      setVaultPassword("")
    } else {
      alert("Wrong Password")
    }
  }

  if (!vaultUnlocked) {
    return (
      <>
        <style>{vaultStyles}</style>

        <div className="vault-page vault-lock-screen">
          <div className="vault-orb vault-orb--gold" />
          <div className="vault-orb vault-orb--silver" />

          <div className="vault-lock-card">
            <div className="vault-lock-copy">
              <p className="vault-overline">Private Station Vault</p>
              <h1 className="vault-title">Secure Notes</h1>
              <p className="vault-copy">
                Passwords, websites, usernames, and sensitive station notes stay behind a date-coded lock with automatic
                timeout protection.
              </p>

              <div className="vault-lock-hints">
                <div className="vault-lock-hint">
                  <span>Auto lock</span>
                  <strong>120 sec</strong>
                </div>
                <div className="vault-lock-hint">
                  <span>Session mode</span>
                  <strong>Private</strong>
                </div>
              </div>
            </div>

            <div className="vault-lock-panel">
              <div className="vault-dial" />

              <div className="vault-unlock-form">
                <h2 className="vault-form-title">Enter Vault Password</h2>

                <input
                  type="password"
                  value={vaultPassword}
                  onChange={(event) => setVaultPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") unlockVault()
                  }}
                  className="vault-input"
                  placeholder="Enter your password"
                />

                <button onClick={unlockVault} className="vault-button vault-button--gold vault-button--full">
                  Unlock Vault
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{vaultStyles}</style>

      <div className="vault-page">
        <div className="vault-orb vault-orb--gold" />
        <div className="vault-orb vault-orb--silver" />

        <div className="vault-shell">
          <div className="vault-top">
            <section className="vault-hero">
              <p className="vault-overline">Private Station Vault</p>
              <h1 className="vault-title">Secure Notes</h1>
              <p className="vault-copy">
                A premium cipher board for login credentials, website references, private remarks, and fast copy actions.
              </p>

              <div className="vault-chip-row">
                <span className="vault-chip vault-chip--gold">{filtered.length} notes visible</span>
                <span className="vault-chip vault-chip--green">Vault unlocked</span>
                <span className="vault-chip">Auto-lock in 120 sec</span>
              </div>

              <div className="vault-hero-actions">
                <button
                  className="vault-button vault-button--gold"
                  onClick={() => {
                    setEditData(null)
                    setModalOpen(true)
                  }}
                >
                  + Add Note
                </button>

                <button
                  className="vault-button vault-button--ghost"
                  onClick={() => {
                    setVaultUnlocked(false)
                    setShowPassword(null)
                  }}
                >
                  Lock Vault
                </button>
              </div>
            </section>

            <aside className="vault-status">
              <p className="vault-overline">Vault Telemetry</p>
              <div className="vault-status-grid">
                <div className="vault-status-tile">
                  <span className="vault-status-label">Total</span>
                  <strong className="vault-status-value">{notes.length}</strong>
                </div>
                <div className="vault-status-tile">
                  <span className="vault-status-label">Visible</span>
                  <strong className="vault-status-value">{filtered.length}</strong>
                </div>
                <div className="vault-status-tile">
                  <span className="vault-status-label">Reveal</span>
                  <strong className="vault-status-value">{showPassword ? "On" : "Off"}</strong>
                </div>
                <div className="vault-status-tile">
                  <span className="vault-status-label">Mode</span>
                  <strong className="vault-status-value">Safe</strong>
                </div>
              </div>
            </aside>
          </div>

          <div className="vault-command">
            <input
              placeholder="Search note title..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="vault-input"
            />

            <button className="vault-button vault-button--ghost" onClick={() => setSearch("")}>
              Clear
            </button>

            <button
              className="vault-button vault-button--green"
              onClick={() => {
                setEditData(null)
                setModalOpen(true)
              }}
            >
              New Note
            </button>
          </div>

          <div className="vault-section">
            <div>
              <p className="vault-overline">Encrypted Board</p>
              <h2>Saved credentials and private notes</h2>
            </div>
            <span className="vault-chip vault-chip--gold">{filtered.length} cards</span>
          </div>

          <div className="vault-notes-grid">
            {filtered.map((note) => (
              <div key={note._id} className="vault-note-card">
                <div className={`vault-note-color ${note.color || ""}`} />

                <div className="vault-note-head">
                  <div>
                    <h2 className="vault-note-title">{safeText(note.title)}</h2>
                    <p className="vault-note-site">{safeText(note.website)}</p>
                  </div>

                  <button className="vault-mini-action" onClick={() => copyText(note.title)} title="Copy title">
                    CP
                  </button>
                </div>

                <div className="vault-field-stack">
                  <VaultField label="Website" value={note.website} onCopy={() => copyText(note.website)} />
                  <VaultField label="Username" value={note.username} onCopy={() => copyText(note.username)} />

                  <div className="vault-field">
                    <span className="vault-field-label">Password</span>
                    <div className="vault-field-value">
                      <span>{showPassword === note._id ? safeText(note.password) : maskPassword}</span>
                      <div className="vault-field-actions">
                        <button
                          className="vault-mini-action"
                          onClick={() => setShowPassword(showPassword === note._id ? null : note._id)}
                          title={showPassword === note._id ? "Hide password" : "Show password"}
                        >
                          {showPassword === note._id ? "HD" : "SH"}
                        </button>
                        <button className="vault-mini-action" onClick={() => copyText(note.password)} title="Copy password">
                          CP
                        </button>
                      </div>
                    </div>
                  </div>

                  <VaultField
                    label="Note"
                    value={note.note}
                    displayValue={limitWords(note.note, 25)}
                    onCopy={() => copyText(note.note)}
                  />
                </div>

                <div className="vault-note-actions">
                  <button
                    className="vault-button vault-button--ghost vault-button--small"
                    onClick={() => {
                      setEditData(note)
                      setModalOpen(true)
                    }}
                  >
                    Edit
                  </button>

                  <button className="vault-button vault-button--danger vault-button--small" onClick={() => handleDelete(note._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            <div
              onClick={() => {
                setEditData(null)
                setModalOpen(true)
              }}
              className="vault-add-card"
            >
              <div className="vault-add-content">
                <div className="vault-add-plus">+</div>
                <strong>Add Secure Note</strong>
                <p className="vault-note-site">Create a new private credential card.</p>
              </div>
            </div>
          </div>

          <SecureNoteModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditData(null)
            }}
            onSave={async () => {
              await loadNotes()
              setModalOpen(false)
              setEditData(null)
            }}
            editData={editData}
          />

          {copied && <div className="vault-toast">Copied to clipboard</div>}
        </div>
      </div>
    </>
  )
}

function VaultField({ label, value, displayValue, onCopy }) {
  return (
    <div className="vault-field">
      <span className="vault-field-label">{label}</span>
      <div className="vault-field-value">
        <span title={safeText(value)}>{safeText(displayValue ?? value)}</span>
        <button className="vault-mini-action" onClick={onCopy} title={`Copy ${label}`}>
          CP
        </button>
      </div>
    </div>
  )
}



// import { useEffect,useState } from "react"
// import {
// getNotes,
// deleteNote
// } from "../services/secureNoteApi"

// import SecureNoteModal from "../components/SecureNoteModal"

// export default function SecureNotes(){

// const [notes,setNotes] = useState([])
// const [search,setSearch] = useState("")
// const [modalOpen,setModalOpen] = useState(false)
// const [editData,setEditData] = useState(null)
// const [showPassword,setShowPassword] = useState(null)

// const [vaultUnlocked,setVaultUnlocked] = useState(false)
// const [vaultPassword,setVaultPassword] = useState("")
// const [copied,setCopied] = useState(false)

// useEffect(()=>{
// if(vaultUnlocked){
// loadNotes()
// }
// },[vaultUnlocked])

// const loadNotes = async()=>{
// const data = await getNotes()
// setNotes(data)
// }

// const handleDelete = async(id)=>{
// await deleteNote(id)
// loadNotes()
// }

// const filtered = notes.filter(n=>
// n.title.toLowerCase().includes(search.toLowerCase())
// )

// const copyText = (text)=>{
// navigator.clipboard.writeText(text)

// setCopied(true)

// setTimeout(()=>{
// setCopied(false)
// },2000)

// }

// // AUTO LOCK

// useEffect(()=>{

// let timer

// if(vaultUnlocked){

// timer=setTimeout(()=>{

// setVaultUnlocked(false)

// },120000)

// }

// return ()=>clearTimeout(timer)

// },[vaultUnlocked])



// /* VAULT LOCK SCREEN */

// if(!vaultUnlocked){

// return(

// <div className="flex items-center justify-center h-screen bg-[#04060B]">

// <div className="bg-[#0B0F17] p-6 rounded w-[350px]">

// <h2 className="text-lg mb-4 text-white">
// Enter Vault Password
// </h2>

// <input
// type="password"
// value={vaultPassword}
// onChange={(e)=>setVaultPassword(e.target.value)}
// className="border p-2 w-full"
// />

// <button
// onClick={()=>{

// const today = new Date()

// const dd = String(today.getDate()).padStart(2,"0")
// const mm = String(today.getMonth()+1).padStart(2,"0")
// const yy = String(today.getFullYear()).slice(-2) // last 2 digits

// const datePassword = dd + mm + yy

// if(vaultPassword === datePassword){

//   setVaultUnlocked(true)

// }else{

//   alert("Wrong Password")

// }

// }}
// className="mt-4 w-full bg-green-500 text-white p-2 rounded"
// >

// Unlock

// </button>

// </div>

// </div>

// )

// }


// return(

// <div className="p-3 sm:p-4 md:p-6">

// <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">
// Secure Notes
// </h1>

// <input
// placeholder="Search note..."
// value={search}
// onChange={(e)=>setSearch(e.target.value)}
// className="border p-2 mb-4 sm:mb-6 w-full sm:w-72 rounded bg-[#0B0F17] text-white"
// />

// {/* GRID RESPONSIVE */}

// <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 text-white">

// {filtered.map((n)=>(
// <div
// key={n._id}
// className={`p-4 sm:p-5 rounded-xl shadow-md ${n.color} ${
// n.color?.includes("yellow") || n.color?.includes("green") || n.color?.includes("orange")
// ? "text-black"
// : "text-white"
// }`}
// >

// <h2 className="font-semibold text-base sm:text-lg flex justify-between items-center">
// <span>{n.title}</span>

// <button
// className="text-xs sm:text-sm"
// onClick={()=>copyText(n.title)}
// >
// 📋
// </button>
// </h2>

// <p className="text-xs sm:text-sm mt-2 flex justify-between items-center">
// <span>{n.website}</span>

// <button onClick={()=>copyText(n.website)}>📋</button>
// </p>

// <p className="text-xs sm:text-sm mt-2 flex justify-between items-center">
// <span>Username: {n.username}</span>

// <button onClick={()=>copyText(n.username)}>📋</button>
// </p>

// <p className="text-xs sm:text-sm mt-2 flex justify-between items-center">

// <span>
// Password:
// {showPassword===n._id ? n.password : " ********"}
// </span>

// <div className="flex gap-2">
// <button
// onClick={()=>setShowPassword(
// showPassword===n._id ? null : n._id
// )}
// >
// 👁
// </button>

// <button onClick={()=>copyText(n.password)}>
// 📋
// </button>
// </div>

// </p>

// <p className="text-xs sm:text-sm mt-2 flex justify-between items-center">
// <span>{n.note}</span>

// <button onClick={()=>copyText(n.note)}>📋</button>
// </p>

// <div className="mt-3 flex gap-3 text-sm">

// <button
// className="text-blue-500"
// onClick={()=>{
// setEditData(n)
// setModalOpen(true)
// }}
// >
// Edit
// </button>

// <button
// className="text-red-500"
// onClick={()=>handleDelete(n._id)}
// >
// Delete
// </button>

// </div>

// </div>
// ))}


// {/* ADD NOTE */}

// <div
// onClick={()=>{
// setEditData(null)
// setModalOpen(true)
// }}
// className="border-2 border-dashed flex items-center justify-center rounded-xl h-[120px] sm:h-[150px] cursor-pointer text-gray-400 hover:text-white"
// >

// + Add Note

// </div>

// </div>


// <SecureNoteModal
// open={modalOpen}
// onClose={()=>setModalOpen(false)}
// onSave={loadNotes}
// editData={editData}
// />

// {/* TOAST */}

// {copied && (

// <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg text-xs sm:text-sm">

// Copied to clipboard

// </div>

// )}

// </div>

// )

// }
















// NO Lock for exam

// import { useEffect, useState } from "react"
// import {
//   getNotes,
//   deleteNote
// } from "../services/secureNoteApi"

// import SecureNoteModal from "../components/SecureNoteModal"

// export default function SecureNotes(){

//   const [notes,setNotes] = useState([])
//   const [search,setSearch] = useState("")
//   const [modalOpen,setModalOpen] = useState(false)
//   const [editData,setEditData] = useState(null)
//   const [showPassword,setShowPassword] = useState(null)

//   const [copied,setCopied] = useState(false)

//   // LOAD NOTES DIRECTLY
//   useEffect(()=>{
//     loadNotes()
//   },[])

//   const loadNotes = async()=>{
//     const data = await getNotes()
//     setNotes(data)
//   }

//   const handleDelete = async(id)=>{
//     await deleteNote(id)
//     loadNotes()
//   }

//   const filtered = notes.filter(n=>
//     n.title.toLowerCase().includes(search.toLowerCase())
//   )

//   const copyText = (text)=>{
//     navigator.clipboard.writeText(text)

//     setCopied(true)

//     setTimeout(()=>{
//       setCopied(false)
//     },2000)
//   }

//   return(

//     <div className="p-3 sm:p-4 md:p-6">

//       <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">
//         Secure Notes
//       </h1>

//       <input
//         placeholder="Search note..."
//         value={search}
//         onChange={(e)=>setSearch(e.target.value)}
//         className="border p-2 mb-4 sm:mb-6 w-full sm:w-72 rounded bg-[#0B0F17] text-white"
//       />

//       {/* GRID */}

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 text-white">

//         {filtered.map((n)=>(
//           <div
//             key={n._id}
//             className={`p-4 sm:p-5 rounded-xl shadow-md ${n.color} ${
//               n.color?.includes("yellow") || n.color?.includes("green") || n.color?.includes("orange")
//               ? "text-black"
//               : "text-white"
//             }`}
//           >

//             <h2 className="font-semibold text-base sm:text-lg flex justify-between items-center">
//               <span>{n.title}</span>

//               <button
//                 className="text-xs sm:text-sm"
//                 onClick={()=>copyText(n.title)}
//               >
//                 📋
//               </button>
//             </h2>

//             <p className="text-xs sm:text-sm mt-2 flex justify-between items-center">
//               <span>{n.website}</span>
//               <button onClick={()=>copyText(n.website)}>📋</button>
//             </p>

//             <p className="text-xs sm:text-sm mt-2 flex justify-between items-center">
//               <span>Username: {n.username}</span>
//               <button onClick={()=>copyText(n.username)}>📋</button>
//             </p>

//             <p className="text-xs sm:text-sm mt-2 flex justify-between items-center">

//               <span>
//                 Password:
//                 {showPassword===n._id ? n.password : " ********"}
//               </span>

//               <div className="flex gap-2">
//                 <button
//                   onClick={()=>setShowPassword(
//                     showPassword===n._id ? null : n._id
//                   )}
//                 >
//                   👁
//                 </button>

//                 <button onClick={()=>copyText(n.password)}>
//                   📋
//                 </button>
//               </div>

//             </p>

//             <p className="text-xs sm:text-sm mt-2 flex justify-between items-center">
//              <span>
//               {n.note.length > 10 ? n.note.slice(0, 10) + "..." : n.note}
//             </span>
//               <button onClick={()=>copyText(n.note)}>📋</button>
//             </p>

//             <div className="mt-3 flex gap-3 text-sm">

//               <button
//                 className="text-blue-500"
//                 onClick={()=>{
//                   setEditData(n)
//                   setModalOpen(true)
//                 }}
//               >
//                 Edit
//               </button>

//               <button
//                 className="text-red-500"
//                 onClick={()=>handleDelete(n._id)}
//               >
//                 Delete
//               </button>

//             </div>

//           </div>
//         ))}

//         {/* ADD NOTE */}

//         <div
//           onClick={()=>{
//             setEditData(null)
//             setModalOpen(true)
//           }}
//           className="border-2 border-dashed flex items-center justify-center rounded-xl h-[120px] sm:h-[150px] cursor-pointer text-gray-400 hover:text-white"
//         >
//           + Add Note
//         </div>

//       </div>

//       <SecureNoteModal
//         open={modalOpen}
//         onClose={()=>setModalOpen(false)}
//         onSave={loadNotes}
//         editData={editData}
//       />

//       {/* TOAST */}

//       {copied && (
//         <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg text-xs sm:text-sm">
//           Copied to clipboard
//         </div>
//       )}

//     </div>
//   )
// }