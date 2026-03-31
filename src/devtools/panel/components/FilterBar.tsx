import type { Category, Severity } from "@/types";

interface FilterBarProps {
  categoryFilter: Category | "all";
  severityFilter: Severity | "all";
  searchQuery: string;
  onCategoryChange: (v: Category | "all") => void;
  onSeverityChange: (v: Severity | "all") => void;
  onSearchChange: (v: string) => void;
}

const CATEGORIES: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "keyboard", label: "Keyboard" },
  { value: "color-contrast", label: "Color contrast" },
  { value: "images", label: "Images" },
  { value: "forms", label: "Forms" },
  { value: "aria", label: "ARIA" },
  { value: "headings", label: "Headings" },
  { value: "links", label: "Links" },
  { value: "document", label: "Document" },
  { value: "semantics", label: "Semantics" },
];

const SEVERITIES: { value: Severity | "all"; label: string }[] = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "serious", label: "Serious" },
  { value: "moderate", label: "Moderate" },
  { value: "minor", label: "Minor" },
];

export function FilterBar({
  categoryFilter,
  severityFilter,
  searchQuery,
  onCategoryChange,
  onSeverityChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div
      className="px-4 py-2.5 border-b flex items-center gap-3 flex-wrap"
      style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
          style={{ color: "var(--text-secondary)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search issues…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-2"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Category select */}
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value as Category | "all")}
        className="text-xs px-2.5 py-1.5 rounded-md border focus:outline-none"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Severity select */}
      <select
        value={severityFilter}
        onChange={(e) => onSeverityChange(e.target.value as Severity | "all")}
        className="text-xs px-2.5 py-1.5 rounded-md border focus:outline-none"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      >
        {SEVERITIES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
