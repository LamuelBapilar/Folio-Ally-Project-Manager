import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  cancelInvite,
  getMembers,
  inviteUser,
  removeMember,
} from "../../../API/members";
import ConfirmModal from "./ConfirmModal";

function Avatar({ name }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand">
      {name?.charAt(0).toUpperCase()}
    </span>
  );
}

function Row({ name, email, tag, action }) {
  return (
    <li className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
      <Avatar name={name ?? email} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{name ?? email}</span>
        {name && (
          <span className="block truncate text-[10px] text-slate-500">{email}</span>
        )}
      </span>
      {tag && (
        <span className="shrink-0 rounded bg-brand-soft px-1.5 py-0.5 text-[9px] font-semibold text-brand">
          {tag}
        </span>
      )}
      {action}
    </li>
  );
}

export default function ShareModal({ board, user, onClose, onLeave }) {
  const isOwner = board.user_id === user.id;

  const [people, setPeople] = useState(null); // null = not loaded yet
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  // null, { kind: "remove", member }, or { kind: "leave" }
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setPeople(await getMembers(board.id));
    } catch (err) {
      setError(err.message);
    }
  }, [board.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // while a confirmation is open, it handles Escape by itself
    if (confirm) return;

    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, confirm]);

  async function handleInvite(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSending(true);

    const sent = email.trim();

    try {
      await inviteUser(board.id, sent);
      setNotice(`${sent} will get a notification in Folio.`);
      setEmail("");
      await load();
    } catch (err) {
      setError(err.errors?.email?.[0] ?? err.message);
    } finally {
      setSending(false);
    }
  }

  async function run(action) {
    setError("");
    setNotice("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const removeButton = "text-slate-400 hover:text-red-500";

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm space-y-4 rounded-2xl bg-canvas p-5 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold">Share board</h2>
              <p className="truncate text-[11px] text-slate-500">{board.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-slate-500 hover:text-slate-900"
            >
              <X size={14} />
            </button>
          </div>

          {isOwner && (
            <form onSubmit={handleInvite} className="space-y-1.5">
              <label htmlFor="invite-email" className="block text-xs font-medium">
                Invite by email
              </label>
              <div className="flex gap-2">
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="min-w-0 flex-1 rounded-lg border border-brand-muted/50 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  disabled={sending}
                  className="shrink-0 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {sending ? "Inviting..." : "Invite"}
                </button>
              </div>
            </form>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
          {notice && <p className="text-xs text-brand">{notice}</p>}

          <div>
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              People with access
            </h3>

            {people === null && !error && (
              <p className="py-2 text-xs text-slate-500">Loading...</p>
            )}

            {people && (
              <ul>
                <Row
                  name={people.owner.name}
                  email={people.owner.email}
                  tag={people.owner.id === user.id ? "Owner · you" : "Owner"}
                />

                {people.members.map((member) => (
                  <Row
                    key={member.id}
                    name={member.name}
                    email={member.email}
                    tag={member.id === user.id ? "You" : null}
                    action={
                      isOwner && (
                        <button
                          type="button"
                          onClick={() => setConfirm({ kind: "remove", member })}
                          aria-label={`Remove ${member.name}`}
                          className={removeButton}
                        >
                          <X size={13} />
                        </button>
                      )
                    }
                  />
                ))}
              </ul>
            )}
          </div>

          {isOwner && people?.invitations.length > 0 && (
            <div>
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Pending invitations
              </h3>
              <ul>
                {people.invitations.map((invite) => (
                  <Row
                    key={invite.id}
                    email={invite.email}
                    tag="Pending"
                    action={
                      <button
                        type="button"
                        onClick={() => run(() => cancelInvite(board.id, invite.id))}
                        aria-label={`Cancel invitation for ${invite.email}`}
                        className={removeButton}
                      >
                        <X size={13} />
                      </button>
                    }
                  />
                ))}
              </ul>
            </div>
          )}

          {!isOwner && (
            <button
              type="button"
              onClick={() => setConfirm({ kind: "leave" })}
              className="w-full rounded-lg border border-red-200 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Leave board
            </button>
          )}
        </div>
      </div>

      {confirm?.kind === "remove" && (
        <ConfirmModal
          danger
          title={`Remove ${confirm.member.name}?`}
          confirmLabel="Remove"
          busyLabel="Removing..."
          onConfirm={async () => {
            await removeMember(board.id, confirm.member.id);
            await load();
          }}
          onClose={() => setConfirm(null)}
        >
          <span className="font-semibold">{confirm.member.name}</span> will lose access to{" "}
          <span className="font-semibold">{board.name}</span>, and any stories assigned to
          them become unassigned.
        </ConfirmModal>
      )}

      {confirm?.kind === "leave" && (
        <ConfirmModal
          danger
          title={`Leave "${board.name}"?`}
          confirmLabel="Leave board"
          busyLabel="Leaving..."
          onConfirm={async () => {
            await removeMember(board.id, user.id);
            onClose();
            onLeave();
          }}
          onClose={() => setConfirm(null)}
        >
          You will lose access to this board, and any stories assigned to you become
          unassigned. The owner can invite you again.
        </ConfirmModal>
      )}
    </>
  );
}