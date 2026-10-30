import { dueBucket } from "./due";

export const DEFAULT_FILTERS = { priorities: [], due: "any", mine: false };

export const PRIORITY_OPTIONS = [
  { value: "high", label: "High", dot: "bg-high" },
  { value: "medium", label: "Medium", dot: "bg-medium" },
  { value: "low", label: "Low", dot: "bg-low" },
  { value: "none", label: "Undefined", dot: "bg-slate-300" },
];

export const DUE_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Next 7 days" },
  { value: "none", label: "No due date" },
];

const DUE_MATCH = {
  any: () => true,
  overdue: (bucket) => bucket === "overdue",
  today: (bucket) => bucket === "today",
  week: (bucket) => bucket === "today" || bucket === "week",
  none: (bucket) => bucket === "none",
};

export function isFiltering(filters) {
  return filters.mine || filters.priorities.length > 0 || filters.due !== "any";
}

export function matchesFilters(story, filters, userId) {
  if (filters.mine && story.assigned_to !== userId) {
    return false;
  }

  if (
    filters.priorities.length > 0 &&
    !filters.priorities.includes(story.priority ?? "none")
  ) {
    return false;
  }

  return DUE_MATCH[filters.due](dueBucket(story));
}