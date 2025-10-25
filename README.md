# Click Accessibility Checker

Lightweight Chrome DevTools extension that detects elements with click handlers which may not be keyboard accessible, highlights them in the page, and exposes results in a DevTools panel with CSV export.

## Features

- Scans the page for elements that appear clickable but lack keyboard accessibility.
- Highlights findings in-page with `.inaccessible-highlight`.
- DevTools panel shows a table of issues and allows exporting results to CSV.
- Debounced and idle-time friendly checks to minimize main-thread impact.

## How it works (high level)

1. DevTools panel triggers a check for the inspected tab.
2. Background script forwards the request to the content script for the active tab.
3. Content script runs a batched scan, highlights elements, and sends results back.
4. Panel displays results and supports CSV export.

## Quick usage

1. Load the extension as an unpacked extension in Chrome/Chromium (Developer mode).
2. Open DevTools and select the "Accessibility" panel.
3. Click "Refresh Check" or open the panel to run an automatic scan.
4. Use "Export as CSV" to download the report.

## Notes

- Designed to avoid long blocking operations using batching and requestIdleCallback.
- Some CSP restrictions apply (avoid inline scripts/styles); move inline CSS into `panel.css` and avoid `innerHTML` when embedding untrusted HTML for full CSP compliance.
- CSV export uses a data URI download.

## Files of interest

- [background.js](background.js) — message routing and simple caching.
- [content.js](content.js) — page scanning, highlighting, mutation observer, and result reporting.
- [devtools.js](devtools.js) — creates the DevTools panel and triggers checks.
- [devtools-init.html](devtools-init.html) — DevTools entry HTML that loads `devtools.js`.
- [devtools.html](devtools.html) — panel UI that loads `panel.js`.
- [panel.js](panel.js) — panel UI logic: updates table, triggers refresh, exports CSV.
- [styles.css](styles.css) — highlight styles injected by the content script.
- [manifest.json](manifest.json) — extension manifest and permissions.
- icons/ — extension icons.

## Key symbols

- [`content.runAccessibilityCheck`](content.js) — main scan routine that collects issues.
- [`content.startObserver`](content.js) — starts the MutationObserver to rescan on DOM changes.
- [`panel.refreshCheck`](panel.js) — sends a request to run the scan from the panel.
- [`panel.exportToCSV`](panel.js) — builds CSV and triggers download.
- [`devtools.chrome.devtools.panels.create`](devtools.js) — creates the DevTools panel.
- [`background.resultsCache`](background.js) — simple cache of last results per tab.
