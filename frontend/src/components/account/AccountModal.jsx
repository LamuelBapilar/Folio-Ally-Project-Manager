import { useState } from "react";
import { Palette, ShieldCheck, User, UserCog, X } from "lucide-react";
import Modal from "../Modal";
import AppearanceTab from "./AppearanceTab";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";

/**
 * The "Manage account" window: a tab list on the left (above the content on phones)
 * and the selected tab on the right.
 *
 * To add a tab: create a component in this folder, add one entry to TABS,
 * and render it in the panel below.
 */
const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export default function AccountModal({ user, onUserChange, onLogout, onClose }) {
  const [tab, setTab] = useState("profile");

  // The close button appears in two places (phone header, desktop corner), so it's built once.
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
    <Modal
      labelledBy="account-title"
      onClose={onClose}
      size="lg"
      className="flex max-h-[90dvh] flex-col overflow-hidden md:h-[34rem] md:flex-row"
    >
      {/* Left side: the title and the tab list */}
      <aside className="shrink-0 border-b border-brand-soft bg-surface p-4 md:w-52 md:border-b-0 md:border-r">
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

        <div role="tablist" aria-label="Account sections" className="mt-3 flex gap-1 md:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`account-tab-${id}`}
              aria-selected={tab === id}
              aria-controls="account-panel"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand md:flex-none md:justify-start ${
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

      {/* Right side: the selected tab */}
      <section className="relative min-h-0 flex-1 overflow-y-auto p-5">
        {closeButton("absolute right-4 top-4 hidden md:block")}

        <div role="tabpanel" id="account-panel" aria-labelledby={`account-tab-${tab}`}>
          {tab === "profile" && <ProfileTab user={user} onUserChange={onUserChange} />}
          {tab === "appearance" && <AppearanceTab />}
          {tab === "security" && <SecurityTab onLogout={onLogout} />}
        </div>
      </section>
    </Modal>
  );
}