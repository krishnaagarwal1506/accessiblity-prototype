import type { AccessibilityIssue } from "@/types";
import { uid, truncateHTML, getSelector, isHidden } from "./utils";

/**
 * WCAG 2.1.1 Keyboard — All functionality must be operable through a keyboard.
 * WCAG 2.1.2 No Keyboard Trap
 * WCAG 4.1.2 Name, Role, Value — interactive widgets need correct roles.
 */

const NATIVE_INTERACTIVE = new Set([
  "A",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "SUMMARY",
  "DETAILS",
]);

const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "textbox",
  "combobox",
  "gridcell",
  "treeitem",
]);

function hasAccessibleParent(el: Element): boolean {
  let current = el.parentElement;
  while (current && current !== document.body) {
    if (NATIVE_INTERACTIVE.has(current.tagName)) return true;
    const role = current.getAttribute("role");
    const tabIndex = current.getAttribute("tabindex");
    if (
      (role && INTERACTIVE_ROLES.has(role)) ||
      (tabIndex !== null && parseInt(tabIndex, 10) >= 0)
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

export function checkKeyboardAccessibility(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const all = document.querySelectorAll("*");

  for (const el of all) {
    if (isHidden(el)) continue;
    if (NATIVE_INTERACTIVE.has(el.tagName)) continue;
    if (hasAccessibleParent(el)) continue;

    const role = el.getAttribute("role");
    const tabIndex = el.getAttribute("tabindex");

    const hasClick =
      el.hasAttribute("onclick") ||
      (el instanceof HTMLElement && typeof el.onclick === "function") ||
      window.getComputedStyle(el).cursor === "pointer";

    const isKeyboardAccessible =
      (tabIndex !== null && parseInt(tabIndex, 10) >= 0) ||
      (role !== null && INTERACTIVE_ROLES.has(role));

    if (hasClick && !isKeyboardAccessible) {
      issues.push({
        id: uid(),
        category: "keyboard",
        severity: "critical",
        message: "Clickable element is not keyboard accessible",
        element: truncateHTML(el.outerHTML),
        selector: getSelector(el),
        wcag: "2.1.1",
        help: 'Add tabindex="0" and an appropriate ARIA role, or use a native <button> / <a>.',
      });
    }

    // Interactive role without tabindex
    if (role && INTERACTIVE_ROLES.has(role) && tabIndex === null) {
      issues.push({
        id: uid(),
        category: "keyboard",
        severity: "serious",
        message: `Element with role="${role}" is not focusable`,
        element: truncateHTML(el.outerHTML),
        selector: getSelector(el),
        wcag: "2.1.1",
        help: 'Add tabindex="0" to make this element focusable via keyboard.',
      });
    }
  }

  // Check for tabindex > 0 (disrupts natural tab order)
  const positiveTabindex = document.querySelectorAll("[tabindex]");
  for (const el of positiveTabindex) {
    const val = parseInt(el.getAttribute("tabindex")!, 10);
    if (val > 0) {
      issues.push({
        id: uid(),
        category: "keyboard",
        severity: "moderate",
        message: `Element has tabindex="${val}" which disrupts natural tab order`,
        element: truncateHTML(el.outerHTML),
        selector: getSelector(el),
        wcag: "2.4.3",
        help: 'Avoid positive tabindex values. Use tabindex="0" and arrange DOM order instead.',
      });
    }
  }

  return issues;
}
