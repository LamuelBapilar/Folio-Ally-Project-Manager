import { useState } from "react";
import { CalendarDays, Kanban, ListChecks, Pencil, Trash2, User, X } from "lucide-react";
import Modal from "../../../components/Modal";
import { PRIORITIES, STATUS_LABEL } from "../../../constants/stories";
import { getCategory } from "../../../utils/categories";
import { dueLabel } from "../../../utils/due";
import { timeAgo } from "../../../utils/time";

/**
 * The read-only "story details" window you get by clicking a card.
 * It offers Edit (opens the edit window) and Delete (asks first, right inside this window).
 *
 * Props:
 *   story     the story to show
 *   onClose   closes the window
 *   onEdit    called with the story when you press Edit
 *   onDelete  called with the story when you confirm Delete
 */

// "2026-11-05" -> "Nov 5, 2026". The "T00:00:00" keeps it in YOUR timezone.
function formatDate(dateString) {
  return new Date(`${dateString.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// One labeled fact with a small icon, like "Column: To do".
function Fact({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-brand">
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="mt-0.5 text-xs text-slate-800">{children}</div>
      </div>
    </div>
  );
}

export default function StoryDetailsModal({ story, onClose, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false); // true while "Delete this story?" shows
  const [busy, setBusy] = useState(false);

  const priority = PRIORITIES[story.priority ?? "none"] ?? PRIORITIES.none;
  const category = getCategory(story.category);
  const CategoryIcon = category.icon;
  const finished = story.status === "done";
  const due = story.due_date && !finished ? dueLabel(story.due_date) : null;

  // Progress only means something while work is under way, or once it is finished.
  const showProgress = story.status === "in_progress" || finished;
  const percent = finished ? 100 : Math.min(100, Math.max(0, story.progress ?? 0));

  async function remove() {
    setBusy(true);
    try {
      await onDelete(story);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="story-title" onClose={onClose} size="md" dismissible={!busy}>
      <div className="p-5">
        {/* Header: the category icon (in its own color), tags, title, and the close button */}
        <div className="flex items-start gap-3">
          <span
            title={`Category: ${category.label}`}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${category.tone}`}
          >
            <CategoryIcon size={16} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {category.label}
              </span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${priority.style}`}>
                {priority.label}
              </span>
            </div>

            <h2 id="story-title" className="mt-0.5 break-words text-base font-bold leading-snug">
              {story.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="mt-0.5 shrink-0 text-slate-500 hover:text-slate-900"
          >
            <X size={14} />
          </button>
        </div>

        <p
          className={`mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed ${
            story.description ? "text-slate-700" : "italic text-slate-400"
          }`}
        >
          {story.description || "No description."}
        </p>

        {/* The facts grid */}
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-brand-muted/40 bg-surface p-4">
          <Fact icon={Kanban} label="Column">
            {STATUS_LABEL[story.status] ?? story.status}
          </Fact>

          <Fact icon={User} label="Assigned to">
            {story.assignee ? (
              <span className="flex items-center gap-1.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[9px] font-semibold text-brand">
                  {story.assignee.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{story.assignee.name}</span>
              </span>
            ) : (
              <span className="text-slate-400">Unassigned</span>
            )}
          </Fact>

          <Fact icon={CalendarDays} label="Due date">
            {story.due_date ? (
              <>
                {formatDate(story.due_date)}
                {due && (
                  <span className={due.late ? "text-red-500" : "text-slate-500"}> · {due.text}</span>
                )}
              </>
            ) : (
              <span className="text-slate-400">No due date</span>
            )}
          </Fact>

          {showProgress && (
            <Fact icon={ListChecks} label="Progress">
              <span className="flex items-center gap-2">
                <span
                  role="progressbar"
                  aria-label="Progress"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-soft"
                >
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
                </span>
                <span className="shrink-0 font-medium">{percent}%</span>
              </span>
            </Fact>
          )}
        </div>

        <p className="mt-3 text-[10px] text-slate-500">
          Created {timeAgo(story.created_at)} · Updated {timeAgo(story.updated_at)}
        </p>

        {/* Footer: either Delete + Edit, or the "Delete this story?" question */}
        <div className="mt-5 flex items-center justify-between gap-3">
          {confirming ? (
            <>
              <p className="text-xs text-slate-600">Delete this story?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="rounded-lg border border-brand-muted/50 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-soft disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? "Deleting..." : "Delete"}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={13} />
                Delete
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => onEdit(story)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
              >
                <Pencil size={13} />
                Edit story
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}