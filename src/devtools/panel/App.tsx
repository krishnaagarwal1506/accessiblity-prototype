import { useState, useEffect, useCallback, useMemo } from "react";
import type { AccessibilityIssue, Category, Severity } from "@/types";
import { SummaryBar } from "./components/SummaryBar";
import { FilterBar } from "./components/FilterBar";
import { IssueList } from "./components/IssueList";
import { EmptyState } from "./components/EmptyState";
import { Header } from "./components/Header";

export default function App() {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [lastScan, setLastScan] = useState<number | null>(null);
  const [focusIssueId, setFocusIssueId] = useState<string | null>(null);

  const tabId = chrome.devtools.inspectedWindow.tabId;

  // Single listener handles both scan results and "show in panel" from tooltip
  useEffect(() => {
    const listener = (message: {
      type: string;
      payload?: AccessibilityIssue[];
      url?: string;
      timestamp?: number;
      issueId?: string;
    }) => {
      if (message.type === "ACCESSIBILITY_ISSUES" && message.payload) {
        setIssues(message.payload);
        setPageUrl(message.url || "");
        setLastScan(message.timestamp || Date.now());
        setLoading(false);
      } else if (message.type === "SHOW_IN_PANEL" && message.issueId) {
        setFocusIssueId(message.issueId);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // On mount, query the background for the current scan state (handles panel
  // being closed and reopened while scanning was already active)
  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: "GET_SCAN_STATE", tabId },
      (response) => {
        if (chrome.runtime.lastError) return;
        if (response?.enabled) {
          setIsEnabled(true);
          setLoading(true);
          chrome.runtime.sendMessage({ type: "RUN_ACCESSIBILITY_CHECK", tabId });
        }
      },
    );
  }, [tabId]);

  const toggleScanning = useCallback(() => {
    if (isEnabled) {
      setIsEnabled(false);
      setIssues([]);
      setLastScan(null);
      setLoading(false);
      chrome.runtime.sendMessage({ type: "DISABLE_SCANNING", tabId });
    } else {
      setIsEnabled(true);
      setLoading(true);
      chrome.runtime.sendMessage({ type: "ENABLE_SCANNING", tabId });
    }
  }, [isEnabled, tabId]);

  const refresh = useCallback(() => {
    if (!isEnabled) return;
    setLoading(true);
    chrome.runtime.sendMessage({ type: "RUN_ACCESSIBILITY_CHECK", tabId });
  }, [isEnabled, tabId]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (categoryFilter !== "all" && issue.category !== categoryFilter)
        return false;
      if (severityFilter !== "all" && issue.severity !== severityFilter)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          issue.message.toLowerCase().includes(q) ||
          issue.element.toLowerCase().includes(q) ||
          issue.help.toLowerCase().includes(q) ||
          issue.wcag.includes(q)
        );
      }
      return true;
    });
  }, [issues, categoryFilter, severityFilter, searchQuery]);

  const exportCSV = useCallback(() => {
    if (issues.length === 0) return;
    const header = "Severity,Category,WCAG,Message,Element,Help\n";
    const rows = issues
      .map(
        (i) =>
          `"${i.severity}","${i.category}","${i.wcag}","${i.message.replace(/"/g, '""')}","${i.element.replace(/"/g, '""')}","${i.help.replace(/"/g, '""')}"`,
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `a11y-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [issues]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Header
        pageUrl={pageUrl}
        lastScan={lastScan}
        issueCount={issues.length}
        loading={loading}
        isEnabled={isEnabled}
        onToggle={toggleScanning}
        onRefresh={refresh}
        onExport={exportCSV}
      />

      {!isEnabled ? (
        <main className="px-4 pb-6">
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.5 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Scanning is off for this tab
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Toggle <strong>On</strong> in the header to start checking this
                page for accessibility issues.
              </p>
            </div>
          </div>
        </main>
      ) : (
        <>
          {issues.length > 0 && (
            <>
              <SummaryBar issues={issues} />
              <FilterBar
                categoryFilter={categoryFilter}
                severityFilter={severityFilter}
                searchQuery={searchQuery}
                onCategoryChange={setCategoryFilter}
                onSeverityChange={setSeverityFilter}
                onSearchChange={setSearchQuery}
              />
            </>
          )}

          <main className="px-4 pb-6">
            {loading && issues.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div
                  className="flex items-center gap-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Scanning for accessibility issues…
                </div>
              </div>
            ) : issues.length === 0 ? (
              <EmptyState onRefresh={refresh} />
            ) : filteredIssues.length === 0 ? (
              <div
                className="text-center py-12"
                style={{ color: "var(--text-secondary)" }}
              >
                <p className="text-lg mb-1">No issues match your filters</p>
                <p className="text-sm">Try adjusting the filters above</p>
              </div>
            ) : (
              <IssueList
                issues={filteredIssues}
                focusIssueId={focusIssueId}
                onFocusHandled={() => setFocusIssueId(null)}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
