import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function BoardSwitcher({ boards, current, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        title={current.name}
        className="flex max-w-full items-center gap-1 rounded-lg px-1.5 py-1 text-base font-bold transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="truncate">{current.name}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-brand transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul className="absolute left-0 top-full z-30 mt-1.5 max-h-56 w-52 min-w-full overflow-auto rounded-xl border border-brand-soft bg-white p-1 shadow-lg">
          {boards.map((b) => {
            const active = b.id === current.id;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    setOpen(false);
                    if (!active) onSelect(b.id);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-brand-soft ${
                    active ? "bg-brand-soft font-semibold text-brand" : ""
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  {active && <Check size={13} className="shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}