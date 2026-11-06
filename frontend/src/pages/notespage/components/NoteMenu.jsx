import { useEffect, useRef, useState } from "react";
import { Download, Ellipsis, FileText, Share2, Trash2 } from "lucide-react";

const MENU_WIDTH = 176; // the w-44 below
const MENU_HEIGHT = 176; // roughly four options: decides when to open upward
const GAP = 6;

// Share and Download are placeholders until onShare / onDownload are passed in
export default function NoteMenu({ onOpen, onDelete, onShare, onDownload }) {
  const [place, setPlace] = useState(null); // null = closed, otherwise where the menu goes
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = useRef([]);

  const open = place !== null;

  const items = [
    { label: "Open", icon: FileText, run: onOpen },
    { label: "Share", icon: Share2, run: onShare, soon: !onShare },
    { label: "Download", icon: Download, run: onDownload, soon: !onDownload },
    { label: "Delete", icon: Trash2, run: onDelete, danger: true, divider: true },
  ];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (!ref.current?.contains(e.target)) setPlace(null);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setPlace(null);
        buttonRef.current?.focus();
      }
    }
    // the menu is fixed to the screen, so it would drift away from its row if the list moved
    const hide = () => setPlace(null);

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [open]);

  // the first option gets the focus, so the keyboard works right away
  useEffect(() => {
    if (open) itemRefs.current[0]?.focus({ preventScroll: true });
  }, [open]);

  function toggle() {
    if (open) {
      setPlace(null);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const roomBelow = window.innerHeight - rect.bottom;
    const openUp = roomBelow < MENU_HEIGHT + GAP && rect.top > MENU_HEIGHT + GAP;

    setPlace({
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
      top: openUp ? rect.top - GAP : rect.bottom + GAP,
      openUp,
    });
  }

  function select(item) {
    if (item.soon) return;

    setPlace(null);
    item.run?.();
  }

  function onMenuKeyDown(e) {
    const nodes = itemRefs.current.filter(Boolean);
    const current = nodes.indexOf(document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      nodes[(current + 1) % nodes.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nodes[(current - 1 + nodes.length) % nodes.length]?.focus();
    } else if (e.key === "Tab") {
      // hand the focus back to the button, so Tab carries on from there
      buttonRef.current?.focus();
      setPlace(null);
    }
  }

  return (
    <div ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Note options"
        title="More options"
        className={`grid h-6 w-6 place-items-center rounded-md transition-opacity hover:bg-surface hover:text-brand focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-brand ${
          open
            ? "bg-surface text-brand opacity-100"
            : "text-slate-400 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        }`}
      >
        <Ellipsis size={14} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Note options"
          onKeyDown={onMenuKeyDown}
          style={{
            left: place.left,
            top: place.top,
            transform: place.openUp ? "translateY(-100%)" : undefined,
          }}
          className="fixed z-40 w-44 rounded-xl border border-brand-soft bg-surface p-1 shadow-lg"
        >
          {items.map((item, i) => {
            const Icon = item.icon;

            return (
              <div key={item.label}>
                {item.divider && (
                  <div role="separator" className="my-1 border-t border-brand-soft" />
                )}

                <button
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  role="menuitem"
                  aria-disabled={item.soon ? "true" : undefined}
                  title={item.soon ? "Coming soon" : undefined}
                  onClick={() => select(item)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                    item.soon
                      ? "cursor-not-allowed text-slate-400"
                      : item.danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-slate-700 hover:bg-brand-soft"
                  }`}
                >
                  <Icon size={13} className="shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.soon && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                      Soon
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}