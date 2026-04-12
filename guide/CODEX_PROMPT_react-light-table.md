# Codex Prompt — `react-light-table` Refactor & NPM Package Release

> **Project:** react-light-table
> **Author:** Kedar Vijay Kulkarni
> **Goal:** Fix all bugs, modernize to React 19, and publish as a production-ready npm package.
> **Generated:** April 2026 — Senior Code Review Analysis

---

## 1. PROJECT CONTEXT

You are working on `react-light-table`, a React component library that renders a dynamic, searchable, selectable, and sortable data table from any JSON data source. The component currently lives inside a Create React App (CRA) scaffold and is intended to be extracted and published as a standalone npm package.

### Current File Structure

```
react-light-table/
├── package.json
└── src/
    ├── App.js                  # Demo / consumer usage example
    ├── App.test.js             # Broken test (references "learn react")
    ├── index.js                # CRA entry point
    ├── index.css
    ├── reportWebVitals.js
    ├── setupTests.js
    └── lib/
        ├── index.js            # Library entry — exports { Table }
        └── components/
            ├── Table.js        # Core component (~385 lines)
            └── table.css       # Component styles
```

### Tech Stack (current package.json)

- React 19.2.5, React DOM 19.2.5
- react-scripts 5.0.1 (CRA)
- @babel/cli + @babel/core + @babel/preset-env (for library build)
- @babel/polyfill (deprecated)
- @testing-library/react 16, jest-dom 6, user-event 14
- web-vitals 5

---

## 2. BUG REPORT — ALL IDENTIFIED ISSUES

Fix every issue listed below. Do not skip any.

### 2.1 Critical Bugs

| # | File | Line(s) | Bug | Fix |
|---|------|---------|-----|-----|
| B1 | `Table.js` | 55-62 | **Prop mutation during render.** The `for…of` loop mutates the incoming `columns` prop directly (`column.isVisible = true`). This violates React's rule that props are read-only, causes bugs in Strict Mode, and produces side-effects on every render. | Clone `columns` into local state on mount (and when `columns` prop changes) inside a `useEffect` or via lazy `useState` initializer. Never mutate props. |
| B2 | `Table.js` | 71-95 | **Sort mutates column object directly** (`column.sortAsc = false/true`). Same prop mutation problem. Also, `sortedData.reverse()` mutates in place. | Track sort state (`{ key, direction }`) in a separate `useState`. Use `.toReversed()` or `[...arr].reverse()`. |
| B3 | `Table.js` | 86-89 | **Sort crashes on null/undefined values.** `a[column.path].toUpperCase()` throws `TypeError` if the value is `null`, `undefined`, or not a string. | Add null-guard: `const valA = a[column.path] ?? ''; const valB = b[column.path] ?? '';` and use `String(val).toUpperCase()`. |
| B4 | `Table.js` | 156-159 | **Column visibility toggle is broken.** `setLocalColumns(columns)` passes the original prop reference instead of a new array with toggled visibility, so React sees the same reference and may not re-render. The `setData([...data])` call is a hack that forces re-render but is unreliable. | Maintain a deep-cloned local columns state. On toggle: `setLocalColumns(prev => prev.map((c, i) => i === idx ? { ...c, isVisible: !c.isVisible } : c))`. |
| B5 | `Table.js` | 231-246 | **No error handling on fetch.** `fetch(url)` has no try/catch, no response.ok check, no loading state, no error state. Network failures silently produce an empty table. | Wrap in try/catch. Check `response.ok`. Add `isLoading` and `error` states. Render loading/error UI. |
| B6 | `Table.js` | 237-240 | **Data mutation in fetch.** `for (let item of json) { item.isSelected = false; }` mutates the parsed JSON objects directly. | Map to new objects: `json.map(item => ({ ...item, isSelected: false }))`. |
| B7 | `Table.js` | 294-304 | **handleSelect updates stale data.** `handleSelect` reads `data` from closure, modifies a shallow copy, then calls `checkIsAllSelected()` which also reads stale `data`. The state update in `setData` may not reflect the latest state. | Use functional updater: `setData(prev => prev.map(item => item.id === id ? { ...item, isSelected: !item.isSelected } : item))`. |
| B8 | `Table.js` | 182 | **Missing stable keys.** `data.map((item) => …` uses `item.id` as key, but there is no guarantee the dataset has an `id` field. If IDs are missing or duplicated, React's reconciliation breaks. | Accept an optional `rowKey` prop (default `'id'`). Fall back to array index with a console warning if the key field is missing. |
| B9 | `Table.js` | 188 | **console.log left in render loop.** `{console.log('item :::', item)}` fires on every row on every render. Severe performance hit with large datasets. | Remove all `console.log` calls from render output (lines 64, 188, 333). |
| B10 | `App.test.js` | 4-5 | **Test is for CRA boilerplate, not this component.** It looks for "learn react" text which doesn't exist. Test always fails. | Rewrite with meaningful Table component tests. |

