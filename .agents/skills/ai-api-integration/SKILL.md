---
name: ai-api-integration
description: Use when connecting generated AI APIs in a hackathon app, including environment variables, prompt calls, JSON responses, and safe failure behavior.
---

# AI API Integration

## Goal

Connect a generated AI API so the frontend can show reliable structured results.

## Workflow

1. Read `.env.example` and use provider keys only from environment variables.
2. Keep AI calls server-side. Never expose API keys to the browser.
3. Define the request and response shape before implementation.
4. Ask the model for strict JSON when the UI needs structured fields.
5. Validate or normalize the model response before sending it to the frontend.
6. Return controlled errors for missing input, missing key, timeout, or provider failure.

## Response Shape

Prefer:

- `summary`
- `insights`
- `actions`
- `risks`
- `score`
- `reasoning`

## Demo Safety

- Add a short timeout.
- Add clear loading and error states.
- Keep a sample response available for local UI development.
- Do not log secrets or raw credentials.
