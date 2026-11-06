/**
 * Helpers for "neutral ink": text colors that really mean "just the normal text color".
 *
 * Why this exists: when you paste from Word, WPS, or Google Docs, the editor keeps the
 * document's fixed text color, almost always black (#000000), on every piece of text.
 * A fixed color beats the theme, so that text stays black on a dark page and you can't read it.
 *
 * The idea: a color that is almost pure black or almost pure white is not a choice the writer
 * made, so we drop it and let the theme's text color show through. Real colors (a red word,
 * a purple heading) are untouched.
 *
 * Two entry points:
 *   cleanPastedHtml(html)    runs while pasting
 *   stripNeutralColors(doc)  runs when a saved note is opened
 */

// Words that mean "the default color" and need no value at all.
const KEYWORDS = new Set(["inherit", "initial", "unset", "currentcolor", "auto", "none"]);

// Named colors worth recognizing. The Word-style system names (windowtext, window, ...)
// show up in pasted Word content.
const NAMED = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  windowtext: [0, 0, 0],
  canvastext: [0, 0, 0],
  buttontext: [0, 0, 0],
  fieldtext: [0, 0, 0],
  captiontext: [0, 0, 0],
  menutext: [0, 0, 0],
  infotext: [0, 0, 0],
  window: [255, 255, 255],
  canvas: [255, 255, 255],
  field: [255, 255, 255],
};

// Turns a CSS color into [red, green, blue] (each 0-255), or null if we can't read it.
function toRgb(value) {
  const text = String(value).trim().toLowerCase();

  if (NAMED[text]) return NAMED[text];

  // #rgb, #rgba, #rrggbb, or #rrggbbaa (an alpha part is ignored)
  const hexMatch = text.match(/^#([0-9a-f]{3,8})$/);
  if (hexMatch) {
    let hex = hexMatch[1];

    // "#abc" means "#aabbcc"
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("");
    if (hex.length !== 6 && hex.length !== 8) return null;

    return [0, 2, 4].map((start) => parseInt(hex.slice(start, start + 2), 16));
  }

  // rgb(0, 0, 0)   rgba(0, 0, 0, 1)   rgb(0 0 0 / 50%)
  const rgbMatch = text.match(/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/);
  if (rgbMatch) return [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map(Number);

  return null;
}

// How bright a color looks to the eye, 0 (black) to 255 (white).
const brightness = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;

// How far a color is from a plain gray: 0 means a pure gray, higher means more colorful.
const spread = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);

/**
 * True for a text color that just means "normal text": near-black or near-white grays.
 *   "#000000", "black", "windowtext", "rgb(20, 20, 20)", "#fafafa"  -> true
 *   "#6c63ff" (purple), "#dc2626" (red), "#64748b" (gray-blue)      -> false
 */
export function isNeutralInk(value) {
  const text = String(value ?? "").trim().toLowerCase();

  if (!text || KEYWORDS.has(text)) return true;

  const rgb = toRgb(text);
  if (!rgb) return false;

  const dark = brightness(rgb) <= 70 && spread(rgb) <= 45;
  const light = brightness(rgb) >= 215 && spread(rgb) <= 25;

  return dark || light;
}

/**
 * True for a background that is really "no highlight": transparent, or pure white.
 * Pasted Word text often carries a white background that would show as white boxes in dark mode.
 */
export function isBlankBackground(value) {
  const text = String(value ?? "").trim().toLowerCase();

  if (!text || text === "transparent" || KEYWORDS.has(text)) return true;

  // rgba(0, 0, 0, 0): fully see-through
  if (/^rgba?\(.*[,/]\s*0(\.0+)?\s*\)$/.test(text)) return true;

  const rgb = toRgb(text);
  if (!rgb) return false;

  return brightness(rgb) >= 240 && spread(rgb) <= 12;
}

// ---------- When a saved note is opened ----------

// Cleans ONE mark. Returns the mark, or null when nothing useful is left of it.
function cleanMark(mark) {
  // Only the "textStyle" mark carries colors. Bold, italic, and links pass through untouched.
  if (mark?.type !== "textStyle") return mark;

  const attrs = { ...mark.attrs };

  const highlighted = attrs.backgroundColor && !isBlankBackground(attrs.backgroundColor);

  // A neutral text color is dropped, unless the text sits on a real highlight
  // (white text on a dark highlight is a deliberate choice).
  if (attrs.color && isNeutralInk(attrs.color) && !highlighted) delete attrs.color;
  if (attrs.backgroundColor && isBlankBackground(attrs.backgroundColor)) {
    delete attrs.backgroundColor;
  }

  // Keep the mark only if some style is still set (a size, a font, a real color...).
  const somethingLeft = Object.values(attrs).some((v) => v !== null && v !== undefined && v !== "");

  return somethingLeft ? { ...mark, attrs } : null;
}

/**
 * Returns a copy of a note document with neutral colors removed.
 * The original is never changed: this builds new objects as it walks the tree.
 */
export function stripNeutralColors(node) {
  if (!node || typeof node !== "object") return node;

  const next = { ...node };

  if (Array.isArray(node.marks)) {
    const marks = node.marks.map(cleanMark).filter(Boolean);

    if (marks.length) next.marks = marks;
    else delete next.marks;
  }

  // Walk into the children: paragraphs hold text, lists hold items, and so on.
  if (Array.isArray(node.content)) {
    next.content = node.content.map(stripNeutralColors);
  }

  return next;
}

// ---------- While pasting ----------

/**
 * Cleans pasted HTML: removes neutral text colors and blank backgrounds from the
 * inline styles, before the editor turns the HTML into a note.
 * Plugged into the editor as `transformPastedHTML`.
 */
export function cleanPastedHtml(html) {
  // The browser's own HTML parser. The page is never touched: this builds a separate, inert copy.
  const parsed = new DOMParser().parseFromString(html, "text/html");

  parsed.body.querySelectorAll("[style]").forEach((element) => {
    const { color, backgroundColor } = element.style;

    const highlighted = backgroundColor && !isBlankBackground(backgroundColor);

    if (color && isNeutralInk(color) && !highlighted) element.style.removeProperty("color");
    if (backgroundColor && isBlankBackground(backgroundColor)) {
      element.style.removeProperty("background-color");
    }
  });

  return parsed.body.innerHTML;
}