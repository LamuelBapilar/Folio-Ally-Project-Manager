import { Loader2 } from "lucide-react";
import { formatCountdown } from "../utils/countdown";

// a tiny drawn kanban board, purely decorative
function MiniBoard() {
  const columns = [
    { title: "w-8", cards: [{ tag: "bg-high", line: "w-3/4" }, { tag: "bg-medium", line: "w-2/3" }] },
    { title: "w-10", cards: [{ tag: "bg-medium", line: "w-4/5" }] },
    { title: "w-6", cards: [{ tag: "bg-low", line: "w-1/2" }, { tag: "bg-low", line: "w-3/5" }] },
  ];

  return (
    <div aria-hidden="true" className="grid max-w-md grid-cols-3 gap-3">
      {columns.map((col, i) => (
        <div key={i} className="space-y-2 rounded-xl bg-white/15 p-2.5">
          <div className={`h-1.5 rounded bg-white/70 ${col.title}`} />
          {col.cards.map((card, j) => (
            <div key={j} className="space-y-1.5 rounded-lg bg-white p-2.5 shadow-sm">
              <div className={`h-1.5 w-6 rounded ${card.tag}`} />
              <div className={`h-1.5 rounded bg-brand-soft ${card.line}`} />
              <div className="h-1 w-full rounded-full bg-brand-soft">
                <div className="h-1 w-1/2 rounded-full bg-brand" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SubmitButton({ loading, loadingText, wait = 0, children }) {
  const waiting = wait > 0;

  return (
    <button
      disabled={loading || waiting}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2 text-sm font-semibold tabular-nums text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {loading ? loadingText : waiting ? `Try again in ${formatCountdown(wait)}` : children}
    </button>
  );
}

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="grid min-h-dvh bg-canvas text-slate-900 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-dark p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5"
        />

        <p className="relative text-3xl font-medium">Folio</p>

        <div className="relative space-y-8">
          <MiniBoard />
          <div className="max-w-sm space-y-2">
            <h2 className="text-2xl font-bold leading-tight">
              Your kanban and noting ally
            </h2>
            <p className="text-sm">
              Organize stories on boards, track their progress, and share them
              with your team.
            </p>
          </div>
        </div>

        <p className="relative text-xs">© {new Date().getFullYear()} Folio</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm motion-safe:animate-board-in">
          {/* the brand panel is hidden on small screens, so the name moves here */}
          <div className="mb-8 text-center lg:hidden">
            <p className="text-3xl font-medium text-brand">Folio</p>
            <p className="mt-1 text-xs text-slate-500">Your kanban and noting ally</p>
          </div>

          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>

          {children}

          <p className="mt-6 text-center text-xs text-slate-600">{footer}</p>
        </div>
      </main>
    </div>
  );
}