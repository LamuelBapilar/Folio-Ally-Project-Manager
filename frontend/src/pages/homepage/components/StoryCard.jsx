import { Draggable } from "@hello-pangea/dnd";
import { Clock, Pencil, X } from "lucide-react";
import { getCategory } from "../../../utils/categories";
import { dueLabel } from "../../../utils/due";

const PRIORITY = {
  low: { label: "Low", style: "bg-low/15 text-low" },
  medium: { label: "Medium", style: "bg-medium/20 text-medium" },
  high: { label: "High", style: "bg-high/15 text-high" },
  none: { label: "Undefined", style: "bg-slate-100 text-slate-500" },
};

export default function StoryCard({
  story,
  index,
  onOpen,
  onEdit,
  onDelete,
  dragDisabled,
  motion = {},
}) {
  const priority = PRIORITY[story.priority ?? "none"] ?? PRIORITY.none;
  const category = getCategory(story.category);
  const CategoryIcon = category.icon;
  const progress = Math.min(100, Math.max(0, story.progress ?? 0));
  const assignee = story.assignee;

  // progress only matters while the story is being worked on
  const showProgress = story.status === "in_progress";

  // finished stories have no deadline left to show
  const due = story.status === "done" ? null : dueLabel(story.due_date);

  return (
    <Draggable
      draggableId={String(story.id)}
      index={index}
      isDragDisabled={dragDisabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen(story)}
          onKeyDown={(e) => {
            // Enter opens the card, but only when the card itself has focus
            if (e.key === "Enter" && e.target === e.currentTarget) onOpen(story);
          }}
          className="mb-2.5"
        >
          {/* changing the key replays the fade-in */}
          <div
            key={motion.key}
            style={
              motion.entering
                ? { animationDelay: `${Math.min(index, 8) * 30}ms` }
                : undefined
            }
            className={`rounded-xl border bg-white p-3 transition-opacity duration-150 motion-reduce:transition-none ${
              snapshot.isDragging
                ? "border-brand shadow-xl"
                : "border-brand-muted/50 shadow-sm"
            } ${motion.leaving ? "opacity-0" : ""} ${
              motion.entering ? "motion-safe:animate-card-in" : ""
            }`}
          >
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

                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${priority.style}`}
                >
                  {priority.label}
                </span>
              </div>

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

            <h3 className="mt-1.5 text-xs font-semibold leading-snug break-words">
              {story.title}
            </h3>

            {story.description && (
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500 line-clamp-3">
                {story.description}
              </p>
            )}

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
                    className={`ml-auto flex shrink-0 items-center gap-1 text-[9px] ${
                      due.late ? "text-red-500" : "text-slate-500"
                    }`}
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