---
name: hackathon-review
description: "Use when reviewing a hackathon app against judging criteria: theme fit, implementation, challenge spirit, and AI usage."
---

# Hackathon Review

## Goal

Find the fastest improvements that increase judging score.

## Review Criteria

1. Theme fit: the app clearly responds to the announced theme.
2. Implementation: the submitted URL works and the main flow completes.
3. Challenge spirit: the solution feels original or technically curious.
4. AI usage: AI is central and visible in the user experience.

## Workflow

1. Open or inspect the current app flow.
2. Identify the exact three-minute demo path.
3. Score each criterion from 1 to 5.
4. List blockers that could break the submitted demo.
5. Recommend only improvements that fit the remaining time.

## Output Format

Return:

- Overall risk: low, medium, or high.
- Scores for the four criteria.
- Top three fixes in priority order.
- One thing to avoid changing before submission.
