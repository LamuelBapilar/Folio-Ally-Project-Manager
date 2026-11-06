import { useSyncExternalStore } from "react";

/**
 * Theme store: remembers whether the app is "light", "dark", or "system"
 * (follow the device), and tells React when that changes.
 *
 * Why not useState? Several unrelated components need the same answer at the same time:
 * the loading screen, the home page, and the Appearance settings. A small shared store
 * keeps them in sync, and React's `useSyncExternalStore` hook is the official way to read one.
 *
 * Usage in a component:
 *   const { preference, resolved, setPreference } = useTheme();
 *   preference: what the person picked  -> "light" | "dark" | "system"
 *   resolved:   what to actually show   -> "light" | "dark"
 */

export const THEME_STORAGE_KEY = "folio:theme";

// What a first-time visitor gets. Change to "light" to start everyone in light mode.
const DEFAULT_PREFERENCE = "system";

// The browser's "my device is in dark mode" signal.
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

// Functions React gives us to say "re-read the theme".
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

// Reads the saved choice. Browsers can block storage (private mode), so this never throws.
function readStored() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : DEFAULT_PREFERENCE;
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

// The current choice for this tab. Kept in memory too, so it still works when storage is blocked.
let preference = readStored();

// Turns "system" into a real answer, using the device setting.
export function resolveTheme(choice = preference) {
  if (choice === "system") return darkQuery.matches ? "dark" : "light";
  return choice;
}

// Saves a new choice and updates every component that is using the theme.
export function setThemePreference(next) {
  preference = next;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage is blocked: the choice lasts until the tab closes, which is fine.
  }

  notify();
}

// The device switched between light and dark (for example at sunset): refresh "system" users.
darkQuery.addEventListener("change", notify);

// Another browser tab changed the theme: follow it. (This event only fires in OTHER tabs.)
window.addEventListener("storage", (event) => {
  if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;

  preference = readStored();
  notify();
});

// How React subscribes to changes. It returns a function that unsubscribes.
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const currentPreference = useSyncExternalStore(subscribe, () => preference);
  const resolved = useSyncExternalStore(subscribe, () => resolveTheme());

  return { preference: currentPreference, resolved, setPreference: setThemePreference };
}