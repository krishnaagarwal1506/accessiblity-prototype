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

  // WCAG 2.5.8 Target Size — interactive elements should be at least 24×24px
  const MIN_TARGET_SIZE = 24;
  const interactiveSelectors =
    'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="tab"], [role="switch"]';
  const interactives = document.querySelectorAll(interactiveSelectors);
  for (const el of interactives) {
    if (isHidden(el)) continue;
    const rect = el.getBoundingClientRect();
    // Skip zero-size elements (likely off-screen or inline hidden)
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.width < MIN_TARGET_SIZE && rect.height < MIN_TARGET_SIZE) {
      issues.push({
        id: uid(),
        category: "keyboard",
        severity: "moderate",
        message: `Interactive element is too small: ${Math.round(rect.width)}×${Math.round(rect.height)}px (minimum ${MIN_TARGET_SIZE}×${MIN_TARGET_SIZE}px)`,
        element: truncateHTML(el.outerHTML),
        selector: getSelector(el),
        wcag: "2.5.8",
        help: `Ensure interactive elements have a minimum target size of ${MIN_TARGET_SIZE}×${MIN_TARGET_SIZE}px for touch accessibility.`,
      });
    }
  }

  // WCAG 2.4.7 Focus Visible — check for elements that suppress focus outlines
  const focusable = document.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex="0"]',
  );
  for (const el of focusable) {
    if (isHidden(el)) continue;
    if (!(el instanceof HTMLElement)) continue;
    const style = el.style;
    // Only flag inline styles that explicitly suppress outlines
    if (
      (style.outline === "none" || style.outline === "0") &&
      !style.boxShadow
    ) {
      issues.push({
        id: uid(),
        category: "keyboard",
        severity: "serious",
        message: "Element has inline style suppressing focus outline",
        element: truncateHTML(el.outerHTML),
        selector: getSelector(el),
        wcag: "2.4.7",
        help: "Do not remove focus outlines with outline:none unless you provide an alternative visible focus indicator (e.g. box-shadow).",
      });
    }
  }

  return issues;
}
