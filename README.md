# @kedman1234/react-light-table

[![npm version](https://img.shields.io/npm/v/@kedman1234/react-light-table.svg)](https://www.npmjs.com/package/@kedman1234/react-light-table)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A lightweight, accessible, sortable, searchable, and selectable React table component for any dataset. Built with TypeScript, zero dependencies beyond React.

## Features

- 🔍 **Real-time search** — filter rows instantly across all visible columns
- ↕️ **Column sorting** — click to sort ascending/descending on any column
- ✅ **Row selection** — individual and select-all with callback support
- 📄 **Pagination** — built-in page navigation with customizable page size
- 👁️ **Column visibility** — toggle columns on/off via dropdown menu
- 📌 **Column pinning** — pin any column to the left or right edge via sticky positioning
- ⚡ **Row virtualization** — render thousands of rows efficiently (only visible rows in DOM)
- 🎛️ **Controlled props** — take full ownership of search, sort, page, and selection state
- 🎨 **Custom cell render** — return any JSX per cell with the `render` prop
- 🎨 **Theming** — full CSS custom properties for easy customization
- ♿ **Accessible** — ARIA roles, labels, and keyboard navigation
- 📦 **Lightweight** — small bundle, zero runtime dependencies
- 🔒 **TypeScript** — full type safety with generics support
- 🔄 **Dual data source** — works with local arrays or remote URLs

## Installation

```bash
npm install @kedman1234/react-light-table
```

**Note:** `react` (≥18.0.0) and `react-dom` (≥18.0.0) are required as peer dependencies.

## Quick Start

### With Local Data

```tsx
import { Table } from "@kedman1234/react-light-table";
import "@kedman1234/react-light-table/dist/table.css";

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

const columns = [
  { key: "name", path: "name", label: "Name", sortable: true },
  { key: "email", path: "email", label: "Email", sortable: true },
  { key: "age", path: "age", label: "Age", sortable: true },
];

const data: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com", age: 30 },
  { id: 2, name: "Bob", email: "bob@example.com", age: 25 },
];

function App() {
  return (
    <Table<User>
      columns={columns}
      data={data}
      rowKey="id"
      isSearchable
      isSelectable
      pageSize={10}
      bordered
      striped
    />
  );
}
```

### With Remote URL

```tsx
<Table<User>
  columns={columns}
  url="https://jsonplaceholder.typicode.com/users"
  rowKey="id"
  isSearchable
  emptyMessage="No users found"
  errorMessage="Failed to load users"
/>
```

## API Reference

### `<Table>` Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `ColumnDef<T>[]` | _required_ | Column definitions array |
| `data` | `T[]` | — | Local data array (takes priority over `url`) |
| `url` | `string` | — | Remote data URL (triggers fetch) |
| `rowKey` | `keyof T & string` | `'id'` | Field to use as unique row identifier |
| `className` | `string` | `''` | Additional CSS class(es) for the table |
| `isSearchable` | `boolean` | `false` | Show search input |
| `isSelectable` | `boolean` | `false` | Show selection checkboxes |
| `searchableFields` | `string[]` | all visible columns | Which column paths to search |
| `pageSize` | `number` | — | Rows per page (omit to show all) |
| `loading` | `boolean` | `false` | External loading state control |
| `emptyMessage` | `string \| ReactNode` | `'No data available'` | Empty state message |
| `errorMessage` | `string \| ReactNode` | `'Failed to load data'` | Error state message |
| `stickyHeader` | `boolean` | `false` | Sticky table header |
| `striped` | `boolean` | `false` | Striped row styling |
| `bordered` | `boolean` | `false` | Bordered table styling |
| `virtualized` | `boolean` | `false` | Enable row virtualization (only visible rows rendered) |
| `onSelectionChange` | `(rows: T[]) => void` | — | Callback when selection changes |
| `onSort` | `(column, direction) => void` | — | Callback when sort changes |
| `onPageChange` | `(page: number) => void` | — | Callback when page changes |

**Controlled props** — when provided, the component defers state management to the parent:

| Prop | Type | Paired callback | Description |
|---|---|---|---|
| `searchValue` | `string` | `onSearchChange` | Controlled search text |
| `onSearchChange` | `(text: string) => void` | — | Called on every search input change |
| `sortState` | `SortState` | `onSortChange` | Controlled sort state |
| `onSortChange` | `(state: SortState) => void` | — | Called when user clicks a sort button |
| `page` | `number` | `onPageChange` | Controlled current page (1-based) |
| `selectedRows` | `T[]` | `onSelectionChange` | Controlled selected rows |

### Column Definition (`ColumnDef<T>`)

| Property | Type | Required | Description |
|---|---|---|---|
| `key` | `string` | ✅ | Unique column identifier |
| `path` | `keyof T & string` | ✅ | Data object property to display |
| `label` | `string` | ✅ | Column header text |
| `sortable` | `boolean` | ❌ | Enable sorting for this column |
| `isVisible` | `boolean` | ❌ | Initial visibility (default: `true`) |
| `className` | `string` | ❌ | CSS class for column cells |
| `pin` | `'left' \| 'right'` | ❌ | Pin column to the left or right edge |
| `formatter` | `(value, row) => ReactNode` | ❌ | Simple cell transform (string/number output) |
| `render` | `(value, row) => ReactNode` | ❌ | Full JSX cell renderer — takes precedence over `formatter` |

### `SortState` type

```ts
interface SortState {
  key: string;
  direction: 'asc' | 'desc' | 'none';
}
```

## Examples

### Custom Cell Renderer (`render` prop)

Use `render` when you need full JSX control over a cell — badges, links, buttons, icons:

```tsx
const columns = [
  {
    key: "status",
    path: "status",
    label: "Status",
    render: (value, row) => (
      <span style={{ color: value === "active" ? "green" : "red", fontWeight: 600 }}>
        {String(value).toUpperCase()}
      </span>
    ),
  },
];
```

Use `formatter` for simple string transforms (value → string):

```tsx
{
  key: "salary",
  path: "salary",
  label: "Salary",
  formatter: (value) => `$${Number(value).toLocaleString()}`,
}
```

### Column Pinning

Pin columns to the left or right so they remain visible during horizontal scroll:

```tsx
const columns = [
  { key: "id", path: "id", label: "ID", pin: "left" },
  { key: "name", path: "name", label: "Name", pin: "left" },
  // ... scrollable middle columns ...
  { key: "status", path: "status", label: "Status", pin: "right" },
];

<Table
  columns={columns}
  data={data}
  rowKey="id"
  bordered
/>
```

Use the CSS custom properties to adjust pinned-column appearance:

```css
:root {
  --rlt-pin-cell-bg: #fff;         /* pinned body cell background */
  --rlt-pin-header-bg: #f8f9fa;    /* pinned header cell background */
  --rlt-pin-shadow-left: 2px 0 6px rgba(0, 0, 0, 0.15);
  --rlt-pin-shadow-right: -2px 0 6px rgba(0, 0, 0, 0.15);
}
```

### Row Virtualization

Render large datasets efficiently — only visible rows (+ 10 buffer rows) are in the DOM:

```tsx
<Table
  columns={columns}
  data={largeDataset}   // e.g. 10 000 rows
  rowKey="id"
  virtualized
  stickyHeader
/>
```

Control the visible container height via CSS:

```css
:root {
  --rlt-virtual-height: 600px;   /* default: 400px */
}
```

### Controlled Props

Take full ownership of search, sort, page, and selection — useful for URL-synced tables or server-side data:

```tsx
import { useState } from "react";
import { Table } from "@kedman1234/react-light-table";
import type { SortState } from "@kedman1234/react-light-table";

function MyTable() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "", direction: "none" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User[]>([]);

  return (
    <Table<User>
      columns={columns}
      data={data}
      rowKey="id"
      isSelectable
      pageSize={20}
      searchValue={search}
      onSearchChange={setSearch}
      sortState={sort}
      onSortChange={setSort}
      page={page}
      onPageChange={setPage}
      selectedRows={selected}
      onSelectionChange={setSelected}
    />
  );
}
```

Each controlled dimension is independent — you can control just `searchValue` and leave the rest uncontrolled.

### Selection Callback

```tsx
<Table
  columns={columns}
  data={data}
  isSelectable
  onSelectionChange={(selected) => {
    console.log("Selected rows:", selected);
  }}
/>
```

### Pagination

```tsx
<Table
  columns={columns}
  data={data}
  pageSize={25}
  onPageChange={(page) => {
    console.log("Current page:", page);
  }}
/>
```

## Theming with CSS Variables

Customize the entire look using CSS custom properties:

```css
:root {
  --rlt-font-family: "Inter", sans-serif;
  --rlt-header-bg: #1a1a2e;
  --rlt-header-color: #eee;
  --rlt-row-hover-bg: #f0f4ff;
  --rlt-row-selected-bg: #d4edff;
  --rlt-border-color: #e0e0e0;
  --rlt-sort-icon-color: #999;
  --rlt-sort-active-color: #1a73e8;
  --rlt-search-border-color: #ccc;
  --rlt-search-focus-border: #1a73e8;
  --rlt-pagination-active-bg: #1a73e8;
  --rlt-pagination-active-color: #fff;
  --rlt-cell-padding: 10px 14px;
}
```

### Available CSS Variables

| Variable | Default | Description |
|---|---|---|
| `--rlt-font-family` | `inherit` | Font family |
| `--rlt-font-size` | `14px` | Base font size |
| `--rlt-header-bg` | `#f8f9fa` | Header background |
| `--rlt-header-color` | `#333` | Header text color |
| `--rlt-header-font-weight` | `600` | Header font weight |
| `--rlt-row-hover-bg` | `#f5f5f5` | Row hover background |
| `--rlt-row-selected-bg` | `#e3f2fd` | Selected row background |
| `--rlt-row-striped-bg` | `#fafafa` | Striped row background |
| `--rlt-border-color` | `#dee2e6` | Border color |
| `--rlt-sort-icon-color` | `#666` | Sort icon color |
| `--rlt-sort-active-color` | `#333` | Active sort icon color |
| `--rlt-search-border-color` | `#ccc` | Search input border |
| `--rlt-search-focus-border` | `#4a90d9` | Search input focus border |
| `--rlt-cell-padding` | `12px 15px` | Cell padding |
| `--rlt-pagination-active-bg` | `#4a90d9` | Active page button bg |
| `--rlt-pagination-active-color` | `#fff` | Active page button color |
| `--rlt-virtual-height` | `400px` | Virtualized scroll container height |
| `--rlt-pin-cell-bg` | `inherit` | Pinned body cell background |
| `--rlt-pin-header-bg` | `#f8f9fa` | Pinned header cell background |
| `--rlt-pin-shadow-left` | `2px 0 5px rgba(0,0,0,0.12)` | Pinned left column shadow |
| `--rlt-pin-shadow-right` | `-2px 0 5px rgba(0,0,0,0.12)` | Pinned right column shadow |

## Exported Hooks

The library also exports the internal hooks for advanced use cases:

- `useSort<T>(data, onSort?, sortState?, onSortChange?)` — Sort state management
- `useSearch<T>(data, searchableFields?, searchValue?, onSearchChange?)` — Search/filter logic
- `useSelection<T>(data, rowKey, onSelectionChange?, selectedRows?)` — Selection management
- `usePagination<T>(data, pageSize?, onPageChange?, page?)` — Pagination logic

Each hook supports the same controlled/uncontrolled pattern as the `<Table>` component.

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Install dependencies: `npm install`
4. Run the demo: `npm run dev`
5. Run tests: `npm test`
6. Commit your changes: `git commit -m 'Add my feature'`
7. Push to the branch: `git push origin feature/my-feature`
8. Open a Pull Request

## License

[MIT](LICENSE) © Kedar Vijay Kulkarni
