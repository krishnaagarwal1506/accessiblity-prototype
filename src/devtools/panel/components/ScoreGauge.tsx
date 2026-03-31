import { useMemo } from "react";
import type { AccessibilityIssue } from "@/types";

interface ScoreGaugeProps {
  issues: AccessibilityIssue[];
}

const SEVERITY_WEIGHTS = {
  critical: 8,
  serious: 5,
  moderate: 3,
  minor: 1,
} as const;

export function calculateScore(issues: AccessibilityIssue[]): number {
  if (issues.length === 0) return 100;

  let deductions = 0;
  for (const issue of issues) {
    deductions += SEVERITY_WEIGHTS[issue.severity];
  }

  return Math.max(0, Math.round(100 - deductions));
}

function getScoreColor(score: number): string {
  if (score >= 90) return "var(--success)";
  if (score >= 70) return "var(--moderate)";
  if (score >= 50) return "var(--serious)";
  return "var(--critical)";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "Poor";
}

export function ScoreGauge({ issues }: ScoreGaugeProps) {
  const score = useMemo(() => calculateScore(issues), [issues]);
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  // SVG arc parameters
  const size = 96;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 270 degrees (3/4 of circle)
  const arcLength = circumference * 0.75;
  const filledLength = arcLength * (score / 100);
  const dashArray = `${filledLength} ${circumference}`;
  // Rotate so arc starts at bottom-left
  const rotation = 135;

  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        {/* Score number centered */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingBottom: 4 }}
        >
          <span
            className="text-2xl font-bold leading-none"
            style={{ color }}
          >
            {score}
          </span>
          <span
            className="text-[10px] mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            / 100
          </span>
        </div>
      </div>
      <span
        className="text-xs font-medium"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
