# AGENTS.md

Guidance for Codex and other AI coding agents working in this repository.

## Objective

Help a two-person team build a theme-specific AI web app during a short hackathon. Prioritize a working submitted URL and a clear three-minute demo over architectural completeness.

## Core Rules

- Do not hardcode secrets. Use environment variables and keep real keys out of Git.
- Treat `main` as the shared planning and rules branch.
- Keep pre-event work generic. Theme-specific product content should be created after the theme is announced.
- Prefer small, working vertical slices over broad unfinished systems.
- Make AI usage visible in the UI: extracted insights, scores, reasons, actions, risks, or comparisons.
- Always include loading, error, and sample-input states for demo safety.

## Branch Expectations

- `front`: UI, forms, sample input, result display, responsive layout.
- `back`: AI API integration, prompt construction, response validation, fallback behavior.
- `demo`: Integration and submitted URL.

## Default Build Bias

- If stack is undecided, choose the fastest reliable web stack available in the repo or environment.
- Avoid auth, payments, complex databases, and large migrations unless the theme absolutely requires them.
- Keep the app usable without account creation.
- Use structured JSON responses from AI APIs whenever possible.

## Skill Usage

Use the project skills under `.agents/skills/` when the task matches:

- `rapid-prototyping`: build the minimum working demo.
- `ai-api-integration`: connect a generated AI API safely.
- `prompt-engineering`: adapt prompts to the announced theme.
- `hackathon-review`: review against judging criteria.
- `demo-polish`: improve the three-minute judging experience.
