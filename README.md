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

| Prop                | Type                          | Default                 | Description                                  |
| ------------------- | ----------------------------- | ----------------------- | -------------------------------------------- |
| `columns`           | `ColumnDef<T>[]`              | _required_              | Column definitions array                     |
| `data`              | `T[]`                         | —                       | Local data array (takes priority over `url`) |
| `url`               | `string`                      | —                       | Remote data URL (triggers fetch)             |
| `rowKey`            | `keyof T & string`            | `'id'`                  | Field to use as unique row identifier        |
| `className`         | `string`                      | `''`                    | Additional CSS class(es) for the table       |
| `isSearchable`      | `boolean`                     | `false`                 | Show search input                            |
| `isSelectable`      | `boolean`                     | `false`                 | Show selection checkboxes                    |
| `searchableFields`  | `string[]`                    | all visible columns     | Which column paths to search                 |
| `pageSize`          | `number`                      | —                       | Rows per page (omit to show all)             |
| `onSelectionChange` | `(rows: T[]) => void`         | —                       | Callback when selection changes              |
| `onSort`            | `(column, direction) => void` | —                       | Callback when sort changes                   |
| `onPageChange`      | `(page: number) => void`      | —                       | Callback when page changes                   |
| `loading`           | `boolean`                     | `false`                 | External loading state control               |
| `emptyMessage`      | `string \| ReactNode`         | `'No data available'`   | Empty state message                          |
| `errorMessage`      | `string \| ReactNode`         | `'Failed to load data'` | Error state message                          |
| `stickyHeader`      | `boolean`                     | `false`                 | Sticky table header                          |
| `striped`           | `boolean`                     | `false`                 | Striped row styling                          |
| `bordered`          | `boolean`                     | `false`                 | Bordered table styling                       |

### Column Definition (`ColumnDef<T>`)

| Property    | Type                        | Required | Description                          |
| ----------- | --------------------------- | -------- | ------------------------------------ |
| `key`       | `string`                    | ✅       | Unique column identifier             |
| `path`      | `keyof T & string`          | ✅       | Data object property to display      |
| `label`     | `string`                    | ✅       | Column header text                   |
| `sortable`  | `boolean`                   | ❌       | Enable sorting for this column       |
| `isVisible` | `boolean`                   | ❌       | Initial visibility (default: `true`) |
| `className` | `string`                    | ❌       | CSS class for column cells           |
| `formatter` | `(value, row) => ReactNode` | ❌       | Custom cell renderer                 |

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

| Variable                        | Default     | Description               |
| ------------------------------- | ----------- | ------------------------- |
| `--rlt-font-family`             | `inherit`   | Font family               |
| `--rlt-font-size`               | `14px`      | Base font size            |
| `--rlt-header-bg`               | `#f8f9fa`   | Header background         |
| `--rlt-header-color`            | `#333`      | Header text color         |
| `--rlt-header-font-weight`      | `600`       | Header font weight        |
| `--rlt-row-hover-bg`            | `#f5f5f5`   | Row hover background      |
| `--rlt-row-selected-bg`         | `#e3f2fd`   | Selected row background   |
| `--rlt-row-striped-bg`          | `#fafafa`   | Striped row background    |
| `--rlt-border-color`            | `#dee2e6`   | Border color              |
| `--rlt-sort-icon-color`         | `#666`      | Sort icon color           |
| `--rlt-sort-active-color`       | `#333`      | Active sort icon color    |
| `--rlt-search-border-color`     | `#ccc`      | Search input border       |
| `--rlt-search-focus-border`     | `#4a90d9`   | Search input focus border |
| `--rlt-cell-padding`            | `12px 15px` | Cell padding              |
| `--rlt-pagination-active-bg`    | `#4a90d9`   | Active page button bg     |
| `--rlt-pagination-active-color` | `#fff`      | Active page button color  |

## Examples

### Custom Formatter

```tsx
const columns = [
  {
    key: "status",
    path: "status",
    label: "Status",
    formatter: (value) => (
      <span style={{ color: value === "active" ? "green" : "red" }}>
        {String(value).toUpperCase()}
      </span>
    ),
  },
];
```

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

## Exported Hooks

The library also exports the internal hooks for advanced use cases:

- `useSort<T>(data, onSort?)` — Sort state management
- `useSearch<T>(data, searchableFields?)` — Search/filter logic
- `useSelection<T>(data, rowKey, onSelectionChange?)` — Selection management
- `usePagination<T>(data, pageSize?, onPageChange?)` — Pagination logic

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
