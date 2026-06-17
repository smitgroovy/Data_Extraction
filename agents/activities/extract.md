# Activity Extraction

See `agents/activities/rules.md` for comprehensive rules on column matching, category inference, validation, and error handling.

## Quick Reference

**Required fields:** `name` (activity name)
**Optional fields:** `description`, `category`, `duration`, `ageGroup`, `rate`, `unit`, `code`, `status`

## Column Matching (Flexible)

Use keyword matching to detect columns regardless of exact naming:

| Field | Keywords to match |
|-------|------------------|
| `name` | activity, program, service, course, name, title |
| `description` | description, desc, details, notes, about, summary |
| `category` | category, type, department, classification |
| `duration` | duration, minutes, min, length, time, hours |
| `ageGroup` | age, age group, grade, ages |
| `rate` | rate, price, cost, fee, amount, charge |
| `unit` | unit, billing unit, per, measure |
| `code` | code, id, reference, sku |
| `status` | status, state |

## Missing Columns

- If `name` column missing → **ERROR**: report and stop
- If `category` column missing → **infer** from name/description (see rules.md §3)
- If `duration` column missing → leave null
- If `rate` column missing → leave null (may come from billing)
- If `unit` column missing → default `"session"`
- If `code` column missing → auto-generate from name

## Category Inference

Infer from name/description when no category column exists:
- Sports, Arts, STEM, Wellness, Literacy, Language, Academic, Other
- See `agents/activities/rules.md` §3 for full keyword mapping

## Validation

- **ERROR**: Empty `name` → row skipped
- **WARNING**: Invalid duration/rate → set to null, keep record
- **ERROR**: No valid rows → report failure

## Enrichment

- `id`: `act-{timestamp}-{index}`
- `code`: auto-generated slug from name
- `status`: default `"active"`
- `unit`: default `"session"`
- `category`: default `"Other"` if inference fails
- Add `source` and `extractedAt`

## Output

```json
[
  {
    "id": "act-1712345678000-0",
    "source": "activity.xlsx",
    "extractedAt": "2026-06-17T12:00:00.000Z",
    "name": "Basketball Fundamentals",
    "code": "basketball-fundamentals",
    "category": "Sports",
    "ageGroup": "8-12 Years",
    "duration": 60,
    "rate": null,
    "unit": "session",
    "description": "Learn basic dribbling, passing, and shooting techniques.",
    "status": "active"
  }
]
```
