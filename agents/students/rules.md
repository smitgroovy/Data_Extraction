# Students Extraction Rules

## 1. Column Name Matching (Flexible)

Match input columns using **keyword matching** (case-insensitive, partial match). If multiple columns match, use best match.

### `name` — Student name (REQUIRED)
Keywords: `student name`, `student`, `name`, `full name`, `child name`, `participant name`, `first name`, `last name`
Examples: `Student Name`, `Name`, `Full Name`, `Child Name`, `Participant`, `Student`, `First Name`, `Last Name`

**Special handling:** If the file has separate `First Name` and `Last Name` columns, combine them into `name` as `"{firstName} {lastName}"`.

### `activityName` — Enrolled activity (REQUIRED for joining)
Keywords: `activity`, `activity name`, `program`, `program name`, `course`, `course name`, `enrolled in`, `class`, `subject`
Examples: `Activity Name`, `Activity`, `Program`, `Course`, `Enrolled In`, `Class`, `Program Name`

### `billingPlan` — Billing plan code (optional — used for joining to plans)
Keywords: `plan`, `billing plan`, `plan code`, `billing`, `payment plan`, `fee plan`, `installment`, `charges plan`, `package`
Examples: `Billing Plan`, `Plan`, `Plan Code`, `Payment Plan`, `Fee Plan`, `Charges Plan`, `Package`

### `chargeAmount` (optional — per-enrollment amount)
Keywords: `charge amount`, `amount`, `fee`, `charge`, `cost`, `price`, `enrollment fee`, `paid`, `charges`
Examples: `Charge Amount`, `Amount`, `Fee`, `Charge`, `Cost`, `Enrollment Fee`

### `parentName` (optional)
Keywords: `parent`, `parent name`, `guardian`, `guardian name`, `parent/guardian`
Examples: `Parent Name`, `Parent`, `Guardian`, `Guardian Name`

### `dob` / `dateOfBirth` (optional)
Keywords: `dob`, `date of birth`, `birth date`, `birthday`, `birth`
Examples: `DOB`, `Date of Birth`, `Birth Date`, `Birthday`

### `enrollmentDate` (optional)
Keywords: `enrollment date`, `enrollment`, `start date`, `join date`, `registered`, `registration date`, `admission date`
Examples: `Enrollment Date`, `Start Date`, `Join Date`, `Registered On`, `Admission Date`

### `status` (optional — default "active")
Keywords: `status`, `state`, `enrollment status`
Examples: `Status`, `Enrollment Status`, `State`

### `email` (optional)
Keywords: `email`, `e-mail`, `email address`, `mail`
Examples: `Email`, `E-mail`, `Email Address`

### `grade` (optional)
Keywords: `grade`, `grade level`, `year`, `class`, `standard`
Examples: `Grade`, `Grade Level`, `Class`, `Standard`, `Year`

## 2. Missing Columns Handling

| Scenario | Action |
|----------|--------|
| No `name`/student name column | **ERROR**: "No student name column found. Expected a column named Student Name, Name, Full Name, Child Name, or similar." |
| No `activityName` column | **ERROR**: "No activity column found. Students must be linked to an activity. Expected a column named Activity, Program, Course, or similar." |
| No `billingPlan` column | Leave null — student won't join to billing plans, **WARNING**: "No billing plan column found. Students will not be linked to billing plans." |
| No header row at all | Try to detect columns by data patterns — first column might be names, look for date patterns, numeric amounts |

## 3. Data Cleaning

- Strip leading/trailing whitespace from all string fields
- If `name` appears to be a single name with first+last combined, keep as-is
- If separate first/last name columns exist, combine: `"{firstName} {lastName}"`
- Excel serial dates (numbers like 40269): convert to date string `YYYY-MM-DD`:
  - Excel epoch = Dec 30, 1899
  - `date = new Date((serial - 1) * 86400000 + new Date(1899, 11, 30).getTime())`
- If date column has mixed formats (serial numbers and strings), handle each appropriately
- Deduplicate by student `name` + `activityName` combination (keep first) — **WARNING**: "Duplicate enrollment for {name} in {activityName}, keeping first record"

## 4. Validation

| Condition | Severity | Message |
|-----------|----------|---------|
| `name` is empty/missing | **ERROR** | "Row {index}: Student name is empty — record skipped" |
| `activityName` is empty/missing | **ERROR** | "Row {index}: Activity name is empty for student '{name}' — record skipped" |
| No valid rows after processing | **ERROR** | "No valid student records could be extracted. Please check your file has student names and activity names." |

## 5. Terminology Handling

Companies may use different terms - understand semantic equivalence:

| Company says | Map to |
|-------------|--------|
| `Child Name`, `Kid Name`, `Camper` | `name` (student) |
| `Participant`, `Attendee`, `Member` | `name` (student) |
| `Enrolled Activity`, `Selected Program` | `activityName` |
| `Fee Plan`, `Charges Plan`, `Scheme` | `billingPlan` |
| `Registration Date`, `Signup Date` | `enrollmentDate` |

## 6. Enrichment

- Generate unique `id`: `stu-{timestamp}-{index}`
- Set `status` to `"active"` if not provided
- Add `source` field with original filename
- Add `extractedAt` field with ISO timestamp
- If `billingPlan` is null, student won't appear in billing plan join — this is acceptable

## 7. Output Format

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
