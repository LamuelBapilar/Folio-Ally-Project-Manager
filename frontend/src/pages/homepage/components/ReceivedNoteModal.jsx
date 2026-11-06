import { useEffect, useState } from "react";
import { Check, Share2, X } from "lucide-react";
import {
  acceptNoteShare,
  declineNoteShare,
  getFolders,
  getReceivedShare,
} from "../../../API/notes";
import { timeAgo } from "../../../utils/time";

export default function ReceivedNoteModal({ id, onClose, onViewNotes }) {
  const [share, setShare] = useState(null); // null = still loading
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState("");
  const [error, setError] = useState(""); // nothing to show at all
  const [problem, setProblem] = useState(""); // something failed, but the note is still shown
  const [busy, setBusy] = useState(null); // null, "accept", or "decline"
  const [saved, setSaved] = useState(null); // { folder } once the copy exists

  useEffect(() => {
    let cancelled = false;

    Promise.all([getReceivedShare(id), getFolders()])
      .then(([data, folderData]) => {
        if (cancelled) return;
        setShare(data);
        setFolders(folderData.folders);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.status === 404 ? "This shared note is no longer available." : err.message
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  async function respond(accept) {
    setBusy(accept ? "accept" : "decline");
    setProblem("");

    try {
      if (accept) {
        const result = await acceptNoteShare(id, folderId ? Number(folderId) : null);

        window.dispatchEvent(new Event("notes-changed"));
        window.dispatchEvent(new Event("notifications-changed"));
        setSaved({ folder: result.folder });
      } else {
        await declineNoteShare(id);

        window.dispatchEvent(new Event("notifications-changed"));
        onClose();
      }
    } catch (err) {
      setProblem(err.errors?.note?.[0] ?? err.errors?.folder_id?.[0] ?? err.message);
    } finally {
      setBusy(null);
    }
  }

  const close = () => {
    if (!busy) onClose();
  };

  const pending = share?.status === "pending";
  const daysLeft = share
    ? Math.max(0, Math.ceil((new Date(share.expires_at) - Date.now()) / 86400000))
    : 0;

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 grid place-items-center bg-scrim p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="received-note-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-canvas p-5 shadow-xl"
      >
        {/* while loading, or when the share is gone, there is no title row yet */}
        {!share && (
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 text-slate-500 hover:text-slate-900"
          >
            <X size={14} />
          </button>
        )}

        {!share && !error && (
          <p className="py-6 text-center text-xs text-slate-500">Loading shared note...</p>
        )}

        {!share && error && (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-700">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              Close
            </button>
          </div>
        )}

        {share && saved && (
          <div className="py-3 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-low/15 text-low">
              <Check size={18} />
            </span>
            <h2 id="received-note-title" className="mt-3 text-base font-bold">
              Saved to your notes
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              <span className="font-semibold">{share.title || "Untitled"}</span> is now in{" "}
              {saved.folder ? <span className="font-semibold">{saved.folder}</span> : "Unfiled"}.
            </p>

            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-brand-muted/50 bg-surface py-2 text-xs font-semibold text-slate-700 hover:bg-brand-soft"
              >
                Close
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  onViewNotes();
                  onClose();
                }}
                className="flex-1 rounded-lg bg-brand py-2 text-xs font-semibold text-white hover:bg-brand-dark"
              >
                View notes
              </button>
            </div>
          </div>
        )}

        {share && !saved && (
          <>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Share2 size={16} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                  Shared note
                </p>
                <h2
                  id="received-note-title"
                  className="mt-0.5 break-words text-base font-bold leading-snug"
                >
                  {share.sender.name} shared a note with you
                </h2>
              </div>

              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="mt-0.5 shrink-0 text-slate-500 hover:text-slate-900"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-brand-muted/40 bg-surface p-3.5">
              <p className="break-words text-sm font-semibold">{share.title || "Untitled"}</p>
              <p className="mt-1 line-clamp-4 break-words text-xs leading-relaxed text-slate-600">
                {share.preview || "No additional text"}
              </p>
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              Sent by {share.sender.email} · {timeAgo(share.created_at)}
              {pending && ` · expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
            </p>

            {problem && (
              <p role="alert" className="mt-3 text-xs text-red-600">
                {problem}
              </p>
            )}

            {pending ? (
              <>
                <div className="mt-4">
                  <label htmlFor="share-folder" className="mb-1 block text-xs font-medium">
                    Save to
                  </label>
                  <select
                    id="share-folder"
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full rounded-lg border border-brand-muted/50 bg-surface px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Unfiled</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  You get your own copy. Changes you make won't change the original, and{" "}
                  {share.sender.name} won't see your copy.
                </p>

                <div className="mt-4 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => respond(false)}
                    disabled={busy !== null}
                    className="flex-1 rounded-lg border border-brand-muted/50 bg-surface py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-brand-soft disabled:opacity-50"
                  >
                    {busy === "decline" ? "Declining..." : "Decline"}
                  </button>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => respond(true)}
                    disabled={busy !== null}
                    className="flex-1 rounded-lg bg-brand py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                  >
                    {busy === "accept" ? "Saving..." : "Save to my notes"}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-xs text-slate-600">
                  {share.status === "accepted" && "You already saved this note."}
                  {share.status === "declined" && "You declined this note."}
                  {share.status === "expired" && "This shared note has expired."}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 w-full rounded-lg border border-brand-muted/50 bg-surface py-2 text-xs font-semibold text-slate-700 hover:bg-brand-soft"
                >
                  Close
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}