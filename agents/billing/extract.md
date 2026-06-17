# Billing Extraction

## Core: Each row = one billing entry (activity + amount + plan)

"Amount (INR)" IS the billing amount. Extract it directly as `billingAmount`.

## Column Matching

| Field | Keywords |
|-------|----------|
| `name` | activity, program, service, course |
| `billingAmount` | amount, billing amount, total, fee, price |
| `billingPlan` | plan, billing plan, plan code, package |

## Output

```json
{
  "recordType": "billing",
  "name": "Basketball Fundamentals",
  "billingAmount": 4000,
  "billingPlan": "8X",
  "currency": "INR"
}
```
