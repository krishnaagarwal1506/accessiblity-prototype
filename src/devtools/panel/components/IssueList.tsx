import { useState, useCallback } from "react";
import type { AccessibilityIssue, Severity } from "@/types";
import { IssueCard } from "./IssueCard";

interface IssueListProps {
  issues: AccessibilityIssue[];
}

type SortKey = "severity" | "category" | "wcag";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

export function IssueList({ issues }: IssueListProps) {
  const [sortBy, setSortBy] = useState<SortKey>("severity");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...issues].sort((a, b) => {
    if (sortBy === "severity")
      return SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity];
    if (sortBy === "category") return a.category.localeCompare(b.category);
    return a.wcag.localeCompare(b.wcag);
  });

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const highlightElement = useCallback((selector: string) => {
    chrome.runtime.sendMessage({
      type: "HIGHLIGHT_ELEMENT",
      selector,
      tabId: chrome.devtools.inspectedWindow.tabId,
    });
  }, []);

  const clearHighlight = useCallback(() => {
    chrome.runtime.sendMessage({
      type: "CLEAR_HIGHLIGHT",
      tabId: chrome.devtools.inspectedWindow.tabId,
    });
  }, []);

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Sort by:
        </span>
        {(["severity", "category", "wcag"] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className="text-xs px-2 py-0.5 rounded transition-colors"
            style={{
              background: sortBy === key ? "var(--accent-light)" : "transparent",
              color: sortBy === key ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: sortBy === key ? 600 : 400,
            }}
          >
            {key === "wcag" ? "WCAG" : key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
        <span className="text-xs ml-auto" style={{ color: "var(--text-secondary)" }}>
          {issues.length} issue{issues.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Issues */}
      <div className="flex flex-col gap-2">
        {sorted.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            expanded={expandedId === issue.id}
            onToggle={() => toggleExpand(issue.id)}
            onHighlight={() => highlightElement(issue.selector)}
            onClearHighlight={clearHighlight}
          />
        ))}
      </div>
    </div>
  );
}
