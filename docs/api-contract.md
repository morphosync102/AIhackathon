# API Contract

Use this generic contract unless the chosen stack or theme requires something else.

## Request

```json
{
  "theme": "announced hackathon theme",
  "userInput": "user situation, notes, goal, or constraints",
  "mode": "analyze",
  "constraints": {
    "language": "ja",
    "timeLimit": "short demo"
  }
}
```

## Response

```json
{
  "summary": "one sentence summary",
  "insights": [
    {
      "title": "key issue",
      "detail": "why it matters"
    }
  ],
  "actions": [
    {
      "title": "next action",
      "priority": "high",
      "reason": "why this should happen first"
    }
  ],
  "risks": [
    {
      "title": "risk",
      "mitigation": "how to reduce it"
    }
  ],
  "score": {
    "themeFit": 0,
    "implementation": 0,
    "challenge": 0,
    "aiUsage": 0
  },
  "reasoning": "short explanation of the AI judgment"
}
```

## Frontend Requirements

- Show loading state during AI execution.
- Show a useful error state if the API fails.
- Render every response section as cards, lists, or tables.
- Include at least one sample input button.
- Keep the result readable on desktop and mobile.

## Backend Requirements

- Validate missing input before calling the AI API.
- Ask the AI for strict JSON if the provider supports it.
- Normalize provider-specific output into the response shape above.
- Return a controlled error instead of raw provider errors.
- Never send API keys to the browser.
