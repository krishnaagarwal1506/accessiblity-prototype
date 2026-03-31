import type { AccessibilityIssue } from "@/types";
import { uid, truncateHTML, getSelector, isVisible } from "./utils";

/**
 * WCAG 1.3.1 Info and Relationships — Semantic HTML usage.
 * WCAG 4.1.1 Parsing — Duplicate IDs.
 */

export function checkSemantics(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Duplicate IDs
  const idMap = new Map<string, Element[]>();
  const allWithId = document.querySelectorAll("[id]");
  for (const el of allWithId) {
    const id = el.id;
    if (!id) continue;
    const list = idMap.get(id) || [];
    list.push(el);
    idMap.set(id, list);
  }
  for (const [id, elements] of idMap) {
    if (elements.length > 1) {
      issues.push({
        id: uid(),
        category: "semantics",
        severity: "serious",
        message: `Duplicate id="${id}" found ${elements.length} times`,
        element: truncateHTML(elements[0].outerHTML),
        selector: `#${CSS.escape(id)}`,
        wcag: "4.1.1",
        help: "IDs must be unique. Duplicate IDs break label associations and ARIA references.",
      });
    }
  }

  // Tables without headers
  const tables = document.querySelectorAll("table");
  for (const table of tables) {
    if (!isVisible(table)) continue;
    // Skip layout tables
    if (table.getAttribute("role") === "presentation" || table.getAttribute("role") === "none") continue;

    const headers = table.querySelectorAll("th");
    if (headers.length === 0) {
      issues.push({
        id: uid(),
        category: "semantics",
        severity: "serious",
        message: "Data table has no header cells (th)",
        element: truncateHTML(table.outerHTML),
        selector: getSelector(table),
        wcag: "1.3.1",
        help: "Add <th> elements to identify column/row headers in data tables.",
      });
    }

    // Table without caption or aria-label
    const caption = table.querySelector("caption");
    if (
      !caption &&
      !table.getAttribute("aria-label") &&
      !table.getAttribute("aria-labelledby")
    ) {
      issues.push({
        id: uid(),
        category: "semantics",
        severity: "minor",
        message: "Data table has no caption or accessible name",
        element: truncateHTML(table.outerHTML),
        selector: getSelector(table),
        wcag: "1.3.1",
        help: "Add a <caption> or aria-label to describe the purpose of this table.",
      });
    }
  }

  // Buttons without accessible name
  const buttons = document.querySelectorAll("button, [role='button']");
  for (const btn of buttons) {
    if (!isVisible(btn)) continue;
    const name = getAccessibleName(btn);
    if (!name) {
      issues.push({
        id: uid(),
        category: "semantics",
        severity: "critical",
        message: "Button has no accessible name",
        element: truncateHTML(btn.outerHTML),
        selector: getSelector(btn),
        wcag: "4.1.2",
        help: "Add text content, aria-label, or aria-labelledby to give this button an accessible name.",
      });
    }
  }

  // <b> and <i> used instead of <strong> and <em>
  const bTags = document.querySelectorAll("b, i");
  for (const el of bTags) {
    if (!isVisible(el)) continue;
    const tag = el.tagName.toLowerCase();
    const alternative = tag === "b" ? "<strong>" : "<em>";
    issues.push({
      id: uid(),
      category: "semantics",
      severity: "minor",
      message: `<${tag}> used instead of ${alternative}`,
      element: truncateHTML(el.outerHTML),
      selector: getSelector(el),
      wcag: "1.3.1",
      help: `Use ${alternative} for semantic emphasis. <${tag}> is purely presentational.`,
    });
  }

  return issues;
}

function getAccessibleName(el: Element): string {
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    return labelledby
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || "")
      .join(" ")
      .trim();
  }

  const title = el.getAttribute("title");
  if (title) return title;

  return (el.textContent || "").trim();
}
