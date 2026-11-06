import { useCallback, useEffect, useRef, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Search, UserCheck, Users, X } from "lucide-react";
import { getMembers } from "../../../API/members";
import { addStory, deleteStory, reorderStories, updateStory } from "../../../API/story";
import { COLUMNS } from "../../../constants/stories";
import {
  DEFAULT_FILTERS,
  DUE_OPTIONS,
  PRIORITY_OPTIONS,
  isFiltering,
  matchesFilters,
} from "../../../utils/filters";
import BoardSummary from "./BoardSummary";
import Column from "./Column";
import FilterMenu from "./FilterMenu";
import ShareModal from "./ShareModal";
import StoryDetailsModal from "./StoryDetailsModal";
import StoryModal from "./StoryModal";

/**
 * The board screen: toolbar, summary strip, filter chips, and the columns.
 *
 * Data flow: the page gives us `board` (with its stories) ONCE. We copy the stories into
 * `columns` state and update that copy as you drag, add, edit, and delete. Each change is
 * also sent to the server (src/API/story.js). If the server says no, we undo the change.
 *
 * Props:
 *   board       the open board, including board.stories
 *   user        the signed-in person
 *   onNewBoard  opens the "create board" window (lives in the page)
 *   onLeave     called after you leave a shared board
 */

const FADE_OUT_MS = 130; // old cards fade out for this long before the list changes
const ENTER_TOTAL_MS = 650; // long enough for the fade-in and its stagger to finish

// Sorts stories into one list per column, in saved order.
// The lists come from COLUMNS, so adding a column there needs no change here.
function groupByStatus(stories) {
  const grouped = Object.fromEntries(COLUMNS.map((column) => [column.id, []]));

  [...stories]
    .sort((a, b) => a.position - b.position)
    .forEach((story) => grouped[story.status]?.push(story));

  return grouped;
}

