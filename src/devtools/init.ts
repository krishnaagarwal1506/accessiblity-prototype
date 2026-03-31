chrome.devtools.panels.create(
  "Accessibility",
  "",
  "src/devtools/panel.html",
  (panel) => {
    panel.onShown.addListener(() => {
      chrome.runtime.sendMessage({
        type: "RUN_ACCESSIBILITY_CHECK",
        tabId: chrome.devtools.inspectedWindow.tabId,
      });
    });
  }
);
