import type { AccessibilityIssue } from "@/types";
import { uid, truncateHTML, getSelector, isVisible } from "./utils";

/**
 * WCAG 1.3.1 Info and Relationships — Form inputs need labels.
 * WCAG 3.3.2 Labels or Instructions — Visible labels.
 * WCAG 4.1.2 Name, Role, Value — Programmatic label.
 */

export function checkForms(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const inputs = document.querySelectorAll(
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='image']), select, textarea",
  );

  for (const input of inputs) {
    if (!isVisible(input)) continue;

    const hasLabel = hasAssociatedLabel(input);
    const ariaLabel = input.getAttribute("aria-label");
    const ariaLabelledby = input.getAttribute("aria-labelledby");
    const title = input.getAttribute("title");
    const placeholder = input.getAttribute("placeholder");

    if (!hasLabel && !ariaLabel && !ariaLabelledby && !title) {
      const inputTag = input.tagName.toLowerCase();
      const inputId = input.id || "my-input";
      issues.push({
        id: uid(),
        category: "forms",
        severity: "critical",
        message: "Form input has no accessible label",
        element: truncateHTML(input.outerHTML),
        selector: getSelector(input),
        wcag: "1.3.1",
        help: "Associate a <label> using for/id, wrap the input in a <label>, or add aria-label / aria-labelledby.",
        fixSnippet: `<label for="${inputId}">Label text</label>\n<${inputTag} id="${inputId}">`,
      });
    } else if (!hasLabel && !ariaLabelledby && placeholder && !ariaLabel) {
      // Only has placeholder — not a reliable label
      issues.push({
        id: uid(),
        category: "forms",
        severity: "moderate",
        message: "Form input relies on placeholder as its only label",
        element: truncateHTML(input.outerHTML),
        selector: getSelector(input),
        wcag: "3.3.2",
        help: "Placeholders disappear when typing. Use a visible <label> element instead.",
      });
    }
  }

  // Check for autocomplete on identity fields
  const identityInputs = document.querySelectorAll(
    'input[type="email"], input[type="tel"], input[type="text"][name*="name"], input[type="text"][name*="address"]',
  );
  for (const input of identityInputs) {
    if (!isVisible(input)) continue;
    if (!input.getAttribute("autocomplete")) {
      issues.push({
        id: uid(),
        category: "forms",
        severity: "minor",
        message:
          "Input collecting personal data missing autocomplete attribute",
        element: truncateHTML(input.outerHTML),
        selector: getSelector(input),
        wcag: "1.3.5",
        help: 'Add an appropriate autocomplete attribute (e.g., autocomplete="email") to help users fill in forms.',
      });
    }
  }

  return issues;
}

function hasAssociatedLabel(input: Element): boolean {
  // Wrapped in <label>
  if (input.closest("label")) return true;

  // Explicit for/id association
  const id = input.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label) return true;
  }

  return false;
}
