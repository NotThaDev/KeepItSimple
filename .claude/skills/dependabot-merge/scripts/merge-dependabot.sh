#!/bin/zsh
# Rebase, check and squash-merge open Dependabot PRs one at a time, newest first.
# Usage: merge-dependabot.sh [--dry-run] [PR ...]   (no PRs = all open Dependabot PRs)
# Output: one "#N MERGED|SKIP|FAIL: reason" line per PR, then DONE.

dry=0
[[ $1 == --dry-run ]] && { dry=1; shift; }

# Retry gh calls: a transient "error connecting to api.github.com" must not end the run.
ghr() { for i in 1 2 3; do out=$(gh "$@" 2>&1) && { print -r -- "$out"; return 0; }; sleep 10; done; print -r -- "$out" >&2; return 1; }

prs=("$@")
(( ${#prs} )) || prs=(${(f)"$(ghr pr list --author app/dependabot --json number -q '.[].number' | sort -rn)"})
(( ${#prs} )) || { echo "No open Dependabot PRs"; echo DONE; exit 0; }

for pr in $prs; do
  echo "=== #$pr $(ghr pr view $pr --json title -q .title)"
  state=$(ghr pr view $pr --json state -q .state)
  [[ $state == MERGED ]] && { echo "#$pr SKIP: already merged"; continue; }
  [[ $state != OPEN ]] && { echo "#$pr SKIP: $state (Dependabot closes PRs another PR already covered)"; continue; }

  ms=$(ghr pr view $pr --json mergeStateStatus -q .mergeStateStatus)
  if (( dry )); then
    failing=$(gh pr checks $pr 2>/dev/null | grep -viE $'\t(pass|skipping)\t')
    echo "#$pr DRY-RUN: mergeState=$ms${failing:+, not passing: $failing}"
    continue
  fi

  # Main moves after every merge, so the next PR is usually BEHIND and needs a rebase.
  if [[ $ms == BEHIND || $ms == DIRTY || $ms == UNKNOWN ]]; then
    old=$(ghr pr view $pr --json headRefOid -q .headRefOid)
    ghr pr comment $pr --body "@dependabot rebase" >/dev/null
    new=$old
    for i in {1..60}; do sleep 15; new=$(ghr pr view $pr --json headRefOid -q .headRefOid); [[ $new != $old ]] && break; done
    [[ $new == $old ]] && { echo "#$pr FAIL: no rebase after 15 min"; continue; }
    sleep 20  # let the new check runs register before watching
  fi

  gh pr checks $pr --watch --interval 20 >/dev/null 2>&1
  if gh pr checks $pr >/dev/null 2>&1; then
    ghr pr merge $pr --squash >/dev/null && echo "#$pr MERGED" || echo "#$pr FAIL: merge refused"
  else
    echo "#$pr FAIL: checks"
    gh pr checks $pr | grep -viE $'\t(pass|skipping)\t'
  fi
done
echo DONE
