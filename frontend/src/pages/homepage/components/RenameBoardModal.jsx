import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function RenameBoardModal({ board, onSave, onClose }) {
  const [name, setName] = useState(board.name);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-title"
        className="w-full max-w-sm space-y-3 rounded-2xl bg-canvas p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="rename-title" className="text-base font-bold">
            Rename board
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 hover:text-slate-900"
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
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-lg border border-brand-muted/50 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          disabled={saving}
          className="w-full rounded-lg bg-brand py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save name"}
        </button>
      </form>
    </div>
  );
}