import type { AccessibilityIssue, Severity } from "@/types";

interface IssueCardProps {
  issue: AccessibilityIssue;
  expanded: boolean;
  onToggle: () => void;
  onHighlight: () => void;
  onClearHighlight: () => void;
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
};

export function IssueCard({
  issue,
  expanded,
  onToggle,
  onHighlight,
  onClearHighlight,
}: IssueCardProps) {
  return (
    <div
      className="rounded-lg border transition-all"
      style={{
        borderColor: expanded
          ? SEVERITY_COLORS[issue.severity]
          : "var(--border)",
        background: "var(--bg-card)",
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
          </div>
        </div>

        {/* Chevron */}
        <svg
          className="w-4 h-4 mt-1 shrink-0 transition-transform"
          style={{
            color: "var(--text-secondary)",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
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
      {expanded && (
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

          {/* Highlight button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHighlight();
            }}
            className="mt-2.5 text-xs px-2.5 py-1 rounded flex items-center gap-1.5 border transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--accent)",
              background: "var(--bg-secondary)",
            }}
          >
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
            Highlight on page
          </button>
        </div>
      )}
    </div>
  );
}
