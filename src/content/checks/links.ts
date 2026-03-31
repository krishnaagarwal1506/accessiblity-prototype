import type { AccessibilityIssue } from "@/types";
import { uid, truncateHTML, getSelector, isVisible } from "./utils";

/**
 * WCAG 2.4.4 Link Purpose (In Context)
 * WCAG 4.1.2 Name, Role, Value — Links need accessible names.
 */

const GENERIC_LINK_TEXT = new Set([
  "click here",
  "here",
  "read more",
  "more",
  "learn more",
  "link",
  "click",
  "go",
  "details",
  "continue",
]);

export function checkLinks(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const links = document.querySelectorAll("a[href]");

  for (const link of links) {
    if (!isVisible(link)) continue;

    const text = getAccessibleName(link).trim();

    if (!text) {
      issues.push({
        id: uid(),
        category: "links",
        severity: "critical",
        message: "Link has no accessible name",
        element: truncateHTML(link.outerHTML),
        selector: getSelector(link),
        wcag: "4.1.2",
        help: "Add text content, aria-label, or aria-labelledby to give this link an accessible name.",
      });
      continue;
    }

    // Generic link text
    if (GENERIC_LINK_TEXT.has(text.toLowerCase())) {
      issues.push({
        id: uid(),
        category: "links",
        severity: "moderate",
        message: `Link has generic text: "${text}"`,
        element: truncateHTML(link.outerHTML),
        selector: getSelector(link),
        wcag: "2.4.4",
        help: "Use descriptive link text that explains where the link goes. Avoid generic text like \"click here\".",
      });
    }

    // Links opening in new window without warning
    if (
      link.getAttribute("target") === "_blank" &&
      !text.toLowerCase().includes("new window") &&
      !text.toLowerCase().includes("new tab") &&
      !link.getAttribute("aria-label")?.toLowerCase().includes("new") &&
      !link.querySelector('[aria-hidden="true"]') // skip icon-indicated ones
    ) {
      issues.push({
        id: uid(),
        category: "links",
        severity: "minor",
        message: "Link opens in new window without warning",
        element: truncateHTML(link.outerHTML),
        selector: getSelector(link),
        wcag: "3.2.5",
        help: 'Warn users that this link opens a new window/tab via text or aria-label, e.g. "(opens in new tab)".',
      });
    }
  }

  return issues;
}

function getAccessibleName(el: Element): string {
  // aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // aria-labelledby
  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    const parts = labelledby
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || "")
      .join(" ");
    if (parts.trim()) return parts;
  }

  // Image alt inside link
  const img = el.querySelector("img[alt]");
  if (img) return img.getAttribute("alt") || "";

  // Text content
  return el.textContent || "";
}
