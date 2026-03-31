import type { AccessibilityIssue } from "@/types";
import { uid, truncateHTML, getSelector, isVisible } from "./utils";

/**
 * WCAG 1.2.1 Audio-only and Video-only (Prerecorded)
 * WCAG 1.2.2 Captions (Prerecorded)
 * WCAG 4.1.2 Name, Role, Value — iframes need titles.
 */

export function checkMedia(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // <video> without captions track
  const videos = document.querySelectorAll("video");
  for (const video of videos) {
    if (!isVisible(video)) continue;

    const hasCaptions = video.querySelector(
      'track[kind="captions"], track[kind="subtitles"]',
    );
    if (!hasCaptions) {
      issues.push({
        id: uid(),
        category: "media",
        severity: "critical",
        message: "Video has no captions track",
        element: truncateHTML(video.outerHTML),
        selector: getSelector(video),
        wcag: "1.2.2",
        help: 'Add a <track kind="captions" src="..." srclang="en" label="English"> element inside the <video>.',
      });
    }
  }

  // <audio> without text alternative
  const audios = document.querySelectorAll("audio");
  for (const audio of audios) {
    if (!isVisible(audio)) continue;

    const hasTrack = audio.querySelector("track");
    const hasAriaLabel = audio.getAttribute("aria-label");
    const hasAriaDescribedby = audio.getAttribute("aria-describedby");

    if (!hasTrack && !hasAriaLabel && !hasAriaDescribedby) {
      issues.push({
        id: uid(),
        category: "media",
        severity: "serious",
        message: "Audio element has no text alternative or captions",
        element: truncateHTML(audio.outerHTML),
        selector: getSelector(audio),
        wcag: "1.2.1",
        help: "Provide a transcript or <track> element for audio content so deaf and hard-of-hearing users can access it.",
      });
    }
  }

  // <iframe> without title
  const iframes = document.querySelectorAll("iframe");
  for (const iframe of iframes) {
    if (!isVisible(iframe)) continue;
    if (iframe.getAttribute("aria-hidden") === "true") continue;
    if (
      iframe.getAttribute("role") === "presentation" ||
      iframe.getAttribute("role") === "none"
    )
      continue;

    const title = iframe.getAttribute("title");
    const ariaLabel = iframe.getAttribute("aria-label");
    const ariaLabelledby = iframe.getAttribute("aria-labelledby");

    if (!title && !ariaLabel && !ariaLabelledby) {
      issues.push({
        id: uid(),
        category: "media",
        severity: "serious",
        message: "iframe has no accessible name",
        element: truncateHTML(iframe.outerHTML),
        selector: getSelector(iframe),
        wcag: "4.1.2",
        help: 'Add a title attribute to the <iframe> describing its content, e.g. <iframe title="YouTube video player">.',
      });
    }
  }

  // <object> / <embed> without text alternative
  const embeds = document.querySelectorAll("object, embed");
  for (const embed of embeds) {
    if (!isVisible(embed)) continue;
    if (embed.getAttribute("aria-hidden") === "true") continue;

    const ariaLabel = embed.getAttribute("aria-label");
    const ariaLabelledby = embed.getAttribute("aria-labelledby");
    const title = embed.getAttribute("title");
    const hasBody =
      embed.tagName === "OBJECT" && embed.textContent?.trim();

    if (!ariaLabel && !ariaLabelledby && !title && !hasBody) {
      issues.push({
        id: uid(),
        category: "media",
        severity: "serious",
        message: `<${embed.tagName.toLowerCase()}> has no text alternative`,
        element: truncateHTML(embed.outerHTML),
        selector: getSelector(embed),
        wcag: "1.1.1",
        help: "Add a title, aria-label, or fallback text content for embedded content.",
      });
    }
  }

  return issues;
}
