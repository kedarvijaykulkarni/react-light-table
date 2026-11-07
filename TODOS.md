# TODOS — work tracker

This file is the single source of truth for in-flight work, read by Claude Code and Codex.
Update it **in the same PR** as each issue (see "Per-issue workflow" in `CLAUDE.md` / `AGENTS.md`).

Status legend: `todo` · `in-progress` · `pr-open` · `done` · `blocked`

## Active epic

**#11 — epic: v2.3 hardening — Codex deep-review findings + roadmap completion**
https://github.com/kedarvijaykulkarni/react-light-table/issues/11

## ▶ Next up

**#12 — fix(types): public TS contract and published declarations break strict consumers** (P1)

After #12 the next is #13. Always take the first `todo` row in the table below.

## Issues (priority order)

| Order | Issue | Title | Pri | Status | Branch | PR | Updated |
|---|---|---|---|---|---|---|---|
| 1 | #12 | Types and packaging (TS2344, TS2882, exports map) | P1 | todo | | | |
| 2 | #13 | `'use client'` boundary (roadmap #10) | P1 | todo | | | |
| 3 | #14 | Fetch timeout / abort / 10MB cap | P1 | todo | | | |
| 4 | #15 | Sort-key / selection-key / className invariants | P1 | todo | | | |
| 5 | #16 | CSV sanitizer corrupts negatives / injection | P1 | todo | | | |
| 6 | #17 | Selection identity across page / filter / sort | P1 | todo | | | |
| 7 | #18 | StrictMode double callbacks, controlled transitions | P1 | todo | | | |
| 8 | #19 | Sticky header + pinned columns CSS | P1 | todo | | | |
| 9 | #24 | CI: PR gate, pinned actions, deploy, publish | P1 | todo | | | |
| 10 | #20 | Virtualization correctness | P2 | todo | | | |
| 11 | #21 | Pagination normalization, empty state, comparator | P2 | todo | | | |
| 12 | #22 | a11y grid focus model (roadmap #8) | P2 | todo | | | |
| 13 | #23 | Column visibility + resize (roadmap #6) | P2 | todo | | | |
| 14 | #25 | Strengthen tests, ≥90% coverage | P2 | todo | | | |
| 15 | #26 | Repo hygiene + docs drift | P3 | todo | | | |
| 16 | #27 | `theme` prop (roadmap #12) | P3 | todo | | | |
| 17 | #28 | Storybook (roadmap #9) | P3 | todo | | | |
| 18 | #29 | Quick wins: TSDoc, data-testid, skeleton | P3 | todo | | | |

## Unreleased changes (shipped to master, not yet published)

_None yet. Each merged issue adds one line here. Cleared when a version is published._

## Log

- 2026-11-07 — Epic #11 and sub-issues #12–#29 filed from the Codex deep review (58 findings) and the roadmap audit. Tracker created.
