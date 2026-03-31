import type { AccessibilityIssue, Severity } from "@/types";
import { uid, truncateHTML, getSelector, isVisible } from "./utils";

/**
 * WCAG 1.4.3 Contrast (Minimum) — AA level
 *   Normal text: ≥ 4.5:1
 *   Large text (≥18pt or ≥14pt bold): ≥ 3:1
 * WCAG 1.4.6 Contrast (Enhanced) — AAA level (reported as minor)
 *   Normal text: ≥ 7:1
 *   Large text: ≥ 4.5:1
 */

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(color: string): [number, number, number, number] | null {
  const rgb = color.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/
  );
  if (rgb) {
    return [
      parseInt(rgb[1]),
      parseInt(rgb[2]),
      parseInt(rgb[3]),
      rgb[4] !== undefined ? parseFloat(rgb[4]) : 1,
    ];
  }
  return null;
}

function blendOnWhite(
  r: number,
  g: number,
  b: number,
  a: number
): [number, number, number] {
  return [
    Math.round(r * a + 255 * (1 - a)),
    Math.round(g * a + 255 * (1 - a)),
    Math.round(b * a + 255 * (1 - a)),
  ];
}

function isLargeText(el: Element): boolean {
  const style = window.getComputedStyle(el);
  const fontSize = parseFloat(style.fontSize); // in px
  const fontWeight = style.fontWeight;
  const isBold =
    fontWeight === "bold" ||
    fontWeight === "bolder" ||
    parseInt(fontWeight) >= 700;

  // 18pt = 24px, 14pt = 18.66px
  return fontSize >= 24 || (fontSize >= 18.66 && isBold);
}

function hasOwnText(el: Element): boolean {
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      return true;
    }
  }
  return false;
}

export function checkColorContrast(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const textElements = document.querySelectorAll(
    "p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, button, div, section, article, strong, em, b, i, small, blockquote, figcaption, dt, dd, cite, code, pre"
  );

  for (const el of textElements) {
    if (!isVisible(el) || !hasOwnText(el)) continue;

    const style = window.getComputedStyle(el);
    const fgParsed = parseColor(style.color);
    if (!fgParsed) continue;

    let bgColor = getEffectiveBackground(el);
    if (!bgColor) continue;

    const [fr, fg, fb, fa] = fgParsed;
    const fgBlended = blendOnWhite(fr, fg, fb, fa);
    const bgBlended = blendOnWhite(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);

    const fgLum = luminance(...fgBlended);
    const bgLum = luminance(...bgBlended);
    const ratio = contrastRatio(fgLum, bgLum);

    const large = isLargeText(el);
    const aaThreshold = large ? 3 : 4.5;

    if (ratio < aaThreshold) {
      const severity: Severity = ratio < 2 ? "critical" : "serious";
      issues.push({
        id: uid(),
        category: "color-contrast",
        severity,
        message: `Insufficient color contrast: ${ratio.toFixed(2)}:1 (requires ${aaThreshold}:1 for ${large ? "large" : "normal"} text)`,
        element: truncateHTML(el.outerHTML),
        selector: getSelector(el),
        wcag: "1.4.3",
        help: `Foreground color ${style.color} on background does not meet WCAG AA. Increase contrast to at least ${aaThreshold}:1.`,
      });
    }
  }

  return issues;
}

function getEffectiveBackground(
  el: Element
): [number, number, number, number] | null {
  let current: Element | null = el;
  while (current) {
    const style = window.getComputedStyle(current);
    const bg = parseColor(style.backgroundColor);
    if (bg && bg[3] > 0) {
      return bg;
    }
    current = current.parentElement;
  }
  // Default to white
  return [255, 255, 255, 1];
}
