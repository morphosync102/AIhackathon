# AIhackathon

AI hackathon preparation repository for a two-person team.

This repository keeps shared rules, strategy, prompt patterns, agent skills, and operational checklists. The actual product should be built after the event theme is announced.

## Branches

- `main`: Shared documentation, rules, strategy, prompt templates, and agent skills.
- `front`: Frontend implementation branch.
- `back`: Backend and AI API implementation branch.
- `demo`: Final integration branch for the submitted URL.

## Competition Priorities

The judges use the submitted web app directly. Build for a reliable three-minute demo.

1. Match the announced theme.
2. Ship a working URL.
3. Show challenge and originality.
4. Make AI usage visible in the product experience.

## Day-Of Flow

| Time | Work |
| --- | --- |
| 0:00-0:15 | Interpret the theme, choose the app type, write the one-line value proposition. |
| 0:15-0:30 | Freeze the API contract, UI flow, demo scenario, and roles. |
| 0:30-2:00 | Build the minimum working product. |
| 2:00-2:25 | Integrate frontend/backend and deploy. |
| 2:25-2:45 | Polish demo flow, sample input, result display, and pitch. |
| 2:45-3:00 | Final URL check, backup screenshots, and submission. |

## Roles

- Front/demo owner: UI, sample input, result cards, mobile layout, demo script.
- Back/AI owner: AI API calls, prompts, JSON shaping, error handling, deployment support.

Either person may take over the other role if the demo URL is at risk.

## Local Setup Notes

The stack is intentionally not fixed before the theme is announced. Add stack-specific setup steps here once chosen.

```txt
Package manager:
Frontend command:
Backend command:
Dev URL:
Deploy URL:
```

## Environment Variables

Copy `.env.example` to your local environment file for the chosen framework. Never commit real API keys.

## Useful Docs

- [Rules](docs/rules.md)
- [Strategy](docs/strategy.md)
- [API Contract](docs/api-contract.md)
- [Prompt Patterns](docs/prompt-patterns.md)
- [Demo Checklist](docs/demo-checklist.md)
- [Pitch Template](docs/pitch-template.md)
