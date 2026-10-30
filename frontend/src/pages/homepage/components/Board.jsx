import { useCallback, useEffect, useRef, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Search, UserCheck, Users, X } from "lucide-react";
import { getMembers } from "../../../API/members";
import { addStory, deleteStory, reorderStories, updateStory } from "../../../API/story";
import {
  DEFAULT_FILTERS,
  DUE_OPTIONS,
  PRIORITY_OPTIONS,
  isFiltering,
  matchesFilters,
} from "../../../utils/filters";
import Column from "./Column";
import FilterMenu from "./FilterMenu";
import ShareModal from "./ShareModal";
import StoryDetailsModal from "./StoryDetailsModal";
import StoryModal from "./StoryModal";

const FADE_OUT_MS = 130; // old cards fade out before the list changes
const ENTER_TOTAL_MS = 650; // long enough for the fade-in and stagger to finish

const COLUMNS = [
  {
    id: "backlog",
    title: "BackLog",
    description:
      "Ideas and tasks that are not scheduled yet. Park things here until you decide to work on them.",
  },
  {
    id: "todo",
    title: "To do",
    description:
      "Stories that are ready to start. Pick the next one from the top of this column.",
  },
  {
    id: "in_progress",
    title: "In Progress",
    description:
      "Stories being worked on right now. Try to keep this column short so work gets finished.",
  },
  {
    id: "done",
    title: "Done",
    description:
      "Finished stories. Completed work stays here as a record of what has shipped.",
  },
];

function groupByStatus(stories) {
  const grouped = { backlog: [], todo: [], in_progress: [], done: [] };
  [...stories]
    .sort((a, b) => a.position - b.position)
    .forEach((story) => grouped[story.status]?.push(story));
  return grouped;
}

function Chip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-brand-soft py-0.5 pl-2.5 pr-1.5 text-[10px] font-semibold text-brand motion-safe:animate-card-in">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="grid h-3.5 w-3.5 place-items-center rounded-full hover:bg-brand/20"
      >
        <X size={10} />
      </button>
    </span>
  );
}

