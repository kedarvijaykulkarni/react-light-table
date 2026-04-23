# 🛡️ ANTIGRAVITY / CLAUDE CODE — SNYK SECURITY REMEDIATION PROMPT
## Project: `@kedman1234/react-light-table` · Package Audit & Hardening

---

## CONTEXT

You are working on a **React TypeScript component library** (`react-light-table`) that exposes a
sortable, searchable, selectable, paginated `<Table>` component.

The project currently uses **outdated dev dependencies** (inherited from a Create React App /
`react-scripts@5.0.1`-era lockfile) that carry **66+ transitive Snyk vulnerabilities**, many
at Critical (CVSS 9.x) and High severity.

The current `package.json` is already partially upgraded (uses Vite + Rollup + Vitest), but the
`package-lock.json` still pulls in vulnerable transitive packages from the old tool chain. Your
job is to **fully remediate all vulnerabilities without breaking any existing functionality or
tests**, and to **add stress / robustness tests** for the most security-relevant paths.

---

## FILE INVENTORY (checked out at project root)

```
src/
  Table/
    Table.tsx            # Main component
    Table.types.ts       # TypeScript interfaces
    Table.test.tsx       # Existing Vitest test suite (must all continue to pass)
    table.css
  hooks/
    usePagination.ts
    useSearch.ts
    useSelection.ts
    useSort.ts
  utils/
    helpers.ts
  index.ts
  setupTests.ts
package.json             # Already on Vite/Rollup/Vitest toolchain
package-lock.json        # STALE — still references react-scripts transitive graph
```

---

## PHASE 1 — PACKAGE.JSON & DEPENDENCY AUDIT

### 1.1  Remove the create-react-app / react-scripts heritage entirely

The `package-lock.json` carries the old CRA transitive graph. Purge it and regenerate:

```bash
rm -f package-lock.json
rm -rf node_modules
```

### 1.2  Pin devDependencies to the latest non-vulnerable versions

Update `package.json` `devDependencies` to **at minimum** these versions (bump further if a
newer non-breaking patch exists at the time you run this):

| Package | Minimum safe version | Vulnerability fixed |
|---|---|---|
| `@testing-library/jest-dom` | `^6.9.1` | Removes jest-dom@5 transitive chain |
| `@testing-library/react` | `^16.3.0` | Removes RTL@13 (react-scripts peer) |
| `@testing-library/user-event` | `^14.6.1` | Removes UE@13 |
| `rollup` | `^4.40.0` | Fixes Directory Traversal CVE (rollup@2.79.1 CWE-22 CVSS 8.5) + XSS |
| `vite` | `^6.3.2` | Fixes webpack-dev-middleware path traversal, origin validation |
| `vitest` | `^3.1.1` | Picks up vite@6 |
| `typescript` | `^5.7.3` | Latest stable |
| `react` / `react-dom` (dev) | `^19.2.5` | Latest stable |
| `@rollup/plugin-commonjs` | `^28.0.3` | — |
| `@rollup/plugin-node-resolve` | `^16.0.1` | — |
| `@rollup/plugin-typescript` | `^12.1.2` | — |
| `@rollup/plugin-terser` | `^1.0.0` | Removes serialize-javascript@6 (Arbitrary Code Injection CVSS 7.7) |
| `jsdom` | `^26.1.0` | Removes old jsdom transitive chain |

> **Do NOT add `react-scripts`, `webpack`, `babel`, `ajv@6`, `lodash`, `qs`, `flatted`,
> `node-forge`, `cross-spawn`, `minimatch@3`, `braces@3.0.2`, `nth-check@1.0.2`,
> `ws@8`, `http-proxy-middleware@2`, `follow-redirects@1.15`, `form-data@3`,
> `postcss@8.4.27`, or `svgo@2` as direct or peer deps.** These are all
> vulnerable packages from the CRA graph.

### 1.3  Install and verify

```bash
npm install
npm audit
```

**Acceptance criterion**: `npm audit` reports **0 critical, 0 high** vulnerabilities.
Medium/low issues from dev-only packages with no known exploit path are acceptable IF you
document them and they are not fixable without breaking the build.

### 1.4  Confirm the full build still passes

```bash
npm run lint     # tsc --noEmit
npm run build    # rollup -c
npm test         # vitest run
```

All must exit 0.

---

## PHASE 2 — SOURCE-LEVEL SECURITY HARDENING

The following hardening changes must be made to the source files. **Preserve all existing
public API signatures** — this is a published library.

### 2.1  `src/Table/Table.tsx` — URL fetch hardening (mitigates SSRF, open-redirect, header injection)

