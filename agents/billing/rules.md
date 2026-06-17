# Billing Extraction Rules

## Core Concept

The billing file has one row per **activity + billing plan** combination. Each row tells you:

> **"For this activity, under this billing plan, the billing amount is X"**

## Column Detection (Flexible)

| Concept | Keywords | Examples |
|---------|----------|----------|
| Activity | activity, activity name, program, service, course, name | "Activity Name", "Program", "Course" |
| Billing Amount | amount, billing amount, amount inr, total, fee, price, cost, charges | "Amount", "Amount (INR)", "Fee", "Price" |
| Billing Plan | plan, billing plan, plan code, plan name, billing, package, scheme, charges plan | "Billing Plan", "Plan", "Package", "Plan Code" |

## Extraction

Each row → one `recordType: "billing"` record with:
- `name` = activity name (join key to activities)
- `billingAmount` = the amount value (this IS the billing amount, NOT derived)
- `billingPlan` = the plan code

## What NOT to do

- ❌ Do NOT sum charges to get billing amount
- ❌ Do NOT create separate plan records with amounts
- ❌ Do NOT rename "Amount (INR)" to anything other than `billingAmount`

## Validation

| Severity | Condition | Message |
|----------|-----------|---------|
| ERROR | No activity name | "Row {index}: Activity name missing — skipped" |
| ERROR | Amount not a valid positive number | "Row {index}: Amount '{value}' invalid — skipped" |
| ERROR | No billing plan | "Row {index}: Billing plan missing — skipped" |
| ERROR | Zero valid records | "No valid billing records could be extracted." |

## Output

```json
[
  {
    "recordType": "billing",
    "id": "bill-1712345678000-0",
    "source": "billing_and_charges.xlsx",
    "extractedAt": "2026-06-17T12:00:00.000Z",
    "name": "Basketball Fundamentals",
    "billingAmount": 4000,
    "billingPlan": "8X",
    "currency": "INR"
  }
]
```
