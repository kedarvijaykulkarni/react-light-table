# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`@kedman1234/react-light-table` is a zero-dependency React table component library (TypeScript-first) published to npm. It supports search, sorting, pagination, row selection, column visibility toggling, and remote data fetching. The library has strong security hardening built in (SSRF, ReDoS, prototype pollution, CSS injection protections).

Published package names: `react-light-table` and `@kedman1234/react-light-table` (scoped).

## Commands

```bash
npm run dev          # Run the demo app (Vite dev server at demo/)
npm run build        # Bundle with Rollup → dist/ (CJS + ESM + .d.ts)
npm run test         # Run tests once (Vitest)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report (v8)
npm run lint         # Type-check with tsc --noEmit (no emission)
npm run clean        # Remove dist/
```

Pre-publish: `npm run lint && npm run test && npm run build` runs automatically via `prepublishOnly`.

## Architecture

### Source (`src/`)

- **`Table/Table.tsx`** — Core component (~530 lines). All UI rendering: header, body, toolbar, pagination controls, column visibility menu, loading/error states.
- **`Table/Table.types.ts`** — All TypeScript types (`ColumnDef<T>`, `TableProps<T>`, etc.). Start here when understanding the API.
- **`hooks/`** — Four standalone hooks: `useSort`, `useSearch`, `useSelection`, `usePagination`. Each hook is independently exported and tested.
- **`utils/helpers.ts`** — Shared utilities (safe className validation, string comparison, numeric guards).
- **`Table/table.css`** — Stylesheet using 28+ CSS custom properties (e.g., `--rlt-primary`, `--rlt-border-radius`). Extracted and minified by Rollup at build time.

### Build Output (`dist/`)

Rollup produces:
- `dist/index.js` — CommonJS bundle
- `dist/index.esm.js` — ES Module bundle
- `dist/table.css` — Extracted CSS (must be imported separately by consumers)
- `dist/index.d.ts` — TypeScript declarations

React and ReactDOM are externalized (peer dependencies).

### Testing

Tests live in `src/Table/Table.test.tsx`. Uses Vitest + jsdom + `@testing-library/react`. Global test APIs are enabled (no explicit imports needed). Setup file: `src/setupTests.ts` (adds `@testing-library/jest-dom` matchers).

To run a single test by name:
```bash
npx vitest run --reporter=verbose -t "test name substring"
```

### Security Constraints to Preserve

Several security invariants are intentionally enforced in the source — do not remove them:
- **URL validation** in remote data fetch: only `http`/`https` allowed (SSRF protection)
- **Search length cap** (200 chars) and cell value cap (10KB) in `useSearch` (ReDoS/memory protection)
- **Sort key sanitization** and `hasOwnProperty` checks in `useSort` (prototype pollution protection)
- **className validation** regex in `helpers.ts` (CSS injection protection)
- **30-second AbortController timeout** on fetch requests
- **Max dataset size guard** (100K rows for sort, 10MB for fetch response)
