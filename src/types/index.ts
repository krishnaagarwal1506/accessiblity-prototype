export type Severity = "critical" | "serious" | "moderate" | "minor";

export type Category =
  | "keyboard"
  | "color-contrast"
  | "images"
  | "forms"
  | "aria"
  | "headings"
  | "links"
  | "document"
  | "semantics";

export interface AccessibilityIssue {
  id: string;
  category: Category;
  severity: Severity;
  message: string;
  element: string; // truncated outerHTML
  selector: string; // CSS selector to locate the element
  wcag: string; // WCAG criterion e.g. "1.1.1"
  help: string; // short help text / fix suggestion
}

export interface CheckResult {
  issues: AccessibilityIssue[];
}

export interface ScanMessage {
  type: "ACCESSIBILITY_ISSUES";
  payload: AccessibilityIssue[];
  url: string;
  timestamp: number;
}

export interface RunCheckMessage {
  type: "RUN_ACCESSIBILITY_CHECK";
  tabId: number;
}

export interface HighlightMessage {
  type: "HIGHLIGHT_ELEMENT";
  selector: string;
}

export interface ClearHighlightMessage {
  type: "CLEAR_HIGHLIGHT";
}

export type Message =
  | ScanMessage
  | RunCheckMessage
  | HighlightMessage
  | ClearHighlightMessage;
