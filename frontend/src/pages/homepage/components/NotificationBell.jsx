import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  Clock,
  FileCheck,
  FileX,
  Share2,
  TriangleAlert,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { getNotifications, markNotificationsRead } from "../../../API/notification";
import { timeAgo } from "../../../utils/time";

const POLL_MS = 60 * 1000; // check again every minute while the tab is open

// kind: "invite" and "share" need an answer, "board" opens a board, "info" is only read
const TYPES = {
  board_invitation: { icon: UserPlus, tone: "bg-brand-soft text-brand", kind: "invite" },
  note_share: { icon: Share2, tone: "bg-brand-soft text-brand", kind: "share" },
  invitation_accepted: { icon: UserCheck, tone: "bg-low/15 text-low", kind: "board" },
  invitation_declined: { icon: UserX, tone: "bg-slate-100 text-slate-500", kind: "board" },
  note_share_accepted: { icon: FileCheck, tone: "bg-low/15 text-low", kind: "info" },
  note_share_declined: { icon: FileX, tone: "bg-slate-100 text-slate-500", kind: "info" },
  story_due_soon: { icon: Clock, tone: "bg-medium/20 text-medium", kind: "board" },
  story_due_today: { icon: CalendarClock, tone: "bg-high/15 text-high", kind: "board" },
  story_overdue: { icon: TriangleAlert, tone: "bg-red-100 text-red-600", kind: "board" },
  story_assigned: { icon: UserCheck, tone: "bg-low/15 text-low", kind: "board" },
};

const FALLBACK = { icon: Bell, tone: "bg-slate-100 text-slate-500", kind: "info" };

const ANSWERED = {
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default function NotificationBell({
  currentBoardId,
  onOpenBoard,
  onReview,
  onReviewShare,
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null); // null = not loaded yet
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const ref = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const { data, unread_count } = await getNotifications();
      setItems(data);
      setUnread(unread_count);
      setError("");
    } catch {
      setError("Could not load notifications.");
    }
  }, []);

  useEffect(() => {
    refresh();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();

    window.addEventListener("notifications-changed", refresh);
    window.addEventListener("stories-changed", refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener("notifications-changed", refresh);
      window.removeEventListener("stories-changed", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // update the list right away, save it, then reload so the badge matches the database
  async function markRead(ids) {
    const now = new Date().toISOString();

    setItems((list) =>
      list.map((n) =>
        !n.read_at && (!ids || ids.includes(n.id)) ? { ...n, read_at: now } : n
      )
    );

    try {
      await markNotificationsRead(ids);
    } finally {
      refresh();
    }
  }

  // the state of the thing an invitation or a shared note points at
  function answerOf(n, kind) {
    return (kind === "invite" ? n.invitation?.status : n.share?.status) ?? "cancelled";
  }

  function openItem(n) {
    const { kind } = TYPES[n.type] ?? FALLBACK;

    if (kind === "invite" || kind === "share") {
      // only one that is still waiting can be answered; anything else is just marked as read
      if (answerOf(n, kind) === "pending") {
        setOpen(false);

        if (kind === "invite") onReview(n.invitation.id);
        else onReviewShare(n.share.id);
      } else if (!n.read_at) {
        markRead([n.id]);
      }
      return;
    }

    if (!n.read_at) markRead([n.id]);

    if (kind === "info") return;

    // this person was removed from the board, so there is nowhere to go
    if (!n.can_open) return;

    setOpen(false);
    if (n.board_id && n.board_id !== currentBoardId) onOpenBoard(n.board_id);
  }

  const list = items ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-brand-soft bg-white text-slate-900 shadow-lg">
          <div className="flex items-center justify-between border-b border-brand-soft px-3 py-2">
            <h2 className="text-xs font-semibold">Notifications</h2>
            <button
              type="button"
              onClick={() => markRead()}
              disabled={unread === 0}
              className="text-[10px] font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            >
              Mark all as read
            </button>
          </div>

          {error && <p className="px-3 py-3 text-xs text-red-600">{error}</p>}

          {!error && items === null && (
            <p className="px-3 py-4 text-xs text-slate-500">Loading...</p>
          )}

          {!error && items !== null && list.length === 0 && (
            <p className="px-3 py-4 text-xs text-slate-500">
              You're all caught up. Invitations, shared notes, and deadlines will show up here.
            </p>
          )}

          {list.length > 0 && (
            <ul className="max-h-80 overflow-y-auto p-1">
              {list.map((n) => {
                const meta = TYPES[n.type] ?? FALLBACK;
                const Icon = meta.icon;
                const isRead = !!n.read_at;
                const needsAnswer = meta.kind === "invite" || meta.kind === "share";
                const answer = needsAnswer ? answerOf(n, meta.kind) : null;
                const waiting = answer === "pending";
                const noAccess = meta.kind === "board" && n.can_open === false;

                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-brand-soft ${
                        isRead ? "" : "bg-brand-soft/60"
                      } ${(needsAnswer && !waiting) || noAccess || meta.kind === "info" ? "cursor-default" : ""}`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${meta.tone} ${
                          isRead || noAccess ? "opacity-60" : ""
                        }`}
                      >
                        <Icon size={14} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block break-words text-xs leading-snug ${
                            isRead || noAccess ? "text-slate-600" : "font-semibold"
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                          {n.body ? `${n.body} · ` : ""}
                          {timeAgo(n.created_at)}
                        </span>
                      </span>

                      {needsAnswer ? (
                        waiting ? (
                          <span className="shrink-0 self-center rounded-md bg-brand px-2 py-1 text-[10px] font-semibold text-white">
                            Review
                          </span>
                        ) : (
                          <span className="shrink-0 self-center text-[10px] font-semibold text-slate-500">
                            {ANSWERED[answer] ?? answer}
                          </span>
                        )
                      ) : noAccess ? (
                        <span className="shrink-0 self-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                          No access
                        </span>
                      ) : (
                        !isRead && (
                          <span
                            aria-label="Unread"
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                          />
                        )
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}