Replace the bare `fetch(url)` call in the `useEffect` with a hardened version:

```typescript
// BEFORE (vulnerable — accepts any URL, no timeout, no content-type check)
const response = await fetch(url as string);
if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
const json: T[] = await response.json();

// AFTER — add all of the following guards:
```

Requirements for the new fetch implementation:
- **URL validation**: Parse the URL with `new URL(url)` and throw if the protocol is not
  `http:` or `https:`. This prevents `file://`, `data:`, `javascript:` SSRF vectors.
- **Timeout**: Use `AbortController` with a 30-second timeout. Abort and surface a
  "Request timed out" error if exceeded.
- **Content-Type guard**: After `response.ok`, check `response.headers.get('content-type')`
  contains `application/json` (case-insensitive). Throw `"Invalid response content type"` if not.
- **Array guard**: After `await response.json()`, verify the result is an `Array` with
  `Array.isArray(json)`. Throw `"Expected array response"` if not.
- **Size guard**: Limit responses to **10 MB** by consuming the body as text first
  (`await response.text()`), checking `text.length <= 10_000_000`, then `JSON.parse(text)`.
  Throw `"Response too large"` if exceeded. (Mitigates Allocation of Resources — CWE-770.)
- Keep the existing `cancelled` / `AbortController` cleanup pattern (cleanup both the
  component-unmount cancel flag AND the timeout abort).

### 2.2  `src/hooks/useSearch.ts` — ReDoS hardening (mitigates CWE-1333)

The current `searchText.toUpperCase()` + `.includes(query)` pattern is safe for plain-string
includes, but the search input is user-controlled and passed directly. Add the following:

- **Input length cap**: If `searchText.trim().length > 200`, skip filtering and return `data`
  unchanged. Surface this via a new optional return field `searchTruncated: boolean`.
- **Field value length cap**: When iterating fields, skip any individual cell value whose
  `String(value).length > 10_000` (prevents pathological string comparison on huge blob
  fields).

### 2.3  `src/hooks/useSort.ts` — DoS hardening

- **Data size guard**: If `data.length > 100_000`, log a `console.warn` and return `data`
  unsorted (with `sortState` reset to `INITIAL_SORT_STATE`). This prevents O(n log n) sort
  freezing the UI thread with adversarial payloads.
- **Key sanitisation**: Validate that `key` passed to `handleSort` is a non-empty string
  containing only word characters (`/^\w+$/`). Throw if invalid. This prevents prototype
  pollution via `__proto__` sort keys.

### 2.4  `src/hooks/useSelection.ts` — Prototype pollution hardening (mitigates CWE-1321)

- When reading `item[rowKey]`, use `Object.prototype.hasOwnProperty.call(item, rowKey)` before
  accessing. If the property does not exist as an own property, fall back to `String(index)`.
- In `handleSelectAll`, validate that `allKeys` is a plain array of strings with no element
  exceeding 512 characters. Silently filter out any invalid entries.

### 2.5  `src/utils/helpers.ts` — Input sanitisation

- `toComparableString`: Add a guard — if `String(value).length > 10_000`, return the first
  10,000 chars only, to prevent excessive memory allocation in sort/search.
- `getDefaultClassName`: Add a guard — reject (return `''`) any `className` that contains
  characters outside `[\w\s\-]` (i.e. no `<`, `>`, `"`, `'`, `{`, `}`). This prevents
  CSS-injection via column `className` props.

---

## PHASE 3 — NEW TEST CASES

Add the following test blocks to `src/Table/Table.test.tsx`. **Do not remove or modify any
existing tests** — only append. All new tests must use the existing Vitest + RTL setup.

### 3.1  Security / Hardening Tests (`describe('Security Hardening', ...)`)

```
describe('Security Hardening', () => {
```

Add the following `it(...)` cases:

#### Fetch URL validation
- `'rejects non-http/https URL schemes'` — pass `url="file:///etc/passwd"` to `<Table>`;
  verify the error state is rendered (error message shown, no data rendered).
- `'rejects javascript: URL scheme'` — same with `url="javascript:alert(1)"`.
- `'rejects data: URL scheme'` — same with `url="data:text/plain,hello"`.

#### Fetch timeout
- `'shows error when fetch times out'` — mock `fetch` to return a promise that never
  resolves; advance fake timers by 31 seconds (`vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync`);
  verify error state renders.

#### Fetch content-type guard
- `'shows error when response is not JSON content-type'` — mock `fetch` to return
  `{ ok: true, status: 200, headers: { get: () => 'text/html' }, text: () => Promise.resolve('<html/>') }`;
  verify error state renders.

