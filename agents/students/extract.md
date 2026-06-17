# Students Extraction

See `agents/students/rules.md` for comprehensive rules on column matching, data cleaning, validation, and error handling.

## Quick Reference

**Required fields:** `name` (student name), `activityName` (enrolled activity)
**Optional fields:** `billingPlan`, `chargeAmount`, `parentName`, `dob`, `enrollmentDate`, `status`, `email`, `grade`

## Column Matching (Flexible)

| Field | Keywords to match |
|-------|------------------|
| `name` | student name, student, name, full name, child name, participant |
| `activityName` | activity, activity name, program, course, enrolled in, class |
| `billingPlan` | plan, billing plan, plan code, billing, payment plan, charges plan |
| `chargeAmount` | charge amount, amount, fee, charge, cost, enrollment fee |
| `parentName` | parent, parent name, guardian |
| `dob` | dob, date of birth, birth date, birthday |
| `enrollmentDate` | enrollment date, start date, join date, registered |
| `status` | status, enrollment status |
| `email` | email, e-mail, email address |
| `grade` | grade, grade level, class, standard |

## Terminology Equivalence

| Company says | Map to |
|-------------|--------|
| Child Name, Kid, Camper, Participant, Attendee | `name` |
| Enrolled Activity, Selected Program | `activityName` |
| Fee Plan, Charges Plan, Scheme, Package | `billingPlan` |
| Registration Date, Signup Date, Admission Date | `enrollmentDate` |
| Guardian, Guardian Name | `parentName` |

## Missing Columns

- If `name` column missing → **ERROR**: report and stop
- If `activityName` column missing → **ERROR**: report and stop
- If `billingPlan` column missing → **WARNING**: leave null, student won't join to billing plans
- If no header row → try to detect columns from data patterns

## Special Handling

- **Separate first/last name columns**: Combine into `name`: `"{firstName} {lastName}"`
- **Excel serial dates**: Convert number to `YYYY-MM-DD` date string
- **Mixed date formats**: Handle serial numbers and string dates

## Validation

- **ERROR**: Empty `name` → row skipped
- **ERROR**: Empty `activityName` → row skipped
- **ERROR**: No valid rows → report failure

## Enrichment

- `id`: `stu-{timestamp}-{index}`
- `status`: default `"active"`
- Add `source` and `extractedAt`

## Output

```json
[
  {
    "id": "stu-1712345678000-0",
    "source": "Student.xlsx",
    "extractedAt": "2026-06-17T12:00:00.000Z",
    "name": "Student 01",
    "activityName": "Basketball Fundamentals",
    "billingPlan": "8X",
    "status": "active"
  }
]
```
