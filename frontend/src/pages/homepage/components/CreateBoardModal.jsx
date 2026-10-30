import { useEffect, useState } from "react";
import { Kanban, X } from "lucide-react";

export default function CreateBoardModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const close = () => {
    if (!creating) onClose();
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !creating && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, creating]);

  async function handleSubmit(e) {
    e.preventDefault();

    const next = name.trim();
    if (!next) return;

    setCreating(true);
    setError("");

    try {
      await onCreate(next);
      onClose();
    } catch (err) {
      setError(err.errors?.name?.[0] ?? err.message);
      setCreating(false);
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
        aria-labelledby="create-board-title"
        className="w-full max-w-sm space-y-4 rounded-2xl bg-canvas p-5 shadow-xl"
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <Kanban size={16} />
            </span>

            <h2
              id="create-board-title"
              className="min-w-0 flex-1 break-words text-base font-bold leading-snug"
            >
              Create a board
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

          <p className="text-xs leading-relaxed text-slate-600">
            Folio sets up four columns for you: BackLog, To do, In Progress, and Done.
          </p>
        </div>

        <div>
          <label htmlFor="new-board-name" className="mb-1 block text-xs font-medium">
            Board name
          </label>
          <input
            id="new-board-name"
            autoFocus
            autoComplete="off"
            maxLength={255}
            placeholder="e.g. Product launch"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "new-board-error" : undefined}
            className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand ${
              error ? "border-red-400" : "border-brand-muted/50"
            }`}
          />
          {error && (
            <p id="new-board-error" role="alert" className="mt-1 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={close}
            disabled={creating}
            className="flex-1 rounded-lg border border-brand-muted/50 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={creating || !name.trim()}
            className="flex-1 rounded-lg bg-brand py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create board"}
          </button>
        </div>
      </form>
    </div>
  );
}