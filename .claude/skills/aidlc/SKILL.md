---
name: aidlc
description: >-
  KeepItSimple intent/bolt workflow (light AI-DLC). Use whenever the user wants
  to work on, implement, plan or pick up an issue or feature ("lavora sulla
  #123", "implement issue 42", "new feature"): picks the depth, writes an
  intent as a markdown-only PR, then delivers stacked bolt PRs. Overrides the
  global `issue` skill for PR split, branch names, PR titles and where the plan
  lives; everything else in `issue` (verify, review, cleanup) still applies.
---

# Intent / bolt workflow

Docs and templates: `aidlc-docs/` (read `aidlc-docs/README.md` once per session). App context: `aidlc-docs/baseline.md`.

## 0. Pick the depth first

| Task | Path |
|---|---|
| Bug or change under ~30 lines | No intent. One PR `fix/<issue>-<slug>`, normal `workflow` rules. Stop reading here. |
| Feature | Standard: steps 1 to 4. |
| New data, security impact or tricky logic | Deep: same, and fill **Design** in `intent.md`. |

When unsure, ask in the step 1 question round.

## 1. Understand and ask

Follow `issue` step 1 (memory, `gh issue view`, read the code, find test/build commands). Ask one `AskUserQuestion` round, multiple choice, recommendation first. Technical details you decide yourself and write down.

## 2. Write the intent (markdown only)

1. Worktree off `origin/main`: `git worktree add ../KeepItSimple-<issue> -b intent-<issue>/intent origin/main`. Tell the user the folder and branch. It is reused for every bolt (`git switch -c intent-<issue>/bolt-<k>`) and removed at the end.
2. Copy the templates to `aidlc-docs/intents/intent-<issue>-<slug>/` and fill `intent.md`, plus one `bolt-<k>.md` per bolt.
3. Bolts: backend first, then UI. Split further when a layer has two independent parts. A reviewer reads each in one sitting. Each bolt lists goal, "done when", files, tests, out of scope.
4. A **Sonnet** subagent reviews the intent against the real code (read-only): gaps, risks, test limits, ownership checks, migrations, stacking. Apply the fixes in the files.
5. Update the issue body in English: a short summary and a link to the intent folder. `gh issue edit <n> --body-file <file>`.
6. PR `Intent: <title> (#<issue>)`, base `main`, **only `aidlc-docs/` files**.

**Gate:** stop. The user reviews and approves the intent PR (a comment saying OK or a merge). Do not start a bolt before that.

## 3. Deliver the bolts

For each bolt, in order:

- Branch `intent-<issue>/bolt-<k>`. Base: the intent branch for bolt 1, the previous bolt branch after that.
- Implement and verify as in `issue` steps 5 and 6 (Haiku implement, verify subagent, UI design spec first, desktop and mobile screenshots for UI, Ponytail plus `code-review` before commit).
- In the same PR update `bolt-<k>.md`: Status `done`, PR link, **Outcome**, **Decisions**. The last bolt also sets the intent status to `done`.
- Open as a draft, `gh pr create --draft --base <previous branch>`. Title `Bolt <k>/<N>: <what> (#<issue>)`. Description: write it with the `clear-description` skill (it keeps "Things to check" and screenshots up to date), starting with "Bolt k of N of intent #<issue>, stacked on #…". Add "Out of scope" when the bolt leaves related work undone. The intent PR uses the same skill.

If a decision changes the plan, edit `intent.md` / the later `bolt-*.md` in the bolt that causes it and say so in its description.

## 4. When the base changes

Same as `issue` ("When a base changes"): when the intent PR merges, `gh pr edit <bolt-1> --base main`, then `git rebase --onto origin/main intent-<issue>/intent` and `git push --force-with-lease` (own branches only). Repeat for each later bolt, in order, onto the rebased previous bolt (`git rebase --onto intent-<issue>/bolt-<k-1> <old bolt k-1 sha>`). Regenerate EF migrations, never hand-merge them.

## 5. Finish

Report per PR: link, result of tests/build/browser, what was not covered. Delete test users, drop the isolated DB, stop servers, remove the worktree. Offer the deep check (`workflow` rule 2).
