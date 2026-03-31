import type { AccessibilityIssue } from "@/types";
import { uid, truncateHTML, getSelector, isVisible } from "./utils";

/**
 * WCAG 1.1.1 Non-text Content — All images must have text alternatives.
 */

export function checkImages(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // <img> without alt
  const images = document.querySelectorAll("img");
  for (const img of images) {
    if (!isVisible(img)) continue;

    if (!img.hasAttribute("alt")) {
      issues.push({
        id: uid(),
        category: "images",
        severity: "critical",
        message: "Image is missing alt attribute",
        element: truncateHTML(img.outerHTML),
        selector: getSelector(img),
        wcag: "1.1.1",
        help: 'Add an alt attribute describing the image. Use alt="" for decorative images.',
      });
    } else if (
      img.alt === "" &&
      img.getAttribute("role") !== "presentation" &&
      img.getAttribute("role") !== "none"
    ) {
      // Empty alt without presentation role — may be decorative, but flag for review
      const isLinked = img.closest("a, button");
      if (isLinked) {
        issues.push({
          id: uid(),
          category: "images",
          severity: "serious",
          message: "Linked image has empty alt text",
          element: truncateHTML(img.outerHTML),
          selector: getSelector(img),
          wcag: "1.1.1",
          help: "Images inside links/buttons need alt text describing the link destination or action.",
        });
      }
    }
  }

  // <input type="image"> without alt
  const imageInputs = document.querySelectorAll('input[type="image"]');
  for (const input of imageInputs) {
    if (!isVisible(input)) continue;
    if (!input.hasAttribute("alt") || !(input as HTMLInputElement).alt) {
      issues.push({
        id: uid(),
        category: "images",
        severity: "critical",
        message: "Image button is missing alt attribute",
        element: truncateHTML(input.outerHTML),
        selector: getSelector(input),
        wcag: "1.1.1",
        help: "Add an alt attribute describing the button action.",
      });
    }
  }

  // SVGs without accessible name
  const svgs = document.querySelectorAll("svg");
  for (const svg of svgs) {
    if (!isVisible(svg)) continue;
    if (svg.getAttribute("aria-hidden") === "true") continue;
    if (svg.getAttribute("role") === "presentation") continue;

    const hasTitle = svg.querySelector("title");
    const hasAriaLabel = svg.getAttribute("aria-label");
    const hasAriaLabelledby = svg.getAttribute("aria-labelledby");

    if (!hasTitle && !hasAriaLabel && !hasAriaLabelledby) {
      issues.push({
        id: uid(),
        category: "images",
        severity: "serious",
        message: "SVG image has no accessible name",
        element: truncateHTML(svg.outerHTML),
        selector: getSelector(svg),
        wcag: "1.1.1",
        help: 'Add a <title> element inside the SVG, or add aria-label / aria-labelledby. Use aria-hidden="true" for decorative SVGs.',
      });
    }
  }

  // <area> without alt in image maps
  const areas = document.querySelectorAll("area");
  for (const area of areas) {
    if (!area.hasAttribute("alt") || !area.alt) {
      issues.push({
        id: uid(),
        category: "images",
        severity: "critical",
        message: "Image map area is missing alt text",
        element: truncateHTML(area.outerHTML),
        selector: getSelector(area),
        wcag: "1.1.1",
        help: "Add alt text describing the function of this image map area.",
      });
    }
  }

  return issues;
}
