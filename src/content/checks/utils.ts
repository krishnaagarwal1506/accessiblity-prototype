import type { AccessibilityIssue } from "@/types";

let idCounter = 0;

export function uid(): string {
  return `a11y-${Date.now()}-${++idCounter}`;
}

export function truncateHTML(html: string, max = 120): string {
  return html.length > max ? html.slice(0, max) + "…" : html;
}

export function getSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      parts.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === "string") {
      const classes = current.className
        .trim()
        .split(/\s+/)
        .filter((c) => !c.startsWith("a11y-checker"))
        .slice(0, 2);
      if (classes.length) {
        selector += "." + classes.map((c) => CSS.escape(c)).join(".");
      }
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

export function isHidden(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.hidden || el.getAttribute("aria-hidden") === "true") return true;

  const style = window.getComputedStyle(el);
  return (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  );
}

export function isVisible(el: Element): boolean {
  return !isHidden(el);
}

export type CheckFn = () => AccessibilityIssue[];
