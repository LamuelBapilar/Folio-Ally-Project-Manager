import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_FILTERS,
  DUE_OPTIONS,
  PRIORITY_OPTIONS,
  isFiltering,
} from "../../../utils/filters";

export default function FilterMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const count = value.priorities.length + (value.due !== "any" ? 1 : 0);

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

  function togglePriority(priority) {
    const has = value.priorities.includes(priority);
    onChange({
      ...value,
      priorities: has
        ? value.priorities.filter((p) => p !== priority)
        : [...value.priorities, priority],
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
          count > 0
            ? "border-brand bg-brand-soft text-brand"
            : "border-brand-muted/50 bg-white text-slate-700 hover:bg-brand-soft"
        }`}
      >
        <SlidersHorizontal size={13} />
        Filter
        {count > 0 && (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-semibold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-52 rounded-xl border border-brand-soft bg-white p-3 shadow-lg">
          <fieldset>
            <legend className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Priority
            </legend>
            <div className="space-y-0.5">
              {PRIORITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 text-xs hover:bg-brand-soft"
                >
                  <input
                    type="checkbox"
                    checked={value.priorities.includes(opt.value)}
                    onChange={() => togglePriority(opt.value)}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-3">
            <legend className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Due date
            </legend>
            <div className="space-y-0.5">
              {DUE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 text-xs hover:bg-brand-soft"
                >
                  <input
                    type="radio"
                    name="due-filter"
                    checked={value.due === opt.value}
                    onChange={() => onChange({ ...value, due: opt.value })}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            disabled={!isFiltering(value)}
            className="mt-3 w-full rounded-lg border border-brand-muted/50 py-1.5 text-xs font-medium text-slate-700 hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}