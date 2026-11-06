/**
 * The vocabulary of a story: its columns, and its priorities.
 *
 * Keep this file in step with the backend:
 *   - COLUMN ids   must match app/Enums/StoryStatus.php
 *   - PRIORITY keys must match app/Enums/StoryPriority.php (plus "none" for no priority)
 *
 * Tailwind only keeps classes it can read as whole words, so class names here are written
 * out in full, never built with string pieces.
 */

// The board columns, in the order they appear from left to right.
//   id:          the value saved in the database (stories.status)
//   label:       what people read
//   accent:      the colored dot beside the column title
//   description: the text of the (!) tooltip
export const COLUMNS = [
    {
      id: "backlog",
      label: "BackLog",
      accent: "bg-slate-400",
      description:
        "Ideas and tasks that are not scheduled yet. Park things here until you decide to work on them.",
    },
    {
      id: "todo",
      label: "To do",
      accent: "bg-brand",
      description:
        "Stories that are ready to start. Pick the next one from the top of this column.",
    },
    {
      id: "in_progress",
      label: "In Progress",
      accent: "bg-medium",
      description:
        "Stories being worked on right now. Try to keep this column short so work gets finished.",
    },
    {
      id: "done",
      label: "Done",
      accent: "bg-low",
      description:
        "Finished stories. Completed work stays here as a record of what has shipped.",
    },
  ];
  
  // Quick lookup: STATUS_LABEL["in_progress"] gives "In Progress".
  export const STATUS_LABEL = Object.fromEntries(COLUMNS.map((c) => [c.id, c.label]));
  
  // How each priority looks.
  //   style: the colored tag      edge: the colored left border of a story card
  // A story with no priority uses the "none" entry, so look-ups never come back empty:
  //   const priority = PRIORITIES[story.priority ?? "none"] ?? PRIORITIES.none;
  export const PRIORITIES = {
    low: { label: "Low", style: "bg-low/15 text-low", edge: "border-l-low" },
    medium: { label: "Medium", style: "bg-medium/20 text-medium", edge: "border-l-medium" },
    high: { label: "High", style: "bg-high/15 text-high", edge: "border-l-high" },
    none: { label: "Undefined", style: "bg-slate-100 text-slate-500", edge: "border-l-transparent" },
  };