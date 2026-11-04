import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

export default function RenameBoardModal({ board, onSave, onClose }) {
  const [name, setName] = useState(board.name);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (!saving) onClose();
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  async function handleSubmit(e) {
    e.preventDefault();

    const next = name.trim();

    // nothing to save
    if (!next || next === board.name) {
      onClose();
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(next);
      onClose();
    } catch (err) {
      setError(err.errors?.name?.[0] ?? err.message);
      setSaving(false);
    }
  }

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-title"
        className="w-full max-w-sm space-y-4 rounded-2xl bg-canvas p-5 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
            <Pencil size={16} />
          </span>

          <h2 id="rename-title" className="min-w-0 flex-1 text-base font-bold leading-snug">
            Rename board
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

        <div>
          <label htmlFor="board-name" className="mb-1 block text-xs font-medium">
            Board name
          </label>
          <input
            id="board-name"
            autoFocus
            required
            maxLength={255}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onFocus={(e) => e.target.select()}
            aria-invalid={error ? "true" : undefined}
            className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand ${
              error ? "border-red-400" : "border-brand-muted/50"
            }`}
          />
          {error && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="flex-1 rounded-lg border border-brand-muted/50 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={saving || !name.trim()}
            className="flex-1 rounded-lg bg-brand py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save name"}
          </button>
        </div>
      </form>
    </div>
  );
}