// A small removable tag that shows one active filter.
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
  // ---------- State ----------
  const [columns, setColumns] = useState(() => groupByStatus(board.stories));
  const [people, setPeople] = useState([]); // the owner and members: who a story can be assigned to
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Filters live in TWO states so the fade transition works:
  //   `filters` updates instantly (the menu and chips never lag),
  //   `applied` is what the board really shows, and updates after the fade-out.
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [applied, setApplied] = useState(DEFAULT_FILTERS);
  const [motion, setMotion] = useState({ leaving: false, entering: false, key: 0 });
  const timers = useRef([]);

  // Which window is open:
  //   null = none, { status } = adding to a column, { story } = editing a card.
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null); // id of the story whose details are open
  const [sharing, setSharing] = useState(false); // the Share window

  // Stop any pending filter-fade timers when the board goes away.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ---------- Loading the people list (for the "Assigned to" dropdown) ----------
  const loadPeople = useCallback(async () => {
    try {
      const { owner, members } = await getMembers(board.id);
      setPeople([owner, ...members]);
    } catch {
      // Assigning just has no list to pick from. The board still works.
    }
  }, [board.id]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // ---------- Derived values (computed from state on every render) ----------
  const q = search.trim().toLowerCase();
  const filterActive = isFiltering(filters);
  const viewFiltered = !!q || isFiltering(applied);
  const showStatus = filterActive || viewFiltered;

  // Always the latest copy of the story, so edits show up inside the open details window.
  const viewingStory = viewing
    ? Object.values(columns).flat().find((s) => s.id === viewing)
    : null;

  // ---------- Filtering ----------

  // Changes the filters with a fade: old cards fade out, the list swaps, new cards fade in.
  function changeFilters(next) {
    setFilters(next);

    timers.current.forEach(clearTimeout);
    timers.current = [];

    // People who prefer less motion get an instant change.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setApplied(next);
      return;
    }

    // 1. Fade the current cards out.
    setMotion((m) => ({ ...m, leaving: true, entering: false }));

    timers.current.push(
      // 2. Swap the list, and fade the new cards in.
      setTimeout(() => {
        setApplied(next);
        setMotion((m) => ({ leaving: false, entering: true, key: m.key + 1 }));
      }, FADE_OUT_MS),
      // 3. Stop animating, so later changes (like a drop) don't fade.
      setTimeout(() => {
        setMotion((m) => ({ ...m, entering: false }));
      }, ENTER_TOTAL_MS)
    );
  }

  // The stories of one column that pass the search box and the applied filters.
  function visible(list) {
    return list.filter((story) => {
      if (
        q &&
        !story.title.toLowerCase().includes(q) &&
        !(story.description ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return matchesFilters(story, applied, user.id);
    });
  }

  // ---------- Drag and drop ----------
  async function handleDragEnd(result) {
    const { source, destination } = result;

    // Dropped outside a column, or back in the same spot: nothing to do.
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const previous = columns; // kept so we can undo if the server refuses
    const next = { ...columns };

    // Take the card out of its old position...
    const from = Array.from(next[source.droppableId]);
    const [moved] = from.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // ...and put it back in the same column at the new position.
      from.splice(destination.index, 0, moved);
      next[source.droppableId] = from;
    } else {
      // ...or put it in another column. Its status changes with the column.
      const to = Array.from(next[destination.droppableId]);
      to.splice(destination.index, 0, {
        ...moved,
        status: destination.droppableId,
        // Finished stories are always 100%.
        ...(destination.droppableId === "done" && { progress: 100 }),
      });
      next[source.droppableId] = from;
      next[destination.droppableId] = to;
    }

    setColumns(next); // update the screen immediately
    setError("");

    // Send only the columns that changed: each story's id, column, and position.
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

  // ---------- Add, edit, delete ----------
  // handleAdd and handleEdit do NOT catch errors: the story window catches them
  // and shows the message inside the window.

  async function handleAdd(data) {
    const story = await addStory(board.id, data);
    setColumns((c) => ({ ...c, [story.status]: [...c[story.status], story] }));
  }

  async function handleEdit(story, data) {
    const updated = await updateStory(story.id, data);

    setColumns((c) => {
      // Same column: replace the card where it is.
      if (updated.status === story.status) {
        return {
          ...c,
          [story.status]: c[story.status].map((s) => (s.id === updated.id ? updated : s)),
        };
      }

      // Different column: take it out of the old one, add it to the end of the new one.
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

  // ---------- Small helpers used by the JSX below ----------
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
      {/* Toolbar: search on the left, actions on the right */}
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
                : "border-brand-muted/50 bg-surface text-slate-700 hover:bg-brand-soft"
            }`}
          >
            <UserCheck size={13} />
            My stories
          </button>

          <FilterMenu value={filters} onChange={changeFilters} />

          <button
            onClick={() => setSharing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-brand-muted/50 bg-surface px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
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

      {/* The progress strip. Its "Overdue" button applies the overdue filter. */}
      <BoardSummary
        columns={columns}
        onShowOverdue={() => changeFilters({ ...filters, due: "overdue" })}
      />

      {/* Active filter chips. The row slides open and closed, so the columns don't jump. */}
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

      {/* The columns. DragDropContext listens for drops anywhere inside it. */}
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Horizontal scroll only: each column scrolls its own cards vertically. */}
        <div className="min-h-0 flex-1 overflow-x-auto">
          <div className="flex h-full gap-4">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                title={col.label}
                description={col.description}
                accent={col.accent}
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

      {/* ---------- Windows. Each renders only while it is open. ---------- */}

      {modal && (
        <StoryModal
          story={modal.story}
          defaultStatus={modal.status}
          people={people}
          onSave={(data) => (modal.story ? handleEdit(modal.story, data) : handleAdd(data))}
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

      {sharing && <ShareModal board={board} user={user} onClose={closeShare} onLeave={onLeave} />}
    </div>
  );
}