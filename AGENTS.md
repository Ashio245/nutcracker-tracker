# AGENTS.md

This file defines how AI agents should collaborate on this project.

## Project overview

- Name: Nutcracker Tracker
- Stack: Next.js (App Router) with TypeScript and React components.
- Purpose: Track Nutcracker productions, presales, discounts, and group offers for internal operations.
- Primary goal: Make the team’s day‑to‑day work easier, not more complex.

## Core principles

1. **Understand before changing**
   - Always inspect relevant files and describe current behavior before proposing modifications.
   - Derive your understanding from actual code and config, not assumptions.

2. **Plan before coding**
   - For any meaningful task (feature, refactor, UX change, automation), follow this sequence:
     1. **Discover** – inspect and summarize current state.
     2. **Mini PRD** – define what we are building and why.
     3. **Sprint plan** – break work into small, ordered steps.
     4. **Execute** – implement step by step.
     5. **Validate** – verify behavior and note what was tested.

3. **Small, reversible steps**
   - Prefer incremental commits and small patches.
   - Avoid big‑bang rewrites.
   - Prefer adding to existing patterns instead of replacing them.

4. **Stay aligned with the repo**
   - Follow the conventions you see in this repo (file layout, naming, styling, data flow).
   - Avoid introducing new dependencies or architectural patterns without clear justification.

5. **No fantasy features**
   - Do not describe, document, or rely on features that do not exist in the code or explicit instructions.
   - If a feature seems implied but not implemented, treat it as a proposal, not a fact.

## Required output structure for substantial tasks

When tackling any substantial task (new feature, non‑trivial refactor, integration, or workflow change), respond using this structure:

1. **Objective**
   - One or two sentences describing what needs to be achieved and why.

2. **Findings**
   - Brief summary of relevant code, files, and current behavior discovered during inspection.

3. **Mini PRD**
   - **Goal:** What success looks like.
   - **Scope:** What is in scope and explicitly out of scope.
   - **Constraints:** Tech, UX, or business constraints.
   - **Acceptance criteria:** Clear, checkable outcomes.

4. **Sprint plan**
   - Numbered list of small steps (each step should be reviewable and testable).
   - Mention which files will be touched in each step where possible.

5. **Proposed file changes**
   - Bullet list of files to be added/edited/removed.
   - High‑level description of what changes in each file.

6. **Validation plan**
   - How to run the app, tests, or checks.
   - Manual test steps for key flows.
   - Any limitations or follow‑ups that will remain.

For minor tasks (simple text change, tiny bugfix), a shortened version is acceptable, but still include **Objective**, **Findings**, and **Proposed file changes**.

## Safety and integrity rules

- Do not add secrets, API keys, or credentials to the codebase.
- Do not remove error handling or logging without replacement.
- Do not change deployment or build configuration without making the impact explicit.
- Do not claim that work was done, tested, or verified if you did not actually perform or inspect it.
- When in doubt, ask clarifying questions instead of guessing.

Agents should treat this document as the contract for how to work in this repository.
