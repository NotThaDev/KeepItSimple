---
name: issue
description: >-
  End-to-end workflow for working on a KeepItSimple GitHub issue: read and
  clarify it, plan and validate the plan, update the issue text, split the work
  into stacked draft PRs (at least backend and UI), implement each PR in a
  worktree with subagents, design UI with the design skill, verify (tests,
  build, browser, screenshots), review, and clean up. Use whenever the user
  says to work on, implement, close, or pick up an issue ("lavora sulla #123",
  "chiudi #114", "implement issue 42"), even if they only give the number.
---

# Working on an issue

This skill is the order of work. The house rules live in the other skills; load them when the step says so:
`backend` (API code), `frontend` (UI code), `workflow` (commits, reviews, docs lookups, deep check).

## 1. Understand

1. Check memory for the issue and its area (claude-mem search, MEMORY.md).
2. `gh issue view <n> --json title,body,labels` and any linked issues/PRs.
3. Read the code the issue touches. Grep first, read ranges, reuse what exists (helpers, components, channels, stores).
4. Ask before planning. One `AskUserQuestion` round, multiple choice, recommendation first. Typical questions:
   - product choices the issue leaves open (options, defaults, limits);
   - where the UI goes (if unsure, propose the option and say why);
   - base branch: `main`, or on top of an open PR that touches the same files;
   - how to split the PRs (see step 3).

   Decide technical details yourself (polling interval, table shape) and state them.

## 2. Plan and validate

1. Write the plan in the scratchpad: one section per PR, files, steps, tests, docs, verify, out of scope.
2. A **Sonnet** subagent checks it against the real code (read-only): gaps, risks, test-provider limits, auth, ownership tests, migrations, stacking. Ask for severity-ranked findings.
3. Append the fixes to the plan as an "overrides" section. Save the plan path and decisions in claude-mem work state.

## 3. Update the issue

Rewrite the issue body in English (the user asked for this): what's already in place, scope, user-facing behavior, delivery as a list of stacked PRs, out of scope. `gh issue edit <n> --body-file <file>`.

## 4. Stacked PRs

- Split by layer at least: **backend PRs first, then UI PRs**. Split further when a layer has two independent parts (e.g. channel + scheduler, settings page + drawer). Aim for PRs a reviewer reads in one sitting.
- Branches `feature/<issue>-<slug>`. PR 1 targets `main`; every next PR targets the previous branch.
- Work in a **worktree** off `origin/main` (`git worktree add ../KeepItSimple-<issue> -b <branch> origin/main`). Never touch the user's main checkout or its uncommitted files. Say which folder, branch and ports the worktree uses; remove it at the end.
- Open every PR as a **draft** (`gh pr create --draft --base <previous branch>`); the user reviews and merges.
- PR title `<What> (#<issue>, k/N)`. Description: "Part k of N, stacked on #…", What, Why (for non-obvious design), Screenshots (UI), Tested, Out of scope, then the attribution line. English.

### When a base changes

- An earlier PR or the planned base merges: rebase the stack in order (`git rebase --onto <new base> <old base>`), `git push --force-with-lease` (own feature branches only).
- **EF migrations**: never hand-merge `KeepItSimpleDbContextModelSnapshot.cs`. Delete the PR's migration files, take the base branch's snapshot, run `dotnet ef migrations add <Name>` again. Run the tests.
- A merge-conflict event about an old head SHA after a force-push: check `gh pr view <n> --json mergeable,headRefOid` before acting.

## 5. Implement each PR

- Default: **Haiku** subagents, one per PR (or per step for big PRs). Each prompt stands alone: goal, "done when", worktree path, files to read for style, exact steps with snippets, what not to touch, no commit, output format. Use Sonnet only if Haiku fails or the step needs real reasoning.
- Read every subagent report and the diff yourself. Fix small issues directly (stray build folders, wrong return types, missing doc rows).
- Backend: follow `backend`. New owned entities get an ownership test. The EF in-memory test provider lacks `ExecuteDelete*` and unique-index enforcement; code must not rely on either. Background loops must not let one bad row block the rest.
- UI: follow `frontend`. **Before writing UI**, run `design:design-system` (extend) for the new pattern: spacing scale, gaps, hierarchy (what is primary, what is quiet), states, a11y, mobile. Save the spec and hand it to the implementer. The theme is neutral grey; use the one accent (`destructive`) only as an attention signal.

## 6. Verify each PR (before committing)

1. Backend: `dotnet build` + `dotnet test KeepItSimple.sln`.
2. Frontend: `bun run lint` + `API_BASE_URL=… bun run build` (no frontend test runner exists).
3. Browser for anything a user can see, including backend changes that feed the UI:
   - run the worktree's API and UI from `.claude/launch.json` entries on separate ports, against an **isolated DB** (`keep_it_simple_<issue>`, `dotnet ef database update` with an overridden connection string). `appsettings.json` is gitignored: copy it into the worktree.
   - create a test user through the API, confirm it in the DB, log in; seed rows with SQL when a flow needs data.
   - test the real flow end to end (background jobs included: shorten their poll via env vars). Check Mailpit (`localhost:8025`) for emails.
   - check 375 px: no horizontal scroll, nothing hidden under the bottom nav.
4. Screenshots for UI PRs, desktop + mobile: 800 px viewport and the mobile preset, remove `nextjs-portal` first, push the images to an orphan branch `pr-<issue>-screenshots`, embed raw URLs.
5. Reviews from `workflow`: `ponytail:ponytail-review` **and** `code-review` on the staged diff. Fix, then commit (English, no co-author trailer) and push.

## 7. Finish

- Report per PR: link, what it does, test/build/browser result, what wasn't covered.
- Clean up: delete test users, drop the isolated DB, stop the preview servers, remove the worktree and the temporary launch configs (keep the screenshots branch while the PRs are open).
- Offer the deep check from `workflow`.
- Close the claude-mem work-state list.
