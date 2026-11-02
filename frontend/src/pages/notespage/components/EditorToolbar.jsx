import { useState } from "react";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Highlighter,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import MenuButton, { MenuItem } from "./MenuButton";

const DEFAULT_SIZE = 14;
const FONT_SIZES = [10, 12, 16, 18, 24, 32];

const TEXT_COLORS = [
  { name: "Purple", value: "#6c63ff" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Green", value: "#16a34a" },
  { name: "Blue", value: "#2563eb" },
  { name: "Gray", value: "#64748b" },
];

const HIGHLIGHTS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Lavender", value: "#e0dcff" },
];

const HEADINGS = [
  { level: 0, label: "Paragraph", style: "text-xs" },
  { level: 1, label: "Heading 1", style: "text-base font-bold" },
  { level: 2, label: "Heading 2", style: "text-sm font-bold" },
  { level: 3, label: "Heading 3", style: "text-xs font-bold" },
];

const button =
  "grid h-7 min-w-7 place-items-center rounded-md px-1 text-slate-600 transition-colors hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-600";

function ToolButton({ label, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // keeps the text selected while you click a button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`${button} ${active ? "bg-brand-soft text-brand" : ""}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-4 w-px bg-brand-muted/50" />;
}

function Palette({ colors, noneLabel, onPick, close }) {
  const pick = (value) => () => {
    onPick(value);
    close();
  };

  return (
    <div className="p-2">
      <div className="grid grid-cols-6 gap-1.5">
        {colors.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.name}
            aria-label={c.name}
            onMouseDown={(e) => e.preventDefault()}
            onClick={pick(c.value)}
            style={{ backgroundColor: c.value }}
            className="h-5 w-5 rounded-full border border-black/10 transition-transform hover:scale-110"
          />
        ))}
      </div>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={pick(null)}
        className="mt-2 w-full rounded-md px-2 py-1 text-left text-[11px] hover:bg-brand-soft"
      >
        {noneLabel}
      </button>
    </div>
  );
}

// turns "example.com" into a safe https address, or null if it is not a valid one
function normalizeUrl(input) {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);

    if (!["http:", "https:", "mailto:"].includes(url.protocol)) return null;
    if (url.protocol !== "mailto:" && !url.hostname.includes(".")) return null;

    return url.href;
  } catch {
    return null;
  }
}

function LinkForm({ editor, href, hasLink, close }) {
  const [url, setUrl] = useState(href);
  const [error, setError] = useState("");

  function apply(e) {
    e.preventDefault();

    const clean = normalizeUrl(url);
    if (!clean) {
      setError("Enter a valid web address, like example.com");
      return;
    }

    const chain = editor.chain().focus();

    if (editor.state.selection.empty && !hasLink) {
      // nothing is selected, so the address itself becomes the linked text
      chain
        .insertContent({
          type: "text",
          text: clean,
          marks: [{ type: "link", attrs: { href: clean } }],
        })
        .run();
    } else {
      chain.extendMarkRange("link").setLink({ href: clean }).run();
    }

    close();
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    close();
  }

  return (
    <form onSubmit={apply} className="space-y-2 p-2.5">
      <label htmlFor="note-link" className="block text-[11px] font-medium">
        Link address
      </label>
      <input
        id="note-link"
        autoFocus
        autoComplete="off"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setError("");
        }}
        placeholder="example.com"
        className="w-full rounded-lg border border-brand-muted/50 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <div className="flex gap-2">
        {hasLink && (
          <button
            type="button"
            onClick={remove}
            className="rounded-lg border border-brand-muted/50 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-brand-soft"
          >
            Remove link
          </button>
        )}
        <button className="ml-auto rounded-lg bg-brand px-3 py-1 text-[11px] font-semibold text-white hover:bg-brand-dark">
          Apply
        </button>
      </div>
    </form>
  );
}

