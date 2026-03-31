import { useMemo } from "react";
import type { AccessibilityIssue, Category, Severity } from "@/types";

interface SummaryBarProps {
  issues: AccessibilityIssue[];
}

const SEVERITY_ORDER: Severity[] = ["critical", "serious", "moderate", "minor"];
const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "var(--critical)",
  serious: "var(--serious)",
  moderate: "var(--moderate)",
  minor: "var(--minor)",
};
const SEVERITY_BG: Record<Severity, string> = {
  critical: "var(--critical-bg)",
  serious: "var(--serious-bg)",
  moderate: "var(--moderate-bg)",
  minor: "var(--minor-bg)",
};

const CATEGORY_LABELS: Record<Category, string> = {
  keyboard: "Keyboard",
  "color-contrast": "Contrast",
  images: "Images",
  forms: "Forms",
  aria: "ARIA",
  headings: "Headings",
  links: "Links",
  document: "Document",
  semantics: "Semantics",
};

export function SummaryBar({ issues }: SummaryBarProps) {
  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };
    for (const issue of issues) counts[issue.severity]++;
    return counts;
  }, [issues]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const issue of issues) {
      counts.set(issue.category, (counts.get(issue.category) || 0) + 1);
    }
    return counts;
  }, [issues]);

  return (
    <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
      {/* Severity pills */}
      <div className="flex items-center gap-2 mb-3">
        {SEVERITY_ORDER.map((sev) => (
          <div
            key={sev}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              background: SEVERITY_BG[sev],
              color: SEVERITY_COLORS[sev],
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: SEVERITY_COLORS[sev] }}
            />
            {severityCounts[sev]} {sev}
          </div>
        ))}
      </div>

      {/* Category mini-bar */}
      <div className="flex items-center gap-1 flex-wrap">
        {Array.from(categoryCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([cat, count]) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-secondary)",
              }}
            >
              {CATEGORY_LABELS[cat]}: {count}
            </span>
          ))}
      </div>
    </div>
  );
}