#### Fetch array guard
- `'shows error when response is a JSON object not an array'` — mock fetch to resolve with
  `{ ok: true, ..., text: () => Promise.resolve('{"users":[]}') }`; verify error.
- `'shows error when response exceeds size limit'` — mock fetch to resolve with a 10 MB + 1 byte
  string (`'x'.repeat(10_000_001)`); verify error.

#### Search ReDoS / length cap
- `'does not filter when searchText exceeds 200 chars'` — type a 201-character string into
  the search input; verify all rows are still visible (cap active).
- `'handles very long cell values without hanging'` — render table with one cell containing a
  100 KB string; search for 'a'; verify renders without timeout (use `{ timeout: 2000 }` in
  `waitFor`).

#### Sort key sanitisation
- `'handleSort ignores non-word sort keys'` — directly call `handleSort('__proto__')` via
  testing the hook with `renderHook`; verify it throws or no prototype is mutated and
  `Object.getPrototypeOf({})` is unchanged.

#### Prototype pollution via rowKey
- `'does not follow __proto__ as rowKey'` — render with `rowKey="__proto__" as any`; verify
  the component renders the empty/error state or falls back to index keys without throwing.

#### className injection
- `'sanitises dangerous className values'` — render with a column whose `className` is
  `'"><script>alert(1)</script>'`; verify no `<script>` tag appears in the DOM
  (`document.querySelector('script')`).

### 3.2  Stress Tests (`describe('Stress Tests', ...)`)

```
describe('Stress Tests', () => {
```

#### Large dataset rendering
- `'renders 10,000 rows with pagination without timeout'` — generate 10 000-item array;
  render with `pageSize={100}`; expect first page renders in under 3 s (use `performance.now()`).
- `'renders 1,000 rows without pagination without timeout'` — no pageSize; verify all rows
  present.

#### Sort performance
- `'sorts 10,000 rows in under 2 s'` — generate 10 000-item array; click Sort by Name;
  verify `performance.now()` delta < 2000.

#### Search performance
- `'searches across 10,000 rows in under 1 s'` — generate 10 000-item array; type a 10-char
  query; measure time; assert < 1000 ms.

#### Pagination edge cases
- `'handles pageSize larger than dataset gracefully'` — 5 items, pageSize=1000; expect
  "Showing 1–5 of 5 results".
- `'handles pageSize=1 correctly'` — 5 items, pageSize=1; verify 5 total pages, only 1 row
  shown.
- `'goToPage beyond totalPages clamps to last page'` — 50 items, pageSize=10; call
  `goToPage(999)`; verify stays on page 5.

#### Concurrent fetch
- `'cancels in-flight fetch when url prop changes'` — use two sequential mocked fetches;
  change the `url` prop before first resolves; verify only data from the second fetch is shown.

#### Selection with large data
- `'select-all 1,000 rows completes without timeout'` — 1000-item dataset; click Select All;
  verify all `onSelectionChange` last call has length 1000 in under 1 s.

#### Memory / unmount
- `'does not call setState after unmount'` — render with URL; unmount before fetch resolves;
  verify no "Can't perform a React state update on an unmounted component" console error.

### 3.3  Robustness / Edge Case Tests (`describe('Robustness', ...)`)

Add the following cases:

- `'renders when columns array is empty'` — no crash; empty grid shown.
- `'renders when data contains duplicate rowKey values'` — two rows with same id; no key
  collision warning crash; both rendered.
- `'handles undefined rowKey field gracefully'` — data items missing the `rowKey` field; falls
  back to index; no crash.
- `'column formatter receiving null value does not throw'` — formatter returning `null`;
  renders without crash.
- `'columns prop change syncs visible columns'` — re-render with new columns; new columns
  shown, old columns removed.
- `'search + sort + pagination combined'` — 50 items, search narrows to 20, sort applied,
  navigate to page 2; verify correct items shown.
- `'onSort is called with correct direction on repeated clicks'` — click same column 4 times;
  verify alternating asc/desc on calls 1/2/3/4.
- `'emptyMessage ReactNode renders when URL returns empty array'` — mock fetch resolving `[]`;
  pass `emptyMessage={<em>Empty!</em>}`; verify `<em>Empty!</em>` in DOM.
- `'errorMessage ReactNode renders on fetch failure'` — mock fetch error; pass
  `errorMessage={<strong>Oops</strong>}`; verify `<strong>Oops</strong>` in DOM.

---

## PHASE 4 — FINAL VALIDATION

Run the following commands **in order** and confirm all pass:

