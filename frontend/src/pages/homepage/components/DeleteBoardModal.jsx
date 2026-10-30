import { useEffect, useState } from "react";
import { TriangleAlert, X } from "lucide-react";

export default function DeleteBoardModal({ board, onConfirm, onClose }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const matches = typed.trim() === board.name.trim();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!matches) return;

    setDeleting(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-board-title"
        className="w-full max-w-sm space-y-4 rounded-2xl bg-canvas p-5 shadow-xl"
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
              <TriangleAlert size={16} />
            </span>

            <h2
              id="delete-board-title"
              className="min-w-0 flex-1 break-words text-base font-bold leading-snug"
            >
              Delete this board?
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 self-start text-slate-500 hover:text-slate-900"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-xs leading-relaxed text-slate-600">
            <span className="font-semibold">{board.name}</span>, all of its stories, and
            everyone's access to it will be permanently deleted. This can't be undone.
          </p>
        </div>

        <div>
          <label htmlFor="confirm-name" className="mb-1 block text-xs font-medium">
            Type the board name to confirm
          </label>
          <input
            id="confirm-name"
            autoFocus
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={board.name}
            className="w-full rounded-lg border border-brand-muted/50 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-brand-muted/50 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            disabled={!matches || deleting}
            className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Deleting..." : "Delete board"}
          </button>
        </div>
      </form>
    </div>
  );
}