# Combined (Cumulative) Results & Report Card Templates Architecture

## Table of Contents
1. [Combined/Cumulative Term Results](#1-combinedcumulative-term-results)
2. [Report Card Templates by Class Type](#2-report-card-templates-by-class-type)
3. [Database Changes Required](#3-database-changes-required)
4. [Implementation Steps](#4-implementation-steps)

---

## 1. Combined/Cumulative Term Results

### The Problem

Nigerian school report cards (especially 2nd and 3rd term) typically show **cumulative performance** across terms. For example, a 3rd term report card should display:

| SUBJECT | 1st Term Total | 2nd Term Total | 3rd Term Total | Cumulative Avg |
|---------|---------------|----------------|----------------|----------------|
| Mathematics | 78 | 82 | 85 | 81.7 |
| English | 65 | 70 | 72 | 69.0 |

Currently, the system only shows scores for the **current term** (CA1, CA2, Exam, Total). There is no mechanism to pull and display previous term scores side-by-side.

### The Solution: Query-Time Aggregation (No New Tables)

**We do NOT need a new database table.** All the data already exists in `student_scores` + `assessments`. The solution is purely a **query-time aggregation** when generating/printing the report card.

#### How It Works

1. **Current state**: When printing a report card for Term 2, we query:
   ```sql
   student_scores → assessments WHERE term_id = <term2_id>
   ```

2. **Combined state**: When printing a report card for Term 2, we query **all terms in the session up to and including the current term**:
   ```sql
   -- Get all terms in this session, ordered by term_number
   SELECT id, term_number FROM terms 
   WHERE session_id = <session_id> AND term_number <= <current_term_number>
   ORDER BY term_number ASC;
   
   -- For each term, get the student's subject totals
   SELECT 
     a.term_id,
     a.subject_id,
     s.name as subject_name,
     SUM(ss.score) as term_total
   FROM student_scores ss
   JOIN assessments a ON ss.assessment_id = a.id
   JOIN subjects s ON a.subject_id = s.id
   WHERE ss.student_id = <student_id>
     AND a.session_id = <session_id>
     AND a.class_id = <class_id>
     AND a.term_id IN (<term1_id>, <term2_id>)  -- all terms up to current
   GROUP BY a.term_id, a.subject_id, s.name
   ORDER BY s.name, a.term_id;
   ```

3. **Frontend rendering**: The report card component receives a structure like:
   ```typescript
   interface CumulativeSubjectScore {
     subject_name: string;
     terms: {
       term_number: number;
       term_name: string;
       total: number;
     }[];
     cumulative_average: number;
   }
   ```

#### Report Card Table Structure (2nd Term Example)

```
| SUBJECT     | 1st Term | 2nd Term | CA1 | CA2 | Exam | Total | Grade | Cum. Avg |
|-------------|----------|----------|-----|-----|------|-------|-------|----------|
| Mathematics |    78    |    --    |  18 |  16 |   48 |   82  |   A   |   80.0   |
| English     |    65    |    --    |  14 |  12 |   44 |   70  |   B   |   67.5   |
```

- **1st Term column**: Shows the total from term 1 (read-only, pulled from past scores)
- **2nd Term (current)**: Shows the CA1/CA2/Exam breakdown for the active term
- **Cumulative Average**: `(1st_term_total + 2nd_term_total) / 2`

#### Report Card Table Structure (3rd Term Example)

```
| SUBJECT     | 1st Term | 2nd Term | 3rd Term | CA1 | CA2 | Exam | Total | Grade | Cum. Avg |
|-------------|----------|----------|----------|-----|-----|------|-------|-------|----------|
| Mathematics |    78    |    82    |    --    |  17 |  18 |   50 |   85  |  A+   |   81.7   |
```

- **Cum. Avg**: `(78 + 82 + 85) / 3 = 81.7`

### Key Design Decisions

1. **No `cumulative_results` table**: Previous term data is queried on-the-fly. This avoids sync issues (if a teacher corrects a 1st term score, the cumulative report auto-updates).
2. **1st Term report cards stay unchanged**: They only show CA1, CA2, Exam, Total (no cumulative columns since there's nothing to combine).
3. **The cumulative columns appear only on 2nd and 3rd term report cards**.
4. **Performance**: The query is cheap — we're joining `student_scores` → `assessments` with term filtering, which is already indexed by the UNIQUE constraint on `assessments(session_id, term_id, class_id, subject_id, assessment_type_id)`.

---

## 2. Report Card Templates by Class Type

### The Problem

Nursery and Primary classes use different report card formats:

- **Primary Template**: Standard CA1 (20) + CA2 (20) + Exam (60) = Total (100) with numeric grades
- **Nursery Template**: Simplified developmental assessment with descriptive ratings instead of numeric scores (e.g., "Exceeded Expectations", "Met Expectations", "Developing", "Needs Support")

### Recommended Approach: `class_type` on `classes` table

Since each section (Islamiyya, Tahfeez) contains **both** nursery-level and primary-level classes, the template type must live on the individual `classes` row — not on sections.

```
Section: Islamiyya
  ├── Raudah 1  → class_type = 'nursery'
  ├── Raudah 2  → class_type = 'nursery'
  ├── Class 1   → class_type = 'primary'
  ├── Class 2   → class_type = 'primary'

Section: Tahfeez
  ├── Raudah 1  → class_type = 'nursery'
  ├── Halqa 1   → class_type = 'primary'
```

#### Template Types

| Template Key | Used By | Score Structure |
|---|---|---|
| `nursery` | Raudah classes, any nursery-level class | Descriptive ratings per learning area (no numeric CA/Exam breakdown) |
| `primary` | Class 1, Class 2, Halqa, etc. | CA1 (20) + CA2 (20) + Exam (60) = Total (100) |

#### Nursery Report Card Differences

| Feature | Primary | Nursery |
|---|---|---|
| Score entry | CA1, CA2, Exam (numeric) | Single rating per subject (1-5 scale or letter) |
| Columns | CA1, CA2, Exam, Total, Grade, Remarks | Subject, Rating, Teacher's Comment |
| Grading | A+ through F with percentage ranges | Exceeded / Met / Developing / Needs Support |
| Skills sidebar | Affective + Psychomotor | Same |
| Cumulative terms | 1st, 2nd, 3rd term totals | 1st, 2nd, 3rd term ratings |

### How Template Selection Works

```
User selects class → class has class_type field
                            ↓
                  'nursery' → render NurseryReportCard
                  'primary' → render PrimaryReportCard
```

In code:
```typescript
// In printable-report-card.tsx
const template = classData?.class_type || 'primary'

if (template === 'nursery') {
  return <NurseryReportCard {...props} />
}
return <PrimaryReportCard {...props} />
```

---

## 3. Database Changes Required

### Migration: Add `class_type` to `classes`

```sql
-- Add class_type column to classes
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS class_type TEXT 
NOT NULL DEFAULT 'primary' 
CHECK (class_type IN ('nursery', 'primary'));

-- Auto-set nursery classes based on name patterns
UPDATE classes 
SET class_type = 'nursery' 
WHERE LOWER(name) LIKE '%raudah%' 
   OR LOWER(name) LIKE '%nursery%'
   OR LOWER(name) LIKE '%pre-nursery%';
```

**No new tables needed for cumulative results** — the existing `student_scores` + `assessments` tables already contain all the data.

---

## 4. Implementation Steps

### Phase 1: Combined/Cumulative Results (Query + UI)
1. Create a helper function `fetchCumulativeScores(studentId, sessionId, classId, currentTermNumber)` that returns previous term totals per subject.
2. Modify `PrintableReportCard` to accept and render cumulative data columns when `termNumber >= 2`.
3. Modify the report card generation flow to call the helper and pass cumulative data.

### Phase 2: Template System
1. Run the migration to add `report_template` to `sections`.
2. Update section management UI to allow selecting the template type.
3. Create `NurseryReportCard` component with the simplified layout.
4. Update `PrintableReportCard` to dispatch to the correct template based on `section.report_template`.

### Phase 3: Score Entry Adaptation
1. For nursery classes, modify the score entry table to show a rating dropdown instead of numeric CA1/CA2/Exam inputs.
2. The `assessment_types` table can be reused — nursery classes would have a single assessment type ("Term Rating") instead of CA1/CA2/Exam.

---

## Summary

| Feature | Approach | New Tables? | Migration? |
|---|---|---|---|
| Cumulative results | Query-time aggregation from existing `student_scores` | No | No |
| Class type templates | `report_template` field on `sections` table | No | Yes (ALTER TABLE) |
| Nursery report card | New React component dispatched by template type | No | No |
