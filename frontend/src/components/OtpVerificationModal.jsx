export default function OtpVerificationModal({
  open,
  title,
  otpCode,
  otpInput,
  error,
  description,
  confirmLabel = "Verify & Continue",
  onChange,
  onConfirm,
  onClose,
  submitting = false,
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
        <h3 className="text-xl font-semibold text-[color:var(--text-strong)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          {description}
        </p>

        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">OTP Code</p>
          <p className="mt-2 text-3xl font-semibold tracking-[0.22em] text-emerald-300">
            {otpCode}
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-[color:var(--text-secondary)]">
            Enter the same 4-digit OTP
          </label>
          <input
            value={otpInput}
            maxLength={4}
            inputMode="numeric"
            autoFocus
            onChange={(event) =>
              onChange(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="0000"
            className="input text-center text-xl tracking-[0.26em]"
          />
          {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-5 py-3 font-medium text-[color:var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-2xl bg-emerald-600 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Verifying..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
