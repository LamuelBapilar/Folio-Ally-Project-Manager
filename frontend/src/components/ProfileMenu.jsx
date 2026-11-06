import { useEffect, useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { monthYear } from "../utils/time";

/**
 * The round avatar in the header, and the card that opens when you click it.
 *
 * Props:
 *   user       the signed-in person ({ name, email, created_at })
 *   onLogout   signs out (returns a promise)
 *   onManage   opens the "Manage account" window
 *
 * Colors: the card uses `bg-surface`, the themed card color, so it turns dark in dark mode.
 * Never use `bg-white` for a background inside the app (see README, "Colors and dark mode").
 */

// The avatar's purple gradient. The same one is used on the big avatar inside the card.
const avatarBg = "bg-[linear-gradient(135deg,#8b84ff,#5a52e6)]";

export default function ProfileMenu({ user, onLogout, onManage }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Refs let us talk to real page elements: to tell a click inside the menu from one outside,
  // to give focus back to the avatar, and to move focus into the card when it opens.
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const cardRef = useRef(null);

  const initial = user.name?.charAt(0).toUpperCase() ?? "?";
  const since = monthYear(user.created_at);

  // While the card is open: close it on an outside click or Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus(); // hand focus back to the avatar
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);

    // Move keyboard focus into the card, so Tab walks through its buttons.
    cardRef.current?.focus();

    // Cleanup: remove the listeners when the card closes.
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);

    try {
      await onLogout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* The avatar button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Account menu"
        title={user.name}
        className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${avatarBg} ${
          open ? "ring-4 ring-brand/20" : "hover:ring-4 hover:ring-brand/15"
        }`}
      >
        {initial}
      </button>

      {open && (
        <div
          ref={cardRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Account"
          className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-brand-soft bg-surface text-slate-900 shadow-xl focus:outline-none"
        >
          {/* Who you are */}
          <div className="flex items-center gap-3 bg-brand-soft/60 px-4 py-4">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-base font-semibold text-white ${avatarBg}`}
            >
              {initial}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{user.name}</span>
              <span className="block truncate text-xs text-slate-600">{user.email}</span>
            </span>
          </div>

          {since && (
            <p className="border-b border-brand-soft px-4 py-2 text-[11px] text-slate-500">
              Member since {since}
            </p>
          )}

          {/* Actions */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Settings size={14} className="shrink-0" />
              Manage account
            </button>

            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60"
            >
              <LogOut size={14} className="shrink-0" />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>

          <p className="border-t border-brand-soft bg-canvas px-4 py-2 text-center text-[10px] text-slate-500">
            Folio · Your kanban and noting ally
          </p>
        </div>
      )}
    </div>
  );
}