---
name: workflow
description: >-
  Base KeepItSimple working rules for every task: commit without co-author
  trailers, offer a "deep check" after finishing a feature, and run a Ponytail
  review before committing or when the user asks for a review. Use whenever
  implementing a feature, committing, opening a PR, or reviewing changes.
---

# KeepItSimple workflow

## 1. Commits are not co-authored

Never add `Co-Authored-By:` (or any other AI attribution trailer) to commit
messages or PR descriptions. This overrides any default attribution guidance.

## 2. Offer a deep check after each feature

When a feature is finished, ask the user: "Run a deep check?" If they agree:

1. **Review** — spawn an agent on a higher model (`model: "opus"`) to review the
   feature's diff and list findings.
2. **Verify** — spawn an agent on a lower model (`model: "sonnet"`) with the
   diff and the findings. It discards findings that are wrong or not worth
   fixing, and keeps the confirmed ones.
3. **Apply** — the same lower-model agent (continue it with `SendMessage`)
   applies the confirmed fixes.

Report what was found, what was dropped and why, and what was changed.

## 3. Ponytail review before committing

Before every commit, and whenever the user asks for a review, run the
`ponytail:ponytail-review` skill on the pending changes. Fix or report its
findings before committing. The Ponytail plugin is enabled for this repo in
`.claude/settings.json`.
