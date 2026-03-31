import type { Message, AccessibilityIssue } from "@/types";

const resultsCache = new Map<
  number,
  { payload: AccessibilityIssue[]; url: string; timestamp: number }
>();

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
      }
      sendResponse({ status: "received" });
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

    if (
      message.type === "HIGHLIGHT_ELEMENT" ||
      message.type === "CLEAR_HIGHLIGHT"
    ) {
      // Forward to the active tab's content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, message, () => {
            if (chrome.runtime.lastError) {
              // content script not ready — ignore
            }
          });
        }
      });
      sendResponse({ status: "forwarded" });
      return true;
    }

    return true;
  },
);

chrome.tabs.onRemoved.addListener((tabId) => {
  resultsCache.delete(tabId);
});
