// Turns a note into plain text. Bold, colors, and sizes can't exist in a .txt file, so
// they are left out. The words, lists, checklists, and links stay.

function inlineText(nodes = []) {
    let out = "";
    let run = "";
    let href = null;
  
    const flush = () => {
      out += run;
  
      // a link shows its address in brackets, unless the address is already the text
      const shown = href?.replace(/^mailto:/i, "");
      if (shown && !run.includes(shown)) out += ` (${href})`;
  
      run = "";
      href = null;
    };
  
    for (const node of nodes) {
      if (node.type === "text") {
        const link = node.marks?.find((m) => m.type === "link")?.attrs?.href ?? null;
  
        if (link !== href) flush();
        href = link;
        run += node.text ?? "";
      } else if (node.type === "hardBreak") {
        flush();
        out += "\n";
      } else {
        flush();
        out += inlineText(node.content);
      }
    }
  
    flush();
    return out;
  }
  
  const indentLines = (text, pad) =>
    text
      .split("\n")
      .map((line) => (line ? pad + line : line))
      .join("\n");
  
  function listItem(item, marker) {
    const pad = " ".repeat(marker.length);
    const [first, ...rest] = item.content ?? [];
  
    // the first paragraph sits beside the bullet; anything else goes below it, indented
    const lead = first?.type === "paragraph" ? first : null;
    const others = lead ? rest : first ? [first, ...rest] : [];
  
    const head = lead ? inlineText(lead.content).replace(/\n/g, `\n${pad}`) : "";
    const lines = [`${marker}${head}`];
  
    for (const child of others) {
      const text = block(child);
      if (text) lines.push(indentLines(text, pad));
    }
  
    return lines.join("\n");
  }
  
  function block(node) {
    switch (node.type) {
      case "paragraph":
      case "heading":
      case "codeBlock":
        return inlineText(node.content);
  
      case "blockquote":
        return blocks(node.content)
          .split("\n")
          .map((line) => `> ${line}`.trimEnd())
          .join("\n");
  
      case "bulletList":
        return (node.content ?? []).map((item) => listItem(item, "- ")).join("\n");
  
      case "orderedList": {
        const start = node.attrs?.start ?? 1;
        return (node.content ?? []).map((item, i) => listItem(item, `${start + i}. `)).join("\n");
      }
  
      case "taskList":
        return (node.content ?? [])
          .map((item) => listItem(item, item.attrs?.checked ? "[x] " : "[ ] "))
          .join("\n");
  
      case "horizontalRule":
        return "----------";
  
      default:
        return node.content ? blocks(node.content) : "";
    }
  }
  
  function blocks(nodes = []) {
    return nodes
      .map(block)
      .filter((text) => text !== "")
      .join("\n\n");
  }
  
  export function noteToText(title, doc) {
    const heading = (title ?? "").trim() || "Untitled";
    const body = blocks(doc?.content ?? [])
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  
    return body ? `${heading}\n\n${body}\n` : `${heading}\n`;
  }
  
  // "Plan: Q1/Q2?" becomes "Plan Q1Q2.txt"
  export function fileNameFor(title, extension = "txt") {
    const base = (title ?? "")
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80)
      .replace(/[. ]+$/, "");
  
    return `${base || "Untitled note"}.${extension}`;
  }
  
  export function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }