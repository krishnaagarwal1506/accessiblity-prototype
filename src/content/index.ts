import { runAllChecks } from "./checks";
import { isHidden, getSelector } from "./checks/utils";
import type { AccessibilityIssue, Message, HighlightResult } from "@/types";

let checkTimeout: ReturnType<typeof setTimeout> | null = null;
let isChecking = false;
let observer: MutationObserver | null = null;
let isEnabled = false;

// Map element → issues for tooltip display
const elementIssueMap = new Map<Element, AccessibilityIssue[]>();

function scheduleCheck() {
  if (!isEnabled) return;
  if (checkTimeout) clearTimeout(checkTimeout);
  checkTimeout = setTimeout(() => {
    if (!isChecking) runCheck();
  }, 500);
}

function runCheck() {
  isChecking = true;

  if ("requestIdleCallback" in window) {
    requestIdleCallback(
      () => {
        executeCheck();
        isChecking = false;
      },
      { timeout: 3000 },
    );
  } else {
    setTimeout(() => {
      executeCheck();
      isChecking = false;
    }, 0);
  }
}

function executeCheck() {
  // Temporarily disconnect observer to avoid mutation loops
  if (observer) observer.disconnect();

  // Remove old highlights BEFORE running checks — the post-processing filter
  // in runAllChecks() skips elements whose className contains "a11y-checker",
  // so stale highlight classes from the previous scan would cause issues to be
  // silently dropped on subsequent scans.
  const highlightClasses = [
    "a11y-checker-highlight",
    "a11y-checker-highlight-critical",
    "a11y-checker-highlight-serious",
    "a11y-checker-highlight-moderate",
    "a11y-checker-highlight-minor",
  ];
  for (const cls of highlightClasses) {
    document
      .querySelectorAll(`.${cls}`)
      .forEach((el) => el.classList.remove(cls));
  }

  // Clear old issue map and detach tooltip listeners
  for (const el of elementIssueMap.keys()) {
    el.removeEventListener("mouseenter", handleTooltipEnter);
    el.removeEventListener("mouseleave", handleTooltipLeave);
  }
  elementIssueMap.clear();

  const issues = runAllChecks();

  // Apply new highlights and build issue map
  for (const issue of issues) {
    try {
      const el = document.querySelector(issue.selector);
      if (el) {
        el.classList.add("a11y-checker-highlight");
        el.classList.add(`a11y-checker-highlight-${issue.severity}`);

        const existing = elementIssueMap.get(el);
        if (existing) {
          existing.push(issue);
        } else {
          elementIssueMap.set(el, [issue]);
          el.addEventListener("mouseenter", handleTooltipEnter);
          el.addEventListener("mouseleave", handleTooltipLeave);
        }
      }
    } catch {
      // selector might be invalid
    }
  }

  // Reconnect observer after DOM settles
  if (isEnabled) setTimeout(() => startObserver(), 300);

  // Send results to background script
  chrome.runtime.sendMessage({
    type: "ACCESSIBILITY_ISSUES",
    payload: issues,
    url: window.location.href,
    timestamp: Date.now(),
  } satisfies Message);
}

/* ---- Tooltip system ---- */
let tooltipEl: HTMLDivElement | null = null;
let tooltipHideTimer: ReturnType<typeof setTimeout> | null = null;

