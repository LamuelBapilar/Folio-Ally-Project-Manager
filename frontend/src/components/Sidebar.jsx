import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Kanban, PanelLeftClose, PanelLeftOpen, Plus, StickyNote } from "lucide-react";
import Logo from "./Logo";

const STORAGE_KEY = "folio:sidebar";
const MAX_BOARDS = 8;
const BOARD_DOTS = ["bg-brand", "bg-low", "bg-medium", "bg-high", "bg-sky-400", "bg-pink-400"];

const isWide = () => window.matchMedia("(min-width: 768px)").matches;

// open on desktop unless you closed it before; always closed on phones
function readInitial() {
  if (!isWide()) return false;

  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function NavItem({ icon: Icon, label, active, expanded, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={expanded ? undefined : label}
      className={`relative flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
        active
          ? "bg-brand-soft text-brand"
          : "text-slate-600 hover:bg-brand-soft/60 hover:text-slate-900"
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-brand"
        />
      )}
      <Icon size={18} className="shrink-0" />
      <span
        aria-hidden="true"
        className={`truncate whitespace-nowrap transition-opacity duration-150 ${
          expanded ? "opacity-100" : "opacity-0"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export default function Sidebar({ boards, currentBoardId, onSelectBoard, onNewBoard }) {
  const navigate = useNavigate();
  const inNotes = useLocation().pathname === "/notespage";
  const [expanded, setExpanded] = useState(readInitial);

  function toggle() {
    const next = !expanded;
    setExpanded(next);

    if (isWide()) {
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // storage can be blocked: the sidebar still works, it just forgets
      }
    }
  }

  // on a phone the open sidebar covers the page, so it closes after you choose something
  function go(action) {
    action();
    if (!isWide()) setExpanded(false);
  }

  // Escape closes the phone overlay
  useEffect(() => {
    if (!expanded) return;

    function onKey(e) {
      if (e.key === "Escape" && !isWide()) setExpanded(false);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <div
      className={`relative z-30 w-14 shrink-0 transition-[width] duration-200 motion-reduce:transition-none ${
        expanded ? "md:w-56" : ""
      }`}
    >
      {expanded && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-30 cursor-default bg-scrim md:hidden"
        />
      )}

      <aside
        aria-label="Main navigation"
        className={`absolute inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-brand-soft bg-surface transition-[width,box-shadow] duration-200 motion-reduce:transition-none ${
          expanded ? "w-56 shadow-2xl md:shadow-none" : "w-14"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-3.5">
          <Logo size={28} className="shrink-0" />
          <span
            aria-hidden={!expanded}
            className={`whitespace-nowrap text-xl font-medium text-brand transition-opacity duration-150 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            Folio
          </span>
        </div>

        <nav
          aria-label="Sections"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2 pt-1 [scrollbar-width:none]"
        >
          <NavItem
            icon={Kanban}
            label="Boards"
            expanded={expanded}
            active={!inNotes}
            onClick={() => go(() => navigate("/"))}
          />
          <NavItem
            icon={StickyNote}
            label="Notes"
            expanded={expanded}
            active={inNotes}
            onClick={() => go(() => navigate("/notespage"))}
          />

          {expanded && boards.length > 0 && (
            <div className="pt-4">
              <div className="mb-1 flex items-center justify-between px-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Your boards
                </span>
                <button
                  type="button"
                  onClick={() => go(onNewBoard)}
                  aria-label="New board"
                  title="New board"
                  className="grid h-5 w-5 place-items-center rounded text-slate-500 transition-colors hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <Plus size={13} />
                </button>
              </div>

              <ul className="space-y-0.5">
                {boards.slice(0, MAX_BOARDS).map((b) => {
                  const active = !inNotes && b.id === currentBoardId;

                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => go(() => onSelectBoard(b.id))}
                        aria-current={active ? "true" : undefined}
                        title={b.name}
                        className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                          active
                            ? "bg-brand-soft font-semibold text-brand"
                            : "text-slate-600 hover:bg-brand-soft/60 hover:text-slate-900"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-2 w-2 shrink-0 rounded-full ${BOARD_DOTS[b.id % BOARD_DOTS.length]}`}
                        />
                        <span className="min-w-0 truncate">{b.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {boards.length > MAX_BOARDS && (
                <p className="px-2.5 pt-1.5 text-[10px] text-slate-500">
                  +{boards.length - MAX_BOARDS} more in the board menu
                </p>
              )}
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t border-brand-soft p-2">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            title={expanded ? undefined : "Expand sidebar"}
            className="flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-brand-soft/60 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand"
          >
            {expanded ? (
              <PanelLeftClose size={18} className="shrink-0" />
            ) : (
              <PanelLeftOpen size={18} className="shrink-0" />
            )}
            <span
              aria-hidden="true"
              className={`whitespace-nowrap transition-opacity duration-150 ${
                expanded ? "opacity-100" : "opacity-0"
              }`}
            >
              Collapse
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}