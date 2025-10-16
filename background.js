const resultsCache = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages from content script
  if (message.type === "ACCESSIBILITY_ISSUES") {
    console.log("Received accessibility issues:", message.payload.length);

    if (sender.tab?.id) {
      resultsCache.set(sender.tab.id, {
        payload: message.payload,
        timestamp: Date.now(),
      });
    }

    sendResponse({ status: "received" });
    return true;
  }

  // Handle messages from devtools
  if (message.type === "RUN_ACCESSIBILITY_CHECK") {
    const tabId = message.tabId;
    console.log("Running check for tab:", tabId);

    // Send message to content script in the specific tab
    chrome.tabs.sendMessage(
      tabId,
      { type: "RUN_ACCESSIBILITY_CHECK" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error sending message to content script:",
            chrome.runtime.lastError
          );
        }
      }
    );

    sendResponse({ status: "triggered" });
    return true;
  }

  return true;
});

// Clean up cache when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  resultsCache.delete(tabId);
});
