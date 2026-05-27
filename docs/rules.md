# Rules And Judging Notes

## Judging Format

- Judges use the submitted web app directly.
- Each team has three minutes including questions.
- A working submitted URL matters more than an idea-only concept.

## Judging Criteria

1. Theme fit: the product must clearly match the announced development theme.
2. Implementation: the submitted URL must work.
3. Challenge spirit: show curiosity, originality, and a hacker mindset.
4. AI usage: AI should be central and visible, not a hidden decoration.

## Pre-Build Boundary

Allowed pre-event preparation:

- Generic docs, checklists, branch rules, and development workflows.
- Generic prompt patterns.
- Generic API contracts.
- Generic UI and backend planning.
- Environment setup and deployment practice.

Avoid before the theme is announced:

- Theme-specific product copy.
- Theme-specific business logic.
- Theme-specific datasets unless publicly allowed.
- A finished app that only needs minor text replacement.

## Risk Controls

- Keep API keys outside Git.
- Prepare a sample input so judges do not need to invent one.
- Prepare graceful error states for API failure or rate limits.
- Keep the app usable in a browser without login.
- Verify the submitted URL from a clean browser session.
