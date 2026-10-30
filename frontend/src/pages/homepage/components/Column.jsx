import { Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import ColumnInfo from "./ColumnInfo";
import StoryCard from "./StoryCard";

export default function Column({
  id,
  title,
  description,
  stories,
  total = stories.length,
  onAddClick,
  onOpen,
  onEdit,
  onDelete,
  dragDisabled,
  motion,
}) {
  return (
    <div className="flex h-[75vh] max-h-full min-w-56 flex-1 flex-col rounded-2xl bg-brand-soft p-2.5">
      <div className="mb-1.5 flex shrink-0 items-center justify-between pl-1">
        <h2 className="text-[13px] font-semibold">
          {title}{" "}
          <span className="ml-1 font-normal text-slate-500">
            {stories.length}
            {total !== stories.length && ` / ${total}`}
          </span>
        </h2>

        <div className="flex items-center">
          <button
            onClick={() => onAddClick(id)}
            aria-label={`Add story to ${title}`}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-600 transition-colors hover:bg-white/70 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
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