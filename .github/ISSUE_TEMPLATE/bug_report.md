---
name: Bug report
about: Something in react-light-table behaves incorrectly
title: "fix: "
labels: bug
assignees: kedarvijaykulkarni
---

<!-- Keep reproductions minimal. Never paste real credentials or customer data. -->

## Summary

<!-- One sentence. Follow-ups: "Follow-up to #NNN" / "Related: #NNN". -->


## Why this matters

<!-- Impact and scope: which props/features, downstream consumers affected (e.g. RidgeHQAPP DataTable), a11y/security implications, urgency. -->


## Steps to reproduce

1. Package version (`@kedman1234/react-light-table@x.y.z`), React version, bundler / framework (Vite, Next.js App Router, ...):
2. Minimal `<Table />` usage (props + sample `columns` / `data`):

```tsx

```

3. What you did:


## Expected behavior


## Actual behavior

<!-- Full error messages / console warnings / axe-core output. -->


## Logs / screenshots


## Suggested fix (optional)

<!-- File/line pointers (e.g. `src/Table/Table.tsx:NNN`) if known. -->


## Acceptance criteria / test plan

- [ ] Failing test added in `src/Table/Table.test.tsx` that reproduces the bug
- [ ] Fix makes it pass without regressions
- [ ] Security invariants in CLAUDE.md preserved (URL scheme, search/cell caps, sort-key & selection-key guards, className regex, fetch timeout/size caps)
- [ ] `npm run lint && npm run test && npm run build` pass


## Security / sensitive data

- If this is a vulnerability, do **not** file a public issue with exploit details — mark it `security` and describe the class of problem only.


## Related

- Related issues / PRs:
