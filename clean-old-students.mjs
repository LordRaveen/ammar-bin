import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://tshvtbgnfvdodytborbe.supabase.co"
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaHZ0YmduZnZkb2R5dGJvcmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA4OTA1MiwiZXhwIjoyMDc4NjY1MDUyfQ.DfSQOxrIrmviG1cxSaLxxAsj8M-B6DzvRbQV_IwPOWM"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function cleanOldStudents() {
  console.log("Starting cleanup of old students (created before today)...")

  // Define cut-off date (today) in local/UTC time.
  const todayStr = "2026-07-21"

  // 1. Fetch old student IDs
  const { data: oldStudents, error: fetchError } = await supabase
    .from("students")
    .select("id, student_id, first_name, last_name, created_at")
    .lt("created_at", `${todayStr}T00:00:00.000Z`)

  if (fetchError) {
    console.error("Error fetching old students:", fetchError.message)
    return
  }

  const oldIds = oldStudents.map((s) => s.id)
  console.log(`Found ${oldStudents.length} students created before ${todayStr}`)

  if (oldIds.length === 0) {
    console.log("No old students to delete.")
    return
  }

  // Define tables from which we must delete reference records first
  const dependentTables = [
    "student_guardians",
    "student_enrollments",
    "student_scores",
    "student_results",
    "student_skills",
    "tahfeez_assessments",
    "payment_allocations",
    "payments",
    "invoices",
    "discounts",
    "attendance",
    "messages",
    "assignment_submissions",
    "event_students"
  ]

  console.log("Deleting referencing records...")
  for (const table of dependentTables) {
    const { error, count } = await supabase
      .from(table)
      .delete()
      .in("student_id", oldIds)

    if (error) {
      console.log(`  ⚠ Notice/Error in table '${table}': ${error.message}`)
    } else {
      console.log(`  ✓ Cleared references from table '${table}'`)
    }
  }

  // Finally, delete the student records themselves
  console.log("Deleting student records...")
  const { error: deleteError } = await supabase
    .from("students")
    .delete()
    .in("id", oldIds)

  if (deleteError) {
    console.error("Error deleting students:", deleteError.message)
  } else {
    console.log(`\n🎉 Success! Successfully deleted ${oldStudents.length} old students.`)
    console.log("The guardians themselves have been kept intact.")
  }
}

cleanOldStudents()
