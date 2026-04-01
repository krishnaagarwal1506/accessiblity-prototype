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
  | "semantics"
  | "media";

export interface AccessibilityIssue {
  id: string;
  category: Category;
  severity: Severity;
  message: string;
  element: string; // truncated outerHTML
  selector: string; // CSS selector to locate the element
  wcag: string; // WCAG criterion e.g. "1.1.1"
  help: string; // short help text / fix suggestion
  fixSnippet?: string; // corrected HTML snippet suggestion
  isHidden?: boolean; // true if element is not visible on page
  parentSelector?: string; // selector of nearest visible ancestor (for hidden elements)
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
  issueId?: string;
}

export interface ClearHighlightMessage {
  type: "CLEAR_HIGHLIGHT";
}

export interface ShowInPanelMessage {
  type: "SHOW_IN_PANEL";
  issueId: string;
}

/** Sent from DevTools panel → background (with tabId), then forwarded to content script (tabId optional) */
export interface EnableScanningMessage {
  type: "ENABLE_SCANNING";
  tabId?: number;
}

/** Sent from DevTools panel → background (with tabId), then forwarded to content script (tabId optional) */
export interface DisableScanningMessage {
  type: "DISABLE_SCANNING";
  tabId?: number;
}

/** Sent from content script → background on load, to restore enabled state after navigation */
export interface CheckScanStateMessage {
  type: "CHECK_SCAN_STATE";
}

/** Sent from DevTools panel → background to query current enabled state for a tab */
export interface GetScanStateMessage {
  type: "GET_SCAN_STATE";
  tabId: number;
}

/** Sent from popup → background to get cached scan results for a tab */
export interface GetPopupDataMessage {
  type: "GET_POPUP_DATA";
  tabId: number;
}

export type HighlightResult = {
  status: "found" | "hidden" | "not-found";
  parentSelector?: string;
};

export type Message =
  | ScanMessage
  | RunCheckMessage
  | HighlightMessage
  | ClearHighlightMessage
  | ShowInPanelMessage
  | EnableScanningMessage
  | DisableScanningMessage
  | CheckScanStateMessage
  | GetScanStateMessage
  | GetPopupDataMessage;
