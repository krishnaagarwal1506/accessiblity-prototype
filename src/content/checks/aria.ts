import type { AccessibilityIssue } from "@/types";
import { uid, truncateHTML, getSelector, isVisible } from "./utils";

/**
 * WCAG 4.1.2 Name, Role, Value — ARIA usage must be correct.
 * WCAG 1.3.1 Info and Relationships
 */

const REQUIRED_PROPS: Record<string, string[]> = {
  checkbox: ["aria-checked"],
  combobox: ["aria-expanded"],
  slider: ["aria-valuenow", "aria-valuemax", "aria-valuemin"],
  scrollbar: [
    "aria-controls",
    "aria-valuenow",
    "aria-valuemax",
    "aria-valuemin",
  ],
  switch: ["aria-checked"],
  tab: ["aria-selected"],
  meter: ["aria-valuenow"],
  spinbutton: ["aria-valuenow"],
};

const VALID_ROLES = new Set([
  "alert",
  "alertdialog",
  "application",
  "article",
  "banner",
  "button",
  "cell",
  "checkbox",
  "columnheader",
  "combobox",
  "complementary",
  "contentinfo",
  "definition",
  "dialog",
  "directory",
  "document",
  "feed",
  "figure",
  "form",
  "grid",
  "gridcell",
  "group",
  "heading",
  "img",
  "link",
  "list",
  "listbox",
  "listitem",
  "log",
  "main",
  "marquee",
  "math",
  "menu",
  "menubar",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "navigation",
  "none",
  "note",
  "option",
  "presentation",
  "progressbar",
  "radio",
  "radiogroup",
  "region",
  "row",
  "rowgroup",
  "rowheader",
  "scrollbar",
  "search",
  "searchbox",
  "separator",
  "slider",
  "spinbutton",
  "status",
  "switch",
  "tab",
  "table",
  "tablist",
  "tabpanel",
  "term",
  "textbox",
  "timer",
  "toolbar",
  "tooltip",
  "tree",
  "treegrid",
  "treeitem",
]);

export function checkAria(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const elementsWithRole = document.querySelectorAll("[role]");
  for (const el of elementsWithRole) {
    if (!isVisible(el)) continue;
    const role = el.getAttribute("role")!;

    // Invalid role
    if (!VALID_ROLES.has(role)) {
      issues.push({
        id: uid(),
        category: "aria",
        severity: "serious",
        message: `Invalid ARIA role: "${role}"`,
        element: truncateHTML(el.outerHTML),
        selector: getSelector(el),
        wcag: "4.1.2",
        help: `"${role}" is not a valid WAI-ARIA role. Use a recognized role from the ARIA specification.`,
      });
      continue;
    }

    // Missing required properties
    const required = REQUIRED_PROPS[role];
    if (required) {
      for (const prop of required) {
        if (!el.hasAttribute(prop)) {
          issues.push({
            id: uid(),
            category: "aria",
            severity: "serious",
            message: `Role "${role}" is missing required property ${prop}`,
            element: truncateHTML(el.outerHTML),
            selector: getSelector(el),
            wcag: "4.1.2",
            help: `Elements with role="${role}" must have ${prop}. Add the missing attribute.`,
          });
        }
      }
    }
  }

  // aria-labelledby / aria-describedby pointing to non-existent IDs
  const ariaRefAttrs = [
    "aria-labelledby",
    "aria-describedby",
    "aria-controls",
    "aria-owns",
  ];
  for (const attr of ariaRefAttrs) {
    const elements = document.querySelectorAll(`[${attr}]`);
    for (const el of elements) {
      const ids = el.getAttribute(attr)!.split(/\s+/);
      for (const id of ids) {
        if (id && !document.getElementById(id)) {
          issues.push({
            id: uid(),
            category: "aria",
            severity: "serious",
            message: `${attr} references non-existent id "${id}"`,
            element: truncateHTML(el.outerHTML),
            selector: getSelector(el),
            wcag: "1.3.1",
            help: `The id "${id}" referenced by ${attr} does not exist in the document.`,
          });
        }
      }
    }
  }

  return issues;
}
