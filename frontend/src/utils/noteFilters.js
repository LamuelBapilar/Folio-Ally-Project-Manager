export const DEFAULT_NOTE_FILTERS = {
    pinned: false,
    range: "any",
    from: "",
    to: "",
    sort: "updated",
  };
  
  export const RANGE_OPTIONS = [
    { value: "any", label: "Any time" },
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 days" },
    { value: "month", label: "Last 30 days" },
    { value: "custom", label: "Custom range" },
  ];
  
  export const SORT_OPTIONS = [
    { value: "updated", label: "Last edited" },
    { value: "created", label: "Date created" },
    { value: "title", label: "Title (A to Z)" },
  ];
  
  // "2026-10-31" in the browser's own calendar
  function localDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
  
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  
  function shortDate(dateString) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
  
  // the from and to dates the server should filter by
  export function rangeParams({ range, from, to }) {
    switch (range) {
      case "today":
        return { from: localDate(0), to: localDate(0) };
      case "week":
        return { from: localDate(-6) };
      case "month":
        return { from: localDate(-29) };
      case "custom":
        return { from, to };
      default:
        return {};
    }
  }
  
  export function isFiltering(filters) {
    return filters.pinned || filters.range !== "any" || filters.sort !== "updated";
  }
  
  // the text of the "date" chip
  export function describeRange({ range, from, to }) {
    if (range === "custom") {
      if (from && to) return `Edited: ${shortDate(from)} – ${shortDate(to)}`;
      if (from) return `Edited: since ${shortDate(from)}`;
      if (to) return `Edited: until ${shortDate(to)}`;
      return "Edited: custom range";
    }
  
    return `Edited: ${RANGE_OPTIONS.find((o) => o.value === range)?.label ?? ""}`;
  }