export default function Board({ board, user, onNewBoard, onLeave }) {
  const [columns, setColumns] = useState(() => groupByStatus(board.stories));
  const [people, setPeople] = useState([]); // the owner and members: who a story can be assigned to
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS); // what the menu and chips show right away
  const [applied, setApplied] = useState(DEFAULT_FILTERS); // what the board shows
  const [motion, setMotion] = useState({ leaving: false, entering: false, key: 0 });
  // null = closed, { status } = adding to a column, { story } = editing a card
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null); // id of the story whose details are open
  const [sharing, setSharing] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const loadPeople = useCallback(async () => {
    try {
      const { owner, members } = await getMembers(board.id);
      setPeople([owner, ...members]);
    } catch {
      // assigning just has no list to pick from; the board still works
    }
  }, [board.id]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const q = search.trim().toLowerCase();
  const filterActive = isFiltering(filters);
  const viewFiltered = !!q || isFiltering(applied);
  const showStatus = filterActive || viewFiltered;

  // always the latest version of the story, so edits show up in the open details
  const viewingStory = viewing
    ? Object.values(columns).flat().find((s) => s.id === viewing)
    : null;

  function changeFilters(next) {
    setFilters(next);

    timers.current.forEach(clearTimeout);
    timers.current = [];

    // people who prefer less motion get an instant change
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setApplied(next);
      return;
    }

    // 1. fade the current cards out
    setMotion((m) => ({ ...m, leaving: true, entering: false }));

    // 2. swap the list and fade the new cards in
    timers.current.push(
      setTimeout(() => {
        setApplied(next);
        setMotion((m) => ({ leaving: false, entering: true, key: m.key + 1 }));
      }, FADE_OUT_MS),
      // 3. stop animating, so later changes (like a drop) don't fade
      setTimeout(() => {
        setMotion((m) => ({ ...m, entering: false }));
      }, ENTER_TOTAL_MS)
    );
  }

  function visible(list) {
    return list.filter((s) => {
      if (
        q &&
        !s.title.toLowerCase().includes(q) &&
        !(s.description ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return matchesFilters(s, applied, user.id);
    });
  }

  async function handleDragEnd(result) {
    const { source, destination } = result;

    // dropped outside a column, or back in the same spot
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const previous = columns;
    const next = { ...columns };

    const from = Array.from(next[source.droppableId]);
    const [moved] = from.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      from.splice(destination.index, 0, moved);
      next[source.droppableId] = from;
    } else {
      const to = Array.from(next[destination.droppableId]);
      to.splice(destination.index, 0, {
        ...moved,
        status: destination.droppableId,
        // finished stories are always 100%
        ...(destination.droppableId === "done" && { progress: 100 }),
      });
      next[source.droppableId] = from;
      next[destination.droppableId] = to;
    }

    setColumns(next); // update the screen immediately
    setError("");

    // only send the columns that changed
    const affected = new Set([source.droppableId, destination.droppableId]);
    const payload = [...affected].flatMap((status) =>
      next[status].map((story, position) => ({ id: story.id, status, position }))
    );

    try {
      await reorderStories(board.id, payload);
    } catch (err) {
      setColumns(previous); // put the card back
      setError(`Could not save the move: ${err.message}`);
    }
  }

  // add and edit have no try/catch: the modal catches the error and shows it
  async function handleAdd(data) {
    const story = await addStory(board.id, data);
    setColumns((c) => ({ ...c, [story.status]: [...c[story.status], story] }));
  }

  async function handleEdit(story, data) {
    const updated = await updateStory(story.id, data);

    setColumns((c) => {
      // same column: replace the card where it is
      if (updated.status === story.status) {
        return {
          ...c,
          [story.status]: c[story.status].map((s) =>
            s.id === updated.id ? updated : s
          ),
        };
      }

      // different column: take it out of the old one, add it to the end of the new one
      return {
        ...c,
        [story.status]: c[story.status].filter((s) => s.id !== updated.id),
        [updated.status]: [...c[updated.status], updated],
      };
    });
  }

  async function handleDelete(status, storyId) {
    try {
      await deleteStory(storyId);
      setColumns((c) => ({
        ...c,
        [status]: c[status].filter((story) => story.id !== storyId),
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  function removePriority(value) {
    changeFilters({
      ...filters,
      priorities: filters.priorities.filter((p) => p !== value),
    });
  }

  function closeShare() {
    setSharing(false);
    loadPeople(); // people may have joined or left
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2.5">
        <label className="flex items-center gap-2 text-slate-600">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="bg-transparent text-sm focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => changeFilters({ ...filters, mine: !filters.mine })}
            aria-pressed={filters.mine}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
              filters.mine
                ? "border-brand bg-brand-soft text-brand"
                : "border-brand-muted/50 bg-white text-slate-700 hover:bg-brand-soft"
            }`}
          >
            <UserCheck size={13} />
            My stories
          </button>

          <FilterMenu value={filters} onChange={changeFilters} />

          <button
            onClick={() => setSharing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-brand-muted/50 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Users size={13} />
            Share
          </button>

          <button
            onClick={onNewBoard}
            className="rounded-lg border border-transparent bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            New Board
          </button>
          <button
            onClick={() => setModal({ status: "backlog" })}
            className="rounded-lg border border-transparent bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            Add Story
          </button>
        </div>
      </div>

      {/* slides open and closed, so the columns don't jump when chips appear */}
      <div
        className={`grid shrink-0 transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          showStatus ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {showStatus && (
            <div className="flex flex-col gap-2 pb-3">
              {filterActive && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {filters.mine && (
                    <Chip
                      key="mine"
                      label="Assigned to me"
                      onRemove={() => changeFilters({ ...filters, mine: false })}
                    />
                  )}

                  {filters.priorities.map((value) => {
                    const option = PRIORITY_OPTIONS.find((o) => o.value === value);
                    return (
                      <Chip
                        key={value}
                        label={`Priority: ${option.label}`}
                        onRemove={() => removePriority(value)}
                      />
                    );
                  })}

                  {filters.due !== "any" && (
                    <Chip
                      key="due"
                      label={`Due: ${DUE_OPTIONS.find((o) => o.value === filters.due).label}`}
                      onRemove={() => changeFilters({ ...filters, due: "any" })}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => changeFilters(DEFAULT_FILTERS)}
                    className="px-1 text-[10px] font-semibold text-brand hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {viewFiltered && (
                <p className="text-[10px] text-slate-500">
                  Dragging is paused while searching or filtering.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <p className="mb-2 shrink-0 text-xs text-red-600">{error}</p>}

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* horizontal scroll only: each column scrolls its own cards vertically */}
        <div className="min-h-0 flex-1 overflow-x-auto">
          <div className="flex h-full gap-4">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                title={col.title}
                description={col.description}
                stories={visible(columns[col.id])}
                total={columns[col.id].length}
                dragDisabled={viewFiltered}
                motion={motion}
                onAddClick={(status) => setModal({ status })}
                onOpen={(story) => setViewing(story.id)}
                onEdit={(story) => setModal({ story })}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      {modal && (
        <StoryModal
          story={modal.story}
          defaultStatus={modal.status}
          people={people}
          onSave={(data) =>
            modal.story ? handleEdit(modal.story, data) : handleAdd(data)
          }
          onClose={() => setModal(null)}
        />
      )}

      {viewingStory && (
        <StoryDetailsModal
          story={viewingStory}
          onClose={() => setViewing(null)}
          onEdit={(story) => {
            setViewing(null);
            setModal({ story });
          }}
          onDelete={(story) => handleDelete(story.status, story.id)}
        />
      )}

      {sharing && (
        <ShareModal
          board={board}
          user={user}
          onClose={closeShare}
          onLeave={onLeave}
        />
      )}
    </div>
  );
}