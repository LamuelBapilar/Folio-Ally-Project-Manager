import { useEffect, useState } from "react";
import { Info, TriangleAlert, X } from "lucide-react";

export default function ConfirmModal({
  title,
  children,
  confirmLabel = "Confirm",
  busyLabel = "Working...",
  danger = false,
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (!busy) onClose();
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  async function handleSubmit(e) {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const Icon = danger ? TriangleAlert : Info;

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/40 p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role={danger ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-sm space-y-4 rounded-2xl bg-canvas p-5 shadow-xl"
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                danger ? "bg-red-100 text-red-600" : "bg-brand-soft text-brand"
              }`}
            >
              <Icon size={16} />
            </span>

            <h2
              id="confirm-title"
              className="min-w-0 flex-1 break-words text-base font-bold leading-snug"
            >
              {title}
            </h2>

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="shrink-0 self-start text-slate-500 hover:text-slate-900"
            >
              <X size={14} />
            </button>
          </div>

          <p id="confirm-message" className="text-xs leading-relaxed text-slate-600">
            {children}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-2.5">
          {/* for something destructive, the safe choice has the focus */}
          <button
            type="button"
            autoFocus={danger}
            onClick={close}
            disabled={busy}
            className="flex-1 rounded-lg border border-brand-muted/50 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            autoFocus={!danger}
            disabled={busy}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-dark"
            }`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}