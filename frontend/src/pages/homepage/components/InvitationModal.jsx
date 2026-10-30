import { useEffect, useState } from "react";
import { ListChecks, UserPlus, Users, X } from "lucide-react";
import {
  acceptInvitation,
  declineInvitation,
  getInvitation,
} from "../../../API/members";
import { timeAgo } from "../../../utils/time";

function Stat({ icon: Icon, children }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-600">
      <Icon size={13} className="text-brand" />
      {children}
    </span>
  );
}

export default function InvitationModal({ id, onClose, onAccepted }) {
  const [invite, setInvite] = useState(null); // null = still loading
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null); // null, "accept", or "decline"

  useEffect(() => {
    let cancelled = false;

    getInvitation(id)
      .then((data) => !cancelled && setInvite(data))
      .catch(
        (err) =>
          !cancelled &&
          setError(
            err.status === 404 ? "This invitation is no longer available." : err.message
          )
      );

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function respond(accept) {
    setBusy(accept ? "accept" : "decline");
    setError("");

    try {
      if (accept) {
        const { board_id } = await acceptInvitation(id);
        window.dispatchEvent(new Event("notifications-changed"));
        onAccepted(board_id);
      } else {
        await declineInvitation(id);
        window.dispatchEvent(new Event("notifications-changed"));
      }

      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  }

  const pending = invite?.status === "pending";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitation-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-canvas p-5 shadow-xl"
      >
        {/* while loading, or when the invitation is gone, there is no title row yet */}
        {!invite && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-slate-500 hover:text-slate-900"
          >
            <X size={14} />
          </button>
        )}

        {!invite && !error && (
          <p className="py-6 text-center text-xs text-slate-500">Loading invitation...</p>
        )}

        {!invite && error && (
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

        {invite && (
          <>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <UserPlus size={16} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                  Board invitation
                </p>
                <h2
                  id="invitation-title"
                  className="mt-0.5 break-words text-base font-bold leading-snug"
                >
                  {invite.inviter.name} invited you to join{" "}
                  <span className="text-brand">{invite.board.name}</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="mt-0.5 shrink-0 text-slate-500 hover:text-slate-900"
              >
                <X size={14} />
              </button>
            </div>

            {invite.board.description && (
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                {invite.board.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 rounded-xl border border-brand-muted/40 bg-white px-3.5 py-2.5">
              <Stat icon={Users}>
                {invite.board.people_count}{" "}
                {invite.board.people_count === 1 ? "person" : "people"}
              </Stat>
              <Stat icon={ListChecks}>
                {invite.board.stories_count}{" "}
                {invite.board.stories_count === 1 ? "story" : "stories"}
              </Stat>
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              Sent by {invite.inviter.email} · {timeAgo(invite.created_at)}
            </p>

            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

            {pending ? (
              <>
                <p className="mt-4 text-[11px] text-slate-500">
                  As a member you can add, edit, and move stories on this board.
                </p>

                <div className="mt-4 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => respond(false)}
                    disabled={busy !== null}
                    className="flex-1 rounded-lg border border-brand-muted/50 bg-white py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-brand-soft disabled:opacity-50"
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
                    {busy === "accept" ? "Joining..." : "Accept invitation"}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-xs text-slate-600">
                  {invite.status === "accepted"
                    ? "You already joined this board."
                    : "You declined this invitation. Ask the owner to invite you again if you change your mind."}
                </p>

                <div className="mt-4 flex gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-brand-muted/50 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-brand-soft"
                  >
                    Close
                  </button>
                  {invite.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => {
                        onAccepted(invite.board.id);
                        onClose();
                      }}
                      className="flex-1 rounded-lg bg-brand py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      Open board
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}