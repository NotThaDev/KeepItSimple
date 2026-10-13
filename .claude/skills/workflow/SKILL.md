---
name: workflow
description: >-
  Base KeepItSimple working rules for every task: commit without co-author
  trailers, write reviews, comments and descriptions in English, offer a "deep check" after finishing a feature, run Ponytail plus
  the standard code review before committing or when the user asks for a
  review, and use Microsoft Learn (C#/.NET) or Context7 (other libraries) for
  docs and how-to questions. Use whenever
  implementing a feature, committing, opening a PR, reviewing changes, or
  answering how to do something with a library, language, or pattern.
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

## 3. Reviews run both Ponytail and Claude's standard review

Before every commit, and whenever the user asks for a review, run **both**
reviews on the same target (pending changes, a commit, or the PR diff):

1. `ponytail:ponytail-review` skill.
2. Claude's standard review: the `code-review` skill.

Never run only one of them. The Ponytail plugin is enabled for this repo in
`.claude/settings.json`.

### Report

When both reviews are done, post one merged report **in the chat where the
review was asked**: findings from each review (label which one found what),
deduplicated, ranked most severe first. Say what was fixed, if anything.
Fix or report the findings before committing.

### Reviewing an entire PR

When the review is for the entire PR (the user names a PR or asks to review
"the PR"), also post the same report as a comment on the PR:

```
gh pr comment <PR#> --body-file <report.md>
```

Use the scratchpad for the temp file. The comment text is identical to the chat
report and follows rule 1 (no co-author or AI attribution lines).

## 4. Use docs MCPs for library and how-to questions

When building a feature that relies on a library or framework with online docs,
or when the user asks how to do something in a language or pattern, fetch
current docs before answering or writing code. Prefer them over memory for
APIs, config, and version-specific behavior.

- **C# / .NET** (ASP.NET Core, EF Core, Identity, xUnit, anything under
  `backend/`): use the Microsoft Learn MCP — search the docs, then fetch the
  relevant page or code samples.
- **Everything else** (Next.js, React, other libraries): use the Context7 MCP —
  resolve the library ID, then query its docs for the specific topic.

If the MCP has no match, say so and fall back to the other MCP, then to web
search.

## 5. Reviews, comments and descriptions are in English

Write reviews, review reports, PR/issue comments, PR descriptions and commit
messages in English, even if the user writes to you in another language. Use
another language only when the user explicitly asks for it.
