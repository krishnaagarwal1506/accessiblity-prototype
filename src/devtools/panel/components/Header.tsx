import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  pageUrl: string;
  lastScan: number | null;
  issueCount: number;
  isLoading: boolean;
  isEnabled: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onExportCSV: () => void;
  onExportHTML: () => void;
}

export function Header({
  pageUrl,
  lastScan,
  issueCount,
  isLoading,
  isEnabled,
  onToggle,
  onRefresh,
  onExportCSV,
  onExportHTML,
}: HeaderProps) {
  const timeAgo = lastScan ? new Date(lastScan).toLocaleTimeString() : null;
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen]);

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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <h1
            className="text-sm font-semibold whitespace-nowrap"
            style={{ color: "var(--text-primary)" }}
          >
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
        {/* Scanning toggle */}
        <button
          role="switch"
          aria-checked={isEnabled}
          onClick={onToggle}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors"
          style={{
            background: isEnabled
              ? "color-mix(in srgb, var(--accent) 12%, transparent)"
              : "var(--bg-secondary)",
            border: `1px solid ${isEnabled ? "var(--accent)" : "var(--border)"}`,
          }}
          title={
            isEnabled
              ? "Scanning enabled — click to disable"
              : "Scanning disabled — click to enable"
          }
        >
          <span
            className="text-xs font-medium"
            style={{
              color: isEnabled ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            {isEnabled ? "On" : "Off"}
          </span>
          <span
            className="relative inline-flex h-4 w-7 rounded-full transition-colors"
            style={{
              background: isEnabled ? "var(--accent)" : "var(--border)",
            }}
          >
            <span
              className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
              style={{
                transform: isEnabled ? "translateX(14px)" : "translateX(2px)",
              }}
            />
          </span>
        </button>

        {isEnabled && timeAgo && (
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {issueCount} issue{issueCount !== 1 ? "s" : ""} · {timeAgo}
          </span>
        )}

        {/* Export dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            disabled={!isEnabled || issueCount === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-40 flex items-center gap-1"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
            title="Export report"
          >
            Export
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {exportOpen && (
            <div
              className="absolute right-0 top-full mt-1 py-1 rounded-md border shadow-lg z-20"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                minWidth: 140,
              }}
            >
              <button
                onClick={() => {
                  onExportCSV();
                  setExportOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:opacity-80"
                style={{ color: "var(--text-primary)" }}
              >
                Export as CSV
              </button>
              <button
                onClick={() => {
                  onExportHTML();
                  setExportOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:opacity-80"
                style={{ color: "var(--text-primary)" }}
              >
                Export as HTML
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={!isEnabled || isLoading}
          className="px-3 py-1.5 text-xs font-medium rounded-md text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
          style={{ background: "var(--accent)" }}
          title="Re-scan page"
        >
          {isLoading && (
            <svg
              className="animate-spin h-3 w-3"
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
          )}
          Scan
        </button>
      </div>
    </header>
  );
}
