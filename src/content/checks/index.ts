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

  return allIssues;
}
