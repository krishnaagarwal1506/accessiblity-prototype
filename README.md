# Accessibility Checker

A Chrome DevTools extension that scans web pages for accessibility issues based on **WCAG 2.1** guidelines, highlights them in the page, and presents results in a rich DevTools panel.

Built with **Vite**, **TypeScript**, **React**, and **Tailwind CSS** via [vite-plugin-web-extension](https://github.com/nicedoc/vite-plugin-web-extension).

## Features

- **9 check categories** covering core WCAG criteria:
  - **Keyboard accessibility** — clickable elements without keyboard access, positive tabindex, non-focusable interactive roles
  - **Color contrast** — text contrast ratio against WCAG AA (4.5:1 / 3:1)
  - **Images** — missing alt text, empty alt on linked images, inaccessible SVGs
  - **Forms** — missing labels, placeholder-only labels, missing autocomplete
  - **ARIA** — invalid roles, missing required properties, broken ID references
  - **Headings** — skipped levels, missing/multiple h1, empty headings
  - **Links** — empty links, generic text ("click here"), new-window warnings
  - **Document** — missing title, missing lang, viewport zoom restrictions, landmarks
  - **Semantics** — duplicate IDs, data tables without headers, unnamed buttons
- **Severity levels**: critical, serious, moderate, minor
- **Modern DevTools panel** with summary bar, category/severity filters, search, and issue cards
- **Element highlighting** — hover an issue to highlight it on the page; click to scroll into view
- **CSV export** for reporting
- **Dark/light mode** auto-matching DevTools theme
- Debounced, idle-time-friendly scanning with MutationObserver for live updates

## Quick start

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build
```

1. In Chrome, go to `chrome://extensions` → enable **Developer mode**.
2. Click **Load unpacked** and select the `dist/` folder.
3. Open DevTools on any page → navigate to the **Accessibility** tab.

## Project structure

```
├── manifest.json                  # Extension manifest (Vite entry)
├── vite.config.ts                 # Vite + web-extension plugin config
├── tailwind.config.js
├── tsconfig.json
├── public/
│   └── icons/                     # Extension icons
├── src/
│   ├── types/index.ts             # Shared TypeScript types
│   ├── background/index.ts        # Service worker (message routing)
│   ├── content/
│   │   ├── index.ts               # Content script (scan orchestration)
│   │   ├── styles.css             # Highlight styles (injected into page)
│   │   └── checks/
│   │       ├── index.ts           # Check runner
│   │       ├── utils.ts           # Shared helpers (selector, truncation)
│   │       ├── keyboard.ts        # WCAG 2.1.1, 2.4.3
│   │       ├── color-contrast.ts  # WCAG 1.4.3
│   │       ├── images.ts          # WCAG 1.1.1
│   │       ├── forms.ts           # WCAG 1.3.1, 1.3.5, 3.3.2
│   │       ├── aria.ts            # WCAG 4.1.2, 1.3.1
│   │       ├── headings.ts        # WCAG 1.3.1, 2.4.6
│   │       ├── links.ts           # WCAG 2.4.4, 4.1.2, 3.2.5
│   │       ├── document.ts        # WCAG 2.4.2, 3.1.1, 1.4.4
│   │       └── semantics.ts       # WCAG 4.1.1, 4.1.2, 1.3.1
│   └── devtools/
│       ├── init.html / init.ts    # DevTools page entry
│       ├── panel.html             # Panel HTML shell
│       └── panel/
│           ├── main.tsx           # React root
│           ├── App.tsx            # Main application component
│           ├── styles.css         # Tailwind + CSS custom properties
│           └── components/
│               ├── Header.tsx
│               ├── SummaryBar.tsx
│               ├── FilterBar.tsx
│               ├── IssueList.tsx
│               ├── IssueCard.tsx
│               └── EmptyState.tsx
```

## WCAG criteria covered

| Criterion | Name                   | Category                                   |
| --------- | ---------------------- | ------------------------------------------ |
| 1.1.1     | Non-text Content       | images                                     |
| 1.3.1     | Info and Relationships | forms, aria, headings, document, semantics |
| 1.3.5     | Identify Input Purpose | forms                                      |
| 1.4.3     | Contrast (Minimum)     | color-contrast                             |
| 1.4.4     | Resize Text            | document                                   |
| 2.1.1     | Keyboard               | keyboard                                   |
| 2.4.1     | Bypass Blocks          | document                                   |
| 2.4.2     | Page Titled            | document                                   |
| 2.4.3     | Focus Order            | keyboard                                   |
| 2.4.4     | Link Purpose           | links                                      |
| 2.4.6     | Headings and Labels    | headings                                   |
| 3.1.1     | Language of Page       | document                                   |
| 3.2.5     | Change on Request      | links                                      |
| 3.3.2     | Labels or Instructions | forms                                      |
| 4.1.1     | Parsing                | semantics                                  |
| 4.1.2     | Name, Role, Value      | aria, links, semantics                     |
