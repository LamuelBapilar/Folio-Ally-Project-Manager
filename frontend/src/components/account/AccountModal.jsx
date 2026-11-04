import { useEffect, useRef, useState } from "react";
import { ShieldCheck, User, UserCog, X } from "lucide-react";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export default function AccountModal({ user, onUserChange, onLogout, onClose }) {
  const [tab, setTab] = useState("profile");
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Escape closes only the window on top: a confirmation opened from here closes first
  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;

      const dialogs = document.querySelectorAll('[aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== dialogRef.current) return;

      onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const closeButton = (className) => (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className={`text-slate-500 hover:text-slate-900 ${className}`}
    >
      <X size={14} />
    </button>
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-canvas shadow-xl focus:outline-none md:h-[34rem] md:flex-row"
      >
        <aside className="shrink-0 border-b border-brand-soft bg-white p-4 md:w-52 md:border-b-0 md:border-r">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <UserCog size={16} />
            </span>

            <div className="min-w-0 flex-1">
              <h2 id="account-title" className="text-base font-bold leading-snug">
                Account
              </h2>
              <p className="hidden text-[11px] text-slate-500 md:block">Manage your account</p>
            </div>

            {closeButton("shrink-0 md:hidden")}
          </div>

          <div
            role="tablist"
            aria-label="Account sections"
            className="mt-3 flex gap-1 md:flex-col"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`account-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="account-panel"
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand md:flex-none ${
                  tab === id
                    ? "bg-brand-soft font-semibold text-brand"
                    : "text-slate-600 hover:bg-brand-soft/60 hover:text-slate-900"
                }`}
              >
                <Icon size={14} className="shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </aside>

        <section className="relative min-h-0 flex-1 overflow-y-auto p-5">
          {closeButton("absolute right-4 top-4 hidden md:block")}

          <div role="tabpanel" id="account-panel" aria-labelledby={`account-tab-${tab}`}>
            {tab === "profile" ? (
              <ProfileTab user={user} onUserChange={onUserChange} />
            ) : (
              <SecurityTab onLogout={onLogout} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}