### 2.2 Moderate Bugs

| # | File | Line(s) | Bug | Fix |
|---|------|---------|-----|-----|
| B11 | `Table.js` | 111-119 | **Sort icons use local file paths** (`./images/sort.png`). These images won't exist when consumed as an npm package. | Replace with inline SVG icons or use CSS-only arrows (borders or Unicode characters). |
| B12 | `Table.js` | 253-255 | **`getDefaultClassName` is flawed.** `className.indexOf(' ')` returns `-1` (truthy in a ternary — `-1` is truthy!) when there is no space, so it always enters the split branch. Also crashes if `className` is `undefined`. | Fix logic: `if (!className) return ''; return className.includes(' ') ? className.split(' ')[0] : className;` |
| B13 | `Table.js` | 261-283 | **Search has O(n×m) complexity and relies on `id` field.** Uses `ids.push(localData[txt].id)` which fails if data has no `id` field. Also searches every field including objects (which won't match `.toUpperCase()` and may throw). | Filter by checking only string/number column paths. Use the `rowKey` prop for identity. |
| B14 | `Table.js` | 339 | **Duplicate className.** `['rst-table', className].join(' ')` always prepends `rst-table` but the default `className` prop is already `'rst-table'`, resulting in `"rst-table rst-table"`. | Remove the hardcoded prefix or make the default prop empty string. |
| B15 | `App.js` | 5-7 | **`queryParams` function is broken and unused.** `[...params, (params['key'] = 'value')]` is a side-effect expression that mutates params and returns the assignment value. This prop is accepted nowhere in Table. | Remove dead code. If pagination params are planned, implement properly as a feature. |
| B16 | `App.js` | 73-74 | **Props `pageSize` and `pageList` are passed but never consumed** by the Table component. They silently do nothing. | Either implement pagination or remove the props from the demo. |
| B17 | `package.json` | 32 | **`@babel/polyfill` is deprecated** (since Babel 7.4). It also pulls the entire polyfill bundle. | Remove it. If polyfills are needed, use `core-js` with `@babel/preset-env` `useBuiltIns` option. |
| B18 | `Table.js` | 14-19 | **Commented-out code block** (lines 24-51) — dead code from a previous non-hooks implementation left in production source. | Delete the entire commented block. |

### 2.3 Minor Issues / Code Smells

| # | Issue |
|---|-------|
| B19 | Typo: `cashData` should be `cacheData`. |
| B20 | Typo: `ColumnControler` should be `ColumnController`. |
| B21 | `cellPadding`, `cellSpacing`, `tableBorder` are deprecated HTML table attributes. Use CSS instead. |
| B22 | `aria-label="Input username"` on the search input is incorrect — should be `"Search table"`. |
| B23 | The component only accepts a `url` prop for data. There is no way to pass local/static data via a `data` prop, which makes the component nearly unusable for most real-world cases. |
| B24 | No TypeScript types or PropTypes for any component API surface. |
| B25 | CSS uses hardcoded colors with no theming/CSS-variable support. |
| B26 | No pagination, which is listed in the demo props but unimplemented. |

---

## 3. TASK LIST — ORDERED BY PRIORITY

Complete all tasks in the order below. Each task must be fully finished before moving to the next.

### Phase 1: Foundation & Build System

**Task 1 — Restructure for npm package publishing**

Create this target structure:

```
react-light-table/
├── package.json
├── README.md
├── LICENSE
├── tsconfig.json
├── rollup.config.mjs          # or vite library mode config
├── .babelrc  (remove if using Rollup/Vite with TS)
├── src/
│   ├── index.ts               # Library entry — exports everything
│   ├── Table/
│   │   ├── Table.tsx           # Main component
│   │   ├── Table.module.css    # CSS Modules (or .css with unique prefixes)
│   │   ├── Table.types.ts     # TypeScript interfaces/types
│   │   ├── Table.test.tsx      # Unit tests
│   │   └── index.ts           # Re-export
│   ├── hooks/
│   │   ├── useSort.ts
│   │   ├── useSearch.ts
│   │   ├── useSelection.ts
│   │   └── usePagination.ts
│   └── utils/
│       └── helpers.ts
├── demo/                       # Separate demo app (Vite or CRA)
│   ├── App.tsx
│   └── main.tsx
└── dist/                       # Build output (gitignored)
    ├── index.js                # CJS
    ├── index.esm.js            # ESM
    ├── index.d.ts              # Type declarations
    └── Table.module.css
```

**Task 2 — Configure package.json for npm publishing**

```json
{
  "name": "react-light-table",
  "version": "1.0.0",
  "description": "A lightweight, accessible, sortable, searchable, and selectable React table component for any dataset",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "sideEffects": ["**/*.css"],
  "private": false,
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "scripts": {
    "build": "rollup -c",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "prepublishOnly": "npm run build && npm run test"
  }
}
```

Key requirements:
- `react` and `react-dom` must be `peerDependencies`, NOT `dependencies` (currently they are in `dependencies` which causes duplicate React instances for consumers).
- Remove `@babel/polyfill`.
- Remove `react-scripts` (CRA dependency, not needed for library).
- Add Rollup or Vite in library mode with plugins: `@rollup/plugin-typescript`, `rollup-plugin-postcss`, `@rollup/plugin-terser`.
- Generate CJS, ESM, and TypeScript declarations.
- Set `"files": ["dist"]` so only build output is published.
- Add `"prepublishOnly"` script that runs build + tests before publish.

**Task 3 — Convert to TypeScript**

Define these core types in `Table.types.ts`:

```typescript
export interface ColumnDef<T = Record<string, unknown>> {
  key: string;
  path: keyof T & string;
  label: string;
  className?: string;
  sortable?: boolean;
  isVisible?: boolean;
  formatter?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableProps<T = Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data?: T[];                  // ← NEW: local data support
  url?: string;                // ← optional remote data
  rowKey?: keyof T & string;   // ← field to use as unique key (default: 'id')
  className?: string;
  isSearchable?: boolean;
  isSelectable?: boolean;
  searchableFields?: string[]; // ← which columns to search
  pageSize?: number;           // ← implement pagination
  onSelectionChange?: (selectedRows: T[]) => void;  // ← callback
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;           // ← external loading control
  emptyMessage?: string | React.ReactNode;
  errorMessage?: string | React.ReactNode;
  stickyHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
}
```

### Phase 2: Bug Fixes (Apply ALL fixes from Section 2)

**Task 4 — Fix all critical bugs (B1–B10)**

- Eliminate every prop mutation. All column state must be internally cloned.
- Extract sort logic into `useSort` custom hook.
- Extract search logic into `useSearch` custom hook.
- Extract selection logic into `useSelection` custom hook.
- Add proper error boundaries around fetch.
- Add loading and error UI states.
- Remove ALL `console.log` statements from component code.

**Task 5 — Fix all moderate bugs (B11–B18)**

- Replace image-based sort icons with inline SVGs or CSS.
- Fix `getDefaultClassName` logic.
- Fix search to only search string values in visible columns.
- Fix duplicate className application.
- Remove dead/commented code.
- Remove `@babel/polyfill`.

**Task 6 — Fix all minor issues (B19–B26)**

- Rename `cashData` → `cacheData` (or better, eliminate it by deriving filtered data).
- Rename `ColumnControler` → `ColumnController`.
- Remove deprecated HTML attributes; use CSS.
- Fix aria labels.
- Add `data` prop support (not just `url`).
- Add PropTypes or rely on TypeScript (preferred).

### Phase 3: New Features

**Task 7 — Support local data via `data` prop**

The component must work in two modes:
1. **Remote mode**: `url` prop triggers `fetch`, component manages loading/error states.
2. **Local mode**: `data` prop receives an array directly, no fetch occurs.

Validation: If both `data` and `url` are provided, `data` takes priority with a dev-mode console warning. If neither is provided, render the `emptyMessage`.

**Task 8 — Implement Pagination**

- Add `pageSize` prop (default: off / show all).
- Add `currentPage` state and page navigation controls (Prev, Next, page numbers).
- Pagination should work after search filtering.
- Show item count: "Showing 1–25 of 142 results".
- Support `onPageChange` callback.

**Task 9 — Add CSS Custom Properties for Theming**

```css
:root {
  --rlt-font-family: inherit;
  --rlt-header-bg: #f8f9fa;
  --rlt-header-color: #333;
  --rlt-row-hover-bg: #f5f5f5;
  --rlt-row-selected-bg: #e3f2fd;
  --rlt-border-color: #dee2e6;
  --rlt-sort-icon-color: #666;
  --rlt-search-border-color: #ccc;
  --rlt-search-focus-border: #4a90d9;
}
```

**Task 10 — Accessibility (a11y)**

- Add `role="grid"` on table, `role="row"` on tr, `role="gridcell"` on td.
- Sort buttons: `aria-sort="ascending"`, `aria-sort="descending"`, or `aria-sort="none"`.
- Search input: proper `aria-label="Search table data"`.
- Select All checkbox: `aria-label="Select all rows"`.
- Row checkboxes: `aria-label="Select row {identifier}"`.
- Column visibility menu: proper `aria-expanded`, `aria-haspopup`, keyboard navigation.
- Full keyboard navigation for sort buttons and checkboxes.

### Phase 4: Testing

**Task 11 — Write comprehensive tests**

Using Vitest + React Testing Library, write tests covering:

```
Table.test.tsx
├── Rendering
│   ├── renders table with local data
│   ├── renders table from URL (mock fetch)
│   ├── renders loading state
│   ├── renders error state on fetch failure
│   ├── renders empty state with emptyMessage
│   └── renders correct number of columns and rows
├── Sorting
│   ├── sorts string column ascending
│   ├── sorts string column descending
│   ├── sorts numeric column ascending
│   ├── sorts numeric column descending
│   ├── handles null/undefined values in sort
│   └── shows correct sort indicator icon
├── Searching
│   ├── filters rows matching search text
│   ├── search is case-insensitive
│   ├── clears filter when search is emptied
│   ├── searches only string/number fields
│   └── works with formatter columns
├── Selection
│   ├── selects individual row
│   ├── deselects individual row
│   ├── select-all selects all visible rows
│   ├── deselect-all deselects all rows
│   ├── fires onSelectionChange callback
│   └── selection persists through sort/search
├── Column Visibility
│   ├── hides column when toggled off
│   ├── shows column when toggled on
│   └── menu opens and closes
├── Pagination (if implemented)
│   ├── shows correct page of data
│   ├── navigates between pages
│   └── updates after search filter
└── Accessibility
    ├── has correct ARIA roles
    ├── sort buttons have aria-sort
    └── keyboard navigation works
```

### Phase 5: Documentation & Publishing

**Task 12 — Write README.md**

Include:
- Feature list with badges (npm version, bundle size, license)
- Installation: `npm install react-light-table`
- Quick Start code example with local data
- Quick Start code example with remote URL
- Full API reference table for all props
- Column definition reference
- Theming / CSS variables guide
- Examples: sorting, searching, selection, custom formatters, pagination
- Browser support
- Contributing guide
- License (MIT)

**Task 13 — Prepare for npm publish**

- Add `.npmignore` or use `"files"` in package.json (prefer `"files"`).
- Ensure `dist/` is generated with: CJS bundle, ESM bundle, TypeScript declarations, CSS file.
- Add `"sideEffects": ["**/*.css"]` for tree-shaking.
- Verify package works by running `npm pack` and inspecting the tarball.
- Test the package locally: `npm link` in the library, `npm link react-light-table` in a test Vite app, and verify import + rendering works.

---

## 4. CODE QUALITY CONSTRAINTS

Apply these rules to ALL code you write:

1. **Zero `any` types.** Every variable, parameter, and return type must be explicitly typed.
2. **Zero `console.log` in production code.** Use `process.env.NODE_ENV === 'development'` guards if needed.
3. **No prop mutation.** Never modify props or their nested objects. Always clone first.
4. **Functional state updates.** Always use `setState(prev => ...)` when the new state depends on the previous state.
5. **Stable references.** Wrap callbacks in `useCallback`, memoize expensive computations with `useMemo`.
6. **No inline function definitions in JSX** for event handlers that would cause unnecessary re-renders.
7. **CSS Modules or uniquely prefixed classes** (prefix: `rlt-`) to prevent global style leakage.
8. **Every component must be a named function** (not anonymous arrow assigned to const) for better debugging stack traces.
9. **Exhaustive `useEffect` dependency arrays** — no eslint-disable for `react-hooks/exhaustive-deps`.
10. **Handle edge cases:** empty data, null values, missing fields, duplicate IDs, zero columns visible.

---

## 5. FINAL ACCEPTANCE CRITERIA

The work is done when ALL of these are true:

- [ ] `npm run build` produces `dist/` with CJS, ESM, and `.d.ts` files with zero errors.
- [ ] `npm run test` passes all tests (minimum 25 test cases) with zero failures.
- [ ] The component renders correctly with both `data` (local array) and `url` (remote fetch) props.
- [ ] Sorting works for strings, numbers, and handles null/undefined without crashing.
- [ ] Search filters rows in real-time across all visible string/number columns.
- [ ] Row selection (individual + select-all) works and fires `onSelectionChange`.
- [ ] Column visibility toggling works without visual glitches or stale state.
- [ ] No `console.log`, `console.warn`, or `console.error` calls exist in library source.
- [ ] No TypeScript errors with `strict: true`.
- [ ] No ESLint errors.
- [ ] `npm pack` produces a clean tarball containing only `dist/`, `README.md`, `LICENSE`, `package.json`.
- [ ] A fresh Vite + React project can `npm install ./react-light-table-1.0.0.tgz` and render the table with zero additional configuration.
- [ ] All ARIA attributes are correctly applied.
- [ ] CSS custom properties allow full visual theming without overriding internal classes.
- [ ] Bundle size is under 15 KB gzipped (excluding React peer dependency).

---

## 6. REFERENCE — CURRENT SOURCE CODE

Below is the complete current source for reference. Apply all changes against this baseline.

### `package.json`

```json
{
  "name": "react-light-table",
  "version": "0.1.0",
  "author": "kedarvijaykulkarni",
  "private": true,
  "main": "dist/index.js",
  "module": "dist/index.js",
  "contributors": [
    {
      "name": "Kedar Vijay Kulkarni",
      "url": "https://github.com/kedarvijaykulkarni"
    }
  ],
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/kedarvijaykulkarni/react-light-table/issues"
  },
  "keywords": ["React","Table","Dynamic Table","Components","React components","React table components","UI"],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/kedarvijaykulkarni/react-light-table.git"
  },
  "dependencies": {
    "@babel/polyfill": "^7.12.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-scripts": "5.0.1",
    "web-vitals": "^5.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "rm -rf dist && NODE_ENV=production babel src/lib --out-dir dist --copy-files",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "@babel/cli": "^7.18.6",
    "@babel/core": "^7.29.0",
    "@babel/preset-env": "^7.18.6"
  }
}
```

### `src/lib/components/Table.js`

```jsx
import React from 'react';
import './table.css';

const Table = ({
  columns,
  url,
  cellPadding = 0,
  cellSpacing = 0,
  className = 'rst-table',
  tableBorder = 0,
  isSearchable = false,
  isSelectable = false,
}) => {
  const [data, setData] = React.useState([]);
  const [cashData, setCashData] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [localColumns, setLocalColumns] = React.useState(columns);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isAllSelected, setIsAllSelected] = React.useState(false);

  // --- large block of commented-out code (lines 24-51) ---

  for (let column of columns) {
    if (column?.isVisible === undefined) {
      column.isVisible = true;
    }
    if (column?.isSelectable === undefined) {
      column.isSelectable = isSelectable;
    }
  }

  console.log(columns);

  const sortable = (column) => {
    const isAsc = column?.sortAsc === true;
    if (isAsc) {
      column.sortAsc = false;
    } else {
      column.sortAsc = true;
    }
    const sortedData = [...data].sort((a, b) => {
      const isNumber = !isNaN(a[column.path]);
      if (isNumber) {
        return a[column.path] - b[column.path];
      } else {
        return a[column.path].toUpperCase() === b[column.path].toUpperCase()
          ? 0
          : a[column.path].toUpperCase() > b[column.path].toUpperCase()
          ? 1
          : -1;
      }
    });
    setData(isAsc ? sortedData : sortedData.reverse());
  };

  const sortableColumn = (column) => {
    if (column.sortable) {
      return (
        <React.Fragment>
          <span>{column.label}</span>
          <button onClick={() => sortable(column)} className="rst-btn rst-sort-btn">
            <span className="sort-icon">
              {column.sortAsc === undefined && (
                <img className="rst-sort" alt="sort" src="./images/sort.png" />
              )}
              {column.sortAsc !== undefined && (
                <img className="rst-sort" alt="sort"
                  src={column.sortAsc ? './images/down.png' : './images/up.png'} />
              )}
            </span>
          </button>
        </React.Fragment>
      );
    } else {
      return <span>{column.label}</span>;
    }
  };

  const ColumnControler = () => { /* ... menu toggle with checkbox list ... */ };

  const ListComponent = ({ data }) => {
    return (
      <React.Fragment>
        {data.map((item) => {
          return (
            <tr key={item.id} className={`tr-${item.id}${item.isSelected ? ' selected' : ''}`}>
              {console.log('item :::', item)}
              {isSelectable && (
                <td align="center">
                  <input type="checkbox" checked={item.isSelected}
                    onChange={() => { handleSelect(item.id); }} />
                </td>
              )}
              {localColumns.map((column) => {
                if (column.isVisible) {
                  return (
                    <td key={column.key}
                      className={`td-${getDefaultClassName(column.className)} ${column.className}`}>
                      {column.formatter ? column.formatter(item[column.path]) : item[column.path]}
                    </td>
                  );
                } else { return null; }
              })}
            </tr>
          );
        })}
      </React.Fragment>
    );
  };

  React.useEffect(() => {
    async function fetchData() {
      const response = await fetch(url);
      const json = await response.json();
      for (let item of json) {
        if (item?.isSelected === undefined) { item.isSelected = false; }
      }
      setData([...json]);
      setCashData([...json]);
    }
    fetchData();
  }, [url]);

  const getDefaultClassName = (className) => {
    return className.indexOf(' ') ? className.split(' ')[0] : className;
  };

  const handleSearch = (text) => { /* ... search logic with ids ... */ };
  const handleSelectAll = () => { /* ... toggle all ... */ };
  const handleSelect = (id) => { /* ... toggle one ... */ };
  const checkIsAllSelected = () => { /* ... check logic ... */ };

  return (
    <>
      {isSearchable && ( /* search input + column controller */ )}
      {console.log('data :::', data)}
      {data.length > 0 && (
        <table cellPadding={cellPadding} cellSpacing={cellSpacing}
          className={['rst-table', className].join(' ')} border={tableBorder}>
          {/* thead + tbody */}
        </table>
      )}
    </>
  );
};

export default Table;
```

### `src/lib/components/table.css`

```css
.rst-table { border-collapse: collapse; border-spacing: 0; width: 100%; }
.rst-sort-btn { cursor: pointer; color: #666; font-size: 12px; font-weight: bold; padding: 0 5px; border: 1px solid #ccc; border-radius: 3px; margin-left: 5px; }
[class^='th-'], [class^='td-'] { padding: 15px; }
.rst-action-container { display: flex; align-items: center; justify-content: flex-end; padding: 15px; }
.rst-column-controller { position: relative; display: inline-block; padding: 0px 15px; }
.rst-btn { padding-top: 5px; background: #fff; border: 1px solid; }
.rst-controller-list { position: absolute; top: 15px; right: 0; background: #fff; border: 1px solid #ccc; border-radius: 3px; padding: 5px; z-index: 1; }
.rst-controller-list li { display: block; padding: 5px; min-width: 100px; list-style-type: none; border-bottom: 1px solid #ccc; }
.hide { display: none; }
.selected td { background: #f5f5f5; }
```

### `src/App.js` (Demo)

```jsx
import React from 'react';
import Table from './lib/components/Table';

function App() {
  const queryParams = (params) => {
    return [...params, (params['key'] = 'value')];
  };

  return (
    <React.Fragment>
      <h1>React Light Table Example</h1>
      <Table
        className="table-class kedar-table"
        tableBorder="1"
        columns={[ /* 6 column definitions */ ]}
        isSearchable={true}
        isSelectable={true}
        pageSize={25}
        pageList={[25, 50]}
        queryParams={queryParams}
        url={'https://jsonplaceholder.typicode.com/users'}
      />
    </React.Fragment>
  );
}

export default App;
```

---

*End of Codex Prompt. Follow every instruction precisely. Do not skip any bug fix or task.*
