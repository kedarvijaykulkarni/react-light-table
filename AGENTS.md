# AGENTS.md

Instructions for Codex and other coding agents working in this repo. Claude Code reads `CLAUDE.md`, which has the same workflow.

## Read first

1. `TODOS.md`: the active epic, the issue to take next, and the status of every issue.
2. `CLAUDE.md`: architecture, commands, the **security invariants you must not remove**, CSS z-index layering, TypeScript config.
3. The GitHub issue you're taking: `gh issue view <N>`. Each one has an item checklist with file:line pointers and acceptance criteria.

## Project in one paragraph

`@kedman1234/react-light-table` is a zero-runtime-dependency React (>=18) TypeScript table library published to npm. The source is in `src/`: the `Table/Table.tsx` component, types in `Table/Table.types.ts`, the hooks `useSort`, `useSearch`, `useSelection` and `usePagination` in `hooks/`, and `utils/helpers.ts`. Tests are in `src/Table/Table.test.tsx` (Vitest + jsdom + Testing Library). RidgeHQAPP consumes it downstream as `DataTable`, so a public-API or DOM/ARIA change is a contract change.

## Commands

```bash
npm run lint      # tsc --noEmit
npm run test      # vitest run
npm run build     # rollup -> dist/
npx vitest run -t "name substring"   # single test
npx vitest run --coverage
```

## Coding rules (Karpathy guidelines)

These are mandatory. The full text is at `~/.claude/skills/karpathy-guidelines/SKILL.md`.

1. **Think before coding.** State your assumptions. If the issue is ambiguous, say so in the PR or ask. Don't guess silently.
2. **Simplicity first.** Write the minimum code that closes the issue's items. No speculative options or abstractions, and no new runtime dependencies.
3. **Surgical changes.** Every changed line should trace back to the issue. Don't refactor or reformat neighbouring code. If you spot unrelated problems, mention them in the PR; don't fix them.
4. **Goal-driven.** For every item, write a failing test first, then make it pass. Loop until `lint && test && build` are green.

## gstack skills (installed in `~/.agents/skills`)

Use these at the matching step:

| Step | Skill | Notes |
|---|---|---|
| Unclear root cause | `investigate` | Before changing code for a bug you can't reproduce yet |
| Before claiming done | `verify` | Run the checks until they're green, and paste the results into the PR |
| Self-review of the diff | `review` | Before opening the PR |
| Security-labelled issues | `cso` | Issues #14, #15, #16 and #24, and anything touching the CLAUDE.md invariants |
| UI-visible changes | `qa` / `design-review` | Run against the Vite demo (`npm run dev`) |
| Opening the PR | `ship` | **Don't bump the version.** Put the change under `## Unreleased` in CHANGELOG.md; versions are bumped only in a separate release PR |
| Docs after a release | `document-release` | Release PRs only |

## Per-issue workflow (run in this order)

1. **Sync.** `git checkout master && git pull`. Check every `pr-open` row in `TODOS.md` with `gh pr view <PR> --json state`. Change merged ones to `done` and add their line under "Unreleased changes".
2. **Pick.** Take the first `todo` row in `TODOS.md`, which should match "▶ Next up". Skip `blocked` rows.
3. **Branch.** `<type>/<issue#>-<short-slug>`, for example `fix/12-public-types`. The type comes from the issue title prefix (`fix`, `feat`, `ci`, `test`, `chore`, `a11y`→`fix`).
4. **Mark in progress.** In `TODOS.md`, set the row to `in-progress` and fill in the branch and today's date.
5. **Implement.** Work each checkbox in the issue: write a failing test, fix it, and preserve the security invariants. If an item turns out to be wrong or out of scope, leave it unchecked and explain why in the PR.
6. **Verify.** `npm run lint && npm run test && npm run build` must all pass. Update CLAUDE.md's test count if it changed.
7. **Update the tracker in the same PR:**
   - set the row to `pr-open`, with the PR number and date
   - move "▶ Next up" to the next `todo` row
   - add a one-line entry to "Log"
8. **Open the PR** using `.github/PULL_REQUEST_TEMPLATE.md`, with `Closes #N` and labels copied from the issue, assigned to `kedarvijaykulkarni`. End the description with the attribution line your harness requires.
9. **Stop** after one issue per PR unless the user asks for more. Don't merge your own PRs.

When every row is `done`, mark the epic's "Done when" items and propose a release PR (version bump, CHANGELOG, then `npm publish` done manually by the maintainer).

## Never

- Remove or weaken a security invariant listed in CLAUDE.md
- Add a runtime dependency
- Commit secrets, `.env` contents or `coverage/`
- Merge, force-push to `master`, or publish to npm
