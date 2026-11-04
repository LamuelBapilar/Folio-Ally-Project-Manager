import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getCategory } from "../utils/categories";
import { formatCountdown } from "../utils/countdown";
import Logo from "./Logo";

const POINTS = [
  "Kanban boards with drag and drop",
  "Rich-text notes, organized in folders",
  "Share boards, and send copies of notes",
];

const TASKS = [
  { text: "Review the open pull requests", done: true },
  { text: "Send the agenda to the team", done: false },
];

// two drawn cards that float gently, purely decorative
function Preview() {
  const category = getCategory("feature");
  const CategoryIcon = category.icon;

  return (
    <div aria-hidden="true" className="relative mx-auto h-60 w-full max-w-sm">
      <div className="absolute left-0 top-2 w-60 -rotate-3">
        <div
          className="rounded-xl border border-l-[3px] border-l-high bg-white p-3 text-slate-900 shadow-xl motion-safe:animate-float"
          style={{ animationDuration: "6s" }}
        >
          <div className="flex items-center gap-1.5">
            <span className={`grid h-5 w-5 place-items-center rounded ${category.tone}`}>
              <CategoryIcon size={11} />
            </span>
            <span className="rounded bg-high/15 px-1.5 py-0.5 text-[9px] font-semibold text-high">
              High
            </span>
          </div>

          <p className="mt-1.5 text-xs font-semibold">Build the sign-up flow</p>

          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-brand-soft">
              <div className="h-full w-2/3 rounded-full bg-brand" />
            </div>
            <span className="text-[9px] font-medium text-slate-500">70%</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-56 rotate-2">
        <div
          className="rounded-xl bg-white p-3 text-slate-900 shadow-xl motion-safe:animate-float"
          style={{ animationDuration: "7s", animationDelay: "-2s" }}
        >
          <p className="text-xs font-bold">Weekly planning</p>

          <ul className="mt-2 space-y-1.5">
            {TASKS.map((task) => (
              <li key={task.text} className="flex items-center gap-2 text-[11px]">
                <span
                  className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded border ${
                    task.done ? "border-brand bg-brand text-white" : "border-brand-muted"
                  }`}
                >
                  {task.done && <Check size={9} />}
                </span>
                <span className={task.done ? "text-slate-400 line-through" : "text-slate-700"}>
                  {task.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SubmitButton({ loading, loadingText, wait = 0, children }) {
  const waiting = wait > 0;

  return (
    <button
      disabled={loading || waiting}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-xs font-semibold tabular-nums text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {loading ? loadingText : waiting ? `Try again in ${formatCountdown(wait)}` : children}
    </button>
  );
}

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="grid min-h-dvh bg-canvas text-slate-900 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#5f57ee,#4b43d1)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5"
        />

        <Link
          to="/"
          aria-label="Folio home"
          className="relative flex w-fit items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Logo size={32} />
          <span className="text-2xl font-medium">Folio</span>
        </Link>

        <div className="relative space-y-10">
          <Preview />

          <div className="max-w-sm space-y-4">
            <h2 className="text-2xl font-bold leading-tight">
              Boards and notes that keep your work moving
            </h2>

            <ul className="space-y-2">
              {POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                    <Check size={12} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative text-xs text-white/90">© {new Date().getFullYear()} Folio</p>
      </aside>

      <main className="flex flex-col px-6 py-6">
        <Link
          to="/"
          className="flex w-fit items-center gap-1.5 rounded-md text-xs font-medium text-slate-600 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm motion-safe:animate-board-in">
            {/* the brand panel is hidden on small screens, so the logo moves here */}
            <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
              <Logo size={32} />
              <span className="text-2xl font-medium text-brand">Folio</span>
            </div>

            <div className="rounded-2xl border border-brand-muted/40 bg-white p-6 shadow-sm">
              <h1 className="text-lg font-bold">{title}</h1>
              <p className="mb-5 mt-1 text-xs text-slate-500">{subtitle}</p>

              {children}
            </div>

            <p className="mt-5 text-center text-xs text-slate-600">{footer}</p>
          </div>
        </div>
      </main>
    </div>
  );
}