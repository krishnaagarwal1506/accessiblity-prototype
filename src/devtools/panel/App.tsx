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
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [lastScan, setLastScan] = useState<number | null>(null);

  useEffect(() => {
    const listener = (message: { type: string; payload?: AccessibilityIssue[]; url?: string; timestamp?: number }) => {
      if (message.type === "ACCESSIBILITY_ISSUES" && message.payload) {
        setIssues(message.payload);
        setPageUrl(message.url || "");
        setLastScan(message.timestamp || Date.now());
        setLoading(false);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    chrome.runtime.sendMessage({
      type: "RUN_ACCESSIBILITY_CHECK",
      tabId: chrome.devtools.inspectedWindow.tabId,
    });
  }, []);

  // Trigger initial scan
  useEffect(() => {
    refresh();
  }, [refresh]);

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
          `"${i.severity}","${i.category}","${i.wcag}","${i.message.replace(/"/g, '""')}","${i.element.replace(/"/g, '""')}","${i.help.replace(/"/g, '""')}"`
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
        onRefresh={refresh}
        onExport={exportCSV}
      />

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
            <div className="flex items-center gap-3" style={{ color: "var(--text-secondary)" }}>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scanning for accessibility issues…
            </div>
          </div>
        ) : issues.length === 0 ? (
          <EmptyState onRefresh={refresh} />
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
            <p className="text-lg mb-1">No issues match your filters</p>
            <p className="text-sm">Try adjusting the filters above</p>
          </div>
        ) : (
          <IssueList issues={filteredIssues} />
        )}
      </main>
    </div>
  );
}
