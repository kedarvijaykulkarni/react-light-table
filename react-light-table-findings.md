# Findings — issues faced in RidgeHQAPP due to `@kedman1234/react-light-table`

<!-- Compiled from open + closed GitHub issues/PRs on RidgeHQAPP/RidgeHQAPP and from
     in-repo workarounds (globals.css, e2e/a11y.spec.ts, pnpm patch, dev-reference wiki).
     This is a findings document only. Do NOT open GitHub issues from this file. -->

Package under review: **`@kedman1234/react-light-table@2.1.1`** (aliased in the codebase as
`DataTable`, `apps/web/src/components/ui/DataTable.tsx`). Vendor source is **not** in this
repo; every fix so far has been a `pnpm patch` or a CSS/e2e-level workaround.

## Index of findings

| # | Source | State | WCAG / area | One-line |
|---|--------|-------|-------------|----------|
| F1 | Issue #60, PR #76 | CLOSED (fixed via pnpm patch) | 4.1.2 `aria-allowed-attr` | `aria-sort` rendered on the sort `<button>`, not the `<th>` |
| F2 | Issue #78 | OPEN | 2.5.8 `target-size` | Every `<td>` is an independent `gridcell tabindex=0` with zero inter-column gap |
| F3 | Issue #64, PR #79 | OPEN (FAB fix merged, suppressions remain) | 2.5.8 `target-size` | Table target-size failure mis-diagnosed as Copilot FAB overlap |
| F4 | Issue #8, PR #10 | CLOSED | 1.4.3 contrast / theming | Package hardcodes `#fff` backgrounds → unreadable in dark mode |
| F5 | Issue #62, PR #77 + wiki §12 | CLOSED | 1.4.1 / 1.4.3 | `TableAction` row-action hover tint collides with `--rlt-row-hover-bg` (both `--sky`) |
| F6 | `globals.css` workarounds | Carried (not ticketed) | 2.5.8 / layout | 16×16px row-select checkboxes; `.rlt-pagination` hardcodes `padding:12px 0` |
| F7 | `dist/index.esm.js` inspection | Latent (not yet hit) | correctness | Silent caps: sort > 100k rows, search query > 200 chars, cell value > 10k chars |
| F8 | `dist/index.esm.js` inspection | Latent | correctness | Built-in `url=` fetch mode: http/https only, 30s timeout, 10MB cap, must be JSON array |

---

## F1 — `aria-sort` placed on the sort `<button>` instead of the `<th>`

### Summary
`@kedman1234/react-light-table` v2.1.1 renders `aria-sort` on **both** the
`<th role="columnheader">` (correct) **and** its child `.rlt-sort-btn` `<button>`
(invalid — `aria-sort` is only allowed on a `columnheader`/`rowheader`). axe-core
flags a critical `aria-allowed-attr` violation on every sortable column, on every
admin page that uses `DataTable`. Reference: issue #60, fixed in PR #76.

