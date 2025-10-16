console.log("DevTools script loaded - about to create panel");

// Create the custom panel
chrome.devtools.panels.create("Accessibility", "", "devtools.html", (panel) => {
  console.log("Accessibility panel created successfully!");

  panel.onShown.addListener(() => {
    console.log("Accessibility panel opened");
    // Send message to background script to trigger check
    chrome.runtime.sendMessage({
      type: "RUN_ACCESSIBILITY_CHECK",
      tabId: chrome.devtools.inspectedWindow.tabId,
    });
  });
});