```bash
# 1. Security audit
npm audit --audit-level=high
# Expected: found 0 vulnerabilities (or 0 high/critical)

# 2. Type check
npm run lint

# 3. Full test suite (must include all new tests)
npm test -- --reporter=verbose

# 4. Coverage check (optional stretch goal — aim for >90% statement coverage)
npm run test:coverage

# 5. Production build
npm run build

# 6. Verify dist artefacts exist and are non-empty
ls -lh dist/
```

---

## CONSTRAINTS & RULES

1. **Do NOT change any public TypeScript interface in `Table.types.ts`** unless adding
   optional fields. No breaking changes to `TableProps`, `ColumnDef`, `SortState`.
2. **Do NOT change the CSS class names in `table.css`** or the class name strings in
   `Table.tsx` — downstream consumers depend on them.
3. **All existing 40+ tests in `Table.test.tsx` must continue to pass unchanged.**
4. **Do not introduce runtime production dependencies** (no additions to `dependencies`
   or `peerDependencies`). All security hardening must live inside the existing source files.
5. **Do not use `eval`, `Function()`, `dangerouslySetInnerHTML`** anywhere in the codebase.
6. Use only standard Web APIs and React APIs — no new npm packages for the source code.
7. When writing new tests, follow the existing Vitest + `@testing-library/react` + `userEvent`
   patterns already established in `Table.test.tsx`.
8. The `useSearch` hook's public return shape may be extended with `searchTruncated` as an
   **optional addition** only — `Table.tsx` must handle its absence gracefully.

---

## DELIVERABLES CHECKLIST

- [ ] `package.json` — updated devDependencies (no vulnerable packages)
- [ ] `package-lock.json` — freshly generated (no CRA transitive graph)
- [ ] `src/Table/Table.tsx` — hardened fetch (URL check, timeout, content-type, array, size)
- [ ] `src/hooks/useSearch.ts` — input length cap, cell value cap
- [ ] `src/hooks/useSort.ts` — size guard + key sanitisation
- [ ] `src/hooks/useSelection.ts` — own-property check, allKeys validation
- [ ] `src/utils/helpers.ts` — string length cap, className injection guard
- [ ] `src/Table/Table.test.tsx` — new Security, Stress, Robustness test blocks appended
- [ ] `npm audit` output showing 0 critical / 0 high vulnerabilities
- [ ] `npm test` output showing all tests passing (old + new)
- [ ] `npm run build` output showing successful build

---

## VULNERABILITY REFERENCE MAP

The following table maps the highest-priority Snyk findings to the source changes above:

| CVE / CWE | Snyk Finding | Vulnerable Package | Fix Applied |
|---|---|---|---|
| CWE-918 | SSRF | webpack@5 (dev, transitive) | Phase 1: remove webpack entirely |
| CWE-22 | Directory Traversal | rollup@2.79.1 | Phase 1: upgrade rollup to v4 |
| CWE-22 | Path Traversal | webpack-dev-middleware@5.3.3 | Phase 1: remove |
| CWE-94 | Arbitrary Code Injection | serialize-javascript@6 | Phase 1: rollup-plugin-terser→v1 uses serialize-javascript@6.0.2+ |
| CWE-1321 | Prototype Pollution | lodash@4.17.21 | Phase 1: lodash not used in src; remove transitive ref |
| CWE-1321 | Prototype Pollution | flatted@3.2.7 | Phase 1: remove CRA graph |
| CWE-1333 | ReDoS | cross-spawn@7.0.3, minimatch@3.1.2, nth-check@1.0.2, picomatch@2.3.1 | Phase 1: remove CRA graph |
| CWE-770 | Resource Exhaustion | qs@6.11.0, serialize-javascript@6 | Phase 1 + Phase 2.2 size cap |
| CWE-400 | DoS | ws@8.13.0, http-proxy-middleware@2 | Phase 1: remove |
| CWE-295 | Improper Cert Validation | node-forge@1.3.1 | Phase 1: remove |
| CWE-343 | Predictable Value | form-data@3.0.1 | Phase 1: remove |
| CWE-835 | Infinite Loop | node-forge@1.3.1, brace-expansion@1.1.11 | Phase 1: remove |
| CWE-1333 | ReDoS (user input) | path-to-regexp@0.1.7 | Phase 2.2: input length cap in useSearch |
| CWE-1321 | Prototype Pollution (user input) | — | Phase 2.3/2.4: sort key guard + own-property check |
| CWE-79 | XSS via className | — | Phase 2.5: className sanitisation |
| CWE-918 | SSRF (fetch URL) | — | Phase 2.1: URL scheme validation |
| CWE-770 | Large response DoS | — | Phase 2.1: 10 MB response cap |
