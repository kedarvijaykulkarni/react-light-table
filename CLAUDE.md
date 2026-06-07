# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`@kedman1234/react-light-table` is a zero-dependency React table component library (TypeScript-first) published to npm. It supports search, sorting, pagination, row selection, column visibility toggling, remote data fetching, row virtualization, column pinning, controlled props, and custom cell rendering. The library has strong security hardening built in (SSRF, ReDoS, prototype pollution, CSS injection protections).

Published package names: `react-light-table` and `@kedman1234/react-light-table` (scoped).

## Commands

```bash
npm run dev           # Run the demo app (Vite dev server at demo/)
npm run build         # Bundle with Rollup → dist/ (CJS + ESM + .d.ts)
npm run test          # Run tests once (Vitest)
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report (v8)
npm run lint          # Type-check with tsc --noEmit (no emission)
npm run clean         # Remove dist/
```

Pre-publish: `npm run lint && npm run test && npm run build` runs automatically via `prepublishOnly`.

## Architecture

### Source (`src/`)

- **`Table/Table.tsx`** — Core component. All UI rendering: header, body, toolbar, pagination controls, column visibility menu, loading/error states, virtual scroll wrapper, pinned-column offset calculation.
- **`Table/Table.types.ts`** — All TypeScript types (`ColumnDef<T>`, `TableProps<T>`, `SortState`, `InternalColumn<T>`). Start here when understanding the API.
- **`hooks/`** — Four standalone hooks, each independently exported and tested:
  - `useSort` — sort state, controlled via `sortState` + `onSortChange`
  - `useSearch` — filter logic, controlled via `searchValue` + `onSearchChange`
  - `useSelection` — row selection, controlled via `selectedRows` + `onSelectionChange`
  - `usePagination` — page state, controlled via `page` + `onPageChange`
- **`utils/helpers.ts`** — Shared utilities (safe className validation, string comparison, numeric guards).
- **`Table/table.css`** — Stylesheet using CSS custom properties. Extracted and minified by Rollup at build time.
- **`globals.d.ts`** — Ambient `declare module '*.css'` declaration required by TypeScript 6 `bundler` moduleResolution.

### Key Props Added (branch: feature/row-virtualization)

- **`virtualized?: boolean`** — enables DOM windowing (only visible rows + 10 buffer rows rendered). Container height via `--rlt-virtual-height` CSS variable (default 400px).
- **`render?: (value, row) => ReactNode`** on `ColumnDef<T>` — full JSX cell renderer; takes precedence over `formatter` when both are present.
- **`pin?: 'left' | 'right'`** on `ColumnDef<T>` — sticky-positions a column. Offsets computed by `useLayoutEffect` measuring rendered `<th>` widths. CSS classes: `rlt-th--pin-left/right`, `rlt-td--pin-left/right`.
- **Controlled props** — each hook accepts a controlled value + change callback. Component falls back to internal state when the controlled prop is `undefined`.

### Build Output (`dist/`)

Rollup produces:
- `dist/index.js` — CommonJS bundle
- `dist/index.esm.js` — ES Module bundle
- `dist/table.css` — Extracted CSS (must be imported separately by consumers)
- `dist/index.d.ts` — TypeScript declarations

React and ReactDOM are externalized (peer dependencies).

### Testing

Tests live in `src/Table/Table.test.tsx`. Uses Vitest 4.x + jsdom + `@testing-library/react`. Global test APIs are enabled (no explicit imports needed). Setup file: `src/setupTests.ts` (adds `@testing-library/jest-dom` matchers). Coverage via `@vitest/coverage-v8` (separate package required by vitest 4.x).

To run a single test by name:
```bash
npx vitest run --reporter=verbose -t "test name substring"
```

Current test count: **114 tests**, all passing.

### Security Constraints to Preserve

Several security invariants are intentionally enforced in the source — do not remove them:
- **URL validation** in remote data fetch: only `http`/`https` allowed (SSRF protection)
- **Search length cap** (200 chars) and cell value cap (10KB) in `useSearch` (ReDoS/memory protection)
- **Sort key sanitization** and `hasOwnProperty` checks in `useSort` (prototype pollution protection)
- **className validation** regex in `helpers.ts` (CSS injection protection)
- **30-second AbortController timeout** on fetch requests
- **Max dataset size guard** (100K rows for sort, 10MB for fetch response)
- **Max key length guard** (512 chars) and `hasOwnProperty` checks in `useSelection` (prototype pollution protection)

### TypeScript Configuration

- `"moduleResolution": "bundler"` — required for TypeScript 6 (replaces deprecated `"node"`)
- `src/globals.d.ts` declares `module '*.css'` to satisfy bundler resolution for CSS side-effect imports
- `"allowSyntheticDefaultImports": true` — needed for React JSX transform interop

### CSS Z-Index Layering (Pinned Columns)

| Layer | z-index | Element |
|---|---|---|
| Pinned body cells | 2 | `.rlt-td--pin-left/right` |
| Pinned header cells | 3 | `.rlt-th--pin-left/right` |
| Regular sticky header | 10 | `.rlt-table--sticky thead th` |
| Pinned sticky header | 11 | `.rlt-table--sticky .rlt-th--pin-left/right` |
