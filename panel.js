let issuesData = [];
let isLoading = false;

// Listen for messages from the content script (via background)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ACCESSIBILITY_ISSUES") {
    console.log("Panel received issues:", message.payload.length);
    issuesData = message.payload;
    isLoading = false;
    updateTable(message.payload);
    updateLoadingState();
  }
});

function updateTable(issues) {
  const tableBody = document.querySelector("#issuesTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (issues.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="3" style="text-align: center; color: #666;">No accessibility issues found!</td>`;
    tableBody.appendChild(row);
    return;
  }

  issues.forEach((issue) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHTML(issue.tagName)}</td>
      <td><code>${escapeHTML(issue.outerHTML)}</code></td>
      <td>${escapeHTML(issue.reason)}</td>
    `;
    tableBody.appendChild(row);
  });
}

function updateLoadingState() {
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = isLoading ? "block" : "none";
  }
}

function escapeHTML(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function exportToCSV() {
  if (issuesData.length === 0) {
    alert("No issues to export.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Element,HTML Snippet,Reason\n";

  issuesData.forEach((issue) => {
    const row = `"${issue.tagName}","${issue.outerHTML.replace(
      /"/g,
      '""'
    )}","${issue.reason.replace(/"/g, '""')}"`;
    csvContent += row + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "accessibility_report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function refreshCheck() {
  isLoading = true;
  updateLoadingState();

  // Send message to background script to trigger check
  chrome.runtime.sendMessage(
    {
      type: "RUN_ACCESSIBILITY_CHECK",
      tabId: chrome.devtools.inspectedWindow.tabId,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError);
        isLoading = false;
        updateLoadingState();
      }
    }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportToCSV);
  }

  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshCheck);
  }

  updateLoadingState();

  // Trigger initial check when panel loads
  refreshCheck();
});
