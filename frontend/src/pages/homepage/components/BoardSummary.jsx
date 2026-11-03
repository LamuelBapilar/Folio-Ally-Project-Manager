import { dueBucket } from "../../../utils/due";

function Stat({ dot, label, value }) {
  return (
    <li className="flex items-center gap-1.5 text-[11px]">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </li>
  );
}

export default function BoardSummary({ columns, onShowOverdue }) {
  const all = Object.values(columns).flat();
  const total = all.length;

  // an empty board has nothing to summarize
  if (total === 0) return null;

  const done = columns.done.length;
  const percent = Math.round((done / total) * 100);
  const working = columns.in_progress.length;
  const overdue = all.filter((s) => dueBucket(s) === "overdue").length;
  const soon = all.filter((s) => ["today", "week"].includes(dueBucket(s))).length;

  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-brand-muted/40 bg-white px-4 py-2.5">
      <div className="flex min-w-48 flex-1 items-center gap-3">
        <div
          role="progressbar"
          aria-label="Board completion"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-soft"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="shrink-0 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-900">{percent}%</span> done · {done} of{" "}
          {total} {total === 1 ? "story" : "stories"}
        </p>
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Stat dot="bg-medium" label="In progress" value={working} />
        <Stat dot="bg-brand-muted" label="Due soon" value={soon} />

        {overdue > 0 ? (
          <li>
            <button
              type="button"
              onClick={onShowOverdue}
              title="Show only overdue stories"
              className="-mx-1.5 flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-slate-600">Overdue</span>
              <span className="font-semibold text-red-600">{overdue}</span>
            </button>
          </li>
        ) : (
          <Stat dot="bg-red-500" label="Overdue" value={0} />
        )}
      </ul>
    </div>
  );
}