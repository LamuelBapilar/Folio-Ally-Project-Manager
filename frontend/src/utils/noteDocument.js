// Makes sure a saved note can be opened by the editor.
// Given a document it does not understand, the editor silently shows an EMPTY page,
// so we check first, repair what we can, and tell the person.

// the reason a document is invalid, or null when it is fine
function problem(json, schema) {
    try {
      schema.nodeFromJSON(json).check();
      return null;
    } catch (error) {
      return error.message;
    }
  }
  
  // keeps only what the editor understands: text with real characters in it,
  // and node and mark types that exist
  function repairNode(node, schema, depth = 0) {
    if (!node || typeof node !== "object" || depth > 50) return null;
  
    if (node.type === "text") {
      if (typeof node.text !== "string" || node.text === "") return null;
  
      const marks = Array.isArray(node.marks)
        ? node.marks.filter((mark) => mark && schema.marks[mark.type])
        : [];
  
      return marks.length
        ? { type: "text", text: node.text, marks }
        : { type: "text", text: node.text };
    }
  
    if (typeof node.type !== "string" || !schema.nodes[node.type]) return null;
  
    const next = { ...node };
  
    if (Array.isArray(node.content)) {
      next.content = node.content
        .map((child) => repairNode(child, schema, depth + 1))
        .filter(Boolean);
  
      if (next.content.length === 0) delete next.content;
    } else {
      delete next.content;
    }
  
    return next;
  }
  
  // the words of the document, one line for each block of text
  function collectLines(node, lines, depth = 0) {
    if (!node || typeof node !== "object" || depth > 50 || !Array.isArray(node.content)) {
      return;
    }
  
    const text = node.content
      .filter((child) => child && child.type === "text" && typeof child.text === "string")
      .map((child) => child.text)
      .join("");
  
    if (text.trim()) lines.push(text);
  
    node.content.forEach((child) => collectLines(child, lines, depth + 1));
  }
  
  // returns { doc, repaired }
  //   doc      a document the editor can open, or null for an empty note
  //   repaired true when the saved copy had a problem
  export function prepareDocument(content, schema) {
    // nothing was ever written in this note
    if (
      !content ||
      typeof content !== "object" ||
      !Array.isArray(content.content) ||
      content.content.length === 0
    ) {
      return { doc: null, repaired: false };
    }
  
    const reason = problem(content, schema);
    if (!reason) return { doc: content, repaired: false };
  
    // shown in the browser console, so the cause can be seen
    console.warn("[Folio] This note could not be opened as saved:", reason);
  
    const fixed = repairNode(content, schema);
    if (fixed && Array.isArray(fixed.content) && !problem(fixed, schema)) {
      return { doc: fixed, repaired: true };
    }
  
    // last resort: keep the words, drop the formatting
    const lines = [];
    collectLines(content, lines);
  
    return {
      doc: lines.length
        ? {
            type: "doc",
            content: lines.map((line) => ({
              type: "paragraph",
              content: [{ type: "text", text: line }],
            })),
          }
        : null,
      repaired: true,
    };
  }