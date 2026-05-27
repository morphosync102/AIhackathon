---
name: prompt-engineering
description: Use when adapting prompts for an unknown hackathon theme, especially to produce concise structured JSON outputs for a web UI.
---

# Prompt Engineering

## Goal

Create prompts that turn theme-specific user input into useful structured outputs.

## Workflow

1. Include the announced theme in every core prompt.
2. Give the model a product role, not just a generic assistant role.
3. Ask for concise, practical output.
4. Ask for strict JSON when the frontend needs predictable rendering.
5. Include fields that map directly to UI sections.
6. Test with the sample input and one adversarial or vague input.

## Useful Fields

- `summary`
- `insights`
- `actions`
- `risks`
- `priority`
- `reason`
- `score`

## Avoid

- Prompts that produce long essays.
- Hidden chain-of-thought requests.
- Output shapes that the frontend cannot render.
- Generic advice that ignores the theme.
