# AI-DLC in KeepItSimple

A light adaptation of the [AWS AI-DLC](https://github.com/awslabs/aidlc-workflows)
(AI-Driven Development Life Cycle). Adopted on 2026-11-17, in the middle of the project.
The working rules live in the `aidlc` skill (`.claude/skills/aidlc/SKILL.md`); this folder holds the documents.

## Vocabulary

| Term | Here it means |
|---|---|
| **Intent** | One GitHub issue: the goal and why. Written down in `intent.md`. |
| **Bolt** | A PR-sized slice of an intent, delivered in hours or days. Replaces "part k of N". |
| **Approval gate** | A point where work stops until the owner says OK. The intent PR is the first one. |
| **Baseline** | [`baseline.md`](baseline.md): what the app already is. Replaces a full retro-documentation. |

## Layout

```
aidlc-docs/
  README.md
  baseline.md
  intents/
    _template/            intent.md, bolt.md
    intent-<issue>-<slug>/
      intent.md
      bolt-1.md ... bolt-n.md
```

## Branches and PRs

```
main
 └─ intent-67/intent     "Intent: <title> (#67)"        markdown only
     └─ intent-67/bolt-1  "Bolt 1/3: <what> (#67)"       draft
         └─ intent-67/bolt-2 ...                          draft, base = previous bolt
```

- All branches of an intent live under `intent-<issue>/` (a branch `intent-67` would block `intent-67/bolt-1`).
- **Intent PR:** only files under `aidlc-docs/`. Reviewing and approving it is the requirements gate.
- **Bolt PRs:** code, tests, and an update of their own `bolt-k.md` (status, outcome, decisions). Open them as drafts. They start only after the intent is approved.
- When the intent PR merges, retarget bolt 1 to `main` and rebase the stack (see the `issue` skill, "When a base changes").
- The last bolt also sets the intent status to `done`. No extra markdown-only PR.

## Depth adapts to the task

| Task | What to do |
|---|---|
| Bug or change under ~30 lines | No AI-DLC files. One PR, `fix/<issue>-<slug>`. |
| Feature | Intent PR, then bolts. |
| Feature with new data, security impact or tricky logic | Same, and fill the **Design** section of `intent.md`. |

Skipped on purpose: AWS Operations phase, `aidlc-state.md` (state lives in PRs), `audit.md` (decisions live in `intent.md` and the bolts), team "mob" sessions.

## Past work

Nothing is backfilled. Closed issues and git history stay the record before 2026-11-17.
Work already in flight keeps its old `feature/<issue>-<slug>` stack until it merges. When a task touches
an area, add what you learn to `baseline.md` instead of documenting everything up front.
