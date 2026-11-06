import { useState } from "react";
import { Pencil } from "lucide-react";
import Modal, { ModalHeader } from "../../../components/Modal";

/**
 * Asks for a new board name, then calls `onSave(name)`.
 * If onSave throws (for example the server says the name is invalid),
 * the message is shown inside the window and the window stays open.
 */
export default function RenameBoardModal({ board, onSave, onClose }) {
  const [name, setName] = useState(board.name);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const next = name.trim();

    // Nothing to save: just close.
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
    // dismissible={!saving}: the window can't be closed while the request is running
    <Modal labelledBy="rename-title" onClose={onClose} dismissible={!saving}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <ModalHeader
          icon={Pencil}
          title="Rename board"
          titleId="rename-title"
          onClose={onClose}
          closeDisabled={saving}
        />

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
            className={`w-full rounded-lg border bg-surface px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand ${
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
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg border border-brand-muted/50 bg-surface py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-soft disabled:opacity-50"
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
    </Modal>
  );
}