### Why this matters
`apps/web/CLAUDE.md` §5 mandates 0 A/AA axe violations per route group. This was a
tenant-wide primitive-level defect, not a single screen. It blocked the
authenticated axe coverage rollout (issues #38–#49) and forced an
`AxeBuilder.exclude('.rlt-sort-btn')` / `RLT_SORT_BUTTON` known-issue suppression
in **6 `describe` blocks** of `e2e/a11y.spec.ts`.

### Steps to reproduce
1. Environment: `apps/web` dev server, any `(admin)` list page with a sortable
   `DataTable` column (e.g. `/admin/catalog`).
2. Run `@axe-core/playwright` with the `wcag21aa` / `wcag22aa` tags against the page.
3. Inspect a sortable column header in DevTools.

### Expected behavior
`aria-sort` appears once, on the `<th role="columnheader">`. The inner sort
`<button>` carries only `aria-label` (e.g. "Sort by Name") and `type="button"`.

### Actual behavior
`aria-sort="none|ascending|descending"` is present on the `.rlt-sort-btn` `<button>`
as well as the `<th>`. axe: `aria-allowed-attr` — "ARIA attribute is not allowed:
aria-sort" — critical, one instance per sortable column.

### Logs / evidence
- Issue #60 body; PR #76 (`fix: react-light-table aria-sort belongs on th, not the sort button`), MERGED, commit `7355e75`.
- Patch file: `apps/web/patches/@kedman1234__react-light-table@2.1.1.patch` (edits `dist/index.js` + `dist/index.esm.js` to drop the redundant `aria-sort` from the button).
- Wired via `apps/web/pnpm-workspace.yaml` → `patchedDependencies`; re-applied on every `pnpm install`.

### Fix applied
`pnpm patch @kedman1234/react-light-table@2.1.1` → remove `aria-sort` from the
button node in both bundles → `pnpm patch-commit`. Removed all 6
`RLT_SORT_BUTTON` suppressions from `e2e/a11y.spec.ts`. Added a `DataTable`
regression test asserting `aria-sort` is on the `<th>` and never on `.rlt-sort-btn`.

### Secondary defect exposed while fixing
`Makefile`, `apps/web/Dockerfile`, and `WINDOWS-LOCAL-SETUP.md` still invoked
`npm install` / `npm ci`. `apps/web` has **no** `package-lock.json` (only
`pnpm-lock.yaml`), so those paths silently installed the **unpatched** vendor
package in Docker / CI / fresh local setup, defeating the patch. All were switched
to `pnpm` in the same PR. **Lesson: any future vendor patch is only as good as
every install path using pnpm.**

### Acceptance criteria / test plan
- [x] `pnpm install --force` re-applies the patch
- [x] axe `aria-allowed-attr` passes on `/admin/catalog` list view (the exact test named in #60)
- [x] `DataTable` regression test proves `aria-sort` removed from `.rlt-sort-btn`
- [x] `vitest run` green; `pnpm run lint` clean

---

## F2 — Dense gridcell layout fails WCAG 2.5.8 target-size

### Summary
`@kedman1234/react-light-table` renders **every** `<td>` as an independently
keyboard-focusable target: `role="gridcell" tabindex="0"`, packed edge-to-edge
with **zero gap** between adjacent columns. Narrow columns (numeric / action
columns, ~90–106px wide on `/admin/courses`) trip WCAG 2.5.8's 24×24px minimum
target-size / spacing rule purely from this adjacency, with nothing overlapping
them. Reference: issue #78 (OPEN).

### Why this matters
`apps/web/CLAUDE.md` §5 lists 2.5.8 as a hard WCAG 2.2 AA requirement. Because the
tab-stop model is baked into the vendor DOM, this affects every `DataTable` list
page with a narrow column. It is currently **suppressed** in `e2e/a11y.spec.ts`
for Courses (`COPILOT_OVERLAP_TARGET_SIZE`, `classContains: "rlt-td-text-right"`),
Register/Reports (`COPILOT_OVERLAP_REGISTER_ACTIONS`, `data-rlt-col="8"`), and
Spots (`COPILOT_OVERLAP_ACTIONS`, `data-rlt-col="3"`).

### Steps to reproduce
1. Sign in, open `/admin/courses` (default 10 rows/page) at a common desktop viewport.
2. Run `@axe-core/playwright` with the `wcag22aa` tag.
3. `target-size` fires on every visible row's narrow/action `<td>` — **including row 1**, nowhere near any fixed element.

### Expected behavior
Either the `<td>` is not itself a tab stop when it contains its own focusable
child, or adjacent narrow-column cells have ≥24px of mutual clickable spacing.

### Actual behavior
axe `target-size`: *"Element has insufficient space to its closest neighbors.
Safe clickable space has a diameter of 12.6px instead of at least 24px."*
`document.elementsFromPoint()` at the failing coordinates shows **no** overlapping
element — the failure is intrinsic to the cell grid, not an overlay.

### Logs / evidence
- Issue #78 body; `e2e/a11y.spec.ts` lines ~318–330, ~728–738, ~846–853 (known-issue comments).
- Dev-reference wiki `Frontend-Admin-UI-Standards.md` §12 (~lines 387–398).

### Suggested fix (not yet done — needs investigation)
- Remove `tabindex="0"` / `role="gridcell"` from `<td>`s that contain their own focusable child (button/link) — the redundant cell-level tab stop is likely what axe measures against neighbors.
- Or add a minimum horizontal gap/padding between adjacent narrow `<td>`s.
- Delivery mechanism: same `pnpm patch` approach as F1 (vendor source not in repo).

### Acceptance criteria / test plan
- [ ] axe `target-size` passes on `/admin/courses` + one other list page with the table's own cells (no overlay involved)
- [ ] Keyboard navigation across the table still works (arrow-key `data-rlt-row`/`data-rlt-col` roving still functions)
- [ ] `COPILOT_OVERLAP_TARGET_SIZE` / `COPILOT_OVERLAP_REGISTER_ACTIONS` / `COPILOT_OVERLAP_ACTIONS` suppressions removed from `e2e/a11y.spec.ts`

---

## F3 — Table target-size failure mis-diagnosed as Copilot FAB overlap

### Summary
Issue #64 originally attributed a `/admin/courses` `target-size` failure on the
last table rows to the fixed-position AI Copilot launcher (bottom-right FAB)
overlapping the action column. Investigation under issue #78 showed the real cause
is F2 (the table's own dense-gridcell model) — the FAB was not overlapping the
flagged cells at all (row 1 failed too). Reference: issues #64 (OPEN) + #78, PR #79.

### Why this matters
The mis-diagnosis meant the `e2e/a11y.spec.ts` suppressions were labelled with the
wrong root cause, and a reader could have removed them after the FAB fix and
regressed CI. Comments are now corrected but the suppressions must stay until F2
is actually fixed.

### Steps to reproduce
1. `/admin/courses`, 10 rows/page, viewport where the last row sits near the bottom.
2. Run axe `wcag22aa`. Note `target-size` fires.
3. `document.elementsFromPoint()` at the failing cell coordinates → nothing overlaps; run against row 1 (top of table) → also fails.

### Expected behavior
The FAB should never overlap scrollable list content (usability + 2.5.8), **and**
the table's own cells should pass 2.5.8 independently.

### Actual behavior
- FAB overlap: **real but separate** — fixed in PR #79 (`fix: reserve space for Copilot FAB so it never overlaps main-content`), which adds bottom padding to `#main-content` / `AdminLayout`.
- The axe `target-size` violation the suppressions cover **persists** after PR #79 because its cause is F2, not the FAB.

### Logs / evidence
Issue #78 "What I found" section; `e2e/a11y.spec.ts` corrected known-issue comments
(the `COPILOT_OVERLAP_*` constant names are now historical misnomers).

### Fix applied / outstanding
- [x] FAB no longer overlaps content (PR #79)
- [ ] Table cell `target-size` (tracked as F2 / issue #78)

---

## F4 — Package hardcodes `#fff` backgrounds → unreadable in dark mode

### Summary
The Staff table was unreadable in dark mode (issue #8). Two causes: (a) the
`DataTable` card path hardcoded `border-slate-200 bg-white`, which never adapts to
`.dark`; (b) **`@kedman1234/react-light-table` itself hardcodes several
button/menu backgrounds to `#fff`** instead of reading a CSS variable —
`.rlt-controller-list`, `.rlt-pagination-btn`, `.rlt-expand-btn`, `.rlt-export-btn`.
Reference: issue #8 (CLOSED), PR #10 + the 2026-08-22 `DataTable` token migration.

### Why this matters
Dark mode is a global app theme. Every table using column-visibility control,
pagination, row expansion, or CSV export renders white-on-dark chrome without an
explicit patch. `ClientsTable` only dodged it incidentally via `noCard` + its own
`bg-surface` wrapper.

### Steps to reproduce
1. `http://localhost:3000/admin/staff`, enable dark mode.
2. Observe: table area uses light/white row backgrounds and low-contrast text;
   the "Rows per page" bar and pagination buttons render white.
3. Compare with `/admin/clients` (correct in both themes).

### Expected behavior
All `DataTable` chrome (header, toolbar, rows, borders, checkboxes, badges,
pagination, links, action buttons) uses design tokens that flip for dark mode.

### Actual behavior
White row/control backgrounds with near-invisible text in dark mode.

### Fix applied
- Migrated `DataTable`'s card surface + rows-per-page bar + page-size select off hardcoded `border-slate-200` / `bg-white` / `text-slate-*` / `focus:ring-teal-400` onto `--surface` / `--border` / `--text*` / `--aqua` tokens.
- Added an explicit dark-mode override in `apps/web/src/app/globals.css` for the package's hardcoded-`#fff` nodes:
  ```css
  .dark .rlt-controller-list,
  .dark .rlt-pagination-btn,
  .dark .rlt-expand-btn,
  .dark .rlt-export-btn { background: var(--surface); color: var(--text); }
  ```
- Full `--rlt-*` theming variable map added to `:root` in `globals.css` (~lines 112–135), pointing every `--rlt-*` hook at an app token so no separate dark block is needed for the parts that *do* honour the variables.

### Acceptance criteria / test plan
- [x] Staff table readable in dark mode, matches `ClientsTable`
- [x] Still correct in light mode
- [x] Other admin tables on the same primitive checked
- [x] `npm --prefix apps/web run test` + `run lint` pass

---

## F5 — `TableAction` row-action hover tint collides with `--rlt-row-hover-bg`

### Summary
The shared row-action component (`TableAction`, used inside every `DataTable` row)
had a `primary`-variant hover of `hover:bg-sky` — the **same `--sky` token**
`@kedman1234/react-light-table` mixes into its own row-hover background
(`--rlt-row-hover-bg: color-mix(in srgb, var(--sky) 40%, transparent)`). Hovering a
row action was visually indistinguishable from the row underneath already being
hovered — a WCAG 1.4.1 (use of colour) / hover-affordance problem. A related token
contrast bug on `Badge` / `TableAction` `success|warning|danger` text
(2.14–2.79:1 on white) is issue #62. References: issue #62 (CLOSED) / PR #77;
dev-reference wiki §12 (~lines 266–300).

### Why this matters
`TableAction` is the standard action control in every admin list. A row-action
hover state that reads identically to the row wash means keyboard/mouse users get
no reliable "this control is focused/hovered" feedback. Also `muted`'s hover used
`hover:bg-surface-hover`, which is **not a defined Tailwind colour** — a silent
no-op.

### Actual behavior
- `TableAction` `primary` hover == `--rlt-row-hover-bg` hue → no visible change on hover over a hovered row.
- `TableAction` `muted` hover → no-op (undefined colour).
- `Badge` `success|warning|danger` and `TableAction` `danger|success` text on `--surface`/white: 2.14–2.79:1, far below AA 4.5:1 (issue #62).

### Fix applied
- `TableAction` hover switched to arbitrary-value `color-mix()` tints (e.g.
  `hover:bg-[color-mix(in_srgb,var(--primary)_15%,transparent)]`) — the same
  technique `--rlt-row-hover-bg` uses — giving `primary` a brand-hue tint distinct
  from the row wash and `muted` a real `--border`-based tint. Added
  `hover:shadow-sm` so hover also reads via elevation, not colour alone.
- Issue #62: added `--status-{success,warning,danger}-text` tokens (light
  `#15803d` / `#b45309` / `#b91c1c`, 5.0–6.5:1 on white) used **only** for text;
  background tints/borders keep the vivid tokens. Codex review caught that the
  darker text + existing 15% hover `color-mix()` dropped two variants just under
  4.5:1 — hover mix lowered to 8% for those two only.
- Regression-guarded in `TableAction.test.tsx` / `Badge.test.tsx`.

---

## F6 — CSS-level workarounds carried for package layout/target-size defects

### Summary
`apps/web/src/app/globals.css` carries standing overrides for vendor DOM the
package emits with fixed, non-tokenised values. Not individually ticketed, but
each is a real package defect the app has to paper over.

### Findings
1. **Row-select checkboxes render at 16×16px** — below the WCAG 2.5.8 (2.2 AA)
   24×24px minimum. Override:
   ```css
   .rlt-select-cell input[type="checkbox"] { width: 24px; height: 24px; }
   ```
2. **`.rlt-pagination` hardcodes `padding: 12px 0`** (no horizontal inset), so the
   "Showing X–Y of Z results" text and page buttons sit flush to the card edge
   instead of aligning with the cells' 1rem inset. Override adds
   `padding-left/right: 1rem`.
3. **`#fff` hardcoded control backgrounds** — see F4.
4. **`--rlt-row-hover-bg` is built from `--sky`** — see F5 (token collision with
   `TableAction`).

### Why this matters
Every one of these is invisible until a `pnpm install` / package bump silently
changes the vendor bundle out from under the override. They should be revisited
whenever `@kedman1234/react-light-table` is upgraded, and ideally folded into the
`pnpm patch` alongside F1/F2.

### Acceptance criteria / test plan
- [ ] On the next package bump, re-verify each override still targets a real class and is still needed
- [ ] Consider moving the checkbox-size and pagination-padding fixes into the vendor patch so they travel with the dependency

---

## F7 — Silent correctness caps in the bundled hooks

### Summary
Reading `apps/web/patches/@kedman1234__react-light-table@2.1.1.patch` /
`dist/index.esm.js`, the bundled `useSort` / `useSearch` helpers apply hard limits
and **fail silently / degrade** rather than erroring. Not yet hit in RidgeHQAPP,
but latent for large tenants or pasted search input.

### Findings
| Behaviour | Threshold | What happens |
|---|---|---|
| `useSort` on a large dataset | `> 100,000` rows | Returns **unsorted** data, only a `console.warn("[useSort] Dataset has N rows which exceeds the 100000-row sort limit. Returning unsorted data.")` |
| `useSearch` query string | `> 200` chars | Filter is skipped — returns the full unfiltered set (`searchTruncated` flag is set but nothing surfaces it in `DataTable`) |
| Cell value coercion for sort/search compare | `> 10,000` chars | Value is truncated to 10k before `localeCompare` / `includes` |
| Sort key validation | key must match `/^\w+$/` and not `__`/`prototype`/`constructor` | **Throws** `Error("Invalid sort key: ...")` — a column whose `path` contains a `.`, `-`, or space will crash the table on sort |

### Why this matters
The sort-key regex (`/^\w+$/`) is the sharp edge: any `column.path` with a dot
(nested field), dash, or space throws at sort time, not at render time. The 100k
sort cap and 200-char search cap degrade quietly — a reports/export view over a
big tenant would appear to "ignore" the sort with no user-visible signal.

### Suggested follow-up
- Add a dev-time assertion or lint that every `DataTable` `columns[].path` matches `/^\w+$/`.
- If a nested/hyphenated path is ever needed, that's a vendor-patch item.
- Consider surfacing `searchTruncated` in the `DataTable` wrapper (helper text: "search term too long").

---

## F8 — Built-in `url=` fetch mode constraints

### Summary
`Table` supports a `url` prop (fetch data itself instead of receiving `data`).
RidgeHQAPP always passes `data` (BFF pattern, `apps/web/CLAUDE.md` §3), so this is
informational — but if anyone reaches for `url=` it silently enforces:

- Scheme must be `http:` / `https:` → otherwise error `"Blocked URL scheme: ..."`.
- 30-second `AbortController` timeout → `"Request timed out"`.
- Response `Content-Type` must include `application/json` → else `"Invalid response content type"`.
- Response body `> 10,000,000` bytes → `"Response too large"`.
- Parsed JSON must be a top-level **array** → else `"Expected array response"`.

### Why this matters
The app's data path is the BFF (`src/hooks/`, TanStack Query) — using `url=` would
bypass auth cookies, the FastAPI proxy, and error handling conventions. **Do not
use `url=`; always pass `data`.** Documented here so a future contributor doesn't
discover the constraints the hard way.

---

## Related PRs / issues

| Ref | Title | State |
|---|---|---|
| #60 / PR #76 | `aria-sort` on `<th>` not the sort button | CLOSED / MERGED (`7355e75`) |
| #62 / PR #77 | Badge/TableAction status text contrast | CLOSED / MERGED (`63313d7`) |
| #64 | Copilot launcher overlaps table row actions | OPEN |
| #78 | DataTable dense gridcell fails 2.5.8 (mis-diagnosis of #64) | OPEN |
| PR #79 | Reserve space for Copilot FAB vs `#main-content` | MERGED |
| #8 / PR #10 | Staff table unreadable in dark mode | CLOSED / MERGED |
| #15 / #11 | Shared `TableAction` / `Badge` primitives (row-action + status chips wrapping the table) | CLOSED |
| #26 / PR #28 | Standardize dropdown/select (incl. `DataTable` "Rows per page") | CLOSED |
| #38–#49 | Authenticated axe coverage rollout — the effort that surfaced F1/F2/F3/F5 | mostly CLOSED |

Notes / runbook references:
- Vendor patch: `apps/web/patches/@kedman1234__react-light-table@2.1.1.patch`, wired via `apps/web/pnpm-workspace.yaml` `patchedDependencies`.
- Theming + workarounds: `apps/web/src/app/globals.css` (~lines 112–160).
- Known-issue suppressions: `apps/web/e2e/a11y.spec.ts` (`COPILOT_OVERLAP_*`).
- Design/architecture rationale: `Brain/RidgeHQAPP/wiki/development-reference/Architecture/Frontend-Admin-UI-Standards.md` §3, §12.

## Security / sensitive data
- No credentials, secrets, or PII involved in any finding.
- F8 note: `url=` fetch mode would bypass the app's httpOnly-cookie auth + BFF proxy — a reason not to use it, not an active vulnerability.

## Suggested labels
`frontend`, `accessibility`, `dependencies`

## Suggested consolidated follow-up (single vendor patch pass)
Fold into one `pnpm patch @kedman1234/react-light-table@2.1.1` bump:
- F2: drop redundant `tabindex="0"`/`role="gridcell"` on `<td>`s containing a focusable child (or add narrow-column spacing).
- F6.1: emit 24×24px row-select checkboxes.
- F6.2: give `.rlt-pagination` a horizontal inset variable.
- F6.3: replace hardcoded `#fff` control backgrounds with a `--rlt-*` variable.
- F7: relax the `useSort` sort-key regex or document the `/^\w+$/` constraint prominently.
Then remove the corresponding `globals.css` overrides and `e2e/a11y.spec.ts` suppressions.
