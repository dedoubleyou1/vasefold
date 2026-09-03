# VaseFold

A browser-based papercraft template tool for turning vase-like revolved profiles into flattened SVG templates.

The app samples a cubic Bezier side profile, imagines it revolved around a vertical axis, and maps the resulting surface into repeated 2D panels that can be exported as a printable SVG.

## Run

```sh
npm install
npm run dev
```

## Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` type-checks and builds the app.
- `npm run test` runs geometry/unit tests.
- `npm run test:e2e` runs Playwright browser checks.
- `npm run lint` runs ESLint.

## Stack

- Vite + React + TypeScript
- SVG rendering for the editor, previews, and export
- Zustand for project state
- CSS Modules with CSS variables
- Vitest and Playwright for test coverage

## Status

This is still an early design tool, but it now has a complete front-end foundation: draggable Bezier profile editing, live vase and template previews, metric or imperial height-based sizing, adjustable revolve angle, separate closed SVG panel paths, printable SVG export, and testable pure geometry modules. Glue tabs are intentionally left for a later pass.
