import { runAllChecks } from "./checks";
import type { AccessibilityIssue, Message } from "@/types";

let checkTimeout: ReturnType<typeof setTimeout> | null = null;
let isChecking = false;
let observer: MutationObserver | null = null;

function scheduleCheck() {
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
      { timeout: 3000 }
    );
  } else {
    setTimeout(() => {
      executeCheck();
      isChecking = false;
    }, 0);
  }
}

function executeCheck() {
  const issues = runAllChecks();

  // Temporarily disconnect observer to avoid mutation loops
  if (observer) observer.disconnect();

  // Remove old highlights
  document
    .querySelectorAll(".a11y-checker-highlight")
    .forEach((el) => el.classList.remove("a11y-checker-highlight"));
  document
    .querySelectorAll(".a11y-checker-highlight-critical")
    .forEach((el) => el.classList.remove("a11y-checker-highlight-critical"));
  document
    .querySelectorAll(".a11y-checker-highlight-serious")
    .forEach((el) => el.classList.remove("a11y-checker-highlight-serious"));
  document
    .querySelectorAll(".a11y-checker-highlight-moderate")
    .forEach((el) => el.classList.remove("a11y-checker-highlight-moderate"));

  // Apply new highlights
  for (const issue of issues) {
    try {
      const el = document.querySelector(issue.selector);
      if (el) {
        el.classList.add("a11y-checker-highlight");
        el.classList.add(`a11y-checker-highlight-${issue.severity}`);
      }
    } catch {
      // selector might be invalid
    }
  }

  // Reconnect observer
  setTimeout(() => startObserver(), 100);

  // Send results to background script
  chrome.runtime.sendMessage({
    type: "ACCESSIBILITY_ISSUES",
    payload: issues,
    url: window.location.href,
    timestamp: Date.now(),
  } satisfies Message);
}

function startObserver() {
  if (observer) observer.disconnect();

  observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((m) => {
      if (
        m.type === "attributes" &&
        m.attributeName === "class" &&
        (m.target as Element).className?.includes?.("a11y-checker")
      ) {
        return false;
      }
      return true;
    });

    if (relevant) scheduleCheck();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["onclick", "role", "tabindex", "style", "alt", "aria-label", "aria-hidden"],
  });
}

// Handle highlight requests from the panel
function highlightElement(selector: string) {
  document
    .querySelectorAll(".a11y-checker-focus")
    .forEach((el) => el.classList.remove("a11y-checker-focus"));

  try {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add("a11y-checker-focus");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } catch {
    // invalid selector
  }
}

function clearHighlight() {
  document
    .querySelectorAll(".a11y-checker-focus")
    .forEach((el) => el.classList.remove("a11y-checker-focus"));
}

// Listen for messages
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type === "RUN_ACCESSIBILITY_CHECK") {
      runCheck();
      sendResponse({ status: "started" });
    } else if (message.type === "HIGHLIGHT_ELEMENT") {
      highlightElement(message.selector);
      sendResponse({ status: "highlighted" });
    } else if (message.type === "CLEAR_HIGHLIGHT") {
      clearHighlight();
      sendResponse({ status: "cleared" });
    }
    return true;
  }
);

// Initial check
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    runCheck();
    startObserver();
  });
} else {
  runCheck();
  startObserver();
}
