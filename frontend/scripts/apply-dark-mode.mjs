/**
 * One-time helper: switches the signed-in app from fixed colors to theme colors,
 * so dark mode can recolor them.
 *
 *   bg-white           -> bg-surface   (cards, inputs, menus; also bg-white/70 -> bg-surface/70)
 *   bg-slate-900/30|40 -> bg-scrim     (the dim layer behind a window)
 *   bg-slate-900       -> bg-tooltip   (tooltip bubbles)
 *
 * It only touches the signed-in app. The landing, login, and register pages are NOT
 * listed below on purpose: they stay light.
 *
 * Safe to run more than once: files that are already converted are skipped.
 *
 * Usage (from the frontend folder):
 *   node scripts/apply-dark-mode.mjs --check    preview the files that would change
 *   node scripts/apply-dark-mode.mjs            apply the changes
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// The src folder, found relative to this script.
const SRC = fileURLToPath(new URL("../src", import.meta.url));
const DRY_RUN = process.argv.includes("--check");

// Folders and files (inside src) the swap applies to.
const TARGETS = [
  "pages/homepage",
  "pages/notespage",
  "components/account",
  "components/Sidebar.jsx",
  "components/ProfileMenu.jsx",
  "components/Field.jsx",
];

// Each rule matches a WHOLE class name: `(?<![\w-])` means "not preceded by a letter, digit,
// underscore, or dash", and `(?![\w-])` means "not followed by one". So `bg-white` matches,
// and so do `hover:bg-white` and `bg-white/70`, but a class like `bg-whitesmoke` would not.
const RULES = [
  { from: /(?<![\w-])bg-slate-900\/(?:30|40)(?![\w-])/g, to: "bg-scrim" },
  { from: /(?<![\w-])bg-white(?![\w-])/g, to: "bg-surface" },
  { from: /(?<![\w-])bg-slate-900(?![\w/-])/g, to: "bg-tooltip" },
];

// All .js and .jsx files inside a folder (or just the file, when given a file).
function listFiles(path) {
  const info = statSync(path, { throwIfNoEntry: false });

  if (!info) {
    console.warn(`  skipped (not found): ${relative(SRC, path)}`);
    return [];
  }

  if (info.isFile()) return /\.jsx?$/.test(path) ? [path] : [];

  // A folder: look inside every entry, including sub-folders.
  return readdirSync(path).flatMap((name) => listFiles(join(path, name)));
}

const files = TARGETS.flatMap((target) => listFiles(join(SRC, target)));

let changedFiles = 0;
let totalEdits = 0;

for (const file of files) {
  const before = readFileSync(file, "utf8");

  let after = before;
  let edits = 0;

  for (const rule of RULES) {
    // The function form lets us count every replacement.
    after = after.replace(rule.from, () => {
      edits += 1;
      return rule.to;
    });
  }

  if (after === before) continue; // already converted, or nothing to change

  changedFiles += 1;
  totalEdits += edits;
  console.log(`${DRY_RUN ? "would change" : "changed"}  ${relative(SRC, file)}  (${edits})`);

  if (!DRY_RUN) writeFileSync(file, after);
}

console.log(
  `\n${DRY_RUN ? "Would change" : "Changed"} ${totalEdits} class names in ${changedFiles} files (${files.length} files checked).`
);

// After applying, make sure nothing is left behind.
if (!DRY_RUN) {
  const LEFTOVER = /(?<![\w-])bg-white(?![\w-])|(?<![\w-])bg-slate-900(?![\w-])/;
  const left = files.filter((file) => LEFTOVER.test(readFileSync(file, "utf8")));

  console.log(
    left.length === 0
      ? "No fixed backgrounds left in the signed-in app."
      : `Still contains a fixed background:\n  ${left.map((f) => relative(SRC, f)).join("\n  ")}`
  );
}