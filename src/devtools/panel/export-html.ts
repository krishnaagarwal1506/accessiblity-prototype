import type { AccessibilityIssue, Severity } from "@/types";
import { calculateScore } from "./components/ScoreGauge";
import { getWcagLevel } from "./wcag-levels";

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#dc2626",
  serious: "#ea580c",
  moderate: "#ca8a04",
  minor: "#2563eb",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#16a34a";
  if (score >= 70) return "#ca8a04";
  if (score >= 50) return "#ea580c";
  return "#dc2626";
}

export function generateHtmlReport(
  issues: AccessibilityIssue[],
  pageUrl: string,
  timestamp: number | null,
): string {
  const score = calculateScore(issues);
  const color = getScoreColor(score);
  const date = timestamp ? new Date(timestamp).toLocaleString() : "Unknown";

  const counts: Record<Severity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };
  for (const i of issues) counts[i.severity]++;

  const issueRows = issues
    .map(
      (i) => `
    <tr>
      <td><span class="badge" style="background:${SEVERITY_COLORS[i.severity]}20;color:${SEVERITY_COLORS[i.severity]}">${i.severity}</span></td>
      <td>${escapeHtml(i.category)}</td>
      <td><code>WCAG ${escapeHtml(i.wcag)}</code> <span class="level">${getWcagLevel(i.wcag)}</span></td>
      <td>${escapeHtml(i.message)}</td>
      <td><code class="element">${escapeHtml(i.element)}</code></td>
      <td>${escapeHtml(i.help)}${i.fixSnippet ? `<br><code class="fix">${escapeHtml(i.fixSnippet)}</code>` : ""}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Accessibility Report — ${escapeHtml(pageUrl)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; line-height: 1.5; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  .meta a { color: #6366f1; text-decoration: none; }
  .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .score-card { background: white; border-radius: 12px; padding: 20px 24px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 16px; }
  .score-num { font-size: 40px; font-weight: 800; line-height: 1; }
  .score-label { font-size: 14px; font-weight: 600; }
  .score-sub { font-size: 12px; color: #64748b; }
  .pills { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; background: white; border: 1px solid #e2e8f0; }
  .pill-dot { width: 8px; height: 8px; border-radius: 50%; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
  thead { background: #f1f5f9; }
  th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  td { padding: 10px 12px; border-top: 1px solid #f1f5f9; font-size: 13px; vertical-align: top; }
  tr:hover td { background: #f8fafc; }
  .badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .level { font-size: 10px; color: #94a3b8; margin-left: 4px; }
  code { font-size: 11px; }
  .element { display: block; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
  .fix { display: block; margin-top: 6px; padding: 4px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; color: #16a34a; white-space: pre-wrap; }
  .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
<div class="container">
  <h1>Accessibility Report</h1>
  <div class="meta">
    <a href="${escapeHtml(pageUrl)}" target="_blank">${escapeHtml(pageUrl)}</a> &middot; ${escapeHtml(date)}
  </div>

  <div class="summary">
    <div class="score-card">
      <div class="score-num" style="color:${color}">${score}</div>
      <div>
        <div class="score-label" style="color:${color}">${score >= 90 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Needs work" : "Poor"}</div>
        <div class="score-sub">${issues.length} issue${issues.length !== 1 ? "s" : ""} found</div>
      </div>
    </div>
    <div class="pills">
      ${(["critical", "serious", "moderate", "minor"] as Severity[])
        .filter((s) => counts[s] > 0)
        .map(
          (s) =>
            `<span class="pill"><span class="pill-dot" style="background:${SEVERITY_COLORS[s]}"></span>${counts[s]} ${s}</span>`,
        )
        .join("")}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Severity</th>
        <th>Category</th>
        <th>WCAG</th>
        <th>Issue</th>
        <th>Element</th>
        <th>How to fix</th>
      </tr>
    </thead>
    <tbody>
      ${issueRows}
    </tbody>
  </table>

  <div class="footer">
    Generated by Accessibility Checker &middot; ${escapeHtml(date)}
  </div>
</div>
</body>
</html>`;
}

export function exportHtmlReport(
  issues: AccessibilityIssue[],
  pageUrl: string,
  timestamp: number | null,
): void {
  const html = generateHtmlReport(issues, pageUrl, timestamp);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `a11y-report-${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
