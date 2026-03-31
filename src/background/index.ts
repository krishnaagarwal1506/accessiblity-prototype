import type { Message, AccessibilityIssue, HighlightResult } from "@/types";

const resultsCache = new Map<
  number,
  { payload: AccessibilityIssue[]; url: string; timestamp: number }
>();

// Tracks which tabs currently have scanning enabled
const enabledTabs = new Set<number>();

function updateBadge(tabId: number, issues: AccessibilityIssue[]) {
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const totalCount = issues.length;

  if (totalCount === 0) {
    chrome.action.setBadgeText({ text: "", tabId });
    return;
  }

  const text = criticalCount > 0 ? String(criticalCount) : String(totalCount);
  const bgColor = criticalCount > 0 ? "#dc2626" : "#ca8a04";

  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color: bgColor, tabId });
  chrome.action.setTitle({
    title: `Accessibility Checker — ${totalCount} issue${totalCount !== 1 ? "s" : ""}${criticalCount > 0 ? ` (${criticalCount} critical)` : ""}`,
    tabId,
  });
}

chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    if (message.type === "ACCESSIBILITY_ISSUES") {
      const tabId = sender.tab?.id;
      if (tabId) {
        resultsCache.set(tabId, {
          payload: message.payload,
          url: message.url,
          timestamp: message.timestamp,
        });
        updateBadge(tabId, message.payload);
      }
      sendResponse({ status: "received" });
      return true;
    }

    if (message.type === "ENABLE_SCANNING") {
      const tabId = message.tabId;
      if (tabId) {
        enabledTabs.add(tabId);
        chrome.tabs.sendMessage(tabId, { type: "ENABLE_SCANNING" }, () => {
          if (chrome.runtime.lastError) {
            console.warn(
              "[a11y-checker] Could not reach content script:",
              chrome.runtime.lastError.message,
            );
          }
        });
      }
      sendResponse({ status: "enabled" });
      return true;
    }

    if (message.type === "DISABLE_SCANNING") {
      const tabId = message.tabId;
      if (tabId) {
        enabledTabs.delete(tabId);
        resultsCache.delete(tabId);
        chrome.action.setBadgeText({ text: "", tabId });
        chrome.action.setTitle({ title: "Accessibility Checker", tabId });
        chrome.tabs.sendMessage(tabId, { type: "DISABLE_SCANNING" }, () => {
          if (chrome.runtime.lastError) {
            console.warn(
              "[a11y-checker] Could not reach content script:",
              chrome.runtime.lastError.message,
            );
          }
        });
      }
      sendResponse({ status: "disabled" });
      return true;
    }

    // Content script queries this on load to restore state after navigation
    if (message.type === "CHECK_SCAN_STATE") {
      const tabId = sender.tab?.id;
      sendResponse({ enabled: tabId ? enabledTabs.has(tabId) : false });
      return true;
    }

    // DevTools panel queries this to initialise its toggle state
    if (message.type === "GET_SCAN_STATE") {
      sendResponse({ enabled: enabledTabs.has(message.tabId) });
      return true;
    }

    if (message.type === "RUN_ACCESSIBILITY_CHECK") {
      const tabId = message.tabId;
      chrome.tabs.sendMessage(
        tabId,
        { type: "RUN_ACCESSIBILITY_CHECK" },
        () => {
          if (chrome.runtime.lastError) {
            console.warn(
              "[a11y-checker] Could not reach content script:",
              chrome.runtime.lastError.message,
            );
          }
        },
      );
      sendResponse({ status: "triggered" });
      return true;
    }

    if (message.type === "HIGHLIGHT_ELEMENT") {
      // Forward to content script and relay the HighlightResult back
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(
            tabId,
            message,
            (response: HighlightResult | undefined) => {
              if (chrome.runtime.lastError) {
                sendResponse({ status: "not-found" } as HighlightResult);
              } else {
                sendResponse(response ?? { status: "not-found" });
              }
            },
          );
        } else {
          sendResponse({ status: "not-found" } as HighlightResult);
        }
      });
      return true; // keep channel open for async response
    }

    if (message.type === "CLEAR_HIGHLIGHT") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, message, () => {
            if (chrome.runtime.lastError) {
              /* ignore */
            }
          });
        }
      });
      sendResponse({ status: "forwarded" });
      return true;
    }

    // SHOW_IN_PANEL: content script sends via runtime.sendMessage which
    // broadcasts to all extension contexts — the devtools panel listens
    // on onMessage and picks it up directly. No forwarding needed.
    if (message.type === "SHOW_IN_PANEL") {
      sendResponse({ status: "received" });
      return true;
    }

    return true;
  },
);

chrome.tabs.onRemoved.addListener((tabId) => {
  resultsCache.delete(tabId);
  enabledTabs.delete(tabId);
});
