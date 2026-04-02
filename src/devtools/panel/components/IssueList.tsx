import { useState, useCallback, useEffect, useRef } from "react";
import type { AccessibilityIssue, Severity, HighlightResult } from "@/types";
import { IssueCard } from "./IssueCard";
import { getFingerprint, type SuppressedIssue } from "../suppress";

interface IssueListProps {
  issues: AccessibilityIssue[];
  focusIssueId?: string | null;
  onFocusHandled?: () => void;
  isShowSuppressed?: boolean;
  suppressedMap?: Record<string, SuppressedIssue>;
  onSuppress?: (issue: AccessibilityIssue) => void;
  onUnsuppress?: (fingerprint: string) => void;
}

type SortKey = "severity" | "category" | "wcag";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

export function IssueList({
  issues,
  focusIssueId,
  onFocusHandled,
  isShowSuppressed,
  suppressedMap,
  onSuppress,
  onUnsuppress,
}: IssueListProps) {
  const [sortBy, setSortBy] = useState<SortKey>("severity");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightStatuses, setHighlightStatuses] = useState<
    Record<string, HighlightResult["status"] | "loading">
  >({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle SHOW_IN_PANEL focus
  useEffect(() => {
    if (focusIssueId) {
      setExpandedId(focusIssueId);
      setTimeout(() => {
        cardRefs.current[focusIssueId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
      onFocusHandled?.();
    }
  }, [focusIssueId, onFocusHandled]);

  const sorted = [...issues].sort((a, b) => {
    if (sortBy === "severity")
      return SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity];
    if (sortBy === "category") return a.category.localeCompare(b.category);
    return a.wcag.localeCompare(b.wcag);
  });

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const highlightElement = useCallback((issue: AccessibilityIssue) => {
    setHighlightStatuses((prev) => ({ ...prev, [issue.id]: "loading" }));
    chrome.runtime.sendMessage(
      {
        type: "HIGHLIGHT_ELEMENT",
        selector: issue.selector,
        issueId: issue.id,
      },
      (response: HighlightResult | undefined) => {
        const status = response?.status ?? "not-found";
        setHighlightStatuses((prev) => ({ ...prev, [issue.id]: status }));
        // Clear status after a few seconds for found/not-found
        if (status !== "hidden") {
          setTimeout(() => {
            setHighlightStatuses((prev) => {
              const next = { ...prev };
              delete next[issue.id];
              return next;
            });
          }, 3000);
        }
      },
    );
  }, []);

  const clearHighlight = useCallback(() => {
    chrome.runtime.sendMessage({
      type: "CLEAR_HIGHLIGHT",
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
              background:
                sortBy === key ? "var(--accent-light)" : "transparent",
              color: sortBy === key ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: sortBy === key ? 600 : 400,
            }}
          >
            {key === "wcag"
              ? "WCAG"
              : key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
        <span
          className="text-xs ml-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          {issues.length} issue{issues.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Issues */}
      <div className="flex flex-col gap-2">
        {sorted.map((issue) => {
          const fp = getFingerprint(issue.selector, issue.message);
          const isSuppressed = !!suppressedMap?.[fp];
          return (
            <div
              key={issue.id}
              ref={(el) => {
                cardRefs.current[issue.id] = el;
              }}
            >
              <IssueCard
                issue={issue}
                isExpanded={expandedId === issue.id}
                onToggle={() => toggleExpand(issue.id)}
                onHighlight={() => highlightElement(issue)}
                onClearHighlight={clearHighlight}
                highlightStatus={highlightStatuses[issue.id] ?? null}
                isSuppressed={isSuppressed}
                onSuppress={
                  !isShowSuppressed && onSuppress
                    ? () => onSuppress(issue)
                    : undefined
                }
                onUnsuppress={
                  isShowSuppressed && onUnsuppress
                    ? () => onUnsuppress(fp)
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
