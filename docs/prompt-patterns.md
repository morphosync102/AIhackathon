# Prompt Patterns

Use these as starting points after the theme is announced. Replace bracketed text with the actual theme and product role.

## JSON Analysis

```txt
You are an expert assistant for a hackathon product.

Theme: [THEME]
Product role: [ROLE]

Analyze the user's input and return strict JSON with:
- summary: string
- insights: array of { title, detail }
- actions: array of { title, priority, reason }
- risks: array of { title, mitigation }
- reasoning: string

User input:
[USER_INPUT]

Keep all text concise and practical. Do not include markdown.
```

## Judging Self-Review

```txt
Review this hackathon app idea against four criteria:
1. Theme fit
2. Implementation as a working web app
3. Challenge spirit
4. AI usage

Return JSON with scores from 1 to 5, the strongest point, the weakest point, and three improvements that can be done within 30 minutes.

App:
[APP_DESCRIPTION]
```

## Multi-Perspective Review

```txt
Act as three reviewers:
- A target user
- A technical judge
- A risk reviewer

For the hackathon theme [THEME], review the user's situation and propose a practical solution. Return concise JSON with each reviewer's concern and one combined recommendation.

Situation:
[USER_INPUT]
```

## Prompt Guardrails

- Ask for concise output.
- Ask for strict JSON when the UI depends on structure.
- Include the announced theme in the prompt.
- Include the product role in the prompt.
- Prefer action-oriented outputs over generic advice.
