import { useEffect, useState } from "react";
import { TriangleAlert, X } from "lucide-react";
import { deleteAccount } from "../../API/account";
import { parseError } from "../../API/api";
import Field from "../Field";

export default function DeleteAccountModal({ onDeleted, onClose }) {
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ fields: {}, form: "" });
  const [busy, setBusy] = useState(false);

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
    setErrors({ fields: {}, form: "" });

    try {
      await deleteAccount(password);

      // the account is gone, so this signs out and returns to the start page
      await onDeleted();
    } catch (err) {
      setErrors(parseError(err));
      setBusy(false);
    }
  }

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[60] grid place-items-center bg-scrim p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="w-full max-w-sm space-y-4 rounded-2xl bg-canvas p-5 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
            <TriangleAlert size={16} />
          </span>

          <h2
            id="delete-account-title"
            className="min-w-0 flex-1 text-base font-bold leading-snug"
          >
            Delete your account?
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

        <div className="space-y-2 text-xs leading-relaxed text-slate-600">
          <p>This permanently deletes:</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              The boards you own and all their stories, for everyone you shared them with
            </li>
            <li>Your notes and folders</li>
            <li>Your notifications and every login</li>
          </ul>
          <p>
            Boards you were invited to are not deleted: you just leave them. This can't be
            undone.
          </p>
        </div>

        {errors.form && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {errors.form}
          </div>
        )}

        <Field
          label="Enter your password to confirm"
          id="delete-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          maxLength={255}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors({ fields: {}, form: "" });
          }}
          error={errors.fields.password}
          required
        />

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="flex-1 rounded-lg border border-brand-muted/50 bg-surface py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={busy || !password}
            className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </form>
    </div>
  );
}