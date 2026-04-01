import type { AccessibilityIssue, Severity } from "@/types";

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 12,
  serious: 5,
  moderate: 3,
  minor: 1,
};

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#dc2626",
  serious: "#ea580c",
  moderate: "#ca8a04",
  minor: "#2563eb",
};

function calculateScore(issues: AccessibilityIssue[]): number {
  if (issues.length === 0) return 100;

  // Group by type so repeated identical issues scale logarithmically
  const groups = new Map<string, { weight: number; count: number }>();
  for (const issue of issues) {
    const key = `${issue.category}:${issue.wcag}:${issue.severity}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
    } else {
      groups.set(key, { weight: SEVERITY_WEIGHTS[issue.severity], count: 1 });
    }
  }

  let totalWeight = 0;
  for (const { weight, count } of groups.values()) {
    totalWeight += weight * (1 + Math.log(count));
  }

  return Math.max(0, Math.round(100 * Math.exp(-totalWeight / 400)));
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#16a34a";
  if (score >= 70) return "#ca8a04";
  if (score >= 50) return "#ea580c";
  return "#dc2626";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "Poor";
}

function renderResults(
  issues: AccessibilityIssue[],
  url: string,
  timestamp: number,
) {
  // Hide no-data, show results
  document.getElementById("no-data")!.style.display = "none";
  document.getElementById("results")!.style.display = "block";

  // Score
  const score = calculateScore(issues);
  const color = getScoreColor(score);
  document.getElementById("score-num")!.textContent = String(score);
  document.getElementById("score-num")!.style.color = color;
  document.getElementById("score-label")!.textContent = getScoreLabel(score);
  document.getElementById("score-label")!.style.color = color;

  // Arc: 270 degrees = 131.95 of 175.93 circumference
  const arcLength = 131.95;
  const filled = arcLength * (score / 100);
  const arc = document.getElementById("score-arc")!;
  arc.style.strokeDasharray = `${filled} 175.93`;
  arc.style.stroke = color;

  // Issue count
  document.getElementById("issue-count")!.textContent =
    `${issues.length} issue${issues.length !== 1 ? "s" : ""}`;

  // Severity pills
  const counts: Record<Severity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };
  for (const i of issues) counts[i.severity]++;
  const row = document.getElementById("severity-row")!;
  row.innerHTML = "";
  for (const sev of [
    "critical",
    "serious",
    "moderate",
    "minor",
  ] as Severity[]) {
    if (counts[sev] === 0) continue;
    const pill = document.createElement("span");
    pill.className = "severity-pill";
    pill.innerHTML = `<span class="severity-dot" style="background:${SEVERITY_COLORS[sev]}"></span>${counts[sev]} ${sev}`;
    row.appendChild(pill);
  }

  // URL + time
  document.getElementById("page-url")!.textContent = url;
  document.getElementById("page-url")!.title = url;
  if (timestamp) {
    document.getElementById("scan-time")!.textContent = new Date(
      timestamp,
    ).toLocaleTimeString();
  }
}

async function init() {
  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const tabId = tab.id;

  // Listen for live scan results while popup is open
  chrome.runtime.onMessage.addListener(
    (message: {
      type: string;
      payload?: AccessibilityIssue[];
      url?: string;
      timestamp?: number;
    }) => {
      if (message.type === "ACCESSIBILITY_ISSUES" && message.payload) {
        renderResults(
          message.payload,
          message.url || "",
          message.timestamp || Date.now(),
        );
      }
    },
  );

  // Ask background for cached results
  chrome.runtime.sendMessage(
    { type: "GET_POPUP_DATA", tabId },
    (
      response:
        | {
            payload?: AccessibilityIssue[];
            url?: string;
            timestamp?: number;
          }
        | undefined,
    ) => {
      if (chrome.runtime.lastError || !response?.payload) {
        return;
      }
      renderResults(
        response.payload,
        response.url || "",
        response.timestamp || 0,
      );
    },
  );
}

init();
