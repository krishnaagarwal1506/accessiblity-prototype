interface HeaderProps {
  pageUrl: string;
  lastScan: number | null;
  issueCount: number;
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
}

export function Header({
  pageUrl,
  lastScan,
  issueCount,
  loading,
  onRefresh,
  onExport,
}: HeaderProps) {
  const timeAgo = lastScan
    ? new Date(lastScan).toLocaleTimeString()
    : null;

  return (
    <header
      className="sticky top-0 z-10 px-4 py-3 border-b flex items-center justify-between gap-4"
      style={{
        background: "var(--bg-primary)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <h1 className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
            Accessibility Checker
          </h1>
        </div>
        {pageUrl && (
          <span
            className="text-xs truncate max-w-[200px]"
            style={{ color: "var(--text-secondary)" }}
            title={pageUrl}
          >
            {pageUrl}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {timeAgo && (
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {issueCount} issue{issueCount !== 1 ? "s" : ""} · {timeAgo}
          </span>
        )}

        <button
          onClick={onExport}
          disabled={issueCount === 0}
          className="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-40"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
          title="Export as CSV"
        >
          Export
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium rounded-md text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
          style={{ background: "var(--accent)" }}
          title="Re-scan page"
        >
          {loading && (
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Scan
        </button>
      </div>
    </header>
  );
}
