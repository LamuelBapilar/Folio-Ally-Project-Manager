import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

export function MenuItem({ active = false, onClick, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-brand-soft ${
        active ? "bg-brand-soft font-semibold text-brand" : ""
      }`}
    >
      <span className="min-w-0 truncate">{children}</span>
      {active && <Check size={13} className="shrink-0" />}
    </button>
  );
}

export default function MenuButton({
  label,
  trigger,
  children,
  align = "left",
  buttonClassName = "",
  panelClassName = "w-44",
  keepFocus = false, // true inside the editor toolbar, so the text keeps its selection
}) {
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
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
        onClick={() => setOpen((o) => !o)}
        className={buttonClassName}
      >
        {trigger}
      </button>

      {open && (
        <div
          className={`absolute top-full z-30 mt-1.5 rounded-xl border border-brand-soft bg-white shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}