import type { AccessibilityIssue } from "@/types";
import { uid, truncateHTML, getSelector, isVisible } from "./utils";

/**
 * WCAG 1.3.1 Info and Relationships — Heading levels should be logical.
 * WCAG 2.4.6 Headings and Labels — Headings should be descriptive.
 * WCAG 2.4.1 Bypass Blocks — Document should have headings.
 */

export function checkHeadings(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const headingLevels: number[] = [];

  let h1Count = 0;

  for (const heading of headings) {
    if (!isVisible(heading)) continue;

    const level = parseInt(heading.tagName[1]);
    headingLevels.push(level);

    if (level === 1) h1Count++;

    // Empty heading
    const text = heading.textContent?.trim();
    if (!text) {
      issues.push({
        id: uid(),
        category: "headings",
        severity: "moderate",
        message: `Empty ${heading.tagName.toLowerCase()} heading`,
        element: truncateHTML(heading.outerHTML),
        selector: getSelector(heading),
        wcag: "2.4.6",
        help: "Headings should contain descriptive text. Remove empty headings or add content.",
      });
    }
  }

  // Check for skipped heading levels
  for (let i = 1; i < headingLevels.length; i++) {
    const current = headingLevels[i];
    const previous = headingLevels[i - 1];

    if (current > previous + 1) {
      const heading = headings[i];
      issues.push({
        id: uid(),
        category: "headings",
        severity: "moderate",
        message: `Heading level skipped: h${previous} → h${current}`,
        element: truncateHTML(heading.outerHTML),
        selector: getSelector(heading),
        wcag: "1.3.1",
        help: `Heading levels should increase by one. Expected h${previous + 1} but found h${current}.`,
      });
    }
  }

  // Missing h1
  if (headingLevels.length > 0 && h1Count === 0) {
    issues.push({
      id: uid(),
      category: "headings",
      severity: "moderate",
      message: "Page has no h1 heading",
      element: "<html>",
      selector: "html",
      wcag: "1.3.1",
      help: "Every page should have exactly one h1 heading describing its main content.",
    });
  }

  // Multiple h1s
  if (h1Count > 1) {
    issues.push({
      id: uid(),
      category: "headings",
      severity: "minor",
      message: `Page has ${h1Count} h1 headings (expected 1)`,
      element: "<html>",
      selector: "html",
      wcag: "1.3.1",
      help: "Best practice is to have a single h1 per page. Consider demoting extra h1s to h2.",
    });
  }

  return issues;
}
