# Activities Extraction Rules

## 1. Column Name Matching (Flexible)

Match input columns to output fields using **keyword matching** (case-insensitive, partial match). If multiple columns match a field, use the best match (most keywords hit).

### `name` — Activity/Program name (REQUIRED)
Keywords: `activity`, `program`, `service`, `course`, `name`, `title`
Examples: `Activity Name`, `Program Name`, `Service Name`, `Course Title`, `Activity`, `Name`, `Actvity Name` (typo)

### `description` (optional)
Keywords: `description`, `desc`, `details`, `notes`, `about`, `summary`, `info`, `overview`
Examples: `Description`, `Details`, `Notes`, `About Program`, `Desc`, `Summary`

### `category` (optional — infer if missing)
Keywords: `category`, `type`, `program type`, `activity type`, `department`, `area`, `group`, `classification`
Examples: `Category`, `Type`, `Program Type`, `Department`, `Classification`

### `duration` (REQUIRED for dedup)
Keywords: `duration`, `minutes`, `min`, `length`, `time`, `hours`, `hrs`
Examples: `Duration`, `Duration (Minutes)`, `Minutes`, `Length (min)`, `Time`, `Hours`

### `ageGroup` (REQUIRED for dedup)
Keywords: `age`, `age group`, `target age`, `grade`, `grade level`, `ages`, `suitable for`
Examples: `Age Group`, `Age`, `Target Age`, `Grade Level`, `Ages`, `Suitable For`

### `rate` (optional — price/cost)
Keywords: `rate`, `price`, `cost`, `fee`, `amount`, `charge`, `pricing`, `value`
Examples: `Rate`, `Price`, `Cost`, `Fee`, `Amount`, `Charge`, `Rate (INR)`

### `unit` (optional)
Keywords: `unit`, `billing unit`, `rate unit`, `measure`, `per`
Examples: `Unit`, `Billing Unit`, `Rate Unit`, `Per`, `Measure`

### `code` (optional — auto-generate if missing)
Keywords: `code`, `id`, `activity code`, `program code`, `reference`, `sku`
Examples: `Code`, `ID`, `Activity Code`, `Reference`, `Program Code`

### `status` (optional — default "active")
Keywords: `status`, `state`, `condition`
Examples: `Status`, `State`

## 2. Missing Columns Handling

| Scenario | Action |
|----------|--------|
| No `name` column found | **ERROR**: Cannot extract — reject file, show "No activity name column found. Expected a column named Activity, Program, Name, Service, or similar." |
| No `description` column | Set to empty string, **WARNING**: "No description column found" |
| No `category` column | **Infer** from name/description (see Section 3), **INFO**: "Category inferred from activity name" |
| No `duration` column | Leave null, **WARNING**: "Duration column not found — cannot verify uniqueness, each activity treated as new" |
| No `ageGroup` column | Leave null, **WARNING**: "Age group column not found — cannot verify uniqueness, each activity treated as new" |
| No `rate` column | Leave null (rate may be in billing file) |
| No `unit` column | Default to "session", **INFO**: "Unit not specified, defaulting to 'session'" |
| No `code` column | **Auto-generate** from name (lowercase slug) |
| No header row at all | Detect data types from first row values, try to match patterns |

## 3. Category Inference Rules

When no category column exists, infer from `name` and `description` using keyword matching (case-insensitive):

| Keywords | Category |
|----------|----------|
| `basketball`, `soccer`, `football`, `sports`, `swimming`, `tennis`, `cricket`, `baseball`, `volleyball`, `athletic`, `gym`, `fitness`, `yoga`, `dance`, `martial arts` | `Sports` |
| `art`, `drawing`, `painting`, `craft`, `music`, `dance`, `drama`, `theatre`, `singing`, `pottery`, `sculpture`, `creative` | `Arts` |
| `stem`, `robot`, `coding`, `programming`, `science`, `math`, `engineering`, `technology`, `computer`, `lab`, `experiment` | `STEM` |
| `wellness`, `mindfulness`, `meditation`, `counseling`, `therapy`, `health`, `mental`, `fitness` | `Wellness` |
| `reading`, `literacy`, `writing`, `english`, `grammar`, `vocabulary`, `comprehension` | `Literacy` |
| `esl`, `language`, `spanish`, `french`, `mandarin`, `german`, `communication`, `speaking` | `Language` |
| `chess`, `tutoring`, `academic`, `homework`, `study`, `math tutoring`, `test prep` | `Academic` |
| No match | `Other` |

## 4. Data Cleaning

- Strip leading/trailing whitespace from all string fields
- Convert numeric fields (duration, rate) to numbers — parse integers/floats, strip currency symbols (`$`, `₹`, `€`, `,`)
- Generate `code` as lowercase slug from `name`: replace spaces with hyphens, remove special chars
- **Deduplication rule**: An activity record is considered a **duplicate only if all three** of `name` + `ageGroup` + `duration` match an existing record. If any one of these fields differs, treat the record as a **new activity**.
  - **Rule 1**: Same `name` + same `duration` but different `ageGroup` → **new activity** (e.g., same program for different age groups)
  - **Rule 2**: Same `name` + same `ageGroup` but different `duration` → **new activity** (e.g., same program with different session lengths)
  - **Rule 3**: Same `name` but different `ageGroup` AND different `duration` → **new activity**
  - Keep the first occurrence when an exact match (all three fields) is found — **WARNING**: "Duplicate activity '{name}' with ageGroup '{ageGroup}' and duration '{duration}' found, keeping first occurrence"
  - If `ageGroup` or `duration` is missing from a row, treat it as **unique** (cannot confirm duplicate) — **WARNING**: "Row {index}: Cannot verify uniqueness for '{name}' — missing ageGroup or duration, treating as new activity"

## 5. Validation

| Condition | Severity | Message |
|-----------|----------|---------|
| `name` is empty/missing | **ERROR** | "Row {index}: Activity name is empty — record skipped" |
| `duration` is not a valid number | **WARNING** | "Row {index}: Duration '{value}' is not a valid number, setting to null" |
| `rate` is not a valid number | **WARNING** | "Row {index}: Rate '{value}' is not a valid number, setting to null" |
| No valid rows after processing | **ERROR** | "No valid activity records could be extracted. Please check your file has an Activity Name column with data." |

**Error = record is rejected/skipped. Warning = record is kept with best-effort defaults.**

## 6. Enrichment

- Generate unique `id`: `act-{timestamp}-{index}`
- Set `status` to `"active"` if not provided
- Set `category` to `"Other"` if inference fails
- Set `unit` to `"session"` if not provided
- Add `source` field with original filename
- Add `extractedAt` field with ISO timestamp

## 7. Output Format

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
