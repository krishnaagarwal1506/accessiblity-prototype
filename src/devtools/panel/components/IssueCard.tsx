import type { AccessibilityIssue, Severity, HighlightResult } from "@/types";

interface IssueCardProps {
  issue: AccessibilityIssue;
  isExpanded: boolean;
  onToggle: () => void;
  onHighlight: () => void;
  onClearHighlight: () => void;
  highlightStatus?: HighlightResult["status"] | "loading" | null;
  isSuppressed?: boolean;
  onSuppress?: () => void;
  onUnsuppress?: () => void;
}

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

const CATEGORY_ICONS: Record<string, string> = {
  keyboard: "⌨️",
  "color-contrast": "🎨",
  images: "🖼️",
  forms: "📝",
  aria: "♿",
  headings: "📑",
  links: "🔗",
  document: "📄",
  semantics: "🏷️",
  media: "🎬",
};

export function IssueCard({
  issue,
  isExpanded,
  onToggle,
  onHighlight,
  onClearHighlight,
  highlightStatus,
  isSuppressed,
  onSuppress,
  onUnsuppress,
}: IssueCardProps) {
  return (
    <div
      className="rounded-lg border transition-all"
      style={{
        borderColor: isExpanded
          ? SEVERITY_COLORS[issue.severity]
          : "var(--border)",
        background: "var(--bg-card)",
        opacity: isSuppressed ? 0.6 : 1,
      }}
      onMouseEnter={onHighlight}
      onMouseLeave={onClearHighlight}
    >
      {/* Header row — clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-3 py-2.5 text-left cursor-pointer"
        style={{ background: "transparent", border: "none" }}
      >
        {/* Severity dot */}
        <span
          className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
          style={{ background: SEVERITY_COLORS[issue.severity] }}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs">
              {CATEGORY_ICONS[issue.category] || "❓"}
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {issue.message}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: SEVERITY_BG[issue.severity],
                color: SEVERITY_COLORS[issue.severity],
              }}
            >
              {issue.severity}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-secondary)",
              }}
            >
              WCAG {issue.wcag}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-secondary)",
              }}
            >
              {issue.category}
            </span>
            {issue.isHidden && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5"
                style={{
                  background: "rgba(161, 98, 7, 0.15)",
                  color: "var(--moderate, #a16207)",
                }}
                title="This element is not currently visible (e.g. inside a closed dropdown, modal, or hover menu)"
              >
                <svg
                  className="w-2.5 h-2.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                hidden
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className="w-4 h-4 mt-1 shrink-0 transition-transform"
          style={{
            color: "var(--text-secondary)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div
          className="px-3 pb-3 pt-0 border-t mx-3 mb-1"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Element preview */}
          <div className="mt-2.5 mb-2">
            <div
              className="text-[10px] uppercase tracking-wider font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Element
            </div>
            <code
              className="block text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap break-all"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
              }}
            >
              {issue.element}
            </code>
          </div>

          {/* Selector */}
          <div className="mb-2">
            <div
              className="text-[10px] uppercase tracking-wider font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Selector
            </div>
            <code
              className="block text-xs p-2 rounded overflow-x-auto"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--accent)",
              }}
            >
              {issue.selector}
            </code>
          </div>

          {/* Help / fix suggestion */}
          <div>
            <div
              className="text-[10px] uppercase tracking-wider font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              How to fix
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-primary)" }}
            >
              {issue.help}
            </p>
          </div>

          {/* Fix snippet */}
          {issue.fixSnippet && (
            <div className="mt-2">
              <div
                className="text-[10px] uppercase tracking-wider font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Suggested fix
              </div>
              <code
                className="block text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap break-all"
                style={{
                  background:
                    "color-mix(in srgb, var(--success) 8%, var(--bg-secondary))",
                  color: "var(--success)",
                  border:
                    "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
                }}
              >
                {issue.fixSnippet}
              </code>
            </div>
          )}

          {/* Hidden element explanation */}
          {issue.isHidden && (
            <div
              className="mt-2 p-2 rounded text-xs leading-relaxed"
              style={{
                background: "rgba(161, 98, 7, 0.08)",
                border: "1px solid rgba(161, 98, 7, 0.2)",
                color: "var(--text-primary)",
              }}
            >
              <div
                className="flex items-center gap-1.5 mb-1 font-medium"
                style={{ color: "var(--moderate, #a16207)" }}
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                Not currently visible
              </div>
              <span style={{ color: "var(--text-secondary)" }}>
                This element is hidden (e.g. inside a closed dropdown, modal, or
                hover menu).{" "}
                {issue.parentSelector && (
                  <>
                    Nearest visible parent:{" "}
                    <code
                      className="px-1 py-0.5 rounded"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--accent)",
                      }}
                    >
                      {issue.parentSelector}
                    </code>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Highlight button + status feedback */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHighlight();
              }}
              disabled={highlightStatus === "loading"}
              className="text-xs px-2.5 py-1 rounded flex items-center gap-1.5 border transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--accent)",
                background: "var(--bg-secondary)",
                opacity: highlightStatus === "loading" ? 0.6 : 1,
              }}
            >
              {highlightStatus === "loading" ? (
                <svg
                  className="w-3 h-3 animate-spin"
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
              ) : (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
              Find element
            </button>

            {highlightStatus === "hidden" && (
              <span
                className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1"
                style={{
                  background: "rgba(161, 98, 7, 0.15)",
                  color: "var(--moderate)",
                }}
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                Element is hidden — parent highlighted
              </span>
            )}

            {highlightStatus === "not-found" && (
              <span
                className="text-[10px] px-2 py-0.5 rounded"
                style={{
                  background: "rgba(185, 28, 28, 0.12)",
                  color: "var(--critical)",
                }}
              >
                Element not found in DOM
              </span>
            )}

            {/* Suppress / Unsuppress */}
            {onSuppress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSuppress();
                }}
                className="text-xs px-2.5 py-1 rounded flex items-center gap-1.5 border transition-colors ml-auto"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                  background: "var(--bg-secondary)",
                }}
                title="Suppress this issue — it won't appear in future scans"
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                Suppress
              </button>
            )}
            {onUnsuppress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnsuppress();
                }}
                className="text-xs px-2.5 py-1 rounded flex items-center gap-1.5 border transition-colors ml-auto"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--accent)",
                  background: "var(--bg-secondary)",
                }}
                title="Restore this issue to the active list"
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Restore
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
