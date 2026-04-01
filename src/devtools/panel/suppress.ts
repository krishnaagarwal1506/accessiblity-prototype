/**
 * Suppress/ignore individual accessibility issues using chrome.storage.local.
 * Issues are keyed by a fingerprint of selector + message (stable across scans).
 */

export interface SuppressedIssue {
  fingerprint: string;
  message: string;
  selector: string;
  reason: string;
  suppressedAt: number;
}

export function getFingerprint(selector: string, message: string): string {
  return `${selector}::${message}`;
}

const STORAGE_KEY = "a11y_suppressed_issues";

export async function getSuppressedIssues(): Promise<
  Record<string, SuppressedIssue>
> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || {};
}

export async function suppressIssue(
  selector: string,
  message: string,
  reason: string,
): Promise<void> {
  const suppressed = await getSuppressedIssues();
  const fingerprint = getFingerprint(selector, message);
  suppressed[fingerprint] = {
    fingerprint,
    message,
    selector,
    reason,
    suppressedAt: Date.now(),
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: suppressed });
}

export async function unsuppressIssue(fingerprint: string): Promise<void> {
  const suppressed = await getSuppressedIssues();
  delete suppressed[fingerprint];
  await chrome.storage.local.set({ [STORAGE_KEY]: suppressed });
}

export async function clearAllSuppressed(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
