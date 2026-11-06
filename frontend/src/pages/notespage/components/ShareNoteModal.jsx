import { useCallback, useEffect, useState } from "react";
import { Share2, X } from "lucide-react";
import { cancelNoteShare, getNoteShares, shareNote } from "../../../API/notes";
import { timeAgo } from "../../../utils/time";

const STATUS = {
  pending: { label: "Waiting", style: "bg-brand-soft text-brand" },
  accepted: { label: "Saved", style: "bg-low/15 text-low" },
  declined: { label: "Declined", style: "bg-slate-100 text-slate-500" },
  expired: { label: "Expired", style: "bg-slate-100 text-slate-500" },
};

export default function ShareNoteModal({ note, onClose }) {
  const [shares, setShares] = useState(null); // null = not loaded yet
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setShares((await getNoteShares(note.id)).data);
    } catch (err) {
      setError(err.message);
    }
  }, [note.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setNotice("");
    setSending(true);

    const sent = email.trim();

    try {
      await shareNote(note.id, sent);
      setNotice(`Sent to ${sent}. They'll get a notification and can save their own copy.`);
      setEmail("");
      await load();
    } catch (err) {
      setError(err.errors?.email?.[0] ?? err.message);
    } finally {
      setSending(false);
    }
  }

  async function cancel(share) {
    setError("");
    setNotice("");

    try {
      await cancelNoteShare(note.id, share.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-scrim p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-note-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-canvas p-5 shadow-xl"
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <Share2 size={16} />
            </span>

            <div className="min-w-0 flex-1">
              <h2 id="share-note-title" className="text-base font-bold leading-snug">
                Share note
              </h2>
              <p className="truncate text-[11px] text-slate-500">{note.title || "Untitled"}</p>
            </div>

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
            They can save their own copy. Changes you make to your note later won't change
            theirs, and you won't see their copy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <label htmlFor="share-email" className="block text-xs font-medium">
            Send to
          </label>
          <div className="flex gap-2">
            <input
              id="share-email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="name@example.com"
              className="min-w-0 flex-1 rounded-lg border border-brand-muted/50 bg-surface px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              disabled={sending}
              className="shrink-0 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
        {notice && <p className="text-xs text-brand">{notice}</p>}

        <div>
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Shared with
          </h3>

          {shares === null && !error && (
            <p className="py-2 text-xs text-slate-500">Loading...</p>
          )}

          {shares?.length === 0 && (
            <p className="py-2 text-xs text-slate-500">Not shared with anyone yet.</p>
          )}

          {shares?.length > 0 && (
            <ul className="max-h-48 overflow-y-auto">
              {shares.map((share) => {
                const status = STATUS[share.status] ?? STATUS.pending;

                return (
                  <li key={share.id} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{share.email}</span>
                      <span className="block text-[10px] text-slate-500">
                        Sent {timeAgo(share.created_at)}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${status.style}`}
                    >
                      {status.label}
                    </span>

                    {share.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => cancel(share)}
                        aria-label={`Cancel the share to ${share.email}`}
                        title="Cancel"
                        className="shrink-0 text-slate-400 hover:text-red-500"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}