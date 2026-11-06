import { Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import ColumnInfo from "./ColumnInfo";
import StoryCard from "./StoryCard";

export default function Column({
  id,
  title,
  description,
  accent = "bg-slate-400",
  stories,
  total = stories.length,
  onAddClick,
  onOpen,
  onEdit,
  onDelete,
  dragDisabled,
  motion,
}) {
  // stories exist, but the search or filter hides all of them
  const filteredOut = total > 0 && stories.length === 0;

  return (
    <div className="flex h-[75vh] max-h-full min-w-56 flex-1 flex-col rounded-2xl bg-brand-soft p-2.5">
      <div className="mb-1.5 flex shrink-0 items-center justify-between pl-1">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold">
          <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${accent}`} />
          {title}
          <span className="rounded-full bg-surface/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            {stories.length}
            {total !== stories.length && ` / ${total}`}
          </span>
        </h2>

        <div className="flex items-center">
          <button
            onClick={() => onAddClick(id)}
            aria-label={`Add story to ${title}`}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-600 transition-colors hover:bg-surface/70 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Plus size={16} />
          </button>
          <ColumnInfo title={title} description={description} />
        </div>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-0 flex-1 overflow-y-auto rounded-xl px-1 transition-colors [scrollbar-color:var(--color-brand-muted)_transparent] [scrollbar-width:thin] ${
              snapshot.isDraggingOver ? "bg-brand/10" : ""
            }`}
          >
            {stories.length === 0 && !snapshot.isDraggingOver && (
              <div className="mt-1 grid place-items-center rounded-xl border border-dashed border-brand-muted/70 px-3 py-8 text-center">
                <p className="text-[11px] text-slate-500">
                  {filteredOut ? "No matching stories" : "Nothing here yet"}
                </p>

                {!filteredOut && (
                  <button
                    type="button"
                    onClick={() => onAddClick(id)}
                    className="mt-1.5 text-[11px] font-semibold text-brand hover:underline"
                  >
                    + Add a story
                  </button>
                )}
              </div>
            )}

            {stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                index={index}
                dragDisabled={dragDisabled}
                motion={motion}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={(storyId) => onDelete(id, storyId)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}