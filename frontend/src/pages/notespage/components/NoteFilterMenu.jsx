import { SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_NOTE_FILTERS,
  RANGE_OPTIONS,
  SORT_OPTIONS,
  isFiltering,
} from "../../../utils/noteFilters";
import MenuButton from "./MenuButton";

function Radio({ name, checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 text-xs hover:bg-brand-soft">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-brand"
      />
      {children}
    </label>
  );
}

const legend =
  "mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500";

export default function NoteFilterMenu({ value, onChange }) {
  const count =
    (value.pinned ? 1 : 0) +
    (value.range !== "any" ? 1 : 0) +
    (value.sort !== "updated" ? 1 : 0);

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <MenuButton
      label="Filter notes"
      align="right"
      panelClassName="w-60"
      buttonClassName={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
        count > 0
          ? "border-brand bg-brand-soft text-brand"
          : "border-brand-muted/50 bg-white text-slate-700 hover:bg-brand-soft"
      }`}
      trigger={
        <>
          <SlidersHorizontal size={13} />
          Filter
          {count > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-semibold text-white">
              {count}
            </span>
          )}
        </>
      }
    >
      <div className="space-y-3 p-3">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 text-xs hover:bg-brand-soft">
          <input
            type="checkbox"
            checked={value.pinned}
            onChange={(e) => set({ pinned: e.target.checked })}
            className="h-3.5 w-3.5 accent-brand"
          />
          Pinned notes only
        </label>

        <fieldset>
          <legend className={legend}>Date edited</legend>
          {RANGE_OPTIONS.map((o) => (
            <Radio
              key={o.value}
              name="note-range"
              checked={value.range === o.value}
              onChange={() => set({ range: o.value })}
            >
              {o.label}
            </Radio>
          ))}

          {value.range === "custom" && (
            <div className="mt-1.5 grid grid-cols-2 gap-2 px-1.5">
              <label className="text-[10px] font-medium text-slate-600">
                From
                <input
                  type="date"
                  value={value.from}
                  max={value.to || undefined}
                  onChange={(e) => set({ from: e.target.value })}
                  className="mt-0.5 w-full rounded-md border border-brand-muted/50 bg-white px-1.5 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
              <label className="text-[10px] font-medium text-slate-600">
                To
                <input
                  type="date"
                  value={value.to}
                  min={value.from || undefined}
                  onChange={(e) => set({ to: e.target.value })}
                  className="mt-0.5 w-full rounded-md border border-brand-muted/50 bg-white px-1.5 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className={legend}>Sort by</legend>
          {SORT_OPTIONS.map((o) => (
            <Radio
              key={o.value}
              name="note-sort"
              checked={value.sort === o.value}
              onChange={() => set({ sort: o.value })}
            >
              {o.label}
            </Radio>
          ))}
        </fieldset>

        <button
          type="button"
          onClick={() => onChange(DEFAULT_NOTE_FILTERS)}
          disabled={!isFiltering(value)}
          className="w-full rounded-lg border border-brand-muted/50 py-1.5 text-xs font-medium text-slate-700 hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>
    </MenuButton>
  );
}