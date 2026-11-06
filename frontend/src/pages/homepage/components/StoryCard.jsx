import { Draggable } from "@hello-pangea/dnd";
import { Clock, Pencil, X } from "lucide-react";
import { PRIORITIES } from "../../../constants/stories";
import { getCategory } from "../../../utils/categories";
import { dueLabel } from "../../../utils/due";

/**
 * One story card. It is draggable, and clicking it opens the details window.
 *
 * Props:
 *   story         the story to show
 *   index         its position in the column (the drag library needs it)
 *   onOpen        opens the details window
 *   onEdit        opens the edit window (the pencil)
 *   onDelete      deletes the story (the x)
 *   dragDisabled  true while searching or filtering (positions would be wrong)
 *   motion        the fade-in/out state from Board.jsx
 *
 * What a card shows depends on the story:
 *   - progress bar: only while the story is "In Progress"
 *   - due date:     hidden once the story is "Done"
 *   - avatar:       only when the story is assigned
 */
export default function StoryCard({
  story,
  index,
  onOpen,
  onEdit,
  onDelete,
  dragDisabled,
  motion = {},
}) {
  const priority = PRIORITIES[story.priority ?? "none"] ?? PRIORITIES.none;
  const category = getCategory(story.category);
  const CategoryIcon = category.icon;
  const progress = Math.min(100, Math.max(0, story.progress ?? 0));
  const assignee = story.assignee;

  // Finished cards get a green edge. The rest follow their priority.
  const edge = story.status === "done" ? "border-l-low" : priority.edge;

  // Progress only matters while the story is being worked on.
  const showProgress = story.status === "in_progress";

  // Finished stories have no deadline left to show.
  const due = story.status === "done" ? null : dueLabel(story.due_date);

  // Overdue dates are a red pill, "Today" is amber, the rest are plain text.
  const dueStyle = due?.late
    ? "bg-red-50 text-red-600"
    : due?.text === "Today"
      ? "bg-medium/15 text-amber-700"
      : "text-slate-500";

  return (
    <Draggable draggableId={String(story.id)} index={index} isDragDisabled={dragDisabled}>
      {(provided, snapshot) => (
        // The outer div belongs to the drag library: don't style it with transforms.
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen(story)}
          onKeyDown={(e) => {
            // Enter opens the card, but only when the card itself has focus.
            if (e.key === "Enter" && e.target === e.currentTarget) onOpen(story);
          }}
          className="mb-2.5"
        >
          {/* The inner div is the visible card. Changing `key` replays the fade-in. */}
          <div
            key={motion.key}
            style={
              motion.entering ? { animationDelay: `${Math.min(index, 8) * 30}ms` } : undefined
            }
            className={`rounded-xl border border-l-[3px] bg-surface p-3 transition-[opacity,transform,box-shadow] duration-150 motion-reduce:transition-none ${edge} ${
              snapshot.isDragging
                ? "rotate-2 border-brand shadow-xl"
                : "border-brand-muted/50 shadow-sm hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
            } ${motion.leaving ? "opacity-0" : ""} ${
              motion.entering ? "motion-safe:animate-card-in" : ""
            }`}
          >
            {/* Top row: category icon, priority tag, and the edit/delete buttons */}
            <div className="flex items-start justify-between">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  role="img"
                  title={`Category: ${category.label}`}
                  aria-label={`Category: ${category.label}`}
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded ${category.tone}`}
                >
                  <CategoryIcon size={11} />
                </span>

                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${priority.style}`}>
                  {priority.label}
                </span>
              </div>

              {/* stopPropagation: clicking a button must not also open the details window */}
              <div className="flex shrink-0 items-center gap-1.5 text-slate-400">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(story);
                  }}
                  aria-label="Edit story"
                  className="hover:text-brand"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(story.id);
                  }}
                  aria-label="Delete story"
                  className="hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            <h3 className="mt-1.5 text-xs font-semibold leading-snug break-words">{story.title}</h3>

            {story.description && (
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500 line-clamp-3">
                {story.description}
              </p>
            )}

            {/* Bottom row: progress bar, due date, and the assignee's initial */}
            {(showProgress || due || assignee) && (
              <div className="mt-2.5 flex items-center gap-3">
                {showProgress && (
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <div
                      role="progressbar"
                      aria-label="Progress"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-1 flex-1 overflow-hidden rounded-full bg-brand-soft"
                    >
                      <div
                        className="h-full rounded-full bg-brand transition-[width] duration-300 motion-reduce:transition-none"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[9px] font-medium text-slate-500">
                      {progress}%
                    </span>
                  </div>
                )}

                {due && (
                  <div
                    className={`ml-auto flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium ${dueStyle}`}
                  >
                    <Clock size={10} />
                    {due.text}
                  </div>
                )}

                {assignee && (
                  <span
                    title={`Assigned to ${assignee.name}`}
                    aria-label={`Assigned to ${assignee.name}`}
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[9px] font-semibold text-brand ${
                      // With nothing else on the row, push the avatar to the right.
                      !showProgress && !due ? "ml-auto" : ""
                    }`}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}