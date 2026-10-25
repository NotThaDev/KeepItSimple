---
name: dependabot-merge
description: >-
  Check and merge open Dependabot PRs one at a time: rebase each with
  "@dependabot rebase", wait for CI, squash-merge when everything passes, and
  report the ones that fail. Use whenever the user mentions Dependabot PRs,
  dependency bump PRs, "merge the bots", or asks to clean up / go through
  pending dependency updates, even without saying "merge".
---

# Dependabot merge

Main moves after every merge, so PRs must go strictly one at a time: rebase, wait for checks, merge, then the next. Never comment `@dependabot rebase` on several PRs at once: they would all rebase onto the same main and go stale again after the first merge.

## Run

1. List what is open, so the user sees the batch:
   ```bash
   gh pr list --author app/dependabot --json number,title -q '.[] | "\(.number) \(.title)"'
   ```
2. Run the bundled script in the background (Bash `run_in_background: true`). It takes ~5–10 min per PR; do not poll its output, wait for the completion notice:
   ```bash
   .claude/skills/dependabot-merge/scripts/merge-dependabot.sh
   ```
   - Pass PR numbers to limit the run: `merge-dependabot.sh 184 183`.
   - `--dry-run` only reports merge state and failing checks, it changes nothing. Use it when the user only asks to "check" the PRs without merging.
3. Read the output. Each PR gets one line: `MERGED`, `SKIP` (closed by Dependabot, usually because another PR already bumped those packages) or `FAIL: <reason>` followed by the failing checks.
4. For any `FAIL`, open it with `gh pr view <N>` / `gh pr checks <N>` to name the failing job, then confirm with `gh pr view <N> --json state` that merged ones really merged (a network blip can print a misleading line).

## What the script does per PR

- Skips PRs no longer open.
- If merge state is `BEHIND`, `DIRTY` or `UNKNOWN`: comments `@dependabot rebase`, waits up to 15 min for the head commit to change.
- Watches checks until done; squash-merges only if all pass (skipped checks are fine).
- On failure it moves on to the next PR instead of stopping.
- Retries `gh` calls 3 times so a transient GitHub connection error does not end the run.

## Report to the user

```
Merged: #184, #183, ...
Skipped: #181 (closed by Dependabot: covered by #183)
Failed: #179 (Frontend / CI: Lint) → <PR link>
```
List failures with links so the user can open them; do not try to fix failing bumps unless asked.
