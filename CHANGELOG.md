# Changelog

All notable changes to `@kedman1234/react-light-table` are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## 2.2.0

Accessibility, theming and robustness fixes driven by defects found while
consuming the library in a WCAG 2.2 AA product. All changes are backward
compatible at the API level; two default DOM/behaviour changes are called
out under **Behaviour changes**.

### Fixed

- **`aria-sort` placement (WCAG 4.1.2).** `aria-sort` was rendered on both the
  `<th role="columnheader">` and its child `.rlt-sort-btn` `<button>`. It is
  only valid on a `columnheader`/`rowheader`, so axe-core flagged a critical
  `aria-allowed-attr` violation on every sortable column. It is now on the
  `<th>` only; the button keeps its `aria-label`.
- **Row-select checkbox size (WCAG 2.5.8).** The select-all and per-row
  checkboxes were fixed at 16×16px, below the 24×24px AA target-size minimum.
  They are now sized from `--rlt-checkbox-size` (default `24px`).
- **Hardcoded control backgrounds (WCAG 1.4.3).** `.rlt-controller-list`,
  `.rlt-pagination-btn`, `.rlt-export-btn` and `.rlt-expand-btn` hardcoded
  `background: #fff` and rendered white-on-dark in dark themes. They now read
  a new `--rlt-control-bg` token (default `#fff`).
- **Pagination inset.** `.rlt-pagination` hardcoded `padding: 12px 0`; the
  info text and page buttons sat flush to the card edge. Padding is now
  `var(--rlt-pagination-padding, 12px 16px)`.
- **`useSort` no longer throws on an unsupported sort key.** A column `path`
  containing a dot, dash or space failed the `/^\w+$/` guard and threw
  `Error("Invalid sort key")` from the click handler, crashing the host app.
  Rejected keys now log a warning and no-op. The prototype-pollution guard
  is unchanged.
- **Silent caps are now surfaced.** `useSort` returns `sortSkipped` when a
  dataset over 100,000 rows is left unsorted; `useSearch`'s existing
  `searchTruncated` (query over 200 chars) is now read by `<Table>`. Both
  render a visible `.rlt-notice` status message.

### Behaviour changes

- **Roving tabindex grid navigation (WCAG 2.5.8).** Previously every `<th>`
  and `<td>` was `tabIndex={0}`, putting every cell in the tab sequence;
  adjacent narrow columns then failed target-size, and cells with their own
  control had a redundant second tab stop. The grid now follows the ARIA APG
  roving-tabindex pattern: exactly one cell is tabbable, the rest are
  `tabIndex={-1}` and reached with the (unchanged) arrow keys. `Tab` now
  moves through the whole table in one stop instead of cell by cell.
  `role="grid"`/`"gridcell"` and the `data-rlt-*` coordinates are unchanged.

### Docs

- Documented the built-in `url=` fetch constraints, the sortable-column
  `path` constraint, the new CSS variables, and dark-mode / hover-affordance
  guidance in the README.