function getTooltip(): HTMLDivElement {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement("div");
  tooltipEl.className = "a11y-checker-tooltip";
  tooltipEl.addEventListener("mouseenter", () => {
    if (tooltipHideTimer) {
      clearTimeout(tooltipHideTimer);
      tooltipHideTimer = null;
    }
  });
  tooltipEl.addEventListener("mouseleave", () => {
    hideTooltip();
  });
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

function showTooltip(target: Element, issues: AccessibilityIssue[]) {
  if (tooltipHideTimer) {
    clearTimeout(tooltipHideTimer);
    tooltipHideTimer = null;
  }
  const tip = getTooltip();
  const first = issues[0];
  const extra =
    issues.length > 1
      ? `<div class="a11y-checker-tooltip-msg" style="opacity:.7;margin-top:2px">+ ${issues.length - 1} more issue${issues.length > 2 ? "s" : ""}</div>`
      : "";

  tip.innerHTML =
    `<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">` +
    `<span class="a11y-checker-tooltip-severity a11y-checker-tooltip-severity--${first.severity}">${first.severity}</span>` +
    `<span class="a11y-checker-tooltip-wcag">WCAG ${first.wcag}</span>` +
    `</div>` +
    `<div class="a11y-checker-tooltip-msg">${escapeHtml(first.message)}</div>` +
    extra +
    `<button class="a11y-checker-tooltip-btn" data-a11y-issue-id="${first.id}">` +
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>` +
    `Show in panel` +
    `</button>`;

  // Position tooltip near the target
  const rect = target.getBoundingClientRect();
  tip.style.left = `${Math.min(rect.left, window.innerWidth - 380)}px`;
  tip.style.top = `${rect.bottom + 6}px`;

  // If tooltip would go below viewport, show above
  requestAnimationFrame(() => {
    const tipRect = tip.getBoundingClientRect();
    if (tipRect.bottom > window.innerHeight - 8) {
      tip.style.top = `${rect.top - tipRect.height - 6}px`;
    }
    tip.classList.add("a11y-checker-tooltip--visible");
  });

  // Wire up "show in panel" button — use mousedown so it fires before
  // blur/mouseleave that would otherwise hide the tooltip first
  const btn = tip.querySelector("[data-a11y-issue-id]") as HTMLElement | null;
  btn?.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const issueId = btn.dataset.a11yIssueId;
    if (issueId) {
      chrome.runtime.sendMessage({
        type: "SHOW_IN_PANEL",
        issueId,
      } satisfies Message);
    }
    setTimeout(() => hideTooltip(true), 50);
  });
}

function hideTooltip(immediate = false) {
  if (tooltipHideTimer) clearTimeout(tooltipHideTimer);
  const delay = immediate ? 0 : 250;
  tooltipHideTimer = setTimeout(() => {
    if (tooltipEl) {
      tooltipEl.classList.remove("a11y-checker-tooltip--visible");
    }
    tooltipHideTimer = null;
  }, delay);
}

function handleTooltipEnter(this: Element) {
  const issues = elementIssueMap.get(this);
  if (issues?.length) showTooltip(this, issues);
}

function handleTooltipLeave() {
  hideTooltip();
}

function escapeHtml(text: string): string {
  const div = document.createElement("span");
  div.textContent = text;
  return div.innerHTML;
}

/* ---- Observer ---- */

/** Returns true if a DOM node belongs to our own a11y-checker overlay/tooltip. */
function isOwnNode(node: Node): boolean {
  const el = node instanceof Element ? node : node.parentElement;
  if (!el) return false;
  if (el.closest(".a11y-checker-tooltip")) return true;
  if (
    typeof (el as HTMLElement).className === "string" &&
    (el as HTMLElement).className.includes("a11y-checker")
  )
    return true;
  return false;
}

function startObserver() {
  if (observer) observer.disconnect();

  observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((m) => {
      // Skip any mutation whose target is our own element
      if (isOwnNode(m.target)) return false;

      // For childList mutations, skip if all added/removed nodes are ours
      // (e.g. tooltip being appended to body, tooltip innerHTML changes)
      if (m.type === "childList") {
        const nodes = [
          ...Array.from(m.addedNodes),
          ...Array.from(m.removedNodes),
        ];
        if (nodes.length > 0 && nodes.every(isOwnNode)) return false;
      }

      return true;
    });

    if (relevant) scheduleCheck();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "onclick",
      "role",
      "tabindex",
      "style",
      "alt",
      "aria-label",
      "aria-hidden",
    ],
  });
}

function stopScanning() {
  isEnabled = false;

  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (checkTimeout) {
    clearTimeout(checkTimeout);
    checkTimeout = null;
  }

  // Remove all highlight classes
  const highlightClasses = [
    "a11y-checker-highlight",
    "a11y-checker-highlight-critical",
    "a11y-checker-highlight-serious",
    "a11y-checker-highlight-moderate",
    "a11y-checker-highlight-minor",
    "a11y-checker-focus",
    "a11y-checker-hidden-parent",
  ];
  for (const cls of highlightClasses) {
    document
      .querySelectorAll(`.${cls}`)
      .forEach((el) => el.classList.remove(cls));
  }

  // Clear issue map and tooltip listeners
  for (const el of elementIssueMap.keys()) {
    el.removeEventListener("mouseenter", handleTooltipEnter);
    el.removeEventListener("mouseleave", handleTooltipLeave);
  }
  elementIssueMap.clear();
  hideTooltip(true);

  // Notify panel that issues are cleared
  chrome.runtime.sendMessage({
    type: "ACCESSIBILITY_ISSUES",
    payload: [],
    url: window.location.href,
    timestamp: Date.now(),
  } satisfies Message);
}

/* ---- Highlight with hidden-element detection ---- */
function highlightElement(selector: string): HighlightResult {
  // Clear previous focus highlights
  document
    .querySelectorAll(".a11y-checker-focus, .a11y-checker-hidden-parent")
    .forEach((el) => {
      el.classList.remove("a11y-checker-focus");
      el.classList.remove("a11y-checker-hidden-parent");
    });

  try {
    const el = document.querySelector(selector);
    if (!el) return { status: "not-found" };

    if (isHidden(el)) {
      // Try to find and highlight nearest visible ancestor
      let ancestor: Element | null = el.parentElement;
      while (ancestor && ancestor !== document.documentElement) {
        if (!isHidden(ancestor)) {
          ancestor.classList.add("a11y-checker-hidden-parent");
          ancestor.scrollIntoView({ behavior: "smooth", block: "center" });
          return { status: "hidden", parentSelector: getSelector(ancestor) };
        }
        ancestor = ancestor.parentElement;
      }
      return { status: "hidden" };
    }

    el.classList.add("a11y-checker-focus");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return { status: "found" };
  } catch {
    return { status: "not-found" };
  }
}

function clearHighlight() {
  document
    .querySelectorAll(".a11y-checker-focus, .a11y-checker-hidden-parent")
    .forEach((el) => {
      el.classList.remove("a11y-checker-focus");
      el.classList.remove("a11y-checker-hidden-parent");
    });
  hideTooltip();
}

// Listen for messages
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type === "ENABLE_SCANNING") {
      isEnabled = true;
      runCheck();
      startObserver();
      sendResponse({ status: "enabled" });
    } else if (message.type === "DISABLE_SCANNING") {
      stopScanning();
      sendResponse({ status: "disabled" });
    } else if (message.type === "RUN_ACCESSIBILITY_CHECK") {
      if (isEnabled) runCheck();
      sendResponse({ status: "started" });
    } else if (message.type === "HIGHLIGHT_ELEMENT") {
      const result = highlightElement(message.selector);
      sendResponse(result);
    } else if (message.type === "CLEAR_HIGHLIGHT") {
      clearHighlight();
      sendResponse({ status: "cleared" });
    }
    return true;
  },
);

// On load, ask background if this tab should be scanning (handles page navigation
// while scanning is enabled — the service worker still has the tab in enabledTabs)
chrome.runtime.sendMessage({ type: "CHECK_SCAN_STATE" }, (response) => {
  if (chrome.runtime.lastError) return; // panel not open yet, that's fine
  if (response?.enabled) {
    isEnabled = true;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        runCheck();
        startObserver();
      });
    } else {
      runCheck();
      startObserver();
    }
  }
});
