interface EmptyStateProps {
  onRefresh: () => void;
}

export function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--success-bg)" }}
      >
        <svg
          className="w-8 h-8"
          style={{ color: "var(--success)" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2
        className="text-lg font-medium mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        No issues found
      </h2>
      <p
        className="text-sm mb-4 max-w-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        This page passed all accessibility checks. Great job!
      </p>
      <button
        onClick={onRefresh}
        className="text-xs px-3 py-1.5 rounded-md border transition-colors"
        style={{
          borderColor: "var(--border)",
          color: "var(--accent)",
          background: "var(--bg-secondary)",
        }}
      >
        Run scan again
      </button>
    </div>
  );
}
