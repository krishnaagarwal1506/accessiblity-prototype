import type { AccessibilityIssue } from "@/types";
import { checkKeyboardAccessibility } from "./keyboard";
import { checkColorContrast } from "./color-contrast";
import { checkImages } from "./images";
import { checkForms } from "./forms";
import { checkAria } from "./aria";
import { checkHeadings } from "./headings";
import { checkLinks } from "./links";
import { checkDocument } from "./document";
import { checkSemantics } from "./semantics";
import { checkMedia } from "./media";
import { isHidden, getSelector } from "./utils";

export interface CheckModule {
  name: string;
  fn: () => AccessibilityIssue[];
}

const checks: CheckModule[] = [
  { name: "keyboard", fn: checkKeyboardAccessibility },
  { name: "color-contrast", fn: checkColorContrast },
  { name: "images", fn: checkImages },
  { name: "forms", fn: checkForms },
  { name: "aria", fn: checkAria },
  { name: "headings", fn: checkHeadings },
  { name: "links", fn: checkLinks },
  { name: "document", fn: checkDocument },
  { name: "semantics", fn: checkSemantics },
  { name: "media", fn: checkMedia },
];

export function runAllChecks(): AccessibilityIssue[] {
  const allIssues: AccessibilityIssue[] = [];

  for (const check of checks) {
    try {
      const issues = check.fn();
      allIssues.push(...issues);
    } catch (err) {
      console.warn(`[a11y-checker] "${check.name}" check failed:`, err);
    }
  }

  // Post-process: filter out our own overlay elements, tag hidden elements
  const results: AccessibilityIssue[] = [];
  for (const issue of allIssues) {
    try {
      const el = document.querySelector(issue.selector);
      if (!el) {
        results.push(issue);
        continue;
      }

      // Skip our own injected overlay / tooltip elements.
      // Only skip elements that ARE our tooltip — not page elements
      // that merely carry a highlight class like "a11y-checker-highlight".
      if (
        el.closest(".a11y-checker-tooltip") ||
        (el instanceof HTMLElement &&
          el.classList.contains("a11y-checker-tooltip"))
      )
        continue;

      // Tag hidden elements
      if (isHidden(el)) {
        issue.isHidden = true;
        let ancestor: Element | null = el.parentElement;
        while (ancestor && ancestor !== document.documentElement) {
          if (!isHidden(ancestor)) {
            issue.parentSelector = getSelector(ancestor);
            break;
          }
          ancestor = ancestor.parentElement;
        }
      }
    } catch {
      /* keep issue if selector is weird */
    }
    results.push(issue);
  }
  return results;
}
