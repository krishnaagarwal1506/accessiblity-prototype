export type WcagLevel = "A" | "AA" | "AAA";

/**
 * Maps WCAG 2.1 success criteria to their conformance level.
 * This covers all criteria referenced by the extension's checks.
 */
const WCAG_CRITERION_LEVEL: Record<string, WcagLevel> = {
  // Perceivable
  "1.1.1": "A", // Non-text Content
  "1.2.1": "A", // Audio-only and Video-only
  "1.2.2": "A", // Captions (Prerecorded)
  "1.2.3": "A", // Audio Description or Media Alternative
  "1.3.1": "A", // Info and Relationships
  "1.3.5": "AA", // Identify Input Purpose
  "1.4.3": "AA", // Contrast (Minimum)
  "1.4.4": "AA", // Resize Text
  "1.4.6": "AAA", // Contrast (Enhanced)

  // Operable
  "2.1.1": "A", // Keyboard
  "2.1.2": "A", // No Keyboard Trap
  "2.4.1": "A", // Bypass Blocks
  "2.4.2": "A", // Page Titled
  "2.4.3": "A", // Focus Order
  "2.4.4": "A", // Link Purpose (In Context)
  "2.4.6": "AA", // Headings and Labels
  "2.4.7": "AA", // Focus Visible
  "2.5.8": "AA", // Target Size (Minimum)

  // Understandable
  "3.1.1": "A", // Language of Page
  "3.1.2": "AA", // Language of Parts
  "3.2.5": "AAA", // Change on Request
  "3.3.2": "A", // Labels or Instructions

  // Robust
  "4.1.1": "A", // Parsing (deprecated in 2.2 but still referenced)
  "4.1.2": "A", // Name, Role, Value
  "4.1.3": "AA", // Status Messages
};

export function getWcagLevel(criterion: string): WcagLevel {
  return WCAG_CRITERION_LEVEL[criterion] || "A";
}

/**
 * Returns true if the issue's WCAG criterion is at or below the selected level.
 * A includes only A; AA includes A + AA; AAA includes all.
 */
export function matchesWcagLevel(
  criterion: string,
  selectedLevel: WcagLevel | "all",
): boolean {
  if (selectedLevel === "all") return true;
  const level = getWcagLevel(criterion);
  if (selectedLevel === "A") return level === "A";
  if (selectedLevel === "AA") return level === "A" || level === "AA";
  return true; // AAA includes everything
}