export default function EditorToolbar({ editor }) {
  // the toolbar re-reads the editor whenever the selection or formatting changes
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;

      const style = e.getAttributes("textStyle");

      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        task: e.isActive("taskList"),
        quote: e.isActive("blockquote"),
        hasLink: e.isActive("link"),
        href: e.getAttributes("link").href ?? "",
        heading: [1, 2, 3].find((level) => e.isActive("heading", { level })) ?? 0,
        align: ["center", "right"].find((a) => e.isActive({ textAlign: a })) ?? "left",
        fontSize: style.fontSize ? parseInt(style.fontSize, 10) : DEFAULT_SIZE,
        color: style.color ?? "",
        highlight: style.backgroundColor ?? "",
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  if (!editor || !s) return null;

  const chain = () => editor.chain().focus();

  const setHeading = (level) =>
    level === 0 ? chain().setParagraph().run() : chain().setHeading({ level }).run();

  const setSize = (size) =>
    size ? chain().setFontSize(`${size}px`).run() : chain().unsetFontSize().run();

  const setColor = (value) =>
    value ? chain().setColor(value).run() : chain().unsetColor().run();

  const setHighlight = (value) =>
    value ? chain().setBackgroundColor(value).run() : chain().unsetBackgroundColor().run();

  const headingLabel = HEADINGS.find((h) => h.level === s.heading)?.label ?? "Paragraph";

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="flex shrink-0 flex-wrap items-center gap-0.5 border-y border-brand-soft bg-white px-3 py-1.5"
    >
      <ToolButton label="Undo" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 size={14} />
      </ToolButton>
      <ToolButton label="Redo" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 size={14} />
      </ToolButton>

      <Divider />

      <MenuButton
        keepFocus
        label="Text style"
        buttonClassName={`${button} gap-0.5 px-2 text-xs font-semibold`}
        panelClassName="w-40"
        trigger={
          <>
            <span className="w-14 truncate text-left">{headingLabel}</span>
            <ChevronDown size={12} />
          </>
        }
      >
        {(close) => (
          <div className="p-1">
            {HEADINGS.map((h) => (
              <MenuItem
                key={h.level}
                active={s.heading === h.level}
                onClick={() => {
                  setHeading(h.level);
                  close();
                }}
              >
                <span className={h.style}>{h.label}</span>
              </MenuItem>
            ))}
          </div>
        )}
      </MenuButton>

      <MenuButton
        keepFocus
        label="Font size"
        buttonClassName={`${button} gap-0.5 px-2 text-xs font-semibold`}
        panelClassName="w-32"
        trigger={
          <>
            <span className="w-5 text-center">{s.fontSize}</span>
            <ChevronDown size={12} />
          </>
        }
      >
        {(close) => (
          <div className="p-1">
            <MenuItem
              active={s.fontSize === DEFAULT_SIZE}
              onClick={() => {
                setSize(null);
                close();
              }}
            >
              Default ({DEFAULT_SIZE})
            </MenuItem>
            {FONT_SIZES.map((size) => (
              <MenuItem
                key={size}
                active={s.fontSize === size}
                onClick={() => {
                  setSize(size);
                  close();
                }}
              >
                {size}
              </MenuItem>
            ))}
          </div>
        )}
      </MenuButton>

      <Divider />

      <ToolButton label="Bold (Ctrl+B)" active={s.bold} onClick={() => chain().toggleBold().run()}>
        <Bold size={14} />
      </ToolButton>
      <ToolButton label="Italic (Ctrl+I)" active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic size={14} />
      </ToolButton>
      <ToolButton label="Underline (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
        <Underline size={14} />
      </ToolButton>
      <ToolButton label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough size={14} />
      </ToolButton>

      <MenuButton
        keepFocus
        label="Text color"
        buttonClassName={button}
        panelClassName="w-44"
        trigger={
          <span className="flex flex-col items-center leading-none">
            <span className="text-xs font-bold">A</span>
            <span
              className="mt-0.5 h-0.5 w-3.5 rounded"
              style={{ backgroundColor: s.color || "#475569" }}
            />
          </span>
        }
      >
        {(close) => (
          <Palette colors={TEXT_COLORS} noneLabel="Default color" onPick={setColor} close={close} />
        )}
      </MenuButton>

      <MenuButton
        keepFocus
        label="Highlight"
        buttonClassName={button}
        panelClassName="w-44"
        trigger={
          <span className="flex flex-col items-center leading-none">
            <Highlighter size={13} />
            <span
              className="mt-0.5 h-0.5 w-3.5 rounded"
              style={{ backgroundColor: s.highlight || "#cbd5e1" }}
            />
          </span>
        }
      >
        {(close) => (
          <Palette colors={HIGHLIGHTS} noneLabel="No highlight" onPick={setHighlight} close={close} />
        )}
      </MenuButton>

      <Divider />

      <ToolButton label="Bulleted list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List size={14} />
      </ToolButton>
      <ToolButton label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered size={14} />
      </ToolButton>
      <ToolButton label="Checklist" active={s.task} onClick={() => chain().toggleTaskList().run()}>
        <ListChecks size={14} />
      </ToolButton>

      <Divider />

      <ToolButton label="Align left" active={s.align === "left"} onClick={() => chain().setTextAlign("left").run()}>
        <AlignLeft size={14} />
      </ToolButton>
      <ToolButton label="Align center" active={s.align === "center"} onClick={() => chain().setTextAlign("center").run()}>
        <AlignCenter size={14} />
      </ToolButton>
      <ToolButton label="Align right" active={s.align === "right"} onClick={() => chain().setTextAlign("right").run()}>
        <AlignRight size={14} />
      </ToolButton>

      <Divider />

      <ToolButton label="Quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote size={14} />
      </ToolButton>
      <ToolButton label="Divider line" onClick={() => chain().setHorizontalRule().run()}>
        <Minus size={14} />
      </ToolButton>

      <MenuButton
        keepFocus
        label="Link"
        buttonClassName={`${button} ${s.hasLink ? "bg-brand-soft text-brand" : ""}`}
        panelClassName="w-64"
        trigger={<Link2 size={14} />}
      >
        {(close) => (
          <LinkForm editor={editor} href={s.href} hasLink={s.hasLink} close={close} />
        )}
      </MenuButton>

      <ToolButton
        label="Clear formatting"
        onClick={() => chain().clearNodes().unsetAllMarks().run()}
      >
        <RemoveFormatting size={14} />
      </ToolButton>
    </div>
  );
}