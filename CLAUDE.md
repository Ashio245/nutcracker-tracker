# CLAUDE.md

This file defines how AI coding tools should behave in this repository.

## Project context

- Framework: Next.js (App Router)
- Purpose: "Nutcracker Tracker" – an internal tool to track Nutcracker events, presales, discounts, and offers.
- Audience: internal team / operations, not public end‑users (yet).

## Operating rules

1. **Inspect before editing**
   - Always inspect relevant files before making any change.
   - Summarize current behavior and structure in your own words before proposing modifications.
   - Never assume framework version, architecture, or APIs that are not visible in this repo.

2. **Prefer existing patterns**
   - Follow the existing file structure, naming conventions, styling, and component patterns you see in the code.
   - Reuse existing utilities and components when possible instead of introducing new abstractions.
   - Avoid introducing new libraries unless explicitly requested.

3. **Small, scoped changes**
   - Default to the smallest change that achieves the goal.
   - Avoid large rewrites, reorganizations, or “cleanups” unless the user explicitly asks for them.
   - If you believe a refactor is needed, propose it first with clear pros/cons.

4. **PRD‑first for substantial work**
   - For any non‑trivial feature, refactor, or workflow change:
     1. Understand the current implementation (inspect files).
     2. Write a **mini PRD** (goal, scope, constraints, acceptance criteria).
     3. Propose a **sprint plan** (small, ordered steps).
     4. Wait for confirmation before implementing large changes.

5. **Transparency about changes**
   - When proposing or making changes, always:
     - List the files you will touch.
     - Describe each change at a high level.
     - Call out any risks, trade‑offs, or assumptions.
   - After changes, summarize:
     - What changed.
     - How to run or test it.
     - Any follow‑up work or known limitations.

6. **Safety and constraints**
   - Never introduce hard‑coded secrets, tokens, or credentials.
   - Respect existing `.env*` patterns; do not commit env files.
   - Avoid destructive operations (deleting files, removing major code paths) unless explicitly requested.
   - Do not invent APIs, data models, or business rules that are not supported by the existing code or explicit instructions.

7. **Communication style**
   - Be concise and execution‑focused.
   - Prefer concrete instructions and diffs over long essays.
   - When unsure, ask clarifying questions instead of guessing.

Use these rules for every task in this repository unless the user explicitly overrides them for a specific request.
