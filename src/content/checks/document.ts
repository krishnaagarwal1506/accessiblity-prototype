import type { AccessibilityIssue } from "@/types";
import { uid, truncateHTML, getSelector } from "./utils";

/**
 * WCAG 2.4.2 Page Titled — Pages must have titles.
 * WCAG 3.1.1 Language of Page — html must have lang.
 * WCAG 1.3.1 Info and Relationships — Landmark regions.
 * WCAG 2.4.1 Bypass Blocks — Skip navigation / landmarks.
 */

export function checkDocument(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Missing or empty page title
  const title = document.title?.trim();
  if (!title) {
    issues.push({
      id: uid(),
      category: "document",
      severity: "serious",
      message: "Page has no title",
      element: "<head>",
      selector: "head",
      wcag: "2.4.2",
      help: "Add a descriptive <title> element inside <head>.",
      fixSnippet: "<title>Page Title - Site Name</title>",
    });
  }

  // Missing lang attribute
  const lang = document.documentElement.getAttribute("lang");
  if (!lang) {
    issues.push({
      id: uid(),
      category: "document",
      severity: "serious",
      message: "HTML element is missing lang attribute",
      element: truncateHTML(document.documentElement.outerHTML),
      selector: "html",
      wcag: "3.1.1",
      help: 'Add a lang attribute to the <html> element, e.g. <html lang="en">.',
      fixSnippet: '<html lang="en">',
    });
  }

  // Check for main landmark
  const hasMain =
    document.querySelector("main") || document.querySelector('[role="main"]');
  if (!hasMain) {
    issues.push({
      id: uid(),
      category: "document",
      severity: "moderate",
      message: "Page has no <main> landmark",
      element: "<body>",
      selector: "body",
      wcag: "1.3.1",
      help: 'Use a <main> element (or role="main") to identify the primary content area.',
    });
  }

  // Check for skip navigation link
  const firstLink = document.querySelector("a");
  const hasSkipLink =
    firstLink &&
    firstLink.getAttribute("href")?.startsWith("#") &&
    (firstLink.textContent || "").toLowerCase().includes("skip");
  if (!hasSkipLink) {
    issues.push({
      id: uid(),
      category: "document",
      severity: "moderate",
      message: "No skip navigation link found",
      element: "<body>",
      selector: "body",
      wcag: "2.4.1",
      help: 'Add a "Skip to main content" link as the first focusable element on the page.',
    });
  }

  // Check for landmark regions (nav, header, footer)
  const hasNav =
    document.querySelector("nav") ||
    document.querySelector('[role="navigation"]');
  if (!hasNav && document.querySelectorAll("a[href]").length > 5) {
    issues.push({
      id: uid(),
      category: "document",
      severity: "minor",
      message: "Page has links but no <nav> landmark",
      element: "<body>",
      selector: "body",
      wcag: "1.3.1",
      help: "Wrap navigation links in a <nav> element to help screen reader users find navigation.",
    });
  }

  // WCAG 3.1.2 Language of Parts — elements with text in a different language
  // should have a lang attribute
  const foreignTextElements = document.querySelectorAll("[lang]");
  for (const el of foreignTextElements) {
    if (el === document.documentElement) continue; // already checked above
    const lang = el.getAttribute("lang")!;
    // Flag empty lang values
    if (!lang.trim()) {
      issues.push({
        id: uid(),
        category: "document",
        severity: "moderate",
        message: "Element has empty lang attribute",
        element: truncateHTML(el.outerHTML),
        selector: getSelector(el),
        wcag: "3.1.2",
        help: 'The lang attribute must contain a valid language code, e.g. lang="fr" for French.',
      });
    }
  }

  // Viewport meta should not disable scaling
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const content = viewport.getAttribute("content") || "";
    if (
      content.includes("user-scalable=no") ||
      content.includes("maximum-scale=1")
    ) {
      issues.push({
        id: uid(),
        category: "document",
        severity: "critical",
        message: "Viewport meta tag disables user scaling",
        element: truncateHTML(viewport.outerHTML),
        selector: getSelector(viewport),
        wcag: "1.4.4",
        help: "Do not use user-scalable=no or maximum-scale=1. Users must be able to zoom to 200%.",
      });
    }
  }

  return issues;
}
